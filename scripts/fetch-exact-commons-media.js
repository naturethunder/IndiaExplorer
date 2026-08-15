/**
 * Conservatively fills missing destination/place images from Wikimedia Commons.
 * Results must be photographic, >=1000px, and textually match the entity.
 * Usage: node scripts/fetch-exact-commons-media.js destination|place|stay [--apply] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { curlJson, sleep } = require('./bulk/http');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DIR, 'index.json');
const kind = process.argv[2];
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
if (!['destination', 'place', 'stay'].includes(kind)) throw new Error('Choose destination, place, or stay');

const STOP = new Set(['india', 'indian', 'national', 'wildlife', 'sanctuary', 'temple', 'beach', 'lake', 'park', 'fort', 'falls', 'waterfall', 'village', 'viewpoint', 'point', 'trek', 'museum', 'garden', 'church', 'palace', 'island', 'river', 'mount', 'hill', 'hills']);
const BAD = /\.pdf|\.djvu|page1-|map|logo|flag|diagram|drawing|painting|poster|stamp|coin|book|journal|newsletter|anatomy|microscope|species|specimen|audio|video|\.ogv|\.webm/i;

function src(value) {
  if (typeof value === 'string') return value.trim();
  return value && typeof value.src === 'string' ? value.src.trim() : '';
}

function tokens(value, includeGeneric = false) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(token => token.length >= 4 && (includeGeneric || !STOP.has(token)));
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function candidateText(page, info) {
  const meta = info.extmetadata || {};
  return normalize([
    page.title,
    meta.ObjectName && meta.ObjectName.value,
    meta.ImageDescription && meta.ImageDescription.value,
    meta.Categories && meta.Categories.value,
  ].filter(Boolean).join(' '));
}

function candidateScore(page, info, name, state, parentName, strictEntity = false) {
  const text = candidateText(page, info);
  if (BAD.test(text) || BAD.test(info.url || '')) return -Infinity;
  const originalWidth = Number(info.width || 0);
  if (originalWidth && originalWidth < 1000) return -Infinity;
  const nameTokens = tokens(name);
  const fallbackTokens = nameTokens.length ? nameTokens : tokens(name, true);
  const matches = fallbackTokens.filter(token => text.includes(token));
  const phrase = normalize(name);
  if (strictEntity && (!phrase || !text.includes(phrase) || matches.length < 2)) return -Infinity;
  let score = phrase && text.includes(phrase) ? 12 : matches.length * 4;
  if (tokens(state, true).some(token => text.includes(token))) score += 2;
  if (tokens(parentName).some(token => text.includes(token))) score += 1;
  const required = fallbackTokens.length >= 2 ? 2 : 1;
  if (matches.length < required && !(phrase && text.includes(phrase))) return -Infinity;
  if (fallbackTokens.length === 1 && score < 6) return -Infinity;
  return score;
}

function search(name, state, parentName, strictEntity = false) {
  const query = [name, state, 'India'].filter(Boolean).join(' ');
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(query) +
    '&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url%7Cmime%7Csize%7Cextmetadata&iiurlwidth=1280&format=json';
  let json;
  try { json = curlJson(url, { tries: 1, timeoutSec: 15 }); } catch { return null; }
  const pages = Object.values((json.query && json.query.pages) || {});
  const ranked = [];
  for (const page of pages) {
    const info = page.imageinfo && page.imageinfo[0];
    if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) continue;
    const imageUrl = info.thumburl || info.url;
    if (!imageUrl || !/upload\.wikimedia\.org/i.test(imageUrl)) continue;
    const score = candidateScore(page, info, name, state, parentName, strictEntity);
    if (Number.isFinite(score)) ranked.push({ score, imageUrl, sourcePage: info.descriptionurl || '', title: page.title });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0] || null;
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
let attempted = 0;
let filled = 0;
let noMatch = 0;

for (const summary of index.destinations) {
  if (attempted >= LIMIT) break;
  const file = path.join(DIR, summary.slug + '.json');
  const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;

  if (kind === 'destination' && !src(detail.heroImage)) {
    attempted++;
    const match = search(detail.title, detail.state, '');
    if (match) {
      if (VERBOSE) console.log(`MATCH destination ${detail.slug} => ${match.title}`);
      detail.heroImage = { src: match.imageUrl, alt: `${detail.title}, ${detail.state}` };
      detail.image = detail.image || { ...detail.heroImage };
      detail.gallery = [{ src: match.imageUrl, alt: `${detail.title}, ${detail.state}` }, ...(detail.gallery || []).filter(item => src(item) !== match.imageUrl)];
      detail.mediaSource = { provider: 'Wikimedia Commons', page: match.sourcePage, matchedTitle: match.title };
      const entry = index.destinations.find(item => item.slug === detail.slug);
      if (entry) { entry.heroImage = detail.heroImage; entry.image = detail.image; }
      filled++;
      changed = true;
    } else noMatch++;
    sleep(300);
  }

  if (kind === 'place') {
    for (const place of detail.topPlaces || []) {
      if (attempted >= LIMIT) break;
      if (src(place.image)) continue;
      attempted++;
      const match = search(place.name, detail.state, detail.title);
      if (match) {
        if (VERBOSE) console.log(`MATCH place ${detail.slug} / ${place.name} => ${match.title}`);
        place.image = { src: match.imageUrl, alt: place.name };
        place.photos = [match.imageUrl];
        place.imageSource = { provider: 'Wikimedia Commons', page: match.sourcePage, matchedTitle: match.title };
        filled++;
        changed = true;
      } else noMatch++;
      sleep(300);
    }
  }

  if (kind === 'stay') {
    for (const stay of detail.hotels || []) {
      if (attempted >= LIMIT) break;
      if (src(stay.image)) continue;
      attempted++;
      // Accommodation photos must name the exact property. Location-only scenery
      // is not evidence that an image depicts the stay.
      const match = search(stay.name, detail.state, detail.title, true);
      if (match) {
        if (VERBOSE) console.log(`MATCH stay ${detail.slug} / ${stay.name} => ${match.title}`);
        stay.image = { src: match.imageUrl, alt: `${stay.name}, ${detail.title}` };
        stay.imageSource = { provider: 'Wikimedia Commons', page: match.sourcePage, matchedTitle: match.title };
        filled++;
        changed = true;
      } else noMatch++;
      sleep(300);
    }
  }

  if (APPLY && changed) fs.writeFileSync(file, JSON.stringify(detail, null, 2) + '\n');
  if (attempted && attempted % 100 === 0) process.stdout.write(`processed ${attempted}, filled ${filled}\n`);
}

if (APPLY && kind === 'destination') fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
console.log(JSON.stringify({ kind, mode: APPLY ? 'apply' : 'check', attempted, filled, noMatch }, null, 2));
