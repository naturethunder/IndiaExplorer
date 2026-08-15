/** Fill missing destination/place/stay media from exact English Wikipedia pages. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DIR, 'index.json');
const kind = process.argv[2];
const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
if (!['destination', 'place', 'stay'].includes(kind)) throw new Error('Choose destination, place, or stay');

function src(value) {
  if (typeof value === 'string') return value.trim();
  return value && typeof value.src === 'string' ? value.src.trim() : '';
}
function normalize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function coreName(value) { return String(value || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*&\s*.*/, '').trim(); }
function validIdentity(requested, returned) {
  const a = normalize(requested);
  const b = normalize(returned);
  return a === b || (a.length >= 8 && (a.includes(b) || b.includes(a)));
}
function validImage(summary) {
  const image = summary.originalimage;
  if (!image || !image.source || Number(image.width || 0) < 1000) return false;
  return !/\.svg(?:\/|\?|$)|\.gif(?:\/|\?|$)|map|logo|flag|diagram|drawing|painting|poster|stamp|coin|book|journal|\.pdf|\.djvu/i.test(image.source);
}
function stayContext(summary) {
  const text = normalize([summary.title, summary.description, summary.extract].filter(Boolean).join(' '));
  return /\b(hotel|resort|hostel|homestay|guest house|guesthouse|lodge|inn|motel|accommodation|heritage property)\b/.test(text);
}
function indiaContext(summary, state, parentName) {
  const text = normalize([summary.title, summary.description, summary.extract].filter(Boolean).join(' '));
  return text.includes(' india') || normalize(state).split(' ').some(token => token.length >= 4 && text.includes(token)) || normalize(parentName).split(' ').some(token => token.length >= 5 && text.includes(token));
}
async function fetchSummary(name) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(coreName(name)), {
      signal: controller.signal,
      headers: { 'user-agent': 'IndiaExploreBot/1.0 (travel media verification)' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
  finally { clearTimeout(timer); }
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const details = new Map();
const tasks = [];
for (const summary of index.destinations) {
  const file = path.join(DIR, summary.slug + '.json');
  const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
  details.set(summary.slug, { file, detail, changed: false });
  if (kind === 'destination' && !src(detail.heroImage) && tasks.length < LIMIT) {
    tasks.push({ slug: detail.slug, name: detail.title, state: detail.state, parentName: '', target: detail });
  }
  if (kind === 'place') {
    for (const place of detail.topPlaces || []) {
      if (tasks.length >= LIMIT) break;
      if (!src(place.image)) tasks.push({ slug: detail.slug, name: place.name, state: detail.state, parentName: detail.title, target: place });
    }
  }
  if (kind === 'stay') {
    for (const stay of detail.hotels || []) {
      if (tasks.length >= LIMIT) break;
      if (!src(stay.image)) tasks.push({ slug: detail.slug, name: stay.name, state: detail.state, parentName: detail.title, target: stay });
    }
  }
}

let cursor = 0;
let filled = 0;
let rejected = 0;
const examples = [];
async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++];
    const summary = await fetchSummary(task.name);
    const identityMatches = summary && (kind === 'stay'
      ? normalize(coreName(task.name)) === normalize(summary.title)
      : validIdentity(coreName(task.name), summary.title));
    if (!summary || !identityMatches || !validImage(summary) || !indiaContext(summary, task.state, task.parentName) || (kind === 'stay' && !stayContext(summary))) {
      rejected++;
      continue;
    }
    const image = { src: summary.originalimage.source, alt: task.name };
    const source = { provider: 'Wikipedia/Wikimedia Commons', page: summary.content_urls && summary.content_urls.desktop ? summary.content_urls.desktop.page : '', matchedTitle: summary.title };
    if (kind === 'destination') {
      task.target.heroImage = image;
      task.target.image = task.target.image || { ...image };
      task.target.gallery = [{ ...image }, ...(task.target.gallery || []).filter(item => src(item) !== image.src)];
      task.target.mediaSource = source;
      const entry = index.destinations.find(item => item.slug === task.slug);
      if (entry) { entry.heroImage = image; entry.image = task.target.image; }
    } else if (kind === 'place') {
      task.target.image = image;
      task.target.photos = [image.src];
      task.target.imageSource = source;
    } else {
      task.target.image = image;
      task.target.imageSource = source;
    }
    details.get(task.slug).changed = true;
    filled++;
    if (examples.length < 20) examples.push({ slug: task.slug, requested: task.name, matched: summary.title, image: image.src });
  }
}

(async () => {
  await Promise.all(Array.from({ length: 12 }, worker));
  if (APPLY) {
    for (const { file, detail, changed } of details.values()) if (changed) fs.writeFileSync(file, JSON.stringify(detail, null, 2) + '\n');
    if (kind === 'destination') fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
  }
  console.log(JSON.stringify({ kind, mode: APPLY ? 'apply' : 'check', attempted: tasks.length, filled, rejected, examples }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
