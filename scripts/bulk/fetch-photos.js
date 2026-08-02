/**
 * fetch-photos.js [state|all] — fill REAL Wikimedia Commons photos into the
 * bulk destinations (data/bulk/<state>.json), replacing the picsum placeholders:
 *   • destination hero/gallery  → d.photos[]  (query "<name> <state>")
 *   • each place (attraction)   → p.photos[] + p.image  (query "<place> <name>")
 *
 * Same Commons search the legacy build-place-photos.js uses. Serial + backoff
 * (shared IP is rate-limited by Commons), RESUMABLE + CHECKPOINTED: the state
 * file is rewritten after every destination, and anything that already has a
 * real (non-picsum) photo is skipped — re-run to fill only what's still missing.
 *
 * Usage: node scripts/bulk/fetch-photos.js rajasthan   (one state)
 *        node scripts/bulk/fetch-photos.js all          (every data/bulk/*.json)
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./http');

const ROOT = path.resolve(__dirname, '..', '..');
const BULK = path.join(ROOT, 'data', 'bulk');
const HERO_N = 5;   // hero carousel wants ≥5
const PLACE_N = 3;  // card uses [0], modal uses all
const PAUSE_MS = 400;  // polite serial pace — 60ms drew sustained 429s from Commons (2026-07)

function searchImages(query, limit) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=' + (limit || 8) +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json';
  let data;
  try { data = curlJson(url); } catch (e) { return []; }   // gave up after backoff — re-run fills it
  const pages = (data.query && data.query.pages) || {};
  const urls = [];
  Object.keys(pages).map((k) => pages[k]).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    const u = ii && (ii.thumburl || ii.url);
    if (u && /\.(jpg|jpeg|png)$/i.test(u) && /upload\.wikimedia\.org/.test(u) && urls.indexOf(u) < 0) urls.push(u);
  });
  return urls;
}

// a real photo = present, non-empty, and not a picsum placeholder
function hasReal(urls) {
  return Array.isArray(urls) && urls.length > 0 && !/picsum\.photos/.test(urls[0]);
}

function processState(stateKey) {
  const file = path.join(BULK, stateKey + '.json');
  if (!fs.existsSync(file)) { console.error('[photos] no bulk file for ' + stateKey); return; }
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  let destFilled = 0, placeFilled = 0, skipped = 0, i = 0;
  for (const d of arr) {
    i++;
    // destination-level skip: everything real OR already tried-and-empty on
    // Commons (photoTried marker) → nothing to do, no queries, no rewrite
    const heroDone = hasReal(d.photos) || d.photoTried;
    if (heroDone && (d.places || []).every((p) => hasReal(p.photos) || p.photoTried)) { skipped++; continue; }
    if (!heroDone) {
      const urls = searchImages(d.name + ' ' + d.state, 8).slice(0, HERO_N);
      sleep(PAUSE_MS);
      if (urls.length) { d.photos = urls; destFilled++; } else { d.photoTried = 1; }
    }
    for (const p of (d.places || [])) {
      if (hasReal(p.photos) || p.photoTried) continue;
      // "<place> <dest>" ANDs two proper nouns → ~always 0 hits on Commons for
      // bulk places. State-qualified first (precise), bare name as fallback.
      let urls = searchImages(p.name + ' ' + d.state, 8).slice(0, PLACE_N);
      sleep(PAUSE_MS);
      if (!urls.length) {
        urls = searchImages(p.name, 8).slice(0, PLACE_N);
        sleep(PAUSE_MS);
      }
      if (urls.length) { p.photos = urls; p.image = urls[0]; placeFilled++; }
      else { p.photoTried = 1; }   // Commons has nothing — skip on every future run
    }
    fs.writeFileSync(file, JSON.stringify(arr));   // checkpoint after each destination
    process.stdout.write('[photos] ' + stateKey + ' ' + d.id + ' hero:' + ((d.photos && d.photos.length) || 0) +
      ' (' + i + '/' + arr.length + ')\n');
  }
  console.log('[photos] ' + stateKey + ': +' + destFilled + ' heroes, +' + placeFilled + ' places, ' + skipped + ' dests skipped (already real)');
}

function main(arg) {
  let states;
  if (!arg || arg === 'all') {
    if (!fs.existsSync(BULK)) { console.error('[photos] no data/bulk/ yet — run the ingest first'); process.exit(1); }
    states = fs.readdirSync(BULK).filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, '')).sort();
  } else {
    states = [arg];
  }
  console.log('[photos] states: ' + states.join(', '));
  for (const s of states) processState(s);
  console.log('[photos] all done. Re-run build-json-data.js to propagate into data/destinations/.');
}

if (require.main === module) main(process.argv[2]);
module.exports = { main, searchImages, hasReal };
