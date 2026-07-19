/**
 * refetch-places-overrides.js — re-fetch REAL nearby places for the handful of
 * destinations whose coordinates were corrected in data/coord-overrides.json.
 *
 * Those destinations had their nearby "topPlaces" geosearched around the OLD
 * (wrong) coordinate, so they list attractions from the wrong region (e.g. Fort
 * Madhogarh listing Delhi's Baroda House). This re-runs Wikipedia geosearch +
 * extracts around the CORRECTED coordinate and rewrites each destination's
 * `places` in every data/bulk/<state>.json that carries the slug, then you
 * re-run build-json-data.js to propagate.
 *
 * Only touches the overridden slugs — everything else is untouched. Serial +
 * rate-limited like the rest of the bulk pipeline.
 *
 * Usage: node scripts/bulk/refetch-places-overrides.js
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./http');
const synth = require('./synth');

const ROOT = path.resolve(__dirname, '..', '..');
const API = 'https://en.wikipedia.org/w/api.php';
const RADIUS_M = 10000; // Wikipedia geosearch caps gsradius at 10000

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

function extracts(titles, sentences) {
  if (!titles.length) return {};
  const url = API + '?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=' + (sentences || 2) +
    '&titles=' + encodeURIComponent(titles.join('|')) + '&format=json&redirects=1';
  const data = curlJson(url);
  const out = {};
  const pages = (data.query && data.query.pages) || {};
  const back = {};
  ((data.query && data.query.normalized) || []).forEach((n) => { back[n.to] = n.from; });
  ((data.query && data.query.redirects) || []).forEach((r) => { back[r.to] = back[r.from] || r.from; });
  Object.keys(pages).forEach((k) => {
    const p = pages[k];
    if (p.title && p.extract) out[back[p.title] || p.title] = p.extract.replace(/\s+/g, ' ').trim();
  });
  return out;
}

// Fetch corrected nearby places for one (slug, name, lat, lng). Returns the
// synth-shaped places array, or null on failure.
function fetchPlaces(name, lat, lng) {
  const hits = geosearch(lat, lng)
    .filter((h) => h.title !== name && !EXCLUDE_RE.test(h.title))
    .slice(0, 12);
  sleep(300);
  if (!hits.length) return [];
  const texts = extracts(hits.map((h) => h.title), 2);
  sleep(300);
  const places = hits.map((h) => {
    const distKm = h.dist != null ? h.dist / 1000 : synth.haversineKm([lat, lng], [h.lat, h.lon]);
    const desc = texts[h.title] || '';
    return desc ? synth.makePlace(h.title, placeCategory(h.title + ' ' + desc), distKm, desc, null) : null;
  }).filter(Boolean);
  return places.slice(0, 8);
}

function main() {
  const ov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'coord-overrides.json'), 'utf8'));
  const slugs = Object.keys(ov).filter((k) => !k.startsWith('_') && ov[k].lat != null);
  const bulkDir = path.join(ROOT, 'data', 'bulk');
  const bulkFiles = fs.readdirSync(bulkDir).filter((f) => f.endsWith('.json'));

  // Fetch fresh places once per slug (keyed by corrected coord).
  const fresh = {};
  for (const slug of slugs) {
    // find the destination's display name from any bulk file
    let name = slug;
    for (const f of bulkFiles) {
      const arr = JSON.parse(fs.readFileSync(path.join(bulkDir, f), 'utf8'));
      const d = arr.find((x) => x.id === slug);
      if (d) { name = d.name; break; }
    }
    try {
      const places = fetchPlaces(name, ov[slug].lat, ov[slug].lng);
      fresh[slug] = places;
      console.log('[refetch] ' + slug + ' → ' + places.length + ' places' +
        (places.length ? ' (e.g. ' + places.slice(0, 3).map((p) => p.name).join(', ') + ')' : ' — none found, keeping old'));
    } catch (e) {
      console.error('[refetch] FAIL ' + slug + ': ' + (e.message || '').split('\n')[0]);
      sleep(1500);
    }
  }

  // Write fresh places into every bulk file that carries each slug.
  let rewrites = 0;
  for (const f of bulkFiles) {
    const p = path.join(bulkDir, f);
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    let touched = false;
    for (const d of arr) {
      if (fresh[d.id] && fresh[d.id].length) { d.places = fresh[d.id]; touched = true; rewrites++; }
    }
    if (touched) fs.writeFileSync(p, JSON.stringify(arr));
  }
  console.log('[refetch] rewrote places in ' + rewrites + ' bulk records. Now run build-json-data.js.');
}

if (require.main === module) main();
module.exports = { main, fetchPlaces };
