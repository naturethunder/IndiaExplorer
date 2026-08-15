/**
 * fill-real-hotels.js — replace fictional hotel names in data/destinations/<slug>.json
 * with real, OSM-sourced lodging names (Overpass API), and attempt one real Wikimedia
 * Commons photo per renamed hotel.
 *
 * ⚠️ Works ONLY on the output layer (data/destinations/<slug>.json). Never touches
 * data/bulk/*, js/data*.js, or index.json. Does not run build-json-data.js.
 * Only the `name` (and `image` when a real photo is found) field of existing
 * hotels[] entries is modified — count/tier/priceMin/priceMax/rating/reviews untouched.
 *
 * PERFORMANCE NOTE: the corporate network can only reach overpass-api.de (verified —
 * kumi.systems / private.coffee mirrors time out through the proxy), and that single
 * shared endpoint rate-limits hard (429/504) under one-query-per-destination traffic
 * (measured ~30-50s/destination with retries → ~30+ hours for the full catalog).
 * Fix: BATCH many geographically-sorted destinations into one Overpass query (multiple
 * `around:` clauses unioned in one request — verified 25 destinations/query in ~20s),
 * then locally (haversine) attribute each returned POI back to the nearest
 * destination(s) it's actually within radius of. This cuts request count ~25x.
 *
 * Resumable: writes each destination's file immediately after processing and marks
 * `hotelSourceTried: true` on the destination so re-runs skip completed work.
 * Batch-level failures mark `hotelSourceTried + hotelSourceError` so a follow-up can
 * filter specifically on `hotelSourceError` to retry just those.
 *
 * Usage:
 *   node scripts/bulk/fill-real-hotels.js               # process everything not yet tried
 *   node scripts/bulk/fill-real-hotels.js --limit 50     # process only first N unprocessed (by lat/lng order)
 *   node scripts/bulk/fill-real-hotels.js --slug goa     # process a single slug directly (ignores tried marker)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { curlJson, sleep, UA } = require('./http');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const TMP = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : undefined;
}
const LIMIT = argVal('limit') ? parseInt(argVal('limit'), 10) : Infinity;
const ONLY_SLUG = argVal('slug');
const BATCH_SIZE = argVal('batch') ? parseInt(argVal('batch'), 10) : 25;

const BAD_NAMES = new Set([
  'hotel', 'resort', 'guest house', 'guesthouse', 'hostel', 'inn', 'lodge',
  'home', 'stay', 'rooms', 'room', 'camp', 'homestay',
]);

function isRealName(name) {
  if (!name) return false;
  const n = String(name).trim();
  if (n.length < 4) return false;
  if (BAD_NAMES.has(n.toLowerCase())) return false;
  return true;
}

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function elementCoord(el) {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') return [el.lat, el.lon];
  if (el.center && typeof el.center.lat === 'number') return [el.center.lat, el.center.lon];
  return null;
}

function buildBatchQuery(points, radiusM, timeoutSec, outLimit) {
  let clauses = '';
  for (const p of points) {
    clauses += `node["tourism"~"^(hotel|guest_house|hostel|resort)$"](around:${radiusM},${p.lat},${p.lng});`;
    clauses += `way["tourism"~"^(hotel|guest_house|hostel|resort)$"](around:${radiusM},${p.lat},${p.lng});`;
  }
  return `[out:json][timeout:${timeoutSec}];(${clauses});out center ${outLimit};`;
}

function runOverpass(query, timeoutSec) {
  const qFile = path.join(TMP, 'ov_q_' + process.pid + '.txt');
  const outFile = path.join(TMP, 'ov_r_' + process.pid + '.json');
  fs.writeFileSync(qFile, query, 'utf8');
  const tries = 4;
  let lastErr;
  try {
    for (let i = 0; i < tries; i++) {
      try {
        execFileSync('curl', [
          '-sS', '--fail', '--max-time', String(timeoutSec + 15), '--compressed',
          '-H', 'User-Agent: ' + UA,
          '--data-urlencode', 'data@' + qFile,
          'https://overpass-api.de/api/interpreter',
          '-o', outFile,
        ], { encoding: 'utf8' });
        const raw = fs.readFileSync(outFile, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        lastErr = e;
        const wait = 2500 * Math.pow(2, i);
        process.stderr.write('  overpass retry ' + (i + 1) + '/' + tries + ' in ' + wait + 'ms (' + (e.message || '').split('\n')[0].slice(0, 100) + ')\n');
        sleep(wait);
      }
    }
    throw lastErr;
  } finally {
    try { fs.unlinkSync(qFile); } catch (_) {}
    try { fs.unlinkSync(outFile); } catch (_) {}
  }
}

function batchOverpass(points, radiusM) {
  const timeoutSec = Math.min(120, 40 + points.length * 3);
  const outLimit = Math.max(300, points.length * 40);
  const query = buildBatchQuery(points, radiusM, timeoutSec, outLimit);
  const json = runOverpass(query, timeoutSec);
  const elements = [];
  for (const el of (json.elements || [])) {
    const c = elementCoord(el);
    if (!c) continue;
    const tags = el.tags || {};
    elements.push({ name: tags.name, tourism: tags.tourism, lat: c[0], lng: c[1] });
  }
  return elements;
}

function dedupeNames(list) {
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const key = r.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r.name);
  }
  return out;
}

const GENERIC_WORDS = new Set([
  'hotel', 'resort', 'guest', 'house', 'guesthouse', 'hostel', 'lodge', 'homestay',
  'camp', 'stay', 'rooms', 'room', 'the', 'and', 'inn', 'grand', 'retreat',
  'international', 'tourist', 'rest', 'park', 'holiday', 'palace',
]);

function significantWords(name) {
  return name
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w.toLowerCase()));
}

// Commons full-text search is fuzzy and can return wholly unrelated images for
// short/generic hotel names (verified: "GMVN" matched an unrelated house photo).
// Only accept a result whose file title actually contains one of the hotel
// name's distinctive words — otherwise skip the photo rather than risk a
// mismatched / misleading image.
function commonsPhotoFor(name, state) {
  if (!/^[\x00-\x7F]*$/.test(name)) return null; // non-Latin-script names: matching is unreliable, skip
  const words = significantWords(name);
  if (words.length === 0) return null; // no distinctive token to verify a match against

  const term = `${name} ${state || ''} hotel`.trim();
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(term) +
    '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json';
  try {
    const json = curlJson(url, { tries: 2, timeoutSec: 20 });
    const pages = json && json.query && json.query.pages;
    if (!pages) return null;
    const ranked = Object.values(pages).sort((a, b) => (a.index || 99) - (b.index || 99));
    for (const p of ranked) {
      const title = String(p.title || '').replace(/^File:/, '').replace(/\.[a-zA-Z0-9]+$/, '');
      const titleLower = title.toLowerCase();
      const matched = words.some((w) => titleLower.includes(w.toLowerCase()));
      if (!matched) continue;
      const info = p.imageinfo && p.imageinfo[0];
      if (info && (info.thumburl || info.url)) {
        return info.thumburl || info.url;
      }
    }
  } catch (e) {
    process.stderr.write('  commons lookup failed for "' + name + '": ' + (e.message || '').split('\n')[0].slice(0, 80) + '\n');
  }
  return null;
}

function loadDest(file) {
  return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
}
function saveDest(file, dest) {
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(dest));
}

function markTried(file, extra) {
  const dest = loadDest(file);
  dest.hotelSourceTried = true;
  if (extra) Object.assign(dest, extra);
  saveDest(file, dest);
}

// Applies deduped real `names` (in discovery order) onto dest.hotels, cheapest
// priceMin slot first, leaving any leftover slots untouched. Does one Commons
// photo lookup per renamed hotel. Writes the file and marks it tried.
function applyNames(file, names) {
  const dest = loadDest(file);
  if (dest.hotelSourceTried) return { status: 'already-done' }; // defensive re-check
  const order = dest.hotels
    .map((h, idx) => ({ idx, price: typeof h.priceMin === 'number' ? h.priceMin : Infinity }))
    .sort((a, b) => a.price - b.price);

  let renamed = 0;
  let photosFound = 0;
  const renamedList = [];
  for (let i = 0; i < order.length && i < names.length; i++) {
    const idx = order[i].idx;
    const oldName = dest.hotels[idx].name;
    const newName = names[i];
    dest.hotels[idx].name = newName;
    renamed++;
    renamedList.push({ old: oldName, new: newName });

    const photoUrl = commonsPhotoFor(newName, dest.state);
    if (photoUrl) {
      dest.hotels[idx].image = { src: photoUrl, alt: newName };
      photosFound++;
    }
    sleep(400);
  }

  const latest = loadDest(file);
  latest.hotels = dest.hotels;
  latest.hotelSourceTried = true;
  latest.hotelsRealSourceCount = renamed;
  saveDest(file, latest);
  return { status: 'renamed', renamed, photosFound, renamedList, total: dest.hotels.length };
}

function processBatch(batch, stats, examples, log) {
  let elements15;
  try {
    elements15 = batchOverpass(batch.map((b) => ({ lat: b.lat, lng: b.lng })), 15000);
  } catch (e) {
    log('  BATCH FAILED (15km, ' + batch.length + ' dests): ' + (e.message || '').split('\n')[0].slice(0, 120));
    for (const b of batch) {
      markTried(b.file, { hotelSourceError: true });
      stats.errors++;
    }
    return;
  }

  const needWiden = [];
  for (const b of batch) {
    const near = elements15.filter((el) => isRealName(el.name) && haversineM(b.lat, b.lng, el.lat, el.lng) <= 15000);
    const names = dedupeNames(near);
    if (names.length === 0) { needWiden.push(b); continue; }
    const r = applyNames(b.file, names);
    if (r.status === 'renamed') {
      stats.renamedDestinations++;
      stats.totalHotelsRenamed += r.renamed;
      stats.photosFound += r.photosFound;
      stats.processed++;
      if (examples.length < 30) examples.push({ slug: b.slug, ...r });
      log(`  [${stats.processed}] ${b.slug}: renamed ${r.renamed}/${r.total}, ${r.photosFound} photos`);
    }
  }

  if (needWiden.length === 0) return;

  sleep(1500);
  let elements30;
  try {
    elements30 = batchOverpass(needWiden.map((b) => ({ lat: b.lat, lng: b.lng })), 30000);
  } catch (e) {
    log('  WIDEN BATCH FAILED (30km, ' + needWiden.length + ' dests): ' + (e.message || '').split('\n')[0].slice(0, 120));
    for (const b of needWiden) {
      markTried(b.file, { hotelSourceError: true });
      stats.errors++;
    }
    return;
  }

  for (const b of needWiden) {
    const near = elements30.filter((el) => isRealName(el.name) && haversineM(b.lat, b.lng, el.lat, el.lng) <= 30000);
    const names = dedupeNames(near);
    if (names.length === 0) {
      markTried(b.file, {});
      stats.zeroResults++;
      stats.processed++;
      log(`  [${stats.processed}] ${b.slug}: zero OSM results (15km+30km)`);
      continue;
    }
    const r = applyNames(b.file, names);
    if (r.status === 'renamed') {
      stats.renamedDestinations++;
      stats.totalHotelsRenamed += r.renamed;
      stats.photosFound += r.photosFound;
      stats.processed++;
      if (examples.length < 30) examples.push({ slug: b.slug, ...r });
      log(`  [${stats.processed}] ${b.slug}: renamed ${r.renamed}/${r.total} (widened), ${r.photosFound} photos`);
    }
  }
}

function main() {
  const log = (...a) => console.log(...a);

  if (ONLY_SLUG) {
    const file = ONLY_SLUG + '.json';
    const dest = loadDest(file);
    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      log(ONLY_SLUG, ': no hotels array');
      return;
    }
    const lat = dest.weather && dest.weather.lat;
    const lng = dest.weather && dest.weather.lng;
    if (typeof lat !== 'number') { log(ONLY_SLUG, ': no coords'); return; }
    const stats = { processed: 0, renamedDestinations: 0, totalHotelsRenamed: 0, photosFound: 0, zeroResults: 0, errors: 0 };
    const examples = [];
    processBatch([{ file, slug: ONLY_SLUG, lat, lng }], stats, examples, log);
    log(JSON.stringify(stats, null, 2));
    return;
  }

  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
  const metas = [];
  let skippedAlready = 0, noHotels = 0, noCoords = 0;

  for (const file of files) {
    const dest = loadDest(file);
    if (dest.hotelSourceTried) { skippedAlready++; continue; }
    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      markTried(file, {});
      noHotels++;
      continue;
    }
    const lat = dest.weather && dest.weather.lat;
    const lng = dest.weather && dest.weather.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      markTried(file, {});
      noCoords++;
      continue;
    }
    metas.push({ file, slug: dest.slug, lat, lng });
  }

  metas.sort((a, b) => a.lat - b.lat || a.lng - b.lng);
  const todo = metas.slice(0, LIMIT === Infinity ? metas.length : LIMIT);

  log(`Total destination files: ${files.length}`);
  log(`Already tried (skipped): ${skippedAlready}, no-hotels: ${noHotels}, no-coords: ${noCoords}`);
  log(`To process this run: ${todo.length} (batch size ${BATCH_SIZE})`);

  const stats = { processed: 0, renamedDestinations: 0, totalHotelsRenamed: 0, photosFound: 0, zeroResults: 0, errors: 0 };
  const examples = [];

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    log(`\n-- batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(todo.length / BATCH_SIZE)} (${batch.length} dests, starting ${batch[0].slug}) --`);
    processBatch(batch, stats, examples, log);
    sleep(2500);
  }

  log('\n=== SUMMARY ===');
  log(JSON.stringify(stats, null, 2));
  log('\nExamples:');
  for (const ex of examples.slice(0, 10)) {
    log(ex.slug, '->', (ex.renamedList || []).map((x) => `"${x.old}" => "${x.new}"`).join(', '));
  }
}

main();
