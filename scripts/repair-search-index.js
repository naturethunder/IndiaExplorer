/**
 * repair-search-index.js — One-shot script to rebuild data/search-index.json
 * in the correct schema expected by js/pages/finder.js.
 *
 * Background: scripts/add-new-destinations.js overwrote search-index.json with
 * a plain array and a simplified field set, breaking finder.js (which expects
 * { entries: [{slug, placeNames, hotelNames, tiers, hotelMinPrices, hay}] }).
 *
 * This script reads every data/destinations/<slug>.json and rebuilds the index
 * with the full field set, wrapped in { entries: [...] }.
 *
 * Usage: node scripts/repair-search-index.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const SEARCH_OUT = path.join(ROOT, 'data', 'search-index.json');

// Price tier bands (must match build-json-data.js / the site's PRICE_TIERS)
const TIER_BANDS = [
  { id: 'budget',       max: 1500 },
  { id: 'good',         max: 3000 },
  { id: 'better',       max: 6000 },
  { id: 'best',         max: 12000 },
  { id: 'luxury',       max: 25000 },
  { id: 'extra_luxury', max: Infinity },
];

function tiersOf(hotels, minPrice) {
  const prices = (hotels || []).map(h => {
    const lo = h.priceMin != null ? h.priceMin : (minPrice || 0);
    const hi = h.priceMax != null ? h.priceMax : lo;
    return { lo, hi };
  });
  if (prices.length === 0 && minPrice) {
    prices.push({ lo: minPrice, hi: minPrice });
  }
  const tiers = [];
  TIER_BANDS.forEach(band => {
    const prevMax = TIER_BANDS[TIER_BANDS.indexOf(band) - 1]?.max || 0;
    if (prices.some(p => p.lo <= band.max && p.hi > prevMax)) {
      tiers.push(band.id);
    }
  });
  return tiers;
}

// Read the index to get the full list of slugs
const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const slugs = idx.destinations.map(d => d.slug);

console.log(`Rebuilding search-index.json for ${slugs.length} destinations...`);

const entries = [];
let ok = 0;
let fallback = 0;

slugs.forEach(slug => {
  const fp = path.join(DEST_DIR, slug + '.json');
  if (!fs.existsSync(fp)) {
    console.warn(`  WARN: missing detail file for ${slug}, using index-only fallback`);
    // Build a minimal entry from the index summary
    const sum = idx.destinations.find(d => d.slug === slug);
    entries.push({
      slug,
      placeNames: [],
      hotelNames: [],
      tiers: sum && sum.tiers ? sum.tiers : [],
      hotelMinPrices: sum ? [sum.minPrice || 0] : [0],
      hay: (' ' + [sum?.title, sum?.state, sum?.region, sum?.type, sum?.short,
        (sum?.features || []).join(' ')].filter(Boolean).join(' ') + ' ')
        .toLowerCase().replace(/\s+/g, ' '),
    });
    fallback++;
    return;
  }

  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const ov = d.overview || {};
  const places = d.topPlaces || [];
  const hotels = d.hotels || [];

  // Build the haystack — a single lowercase string with all searchable content
  const hay = (' ' + [
    d.title, d.state, d.region, d.type, d.tagline,
    ov.short, ov.description,
    (ov.features || []).join(' '),
    places.map(p => `${p.name} ${p.description || ''}`).join(' '),
    hotels.map(h => `${h.name} ${(h.amenities || []).join(' ')} ${(h.tags || []).join(' ')}`).join(' '),
  ].filter(Boolean).join(' ') + ' ').toLowerCase().replace(/\s+/g, ' ');

  entries.push({
    slug,
    placeNames: places.map(p => p.name).filter(Boolean),
    hotelNames: hotels.map(h => h.name).filter(Boolean),
    tiers: tiersOf(hotels, ov.minPrice || d.minPrice),
    hotelMinPrices: hotels.map(h => h.priceMin != null ? h.priceMin : (ov.minPrice || 0)),
    hay,
  });
  ok++;
});

fs.writeFileSync(SEARCH_OUT, JSON.stringify({ entries }));

const kb = Math.round(fs.statSync(SEARCH_OUT).size / 1024);
console.log(`✅ search-index.json rebuilt: ${entries.length} entries (${ok} full, ${fallback} fallback), ${kb} KB`);
console.log(`   Shape: { entries: [{ slug, placeNames[], hotelNames[], tiers[], hotelMinPrices[], hay }] }`);
