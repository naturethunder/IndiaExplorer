/**
 * fix-picsum-photos-smart.js — smarter recovery pass for destinations/places
 * whose heroImage / topPlaces[].image still point at picsum.photos, AFTER the
 * blunt "<name> <state>" / "<name>" Commons search already gave up on them
 * (marked photoTried:1 in data/bulk/<state>.json).
 *
 * ⚠️ Works ONLY on the OUTPUT layer: data/destinations/index.json (summaries)
 * and data/destinations/<slug>.json (detail files). Never touches data/bulk/,
 * js/data*.js, or runs build-json-data.js (see CLAUDE.md + docs/AUDIT.md for
 * why that pipeline is dangerous to re-run right now).
 *
 * Only fields touched: heroImage, gallery, topPlaces[].image, topPlaces[].photos
 * (detail files) and heroImage/image (index.json summaries). Never hotels[]
 * (a concurrent process owns that) — and every write re-reads the file fresh
 * from disk immediately beforehand so we never clobber a concurrent edit.
 *
 * Strategies tried in order, first valid hit wins:
 *   Hero:  1. "<title>" <topPlaces[0].name>          (landmark inside it)
 *          2. <title> tourism
 *          3. <title> <type-derived keyword>          (monument/temple/sanctuary/…)
 *          4. Wikipedia REST summary thumbnail/originalimage for <title>
 *   Place: 1. "<placeName>" <parent destination title>
 *          2. "<placeName>" <category>
 *          3. Wikipedia REST summary thumbnail/originalimage for <placeName>
 *
 * Checkpointed: scripts/photo-fix-checkpoint.json records the last fully
 * processed index into index.json's destinations array + running totals, so a
 * crash/interrupt can resume with `node scripts/fix-picsum-photos-smart.js resume`.
 * Every run re-checks picsum status straight off disk (never a stale in-memory
 * list) before deciding to touch a destination.
 *
 * Usage:
 *   node scripts/fix-picsum-photos-smart.js            # fresh run from index 0
 *   node scripts/fix-picsum-photos-smart.js resume     # resume from checkpoint
 *   node scripts/fix-picsum-photos-smart.js test 15    # process only first 15 candidates, verbose
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./bulk/http');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const CHECKPOINT_FILE = path.join(__dirname, 'photo-fix-checkpoint.json');
const PAUSE_MS = 400;

const TYPE_KEYWORD = {
  hill_station: 'hill station',
  beach: 'beach',
  heritage: 'monument',
  wildlife: 'sanctuary',
  spiritual: 'temple',
  adventure: 'adventure sports',
};
const CATEGORY_KEYWORD = {
  cultural: 'heritage',
  beach: 'beach',
  spiritual: 'temple',
  scenic: 'viewpoint',
  nature: 'nature',
  wildlife: 'sanctuary',
  heritage: 'monument',
};

function isValidImage(u) {
  // Require the file to actually live on Commons (upload.wikimedia.org/wikipedia/commons/…).
  // Wikipedia's own REST summary sometimes surfaces a *locally hosted* enwiki file
  // (upload.wikimedia.org/wikipedia/en/…) for obscure village/hamlet stubs — these are
  // frequently generic/decorative or fair-use images with nothing to do with the actual
  // place (observed: "CattleFarming.jpg" attached to an unrelated Andhra Pradesh village
  // stub). Restricting to the Commons path filters those out entirely.
  return typeof u === 'string' && /\.(jpe?g|png)(\?.*)?$/i.test(u.split('?')[0]) && /upload\.wikimedia\.org\/wikipedia\/commons\//.test(u);
}

function searchCommons(query, limit) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=' + (limit || 8) +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json';
  let data;
  try { data = curlJson(url); } catch (e) { return []; }
  const pages = (data.query && data.query.pages) || {};
  const urls = [];
  Object.keys(pages).map((k) => pages[k]).sort((a, b) => (a.index || 0) - (b.index || 0)).forEach((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    const u = ii && (ii.thumburl || ii.url);
    if (isValidImage(u) && urls.indexOf(u) < 0) urls.push(u);
  });
  return urls;
}

function wikiSummaryImage(title) {
  const t = title.trim().replace(/\s+/g, '_');
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t).replace(/%2F/g, '/');
  let data;
  try { data = curlJson(url); } catch (e) { return null; }
  if (data && data.type === 'disambiguation') return null;
  const cand = (data.originalimage && data.originalimage.source) || (data.thumbnail && data.thumbnail.source);
  return isValidImage(cand) ? cand : null;
}

// try a list of Commons queries in order, then a Wikipedia summary fallback title.
// returns { url, via } or null. Sleeps PAUSE_MS after every network attempt.
function tryFind(queries, summaryTitle, log) {
  for (const q of queries) {
    const urls = searchCommons(q, 8);
    sleep(PAUSE_MS);
    if (urls.length) { if (log) log('  hit via commons: ' + q); return { url: urls[0], via: 'commons:' + q }; }
  }
  if (summaryTitle) {
    const u = wikiSummaryImage(summaryTitle);
    sleep(PAUSE_MS);
    if (u) { if (log) log('  hit via wikipedia summary: ' + summaryTitle); return { url: u, via: 'wikisummary:' + summaryTitle }; }
  }
  return null;
}

function heroQueries(d) {
  const title = d.title;
  const kw = TYPE_KEYWORD[d.type] || (d.type || '').replace(/_/g, ' ');
  const queries = [];
  const landmark = d.topPlaces && d.topPlaces[0] && d.topPlaces[0].name;
  if (landmark && landmark.toLowerCase() !== title.toLowerCase()) {
    queries.push('"' + title + '" ' + landmark);
  }
  queries.push(title + ' tourism');
  if (kw) queries.push(title + ' ' + kw);
  return queries;
}

function placeQueries(placeName, parentTitle, category) {
  const queries = ['"' + placeName + '" ' + parentTitle];
  const kw = CATEGORY_KEYWORD[category] || category;
  if (kw) queries.push('"' + placeName + '" ' + kw);
  return queries;
}

function isPicsum(src) {
  return typeof src === 'string' && /picsum\.photos/.test(src);
}

function loadCheckpoint() {
  try { return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch (e) { return { lastIndex: 0, heroFixed: 0, placesFixed: 0, processed: 0 }; }
}
function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

function main() {
  const arg = process.argv[2];
  const testLimit = arg === 'test' ? parseInt(process.argv[3] || '10', 10) : null;
  const resume = arg === 'resume';

  const idxRaw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const slugs = idxRaw.destinations.map((s) => s.slug);
  let startAt = 0;
  let cp = { lastIndex: 0, heroFixed: 0, placesFixed: 0, processed: 0 };
  if (resume) {
    cp = loadCheckpoint();
    startAt = cp.lastIndex || 0;
    console.log('[resume] starting at index ' + startAt + ' (heroFixed=' + cp.heroFixed + ' placesFixed=' + cp.placesFixed + ')');
  }

  let candidatesSeen = 0;
  const t0 = Date.now();

  for (let i = startAt; i < slugs.length; i++) {
    const slug = slugs[i];
    const detailFile = path.join(DEST_DIR, slug + '.json');
    let d;
    try { d = JSON.parse(fs.readFileSync(detailFile, 'utf8')); } catch (e) { console.error('[skip] cannot read ' + slug + ': ' + e.message); continue; }

    const heroPicsum = d.heroImage && isPicsum(d.heroImage.src);
    const placeIdxs = [];
    (d.topPlaces || []).forEach((p, pi) => {
      const src = p.image && (p.image.src || (typeof p.image === 'string' ? p.image : null));
      if (isPicsum(src)) placeIdxs.push(pi);
    });

    if (!heroPicsum && placeIdxs.length === 0) {
      cp.lastIndex = i + 1;
      if (i % 200 === 0) saveCheckpoint(cp);
      continue;
    }

    candidatesSeen++;
    if (testLimit && candidatesSeen > testLimit) { console.log('[test] limit reached, stopping'); break; }

    console.log('[' + i + '/' + slugs.length + '] ' + slug + (heroPicsum ? ' [hero]' : '') + (placeIdxs.length ? ' [places:' + placeIdxs.length + ']' : ''));

    let heroResult = null;
    if (heroPicsum) {
      heroResult = tryFind(heroQueries(d), d.title, (m) => console.log(m));
      if (heroResult) { cp.heroFixed++; console.log('  HERO FIXED -> ' + heroResult.url); }
      else console.log('  hero: no real photo found');
    }

    const placeResults = []; // {pi, url}
    for (const pi of placeIdxs) {
      const p = d.topPlaces[pi];
      const r = tryFind(placeQueries(p.name, d.title, p.category), p.name, (m) => console.log(m));
      if (r) { placeResults.push({ pi, url: r.url }); cp.placesFixed++; console.log('  PLACE FIXED [' + pi + '] ' + p.name + ' -> ' + r.url); }
      else console.log('  place [' + pi + '] ' + p.name + ': no real photo found');
    }

    // ---- write detail file: re-read fresh immediately before writing ----
    if (heroResult || placeResults.length) {
      let fresh;
      try { fresh = JSON.parse(fs.readFileSync(detailFile, 'utf8')); } catch (e) { console.error('[write-skip] cannot re-read ' + slug); continue; }
      if (heroResult) {
        const alt = (fresh.heroImage && fresh.heroImage.alt) || fresh.title || slug;
        fresh.heroImage = { src: heroResult.url, alt };
        if (!Array.isArray(fresh.gallery)) fresh.gallery = [];
        if (fresh.gallery.length < 3 && !fresh.gallery.some((g) => (g.src || g) === heroResult.url)) {
          fresh.gallery.push({ src: heroResult.url, alt });
        }
      }
      for (const pr of placeResults) {
        const fp = fresh.topPlaces && fresh.topPlaces[pr.pi];
        if (!fp) continue;
        const alt = (fp.image && fp.image.alt) || fp.name;
        fp.image = { src: pr.url, alt };
        if (!Array.isArray(fp.photos) || fp.photos.length === 0) fp.photos = [pr.url];
      }
      fs.writeFileSync(detailFile, JSON.stringify(fresh, null, 2));
    }

    // ---- write index.json summary: re-read fresh immediately before writing ----
    if (heroResult) {
      let freshIdx;
      try { freshIdx = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')); } catch (e) { console.error('[write-skip] cannot re-read index.json'); freshIdx = null; }
      if (freshIdx) {
        const summary = freshIdx.destinations.find((s) => s.slug === slug);
        if (summary) {
          const alt = (summary.heroImage && summary.heroImage.alt) || summary.title || slug;
          summary.heroImage = { src: heroResult.url, alt };
          if (summary.image && isPicsum(summary.image.src)) {
            summary.image = { src: heroResult.url, alt: (summary.image.alt || alt) };
          }
          fs.writeFileSync(INDEX_FILE, JSON.stringify(freshIdx));
        }
        console.log('  index.json summary updated');
      }
    }

    cp.processed++;
    cp.lastIndex = i + 1;
    if (cp.processed % 10 === 0) {
      saveCheckpoint(cp);
      const mins = ((Date.now() - t0) / 60000).toFixed(1);
      console.log('--- checkpoint: index=' + cp.lastIndex + ' heroFixed=' + cp.heroFixed + ' placesFixed=' + cp.placesFixed + ' elapsed=' + mins + 'min ---');
    }
  }

  saveCheckpoint(cp);
  console.log('[done] heroFixed=' + cp.heroFixed + ' placesFixed=' + cp.placesFixed + ' processed=' + cp.processed + ' lastIndex=' + cp.lastIndex);
}

if (require.main === module) main();
module.exports = { heroQueries, placeQueries, isValidImage, tryFind };
