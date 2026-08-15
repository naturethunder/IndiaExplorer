/**
 * Removes misleading catalog media without deleting destination/place/stay records.
 * Default is read-only. Use --apply to write canonical detail JSON + index updates.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DIR, 'index.json');
const APPLY = process.argv.includes('--apply');
const BROKEN = new Set([
  'https://images.unsplash.com/photo-1561501878-aabd62234533?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1280&q=80',
]);
const BAD_MEDIA = /\.pdf(?:\/|\?|$)|\.djvu(?:\/|\?|$)|page1-|newsletter_for_birdwatchers|american_homes|sandy_loam|haplocampa|netaji_papers|cd169-mediated|ppat\.100|agriculture_knowledge_dissemination|shop_at_bhedaghat|dictionary|anatomy|plasma_membrane/i;
const PLACEHOLDER = /picsum\.photos|lorempixel|placehold(?:er)?|dummyimage|source\.unsplash\.com/i;
const GENERIC_WORDS = new Set(['hotel', 'resort', 'guesthouse', 'homestay', 'hostel', 'lodge', 'camp', 'stay', 'rooms', 'room', 'grand', 'retreat', 'international', 'tourist', 'holiday', 'palace', 'house', 'inn', 'the', 'and']);

function src(value) {
  if (typeof value === 'string') return value.trim();
  return value && typeof value.src === 'string' ? value.src.trim() : '';
}

function inferredWidth(url) {
  const match = url.match(/\/([1-9]\d{2,4})px-[^/?]+/i) || url.match(/[?&](?:w|width)=([1-9]\d{2,4})(?:&|$)/i);
  return match ? Number(match[1]) : null;
}

function words(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(word => word.length >= 4 && !GENERIC_WORDS.has(word));
}

function exactStayMatch(url, name) {
  let decoded = url.toLowerCase();
  try { decoded = decodeURIComponent(decoded); } catch {}
  return words(name).some(word => decoded.includes(word));
}

function rejectReason(url, kind, name) {
  if (!url) return '';
  if (BROKEN.has(url)) return 'confirmed-broken';
  if (PLACEHOLDER.test(url)) return 'placeholder';
  if (BAD_MEDIA.test(url)) return 'non-travel-scan';
  const width = inferredWidth(url);
  if (width && width < 800) return 'low-resolution';
  if (/images\.unsplash\.com/i.test(url)) return 'generic-stock';
  if (kind === 'stay' && /wikimedia\.org/i.test(url) && !exactStayMatch(url, name)) return 'unverified-stay';
  return '';
}

function imageObject(url, alt) {
  return url ? { src: url, alt } : null;
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const removed = [];
const counts = { destination: 0, place: 0, stay: 0, filesChanged: 0 };
const writes = [];

function record(slug, kind, name, field, url, reason) {
  removed.push({ slug, kind, name, field, url, reason });
  counts[kind]++;
}

for (const summary of index.destinations) {
  const file = path.join(DIR, summary.slug + '.json');
  if (!fs.existsSync(file)) continue;
  const originalText = fs.readFileSync(file, 'utf8');
  const detail = JSON.parse(originalText);
  let changed = false;

  const gallery = [];
  const gallerySeen = new Set();
  for (const [i, item] of (detail.gallery || []).entries()) {
    const url = src(item);
    const reason = rejectReason(url, 'destination', detail.title);
    if (reason || gallerySeen.has(url)) {
      record(detail.slug, 'destination', detail.title, `gallery[${i}]`, url, reason || 'exact-duplicate');
      changed = true;
      continue;
    }
    gallerySeen.add(url);
    gallery.push(typeof item === 'string' ? { src: url, alt: detail.title } : item);
  }
  detail.gallery = gallery;

  for (const field of ['heroImage', 'image']) {
    const url = src(detail[field]);
    if (!url) continue;
    const reason = rejectReason(url, 'destination', detail.title);
    if (reason) {
      record(detail.slug, 'destination', detail.title, field, url, reason);
      detail[field] = imageObject(gallery[0] && gallery[0].src, `${detail.title}, ${detail.state}`);
      changed = true;
    }
  }

  for (const [pi, place] of (detail.topPlaces || []).entries()) {
    const cleanPhotos = [];
    const seen = new Set();
    for (const [i, value] of (place.photos || []).entries()) {
      const url = src(value);
      const reason = rejectReason(url, 'place', place.name);
      if (reason || seen.has(url)) {
        record(detail.slug, 'place', place.name, `topPlaces[${pi}].photos[${i}]`, url, reason || 'exact-duplicate');
        changed = true;
        continue;
      }
      seen.add(url);
      cleanPhotos.push(url);
    }
    place.photos = cleanPhotos;
    const primary = src(place.image);
    const reason = rejectReason(primary, 'place', place.name);
    if (reason) {
      record(detail.slug, 'place', place.name, `topPlaces[${pi}].image`, primary, reason);
      place.image = imageObject(cleanPhotos[0], place.name);
      changed = true;
    }
  }

  for (const [hi, stay] of (detail.hotels || []).entries()) {
    const primary = src(stay.image);
    const reason = rejectReason(primary, 'stay', stay.name);
    if (reason) {
      record(detail.slug, 'stay', stay.name, `hotels[${hi}].image`, primary, reason);
      stay.image = null;
      changed = true;
    }
  }

  if (!changed) continue;
  counts.filesChanged++;
  const indexEntry = index.destinations.find(entry => entry.slug === detail.slug);
  if (indexEntry) {
    indexEntry.heroImage = detail.heroImage;
    indexEntry.image = detail.image || detail.heroImage;
  }
  writes.push({ file, originalText, updatedText: JSON.stringify(detail, null, 2) + '\n' });
}

const reasonCounts = removed.reduce((out, item) => {
  out[item.reason] = (out[item.reason] || 0) + 1;
  return out;
}, {});

if (APPLY) {
  const backupDir = path.join(ROOT, 'scripts', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = {
    createdAt: new Date().toISOString(),
    index: fs.readFileSync(INDEX_PATH, 'utf8'),
    files: writes.map(item => ({ file: path.basename(item.file), content: item.originalText })),
    removed,
  };
  fs.writeFileSync(path.join(backupDir, 'media-repair-2026-08-14.json.gz'), zlib.gzipSync(JSON.stringify(backup)));
  for (const item of writes) fs.writeFileSync(item.file, item.updatedText);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
}

console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'check', ...counts, removedSlots: removed.length, reasons: reasonCounts }, null, 2));
