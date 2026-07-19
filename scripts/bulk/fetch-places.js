/**
 * fetch-places.js <state-key> — for every candidate destination, find REAL
 * nearby attractions via Wikipedia geosearch and fetch short real descriptions
 * (extracts) for them + for the destination itself.
 *
 * Serial + polite (rate-limited shared IP), resumable: each destination's
 * result is checkpointed to scripts/bulk/cache/<state>/places/<slug>.json —
 * re-run to fill gaps only.
 *
 * Usage: node scripts/bulk/fetch-places.js rajasthan
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./http');
const { haversineKm } = require('./synth');

const API = 'https://en.wikipedia.org/w/api.php';
const RADIUS_M = 10000; // Wikipedia geosearch caps gsradius at 10000

// titles that are geo-near but are not visitable attractions
const EXCLUDE_RE = /\b(district|tehsil|taluka|subdivision|constituency|assembly|railway station|junction railway|airport|air force|university|college|school|institute|hospital|court|municipal|nagar nigam|panchayat|census town|cantonment board)\b/i;

function placeCategory(text) {
  if (/\b(fort|palace|museum|tomb|cenotaph|haveli|stepwell|baori|monument|ruins|archaeolog|gate|mahal)\b/i.test(text)) return 'heritage';
  if (/\b(temple|mandir|mosque|masjid|dargah|church|gurudwara|shrine|math|monastery|ashram|ghat)\b/i.test(text)) return 'spiritual';
  if (/\b(national park|sanctuary|tiger|wildlife|zoo|safari|biological)\b/i.test(text)) return 'wildlife';
  if (/\b(beach|island)\b/i.test(text)) return 'beach';
  if (/\b(waterfall|falls|garden|park|hill|valley|forest)\b/i.test(text)) return 'nature';
  if (/\b(lake|dam|sagar|talab|bandh|reservoir|viewpoint|sunset)\b/i.test(text)) return 'scenic';
  if (/\b(bazaar|market|village)\b/i.test(text)) return 'cultural';
  return 'scenic';
}

function geosearch(lat, lng) {
  const url = API + '?action=query&list=geosearch&gscoord=' + lat + '%7C' + lng +
    '&gsradius=' + RADIUS_M + '&gslimit=20&format=json';
  const data = curlJson(url);
  return (data.query && data.query.geosearch) || [];
}

/** Batched intro extracts for up to 20 titles. Returns { title: text }. */
function extracts(titles, sentences) {
  if (!titles.length) return {};
  const url = API + '?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=' + (sentences || 2) +
    '&titles=' + encodeURIComponent(titles.join('|')) + '&format=json&redirects=1';
  const data = curlJson(url);
  const out = {};
  const pages = (data.query && data.query.pages) || {};
  // resolve redirects/normalisation back to requested titles
  const back = {};
  ((data.query && data.query.normalized) || []).forEach((n) => { back[n.to] = n.from; });
  ((data.query && data.query.redirects) || []).forEach((r) => { back[r.to] = back[r.from] || r.from; });
  Object.keys(pages).forEach((k) => {
    const p = pages[k];
    if (p.title && p.extract) out[back[p.title] || p.title] = p.extract.replace(/\s+/g, ' ').trim();
  });
  return out;
}

function main(stateKey) {
  const cacheDir = path.join(__dirname, 'cache', stateKey);
  const candFile = path.join(cacheDir, 'candidates.json');
  if (!fs.existsSync(candFile)) {
    console.error('No candidates cache — run fetch-candidates.js ' + stateKey + ' first.');
    process.exit(1);
  }
  const { candidates } = JSON.parse(fs.readFileSync(candFile, 'utf8'));
  const placesDir = path.join(cacheDir, 'places');
  fs.mkdirSync(placesDir, { recursive: true });

  let done = 0, skipped = 0, failed = 0;
  for (const c of candidates) {
    const outFile = path.join(placesDir, c.slug + '.json');
    if (fs.existsSync(outFile)) { skipped++; continue; }
    try {
      const hits = geosearch(c.lat, c.lng)
        .filter((h) => h.title !== c.wikiTitle && !EXCLUDE_RE.test(h.title))
        .slice(0, 12);
      sleep(250);

      // one batched extract call: destination's own article + up to 12 places
      const texts = extracts([c.wikiTitle].concat(hits.map((h) => h.title)), 2);
      sleep(250);
      const ownText = extracts([c.wikiTitle], 4)[c.wikiTitle] || texts[c.wikiTitle] || '';
      sleep(250);

      const places = hits.map((h) => ({
        name: h.title,
        distanceKm: h.dist != null ? h.dist / 1000 : haversineKm([c.lat, c.lng], [h.lat, h.lon]),
        category: placeCategory(h.title + ' ' + (texts[h.title] || '')),
        desc: texts[h.title] || '',
        lat: h.lat, lng: h.lon,
      })).filter((p) => p.desc);          // require a real description

      fs.writeFileSync(outFile, JSON.stringify({
        slug: c.slug,
        description: ownText,
        places: places.slice(0, 8),
      }, null, 1));
      done++;
      process.stdout.write('[places] ' + c.slug + ': ' + places.length + ' places (' + (done + skipped) + '/' + candidates.length + ')\n');
    } catch (e) {
      failed++;
      process.stderr.write('[places] FAIL ' + c.slug + ': ' + (e.message || '').split('\n')[0] + '\n');
      sleep(2000);
    }
  }
  console.log('[places] done=' + done + ' cached=' + skipped + ' failed=' + failed + ' (re-run to retry failures)');
}

if (require.main === module) main(process.argv[2] || 'rajasthan');
module.exports = { main };
