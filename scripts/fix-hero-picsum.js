/**
 * fix-hero-picsum.js — one-off hero-image fixer (NOT part of scripts/bulk pipeline).
 *
 * Continues fixing destinations whose data/destinations/<slug>.json heroImage.src
 * is still a picsum.photos placeholder. Works ONLY on the output layer:
 *   - data/destinations/<slug>.json  (heroImage, gallery, seo.ogImage)
 *   - data/destinations/index.json   (matching summary's heroImage / image)
 *
 * Does NOT touch data/bulk/, js/data*.js, hotels[], topPlaces[], or run
 * build-json-data.js. Worklist is computed fresh from disk each run, so it's
 * naturally resumable — just re-run.
 *
 * Usage: node scripts/fix-hero-picsum.js [limit]
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./bulk/http');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const PAUSE_MS = 400;

const TYPE_KEYWORD = {
  wildlife: 'sanctuary',
  beach: 'beach',
  spiritual: 'temple',
  heritage: 'monument',
  hill_station: 'hill station',
};

// Generic descriptor suffixes to strip off a title to get its "core" proper
// noun — empirically, Commons' gsrsearch is closer to an AND over all terms,
// so "Tirthan Wildlife Sanctuary" (0 hits) fails where "Tirthan" (8 hits)
// succeeds because the actual Commons content is filed under the valley name,
// not the literal admin designation. Longest phrases first.
const STRIP_SUFFIXES = [
  'Wildlife Sanctuary', 'Bird Sanctuary', 'Conservation Reserve', 'Nature Reserve',
  'National Park', 'Tiger Reserve', 'Sanctuary', 'Reserve',
  'Hill Station', 'Wildlife Refuge',
  'Shiv Temple', 'Shiva Temple', 'Temple', 'Mandir', 'Gurdwara', 'Church', 'Cathedral',
  'Fort', 'Palace', 'Waterfalls', 'Falls', 'Fall', 'Lake', 'Caves', 'Cave',
  'Beach', 'Asthan',
];

function isPicsum(u) { return typeof u === 'string' && /picsum\.photos/.test(u); }
function isRealImg(u) {
  if (typeof u !== 'string') return false;
  if (isPicsum(u)) return false;
  if (!/upload\.wikimedia\.org/.test(u)) return false;
  if (!/\.(jpg|jpeg|png)(\?.*)?$/i.test(u)) return false;
  // Reject thumbnails of scanned documents (PDF/DJVU/TIFF pages) — their
  // thumburl still ends in .jpg (e.g. ".../Some_Atlas.pdf/page1-1280px-....pdf.jpg")
  // even though the underlying file is a document scan, not a photo. See
  // CLAUDE.md's "Strict Real Photos Policy" — these were explicitly audited out before.
  if (/\.(pdf|djvu|tiff?)/i.test(u)) return false;
  return true;
}

// Strip a trailing comma-qualified location (", Village, District") and one
// trailing generic descriptor phrase, returning the "core" search string.
function coreTitle(title) {
  let core = title.split(',')[0].trim();
  for (const suf of STRIP_SUFFIXES) {
    const re = new RegExp('\\s+' + suf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    if (re.test(core)) { core = core.replace(re, '').trim(); break; }
  }
  return core;
}

// India-relevance check — short "core" queries like "Nahar" or "Rehala" can
// hit unrelated Commons content anywhere in the world (a Chinese banknote
// series, a Spanish hunting-dog term). Require the candidate's own Commons
// categories (or, for the Wikipedia path, its summary text) to mention India,
// the destination's state, or one of its own real nearby place names before
// accepting it — generic descriptor/admin words are excluded so they can't
// coincidentally re-admit an off-topic homonym.
const HINT_STOPWORDS = new Set([
  'india', 'indian', 'metro', 'station', 'junction', 'railway', 'road', 'chowk',
  'temple', 'mandir', 'fort', 'city', 'centre', 'center', 'village', 'town',
  'district', 'national', 'park', 'wildlife', 'sanctuary', 'lake', 'fall', 'falls',
  'beach', 'church', 'cathedral', 'palace', 'museum', 'tower', 'bridge', 'river',
  'hill', 'hills', 'gate', 'market', 'area', 'zone', 'sector', 'colony', 'shiv',
  'shiva', 'devi', 'mata', 'sri', 'shri', 'ghat', 'nagar', 'asthan',
]);
function stateKeywords(state) {
  return (state || '')
    .toLowerCase()
    .replace(/\s*ut$/, '')
    .split(/[&,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}
// Real geographic hints pulled from the destination's OWN already-verified
// data (routes/railway/topPlaces) — not from the search query itself, so they
// can't rubber-stamp the same homonym that produced a false-positive query hit.
function placeHints(detail) {
  const hints = new Set();
  ((detail.howToReach && detail.howToReach.routes) || []).slice(0, 5).forEach((r) => {
    if (r.city) hints.add(r.city.toLowerCase());
  });
  const nr = detail.howToReach && detail.howToReach.nearestRailway && detail.howToReach.nearestRailway.name;
  (detail.topPlaces || []).map((p) => p.name).concat(nr ? [nr] : []).forEach((name) => {
    (name || '').split(/[\s,]+/).forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length >= 4 && !HINT_STOPWORDS.has(clean)) hints.add(clean);
    });
  });
  return Array.from(hints);
}
function textLooksRelevant(text, state, hints) {
  const t = (text || '').toLowerCase();
  if (!t) return false;
  if (/india/.test(t)) return true;
  if (stateKeywords(state).some((k) => t.includes(k))) return true;
  return (hints || []).some((h) => t.includes(h));
}

function commonsSearch(query, limit, state, hints) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=' + (limit || 8) +
    '&prop=imageinfo|categories&iiprop=url&iiurlwidth=1000&cllimit=50&format=json';
  let data;
  try { data = curlJson(url); } catch (e) { return []; }
  const pages = (data.query && data.query.pages) || {};
  const urls = [];
  Object.keys(pages).map((k) => pages[k]).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    const u = ii && (ii.thumburl || ii.url);
    if (!isRealImg(u) || urls.indexOf(u) >= 0) return;
    const catText = (p.categories || []).map((c) => c.title).join(' | ');
    if (!textLooksRelevant(catText, state, hints)) return;   // drop off-topic homonym hits
    urls.push(u);
  });
  return urls;
}

function wikipediaSummaryImage(title, state, hints) {
  // tries:1 — a 404 here means "no such Wikipedia page", a real negative
  // result, not a transient failure. Retrying it with backoff (the default
  // curlJson behaviour) just burns ~22s per miss for nothing.
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title);
  let data;
  try { data = curlJson(url, { accept: 'application/json', tries: 1 }); } catch (e) { return null; }
  const cand = (data.thumbnail && data.thumbnail.source) || (data.originalimage && data.originalimage.source);
  if (!isRealImg(cand)) return null;
  // relevance check on the summary text itself (no categories available here)
  const text = (data.extract || '') + ' ' + (data.description || '');
  return textLooksRelevant(text, state, hints) ? cand : null;
}

function findHero(detail) {
  const title = detail.title;
  const type = detail.type;
  const state = detail.state;
  const firstPlace = (detail.topPlaces && detail.topPlaces[0] && detail.topPlaces[0].name) || null;
  const core = coreTitle(title);
  const hints = placeHints(detail);

  const tried = new Set();
  function tryCommons(q) {
    if (!q || tried.has(q)) return null;
    tried.add(q);
    const urls = commonsSearch(q, 8, state, hints);
    sleep(PAUSE_MS);
    return urls.length ? urls : null;
  }

  // 1. exact title as given
  let urls = tryCommons(title);
  // 2. "core" title with a trailing comma-qualifier / generic descriptor
  //    suffix (Temple/Fort/Sanctuary/…) stripped — this is what actually
  //    finds most hits, since Commons content is usually filed under the
  //    place/landmark's bare proper noun, not its full admin designation.
  if (!urls && core !== title) urls = tryCommons(core);
  // 3. core title + state (adds precision when the bare core is ambiguous)
  if (!urls) urls = tryCommons(core + ' ' + state);
  // 4. title + nearest notable place name inside it (spec variant a)
  if (!urls && firstPlace) urls = tryCommons('"' + title + '" ' + firstPlace);
  // 5. title + type-derived keyword (spec variant b)
  const kw = TYPE_KEYWORD[type];
  if (!urls && kw) urls = tryCommons(title + ' ' + kw);
  if (urls) return { url: urls[0], gallery: urls };

  // 6. Wikipedia lead image (spec variant c) — try full title then core
  let wpImg = wikipediaSummaryImage(title, state, hints);
  sleep(PAUSE_MS);
  if (!wpImg && core !== title) { wpImg = wikipediaSummaryImage(core, state, hints); sleep(PAUSE_MS); }
  if (wpImg) return { url: wpImg, gallery: [wpImg] };

  return null;
}

function main() {
  const limitArg = parseInt(process.argv[2], 10);
  const limit = Number.isFinite(limitArg) ? limitArg : Infinity;

  const idx = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const worklist = [];
  for (const d of idx.destinations) {
    const file = path.join(DEST_DIR, d.slug + '.json');
    if (!fs.existsSync(file)) continue;
    let detail;
    try { detail = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { continue; }
    if (detail.heroImage && isPicsum(detail.heroImage.src)) worklist.push(d.slug);
  }
  console.log('[fix-hero] worklist size: ' + worklist.length + (limit < Infinity ? ' (processing up to ' + limit + ')' : ''));

  let fixed = 0, stillMissing = 0, processed = 0;
  for (const slug of worklist) {
    if (processed >= limit) break;
    processed++;
    const detailFile = path.join(DEST_DIR, slug + '.json');
    let detail;
    try { detail = JSON.parse(fs.readFileSync(detailFile, 'utf8')); } catch (e) { console.log('[fix-hero] skip unreadable ' + slug); continue; }
    if (!detail.heroImage || !isPicsum(detail.heroImage.src)) { continue; } // fixed by someone else meanwhile

    let result;
    try { result = findHero(detail); } catch (e) { result = null; }

    if (!result) {
      stillMissing++;
      console.log('[fix-hero] ' + processed + '/' + worklist.length + ' NOT FOUND: ' + slug);
      continue;
    }

    // re-read fresh right before writing (per instructions — avoid stale overwrite)
    let fresh;
    try { fresh = JSON.parse(fs.readFileSync(detailFile, 'utf8')); } catch (e) { fresh = detail; }
    const alt = (fresh.heroImage && fresh.heroImage.alt) || fresh.title;
    fresh.heroImage = { src: result.url, alt };
    if (!Array.isArray(fresh.gallery) || fresh.gallery.length < 3) {
      const existing = Array.isArray(fresh.gallery) ? fresh.gallery : [];
      const existingSrcs = new Set(existing.map((g) => g.src));
      const toAdd = result.gallery.filter((u) => !existingSrcs.has(u)).map((u) => ({ src: u, alt }));
      fresh.gallery = existing.concat(toAdd).slice(0, 5);
    }
    if (fresh.seo && isPicsum(fresh.seo.ogImage)) fresh.seo.ogImage = result.url;
    fs.writeFileSync(detailFile, JSON.stringify(fresh));

    // sync index.json summary (re-read fresh)
    const freshIdx = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    const summary = freshIdx.destinations.find((x) => x.slug === slug);
    if (summary) {
      if (summary.heroImage && isPicsum(summary.heroImage.src)) summary.heroImage = { src: result.url, alt };
      else if (!summary.heroImage) summary.heroImage = { src: result.url, alt };
      if (summary.image && isPicsum(summary.image.src)) summary.image = { src: result.url, alt };
      fs.writeFileSync(INDEX_FILE, JSON.stringify(freshIdx));
    }

    fixed++;
    console.log('[fix-hero] ' + processed + '/' + worklist.length + ' FIXED: ' + slug + ' -> ' + result.url);
  }

  console.log('[fix-hero] done. fixed=' + fixed + ' stillMissing=' + stillMissing + ' processed=' + processed + ' totalWorklist=' + worklist.length);
}

if (require.main === module) main();
module.exports = { main, findHero, isPicsum, isRealImg };
