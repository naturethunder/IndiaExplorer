/**
 * build-json-data.js — converts the legacy JS data layer (js/data.js,
 * js/data-extra.js, js/data-destinations.js, js/data-photos.js,
 * js/data-place-photos.js) into the JSON data layer:
 *
 *   data/destinations/<slug>.json   one file per destination (full detail — the
 *                                   ONLY thing destination.html?slug= loads)
 *   data/destinations/index.json    lightweight manifest of all destinations +
 *                                   site meta (types, states, months, price tiers)
 *                                   for the browse/home pages
 *   data/search-index.json          extended per-destination text index for the
 *                                   AI finder (haystack, place & hotel names)
 *
 * Re-run after any change to the source js/data*.js files:
 *   node scripts/build-json-data.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const geo = require('./geo-reference');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'destinations');
const SEARCH_OUT = path.join(ROOT, 'data', 'search-index.json');

// ─── Load legacy data files in a sandbox ─────────────────────────────
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['data.js', 'data-extra.js', 'data-destinations.js', 'data-photos.js', 'data-place-photos.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), ctx, { filename: f });
}
const DESTINATIONS = vm.runInContext('DESTINATIONS', ctx);
const PRICE_TIERS = vm.runInContext('PRICE_TIERS', ctx);
const DESTINATION_TYPES = vm.runInContext('DESTINATION_TYPES', ctx);
const INDIA_STATES = vm.runInContext('INDIA_STATES', ctx);
const MONTHS = vm.runInContext('MONTHS', ctx);

// ─── Merge bulk-ingested destinations (scripts/bulk/*) ───────────────
// data/bulk/<state>.json holds full source-shaped destinations produced by the
// bulk pipeline (fetch-candidates → fetch-places → derive). They are appended to
// the legacy DESTINATIONS here — the ONLY place the two sources join. Slugs that
// collide with an existing destination are skipped (legacy wins).
const BULK_DIR = path.join(ROOT, 'data', 'bulk');
if (fs.existsSync(BULK_DIR)) {
  const seen = new Set(DESTINATIONS.map((d) => d.id));
  let added = 0, skipped = 0;
  for (const f of fs.readdirSync(BULK_DIR).filter((n) => n.endsWith('.json')).sort()) {
    const arr = JSON.parse(fs.readFileSync(path.join(BULK_DIR, f), 'utf8'));
    for (const d of arr) {
      if (seen.has(d.id)) { skipped++; continue; }
      seen.add(d.id);
      DESTINATIONS.push(d);
      added++;
    }
  }
  console.log(`bulk: +${added} destinations merged (${skipped} slug collisions skipped)`);
}

// Coordinates for the original 18 destinations (they never carried lat/lng —
// this map mirrors what destination.html/ai-finder.html hardcoded).
const COORDS = {
  kanatal: [30.4133, 78.2778], manali: [32.2432, 77.1892], goa: [15.2993, 74.1240],
  coorg: [12.3375, 75.8069], udaipur: [24.5854, 73.7125], rishikesh: [30.0869, 78.2676],
  darjeeling: [27.0360, 88.2627], munnar: [10.0889, 77.0595], ladakh: [34.1526, 77.5771],
  hampi: [15.3350, 76.4600], ooty: [11.4102, 76.6950], varanasi: [25.3176, 82.9739],
  spiti: [32.2461, 78.0335], jaisalmer: [26.9157, 70.9083], mcleodganj: [32.2396, 76.3217],
  varkala: [8.7379, 76.7163], kaziranga: [26.5780, 93.1700], 'rann-of-kutch': [23.7337, 70.8022],
};

const YEAR = new Date().getFullYear();

// ─── Coordinate / state corrections ──────────────────────────────────
// Some bulk destinations inherited WRONG coords or state labels from upstream
// Wikidata/Wikipedia (e.g. Fort Madhogarh's Wikidata point lands on Delhi;
// Manikarnikeswarar temple got Varanasi's Manikarnika Ghat). data/coord-overrides.json
// maps slug → { lat, lng, state? } to fix them at build time. Everything derived
// from coords (distanceFromDelhi, reach, map, weather) is recomputed, so one
// corrected point fixes the whole page. See scripts/geo-reference.js for the math.
const OVERRIDES = (() => {
  const p = path.join(ROOT, 'data', 'coord-overrides.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return {}; }
})();
function applyOverrides(d) {
  const o = OVERRIDES[d.id];
  if (!o) return;
  if (o.lat != null && o.lng != null) {
    d.lat = o.lat; d.lng = o.lng;
    d.distanceFromDelhi = Math.round(geo.haversineKm([28.6139, 77.2090], [o.lat, o.lng]));
    // force reach to re-derive from the corrected point (drop synthetic reach)
    if (d.nearestAirport) d.nearestAirport = { name: d.name + ' / nearest airport', distance: 30 };
  }
  if (o.state) { d.state = o.state; if (!OVERRIDES[d.id].keepRegion) d.region = o.state; }
}

function coordsOf(d) {
  const o = OVERRIDES[d.id];
  if (o && o.lat != null) return [o.lat, o.lng];
  if (COORDS[d.id]) return COORDS[d.id];
  if (d.lat != null) return [d.lat, d.lng];
  return null;
}

function tiersOf(d) {
  // which price tiers this destination actually offers (stay range overlaps band)
  return Object.keys(PRICE_TIERS).filter((key) => {
    const t = PRICE_TIERS[key];
    return (d.stays || []).some((s) => {
      const lo = s.priceMin != null ? s.priceMin : d.minPrice;
      const hi = s.priceMax != null ? s.priceMax : lo;
      return lo <= t.max && hi >= t.min;
    });
  });
}

function buildItinerary(d) {
  const places = d.places || [];
  if (!places.length) return [];
  const days = Math.min(4, Math.max(2, Math.ceil(places.length / 3)));
  const perDay = Math.ceil(places.length / days);
  const slots = ['Morning', 'Afternoon', 'Evening', 'Late evening'];
  const out = [];
  for (let i = 0; i < days; i++) {
    const chunk = places.slice(i * perDay, (i + 1) * perDay).slice(0, 4);
    if (!chunk.length) break;
    out.push({
      day: i + 1,
      title: `Day ${i + 1} — ${chunk[0].name}${chunk.length > 1 ? ' & around' : ''}`,
      items: chunk.map((p, j) => ({
        time: slots[Math.min(j, slots.length - 1)],
        activity: p.name,
        note: p.desc || '',
      })),
    });
  }
  return out;
}

function buildActivities(d) {
  const set = new Set();
  (d.places || []).forEach((p) => { if (p.category) set.add(p.category); });
  const catLabel = {
    temple: 'Temple visits', adventure: 'Adventure sports', nature: 'Nature walks',
    scenic: 'Sightseeing', town: 'Local markets', beach: 'Beach time',
    heritage: 'Heritage walks', wildlife: 'Wildlife safaris', lake: 'Lakeside leisure',
    trek: 'Trekking', museum: 'Museums', fort: 'Fort visits',
  };
  const acts = [...set].map((c) => catLabel[c] || (c.charAt(0).toUpperCase() + c.slice(1)));
  (d.features || []).forEach((f) => { if (!acts.includes(f)) acts.push(f); });
  return acts.slice(0, 10);
}

// Placeholder reach = what scripts/bulk/synth.js emits (generic airport/railway
// names + Delhi/State-capital routes). Detect it so we only overwrite synthetic
// reach and leave the 108 hand-authored destinations' real routes untouched.
function isPlaceholderReach(d) {
  const a = d.nearestAirport;
  return !!a && / \/ nearest airport$/.test(a.name || '');
}

// Real reach (nearest airport/railway + nearest-major-city routes) from baked
// coords. Returns null when we can't improve on the source (no coords, or the
// source is hand-authored). buildFaq consumes the same shape via d.nearest*.
function buildReach(d, coords) {
  if (!coords || !isPlaceholderReach(d)) return null;
  const [lat, lng] = coords;
  const air = geo.nearestAirport(lat, lng);
  const rail = geo.nearestRailway(lat, lng);
  const routes = geo.majorCityRoutes(lat, lng, d.name, 6);
  return {
    routes: routes.length ? routes : (d.routes || []),
    nearestAirport: air || d.nearestAirport,
    nearestRailway: rail || d.nearestRailway,
    roadNote: d.roadNote || '',
  };
}

function buildFaq(d) {  const topNames = (d.places || []).slice(0, 5).map((p) => p.name);
  const days = Math.min(4, Math.max(2, Math.ceil((d.places || []).length / 3)));
  const faq = [
    {
      q: `What is the best time to visit ${d.name}?`,
      a: `The best time to visit ${d.name} is ${d.bestMonths}. Summers are ${d.tempSummer} and winters are ${d.tempWinter}.`,
    },
    {
      q: `How do I reach ${d.name}?`,
      a: `The nearest airport is ${d.nearestAirport.name} (${d.nearestAirport.distance} km) and the nearest railway station is ${d.nearestRailway.name} (${d.nearestRailway.distance} km). ${d.roadNote || ''}`.trim(),
    },
    {
      q: `How many days are enough for ${d.name}?`,
      a: `${days} days are usually enough to cover the top attractions of ${d.name} at a relaxed pace.`,
    },
    {
      q: `How much does a hotel cost in ${d.name}?`,
      a: `Stays in ${d.name} start from ₹${(d.minPrice || 0).toLocaleString('en-IN')} per night, with options across ${tiersOf(d).length} price categories.`,
    },
  ];
  if (topNames.length) {
    faq.push({
      q: `What are the top places to visit in ${d.name}?`,
      a: `The top attractions are ${topNames.join(', ')}.`,
    });
  }
  return faq;
}

function toDestinationJSON(d) {
  const c = coordsOf(d);
  const hero = (d.photos && d.photos[0]) || d.heroImage || d.image;
  // Upgrade synthetic reach to real (nearest airport/railway + major-city
  // routes) before it feeds both howToReach and the derived FAQ.
  const reach = buildReach(d, c);
  if (reach) {
    d.routes = reach.routes;
    d.nearestAirport = reach.nearestAirport;
    d.nearestRailway = reach.nearestRailway;
  }
  return {
    slug: d.id,
    title: d.name,
    state: d.state,
    country: 'India',
    region: d.region || '',
    type: d.type,
    badge: d.badge || '',
    tagline: d.tagline || '',
    heroImage: { src: hero, alt: `${d.name}, ${d.state}` },
    overview: {
      short: d.shortDesc || '',
      description: d.description || '',
      features: d.features || [],
      altitude: d.altitude || null,
      rating: d.rating || 0,
      reviewCount: d.reviewCount || 0,
      minPrice: d.minPrice || 0,
      distanceFromDelhi: d.distanceFromDelhi || null,
    },
    bestTime: { label: d.bestMonths || '', months: d.bestMonthsList || [] },
    weather: {
      lat: c ? c[0] : null,
      lng: c ? c[1] : null,
      tempSummer: d.tempSummer || '',
      tempWinter: d.tempWinter || '',
    },
    howToReach: {
      routes: d.routes || [],
      nearestAirport: d.nearestAirport || null,
      nearestRailway: d.nearestRailway || null,
      roadNote: d.roadNote || '',
    },
    topPlaces: (d.places || []).map((p) => ({
      name: p.name,
      category: p.category || '',
      distance: p.distance || '',
      entryFee: p.entryFee || '',
      timings: p.timings || '',
      duration: p.duration || '',
      rating: p.rating || 0,
      description: p.desc || '',
      image: { src: p.image || '', alt: p.name },
      photos: p.photos || [],
    })),
    itinerary: buildItinerary(d),
    hotels: (d.stays || []).map((s) => ({
      name: s.name,
      type: s.type || '',
      tier: s.tier || '',
      priceMin: s.priceMin || 0,
      priceMax: s.priceMax || 0,
      rating: s.rating || 0,
      reviews: s.reviews || 0,
      amenities: s.amenities || [],
      tags: s.tags || [],
      image: { src: s.image || '', alt: s.name },
    })),
    restaurants: [],
    activities: buildActivities(d),
    gallery: (d.photos || []).map((u, i) => ({ src: u, alt: `${d.name} photo ${i + 1}` })),
    faq: buildFaq(d),
    seo: {
      title: `${d.name} Travel Guide ${YEAR} — Places, Hotels, How to Reach | IndiaExplore`,
      description: `${(d.shortDesc || '').replace(/\s+$/, '')} Plan your ${d.name} trip: ${(d.places || []).length} places to visit, ${(d.stays || []).length} stays from ₹${d.minPrice || 0}/night, best time (${d.bestMonths}) and routes.`.slice(0, 300),
      canonical: `destination.html?slug=${d.id}`,
      ogImage: hero,
      keywords: [
        `${d.name} travel guide`, `places to visit in ${d.name}`, `${d.name} hotels`,
        `best time to visit ${d.name}`, `how to reach ${d.name}`, `${d.state} tourism`,
      ],
    },
  };
}

function toSummary(d) {
  const c = coordsOf(d);
  return {
    slug: d.id,
    title: d.name,
    state: d.state,
    region: d.region || '',
    type: d.type,
    badge: d.badge || '',
    short: d.shortDesc || '',
    bestTime: { label: d.bestMonths || '', months: d.bestMonthsList || [] },
    rating: d.rating || 0,
    reviewCount: d.reviewCount || 0,
    minPrice: d.minPrice || 0,
    distanceFromDelhi: d.distanceFromDelhi || null,
    lat: c ? c[0] : null,
    lng: c ? c[1] : null,
    image: { src: d.image || '', alt: `${d.name}, ${d.state}` },
    heroImage: { src: (d.photos && d.photos[0]) || d.heroImage || d.image || '', alt: `${d.name}, ${d.state}` },
    features: d.features || [],
    tiers: tiersOf(d),
  };
}

function toSearchEntry(d) {
  // one lowercase haystack per destination so the finder's vibe/keyword scoring
  // needs no per-place data at runtime
  const hay = (' ' + [
    d.name, d.state, d.region, d.type, d.tagline, d.shortDesc, d.description,
    (d.features || []).join(' '),
    (d.places || []).map((x) => `${x.name} ${x.desc || ''}`).join(' '),
    (d.stays || []).map((s) => `${s.name} ${(s.amenities || []).join(' ')} ${(s.tags || []).join(' ')}`).join(' '),
  ].join(' ') + ' ').toLowerCase().replace(/\s+/g, ' ');
  return {
    slug: d.id,
    placeNames: (d.places || []).map((p) => p.name),
    hotelNames: (d.stays || []).map((s) => s.name),
    tiers: tiersOf(d),
    hotelMinPrices: (d.stays || []).map((s) => (s.priceMin != null ? s.priceMin : d.minPrice || 0)),
    hay,
  };
}

function countSearchMatches(q) {
  const clean = q.toLowerCase();
  return DESTINATIONS.filter(d => {
    const hay = [
      d.name, d.state, d.region, d.type, d.tagline, d.shortDesc, d.description,
      (d.features || []).join(' '),
      (d.places || []).map((x) => `${x.name} ${x.desc || ''}`).join(' '),
      (d.stays || []).map((s) => `${s.name} ${(s.amenities || []).join(' ')} ${(s.tags || []).join(' ')}`).join(' '),
    ].join(' ').toLowerCase();
    return hay.includes(clean);
  }).length;
}

// ─── Write everything ────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

// Apply coord/state corrections once, up front, so every downstream mapper
// (detail JSON, summary, search index) sees the fixed values.
let corrected = 0;
for (const d of DESTINATIONS) { if (OVERRIDES[d.id]) { applyOverrides(d); corrected++; } }
if (corrected) console.log(`corrections: ${corrected} destinations coord/state-fixed`);

let written = 0;
for (const d of DESTINATIONS) {
  fs.writeFileSync(path.join(OUT_DIR, `${d.id}.json`), JSON.stringify(toDestinationJSON(d)));
  written++;
}

const index = {
  generated: new Date().toISOString(),
  count: DESTINATIONS.length,
  meta: {
    priceTiers: PRICE_TIERS,
    types: DESTINATION_TYPES,
    // Derived from the merged set (not legacy INDIA_STATES) so every state with
    // destinations — incl. bulk-ingested ones — appears in the Explore filter.
    states: [...new Set(DESTINATIONS.map((d) => d.state).filter(Boolean))].sort(),
    months: MONTHS,
    customCounts: {
      road_trips: countSearchMatches('scenic'),
      camping: countSearchMatches('camp')
    }
  },
  destinations: DESTINATIONS.map(toSummary),
};
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));

fs.writeFileSync(SEARCH_OUT, JSON.stringify({ entries: DESTINATIONS.map(toSearchEntry) }));

const kb = (p) => Math.round(fs.statSync(p).size / 1024);
console.log(`OK: ${written} destination JSON files → data/destinations/`);
console.log(`index.json ${kb(path.join(OUT_DIR, 'index.json'))} KB, search-index.json ${kb(SEARCH_OUT)} KB`);
