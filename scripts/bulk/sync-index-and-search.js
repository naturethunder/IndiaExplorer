/**
 * sync-index-and-search.js
 * Synchronizes data/destinations/index.json and data/search-index.json directly from
 * the canonical data/destinations/<slug>.json files.
 * Ensures all "Stay starts from ₹..." card prices and search filter tiers match.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const SEARCH_OUT = path.join(ROOT, 'data', 'search-index.json');

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
    if (h.tier) tiers.add(h.tier);
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

  const dest = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const hotels = dest.hotels || [];
  const ov = dest.overview || {};

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
  }
  if (dest.image && dest.image.src) {
    summary.image = {
      src: dest.image.src,
      alt: dest.image.alt || `${dest.title}, ${dest.state}`
    };
  } else if (dest.heroImage && dest.heroImage.src) {
    summary.image = {
      src: dest.heroImage.src,
      alt: dest.heroImage.alt || `${dest.title}, ${dest.state}`
    };
  }
  updatedCount++;

  // Build search-index entry
  const places = dest.topPlaces || [];
  const hay = (' ' + [
    dest.title, dest.state, dest.region, dest.type, dest.tagline,
    ov.short, ov.description,
    (ov.features || []).join(' '),
    places.map(p => `${p.name} ${p.description || ''}`).join(' '),
    hotels.map(h => `${h.name} ${(h.amenities || []).join(' ')} ${(h.tags || []).join(' ')}`).join(' ')
  ].filter(Boolean).join(' ') + ' ').toLowerCase().replace(/\s+/g, ' ');

  searchEntries.push({
    slug: dest.slug,
    placeNames: places.map(p => p.name).filter(Boolean),
    hotelNames: hotels.map(h => h.name).filter(Boolean),
    tiers: summary.tiers,
    hotelMinPrices: hotels.map(h => h.priceMin != null ? h.priceMin : realMinPrice),
    hay
  });
});

// Save index.json
fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2), 'utf8');
console.log(`✓ data/destinations/index.json updated with ${updatedCount} synchronized summaries.`);

// Save search-index.json
fs.writeFileSync(SEARCH_OUT, JSON.stringify({ entries: searchEntries }), 'utf8');
const searchKb = Math.round(fs.statSync(SEARCH_OUT).size / 1024);
console.log(`✓ data/search-index.json updated: ${searchEntries.length} entries (${searchKb} KB).`);
