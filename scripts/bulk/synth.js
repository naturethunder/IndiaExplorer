/**
 * synth.js — shared synthesis + derivation helpers for the bulk-ingest pipeline.
 *
 * Mirrors the auto-generation already baked into js/data-destinations.js
 * (stdStays / routes / airport / railway / tagline / descriptions) so bulk
 * destinations are structurally identical to the hand-authored 90, PLUS the
 * heuristics for the fields no public dataset carries (type mapping, climate,
 * price). Pure Node stdlib. Legacy files are untouched — this is a build-time
 * module used only by scripts/bulk/*.
 */

// ─── slug / string helpers ──────────────────────────────
function slugify(name) {
  return String(name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')      // strip accents
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function img(seed, w, h) {
  return 'https://picsum.photos/seed/' + encodeURIComponent(seed) + '/' + w + '/' + h;
}

// ─── stays (verbatim port of data-destinations.js stdStays) ──
function stdStays(name, base, type) {
  const b = Math.max(900, base);
  let famous, ftier;
  if (type === 'heritage' || type === 'beach') { famous = 'Marriott ' + name; ftier = 'luxury'; }
  else if (type === 'hill_station') { famous = 'Sterling ' + name; ftier = 'best'; }
  else if (type === 'wildlife') { famous = 'Jungle Lodges ' + name; ftier = 'best'; }
  else if (type === 'spiritual') { famous = 'Fortune Park ' + name; ftier = 'best'; }
  else { famous = 'Radisson ' + name; ftier = 'best'; }
  const r = (x) => Math.round(x / 50) * 50;
  const stay = (nm, t, tier, lo, hi, rating, reviews, amenities, tags) => ({
    name: nm, type: t, tier, priceMin: lo, priceMax: hi, rating, reviews,
    amenities, tags, image: img(nm, 400, 280), bookingUrl: '#',
  });
  return [
    stay('OYO ' + name + ' Stay', 'oyo', 'budget', r(b), r(b * 1.6), 4.0, 320,
      ['WiFi', 'AC', 'Parking', 'Breakfast'], ['OYO Verified', 'Value']),
    stay('Airbnb: Stay in ' + name, 'airbnb apartment', 'good', r(b * 1.9), r(b * 2.7), 4.7, 130,
      ['Full Kitchen', 'Self Check-in', 'Local Host', 'WiFi'], ['Airbnb Superhost', 'Entire Place']),
    stay(name + ' Grand Hotel', 'hotel', 'better', r(b * 3), r(b * 4.5), 4.4, 430,
      ['Pool', 'Restaurant', 'Room Service', 'Gym'], ['Popular', 'Central']),
    stay(famous, 'resort', ftier, r(b * 6), r(b * 10), 4.7, 560,
      ['Pool', 'Spa', 'Fine Dining', 'Concierge'], ['Famous Chain', 'Premium']),
  ];
}

const TYPE_LABEL = {
  hill_station: 'hill station', beach: 'beach town', heritage: 'heritage city',
  wildlife: 'wildlife reserve', spiritual: 'spiritual town', adventure: 'adventure base',
};

// ─── type mapping: Wikidata P31 labels / name / description → 6 site types ──
const TYPE_RULES = [
  { type: 'beach', re: /\bbeach|seashore|seaside|lagoon|backwater\b/i },
  { type: 'wildlife', re: /\bnational park|wildlife|sanctuary|tiger reserve|bird|biosphere|jungle|forest reserve|zoo\b/i },
  { type: 'hill_station', re: /\bhill station|hill town|mountain|valley|peak|glacier|ski|snow|plateau|range\b/i },
  { type: 'spiritual', re: /\btemple|pilgrimage|shrine|math|monaster|gurudwara|mosque|dargah|church|ghat|holy|sacred|tirtha|dham\b/i },
  { type: 'heritage', re: /\bfort|palace|monument|heritage|historic|archaeolog|ruins|caves?|tomb|mausoleum|stepwell|haveli|museum|old city|world heritage\b/i },
  { type: 'adventure', re: /\btrek|trail|rafting|adventure|camping|paraglid|climb|caving|water sport\b/i },
  // bare "island"/"coast" only counts as beach when nothing more specific matched
  // (e.g. "artificial island, palace" = heritage, not beach)
  { type: 'beach', re: /\bisland|coast|harbou?r|port town\b/i },
];
function mapType(hints) {
  const text = (hints || []).join(' ');
  for (const rule of TYPE_RULES) if (rule.re.test(text)) return rule.type;
  return 'heritage'; // safe default — most Indian tourist places are heritage/urban
}

// ─── climate: derive best-months + temps from latitude + altitude + aridity ──
// Approximation good enough for "best time to visit" guidance; real weather is
// live on the page anyway (Open-Meteo).
const ARID_STATES = /rajasthan|gujarat|kutch|haryana|punjab/i;
function deriveClimate(lat, alt, state) {
  alt = alt || 0;
  // High Himalaya / high hill stations
  if (alt >= 2500) {
    return { label: 'Apr – Jun, Sep – Oct', months: [4, 5, 6, 9, 10], tempSummer: '10–22°C', tempWinter: '-6–10°C' };
  }
  if (alt >= 1200) {
    return { label: 'Mar – Jun, Sep – Nov', months: [3, 4, 5, 6, 9, 10, 11], tempSummer: '15–28°C', tempWinter: '2–16°C' };
  }
  // Himalayan state fallback when altitude is unknown/low
  const HIMALAYAN_STATES = /himachal pradesh|uttarakhand|jammu & kashmir|jammu and kashmir|ladakh|sikkim|arunachal pradesh/i;
  if (HIMALAYAN_STATES.test(state || '')) {
    return { label: 'Mar – Jun, Sep – Nov', months: [3, 4, 5, 6, 9, 10, 11], tempSummer: '15–28°C', tempWinter: '2–16°C' };
  }
  // Arid north-west (desert): avoid summer
  if (ARID_STATES.test(state || '')) {
    return { label: 'Oct – Mar', months: [10, 11, 12, 1, 2, 3], tempSummer: '28–44°C', tempWinter: '8–25°C' };
  }
  // Deep south / coastal (low latitude): pleasant winter, humid
  if (lat != null && lat < 16) {
    return { label: 'Nov – Feb', months: [11, 12, 1, 2], tempSummer: '26–36°C', tempWinter: '22–32°C' };
  }
  // Northern plains / general low elevation
  if (lat != null && lat >= 24) {
    return { label: 'Oct – Mar', months: [10, 11, 12, 1, 2, 3], tempSummer: '25–42°C', tempWinter: '7–24°C' };
  }
  // Central India default
  return { label: 'Oct – Mar', months: [10, 11, 12, 1, 2, 3], tempSummer: '26–40°C', tempWinter: '12–28°C' };
}

// ─── price / rating heuristics ──────────────────────────
function deriveMinPrice(type, alt) {
  if (type === 'wildlife') return 2500;
  if (type === 'beach') return 1200;
  if (type === 'hill_station') return (alt && alt >= 2000) ? 1500 : 1200;
  if (type === 'adventure') return 1400;
  if (type === 'spiritual') return 800;
  return 900; // heritage / default
}
// Deterministic pseudo-rating from a seed string (no Math.random — reproducible builds).
function seedNum(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}
function syntheticRating(seed) {
  return Math.round((4.1 + seedNum(seed) * 0.7) * 10) / 10; // 4.1–4.8
}
function syntheticReviews(seed) {
  return 1500 + Math.round(seedNum('r' + seed) * 20000); // 1.5k–21.5k
}

// ─── geography ──────────────────────────────────────────
const DELHI = [28.6139, 77.2090];
function haversineKm(a, b) {
  if (!a || !b || a[0] == null || b[0] == null) return null;
  const R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
function distanceFromDelhi(lat, lng) {
  const d = haversineKm(DELHI, [lat, lng]);
  return d == null ? null : Math.round(d);
}

// ─── features from type + place categories ──────────────
const TYPE_FEATURES = {
  hill_station: ['Mountain Views', 'Cool Weather', 'Scenic Walks', 'Nature'],
  beach: ['Beaches', 'Seafood', 'Water Sports', 'Sunsets'],
  heritage: ['Forts', 'Architecture', 'History', 'Local Bazaars'],
  wildlife: ['Safari', 'Wildlife', 'Nature', 'Birding'],
  spiritual: ['Temples', 'Pilgrimage', 'Ghats', 'Festivals'],
  adventure: ['Trekking', 'Adventure', 'Camping', 'Viewpoints'],
};
function deriveFeatures(type, placeCategories) {
  const base = TYPE_FEATURES[type] || TYPE_FEATURES.heritage;
  return base.slice(0, 4);
}

// ─── place factory (mirrors pl() in data-destinations.js) ──
function makePlace(name, category, distanceKm, desc, rating) {
  const dist = distanceKm != null ? (distanceKm <= 1 ? 'Town Centre' : Math.round(distanceKm) + ' km') : 'Nearby';
  return {
    name,
    category: category || 'scenic',
    distance: dist,
    entryFee: 'Varies',
    timings: 'Varies by season',
    duration: '1–2 hrs',
    rating: rating || syntheticRating(name),
    desc: desc || (name + ' — a notable attraction worth visiting.'),
    image: img(name, 400, 300),
    photos: [],
  };
}

/**
 * Assemble a full source-shaped destination object (same shape the D() factory
 * produces), ready for build-json-data.js's mapper. `authored` supplies the
 * real fields; everything else is synthesized.
 */
function buildDestination(a) {
  const type = a.type;
  const alt = a.altitude || null;
  const climate = deriveClimate(a.lat, alt, a.state);
  const features = a.features && a.features.length ? a.features : deriveFeatures(type, []);
  let minPrice = deriveMinPrice(type, alt);
  const stays = stdStays(a.name, minPrice, type);
  minPrice = stays.reduce((m, s) => Math.min(m, s.priceMin), Infinity);
  const fromDelhi = a.distanceFromDelhi != null ? a.distanceFromDelhi : distanceFromDelhi(a.lat, a.lng);
  const region = a.region || a.state;
  const rating = a.rating || syntheticRating(a.slug);
  const reviews = a.reviewCount || syntheticReviews(a.slug);

  return {
    id: a.slug,
    name: a.name,
    state: a.state,
    region,
    type,
    badge: 'Popular',
    tagline: a.name + ' — ' + (TYPE_LABEL[type] || 'getaway') + ' of ' + a.state,
    shortDesc: a.shortDesc ||
      (a.name + ' is a much-loved ' + (TYPE_LABEL[type] || 'destination') + ' in ' + a.state +
        ', known for ' + features.slice(0, 2).join(' and ').toLowerCase() + '.'),
    description: a.description ||
      (a.name + ', in ' + region + ', ' + a.state + ', is one of India’s notable ' +
        (TYPE_LABEL[type] || 'destinations') + '. Visitors come for its ' +
        features.join(', ').toLowerCase() + ', with the best months being ' + climate.label + '.'),
    altitude: alt,
    bestMonths: climate.label,
    bestMonthsList: climate.months,
    tempSummer: climate.tempSummer,
    tempWinter: climate.tempWinter,
    rating,
    reviewCount: reviews,
    minPrice,
    distanceFromDelhi: fromDelhi,
    image: img(a.slug, 800, 500),
    heroImage: img(a.slug + '-hero', 1400, 700),
    features,
    lat: a.lat,
    lng: a.lng,
    places: (a.places || []).slice(0, 8),
    stays,
    routes: [
      { from: 'Delhi', distance: fromDelhi, byCar: fromDelhi ? Math.max(1, Math.round(fromDelhi / 60)) + '–' + Math.round(fromDelhi / 45) + ' hrs' : 'Via road', byTrain: 'Rail to ' + a.name + ' / nearest junction', byAir: 'Fly to nearest airport + taxi', via: 'National highway network' },
      { from: 'State capital', distance: fromDelhi ? Math.round(fromDelhi / 3) : null, byCar: fromDelhi ? Math.max(1, Math.round((fromDelhi / 3) / 50)) + ' hrs' : 'Via road', byTrain: 'Direct/connecting trains', byAir: 'Nearest airport', via: 'Regional roads' },
    ],
    nearestAirport: { name: a.name + ' / nearest airport', distance: 30 },
    nearestRailway: { name: a.name + ' Railway Station', distance: 5 },
    roadNote: 'Roads are generally good; check seasonal/monsoon conditions before high-altitude or remote stretches.',
  };
}

module.exports = {
  slugify, mapType, deriveClimate, deriveMinPrice, deriveFeatures,
  syntheticRating, syntheticReviews, haversineKm, distanceFromDelhi,
  makePlace, buildDestination, stdStays,
};
