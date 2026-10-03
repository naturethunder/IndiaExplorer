/**
 * sync-index-and-search.js
 * Synchronizes data/destinations/index.json and data/search-index.json directly from
 * the canonical data/destinations/<slug>.json files.
 * Ensures all "Stay starts from ₹..." card prices and search filter tiers match.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const SEARCH_OUT = path.join(ROOT, 'data', 'search-index.json');
const HASHES_PATH = path.join(__dirname, 'content-hashes.json');
const noTouch = process.argv.includes('--no-touch');

const isFirstRun = !fs.existsSync(HASHES_PATH);
let oldHashes = {};
if (!isFirstRun) {
  try {
    oldHashes = JSON.parse(fs.readFileSync(HASHES_PATH, 'utf8'));
  } catch (_) {
    oldHashes = {};
  }
}
const newHashes = {};
const stampedSlugs = [];

function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  const sorted = {};
  Object.keys(obj).sort().forEach(k => {
    if (k !== 'updatedAt') {
      sorted[k] = canonicalize(obj[k]);
    }
  });
  return sorted;
}

function computeFingerprint(dest) {
  const canon = canonicalize(dest);
  return crypto.createHash('sha1').update(JSON.stringify(canon)).digest('hex');
}

const TIER_BANDS = [
  { id: 'cheapest',     min: 0,     max: 800 },
  { id: 'budget',       min: 800,   max: 2000 },
  { id: 'good',         min: 2000,  max: 4000 },
  { id: 'better',       min: 4000,  max: 7000 },
  { id: 'best',         min: 7000,  max: 12000 },
  { id: 'luxury',       min: 12000, max: 25000 },
  { id: 'extra_luxury', min: 25000, max: Infinity }
];

function calculateTiers(hotels, minPrice) {
  const tiers = new Set();
  (hotels || []).forEach(h => {
    const lo = h.priceMin != null ? h.priceMin : (minPrice || 0);
    const hi = h.priceMax != null ? h.priceMax : lo;
    TIER_BANDS.forEach(b => {
      if (lo <= b.max && hi >= b.min) tiers.add(b.id);
    });
  });
  if (tiers.size === 0 && minPrice) {
    TIER_BANDS.forEach(b => {
      if (minPrice <= b.max && minPrice >= b.min) tiers.add(b.id);
    });
  }
  return [...tiers];
}

const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
console.log(`Synchronizing index.json and search-index.json for ${idx.destinations.length} destinations...`);

const searchEntries = [];
let updatedCount = 0;

idx.destinations.forEach(summary => {
  const fp = path.join(DEST_DIR, `${summary.slug}.json`);
  if (!fs.existsSync(fp)) {
    console.warn(`  Missing file: ${summary.slug}.json`);
    return;
  }

  let dest = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const currentHash = computeFingerprint(dest);
  newHashes[summary.slug] = currentHash;

  if (!isFirstRun && !noTouch) {
    const prevHash = oldHashes[summary.slug];
    if (!prevHash || prevHash !== currentHash) {
      dest.updatedAt = new Date().toISOString();
      fs.writeFileSync(fp, JSON.stringify(dest, null, 2) + '\n', 'utf8');
      stampedSlugs.push(prevHash ? summary.slug : `${summary.slug} (new)`);
    }
  }

  const hotels = dest.hotels || [];
  const ov = (dest.overview && typeof dest.overview === 'object') ? dest.overview : {};

  // Copy canonical fields into summary
  if (dest.title) summary.title = dest.title;
  if (dest.state) summary.state = dest.state;
  if (dest.type) summary.type = dest.type;
  if (dest.region) summary.region = dest.region;
  if (dest.bestTime) {
    summary.bestTime = {
      label: dest.bestTime.label || '',
      months: Array.isArray(dest.bestTime.months) ? [...dest.bestTime.months] : []
    };
  }
  const feats = ov.features || dest.features;
  if (feats) summary.features = Array.isArray(feats) ? [...feats] : feats;

  const ratingVal = ov.rating != null ? ov.rating : dest.rating;
  if (ratingVal != null) summary.rating = ratingVal;

  const revCount = ov.reviewCount != null ? ov.reviewCount : dest.reviewCount;
  if (revCount != null) summary.reviewCount = revCount;

  const distDelhi = ov.distanceFromDelhi != null ? ov.distanceFromDelhi : dest.distanceFromDelhi;
  if (distDelhi != null) summary.distanceFromDelhi = distDelhi;

  if (dest.updatedAt) {
    summary.updatedAt = dest.updatedAt;
  } else {
    delete summary.updatedAt;
  }

  const places = dest.topPlaces || [];
  summary.placeNames = places.map(p => p.name).filter(Boolean);

  // Find lowest price
  const hotelMin = hotels.length > 0
    ? Math.min(...hotels.map(h => typeof h.priceMin === 'number' ? h.priceMin : Infinity))
    : Infinity;

  const realMinPrice = hotelMin !== Infinity ? hotelMin : (ov.minPrice || summary.minPrice || 1200);

  // Update summary record in index.json
  summary.minPrice = realMinPrice;
  summary.tiers = calculateTiers(hotels, realMinPrice);
  if (dest.heroImage && dest.heroImage.src) {
    summary.heroImage = {
      src: dest.heroImage.src,
      alt: dest.heroImage.alt || `${dest.title}, ${dest.state}`
    };
    summary.image = {
      src: dest.heroImage.src,
      alt: dest.heroImage.alt || `${dest.title}, ${dest.state}`
    };
  }
  if (ov.short) {
    summary.short = ov.short;
  }
  if (dest.badge) {
    summary.badge = dest.badge;
  }
  updatedCount++;

  // Build search-index entry
  const overviewStr = typeof dest.overview === 'string' ? dest.overview : '';
  const hay = (' ' + [
    dest.title, dest.state, dest.region, dest.type, dest.tagline,
    overviewStr, ov.short, ov.description,
    (ov.features || dest.features || []).join(' '),
    places.map(p => `${p.name} ${p.description || ''}`).join(' '),
    hotels.map(h => `${h.name} ${(h.amenities || []).join(' ')} ${(h.tags || []).join(' ')}`).join(' ')
  ].filter(Boolean).join(' ') + ' ').toLowerCase().replace(/\s+/g, ' ');

  searchEntries.push({
    slug: dest.slug,
    placeNames: summary.placeNames,
    hotelNames: hotels.map(h => h.name).filter(Boolean),
    tiers: summary.tiers,
    hotelMinPrices: hotels.map(h => h.priceMin != null ? h.priceMin : realMinPrice),
    hay
  });
});

// Save content-hashes.json with sorted keys
const sortedHashes = {};
Object.keys(newHashes).sort().forEach(k => {
  sortedHashes[k] = newHashes[k];
});
fs.writeFileSync(HASHES_PATH, JSON.stringify(sortedHashes, null, 2) + '\n', 'utf8');

if (isFirstRun) {
  console.log(`Recorded baseline content hashes for ${Object.keys(sortedHashes).length} destinations in ${path.relative(ROOT, HASHES_PATH)}`);
} else {
  console.log(`Auto-stamped updatedAt on ${stampedSlugs.length} changed destination(s)` + (stampedSlugs.length > 0 ? `: ${stampedSlugs.join(', ')}` : ''));
}

// Save index.json
fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2), 'utf8');
console.log(`✓ data/destinations/index.json updated with ${updatedCount} synchronized summaries.`);

// Save search-index.json
fs.writeFileSync(SEARCH_OUT, JSON.stringify({ entries: searchEntries }), 'utf8');
const searchKb = Math.round(fs.statSync(SEARCH_OUT).size / 1024);
console.log(`✓ data/search-index.json updated: ${searchEntries.length} entries (${searchKb} KB).`);
