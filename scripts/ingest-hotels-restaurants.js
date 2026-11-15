#!/usr/bin/env node
/**
 * scripts/ingest-hotels-restaurants.js
 * ============================================================
 * Geospatial Ingestion Pipeline for ExploreDesh
 * Extracts, normalizes, deduplicates, and saves verified Indian
 * Hotels and Restaurants from OpenStreetMap (ODbL 1.0).
 *
 * Invariant: 100% Free, Zero Paid APIs, Zero Fabricated Data.
 * Missing values strictly remain null.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const HOTELS_DIR = path.join(ROOT, 'data', 'hotels');
const RESTAURANTS_DIR = path.join(ROOT, 'data', 'restaurants');

if (!fs.existsSync(HOTELS_DIR)) fs.mkdirSync(HOTELS_DIR, { recursive: true });
if (!fs.existsSync(RESTAURANTS_DIR)) fs.mkdirSync(RESTAURANTS_DIR, { recursive: true });

// 20 Pilot Hotspots across diverse Indian regions
const PILOT_SLUGS = [
  'manali', 'goa', 'jaipur', 'varanasi', 'munnar',
  'rishikesh', 'udaipur', 'darjeeling', 'ooty', 'hampi',
  'ladakh', 'pondicherry', 'shillong', 'harmandir-sahib', 'agra-fort',
  'kochi', 'mahabaleshwar', 'puri', 'gangtok', 'tarkarli'
];

// True Global Overpass Mirrors (Excludes regional European-only extracts like osm.ch/openstreetmap.fr)
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

// Haversine distance in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Normalize strings for matching
function normalizeName(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanString(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Clean address from OSM tags
function extractAddress(tags, state) {
  if (!tags) return null;
  if (tags['addr:full']) return tags['addr:full'].trim();
  
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber'].trim());
  if (tags['addr:street']) parts.push(tags['addr:street'].trim());
  if (tags['addr:suburb']) parts.push(tags['addr:suburb'].trim());
  if (tags['addr:city']) parts.push(tags['addr:city'].trim());
  if (tags['addr:postcode']) parts.push(tags['addr:postcode'].trim());
  if (state && !parts.includes(state)) parts.push(state);
  
  return parts.length > 0 ? parts.join(', ') : null;
}

// Extract facilities/amenities
function extractFacilities(tags) {
  const facilities = [];
  if (!tags) return null;
  
  if (tags.internet_access === 'wlan' || tags.internet_access === 'yes' || tags.wifi === 'yes') facilities.push('Free Wi-Fi');
  if (tags.swimming_pool === 'yes') facilities.push('Swimming Pool');
  if (tags.air_conditioning === 'yes') facilities.push('Air Conditioning');
  if (tags.parking === 'yes' || tags['parking:fee'] === 'no') facilities.push('Parking Available');
  if (tags.wheelchair === 'yes') facilities.push('Wheelchair Accessible');
  if (tags.restaurant === 'yes') facilities.push('In-house Restaurant');
  if (tags.bar === 'yes') facilities.push('Bar / Lounge');
  if (tags.spa === 'yes') facilities.push('Wellness Spa');
  if (tags.gym === 'yes') facilities.push('Fitness Center');
  if (tags.outdoor_seating === 'yes') facilities.push('Outdoor Seating');
  
  return facilities.length > 0 ? facilities : null;
}

// Extract cuisines
function extractCuisines(tags) {
  if (!tags || !tags.cuisine) return null;
  const list = tags.cuisine
    .split(/[;,]/)
    .map(c => c.trim().toLowerCase().replace(/_/g, ' '))
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

// Fetch Overpass elements with mirror failover and load balancing
let currentMirrorOffset = 0;
async function fetchOverpassQuery(query) {
  let lastError = null;
  const startOffset = currentMirrorOffset++;
  for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
    const mirror = OVERPASS_MIRRORS[(startOffset + i) % OVERPASS_MIRRORS.length];
    try {
      const url = mirror + '?data=' + encodeURIComponent(query);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ExploreDesh-DataIngest/1.0 (https://exploredesh.com; contact@exploredesh.com)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        return json.elements || [];
      } else {
        lastError = new Error(`${mirror} returned HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
    await new Promise(r => setTimeout(r, 600));
  }
  throw lastError || new Error('All Overpass mirrors failed.');
}

// Query Overpass for a specific destination with a single combined query
async function fetchPlacesForDestination(lat, lng, radius = 8000) {
  const query = `[out:json][timeout:35];
(
  nwr["tourism"~"hotel|guest_house|resort|hostel|motel|apartment|camp_site"](around:${radius},${lat},${lng});
  nwr["amenity"~"restaurant|cafe|fast_food|food_court|bakery|pub|bar"](around:${radius},${lat},${lng});
);
out center 80;`;

  const elements = await fetchOverpassQuery(query);
  const hotelElements = elements.filter(e => e.tags && e.tags.tourism);
  const restroElements = elements.filter(e => e.tags && e.tags.amenity);

  return { hotelElements, restroElements };
}

// Process raw OSM elements into normalized ExploreDesh Hotel & Restaurant schemas
function processElements(hotelElements, restroElements, dest) {
  const destLat = dest.weather?.lat ?? dest.lat;
  const destLng = dest.weather?.lng ?? dest.lng;
  const nowISO = new Date().toISOString().split('T')[0];

  const rawHotels = [];
  const rawRestaurants = [];

  // 1. Process Hotels
  for (const el of hotelElements) {
    const tags = el.tags || {};
    const name = cleanString(tags.name || tags['name:en']);
    if (!name) continue;

    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    if (lat == null || lng == null) continue;

    const distanceKm = Number(haversineDistance(destLat, destLng, lat, lng).toFixed(2));
    const sourceId = `${el.type}/${el.id}`;
    const id = `osm-${el.type}-${el.id}`;

    let category = 'Hotel';
    const t = (tags.tourism || '').toLowerCase();
    if (t === 'resort') category = 'Resort';
    else if (t === 'guest_house') category = 'Guest House';
    else if (t === 'hostel') category = 'Hostel';
    else if (t === 'motel') category = 'Motel';
    else if (t === 'apartment') category = 'Apartment';
    else if (t === 'camp_site') category = 'Campsite';
    else if (name.toLowerCase().includes('homestay') || (tags.accommodation && tags.accommodation.includes('homestay'))) category = 'Homestay';

    rawHotels.push({
      id,
      name,
      category,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      distance_km: distanceKm,
      address: extractAddress(tags, dest.state),
      state: dest.state,
      destination: dest.title,
      destination_slug: dest.slug,
      phone: cleanString(tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile),
      website: cleanString(tags.website || tags['contact:website'] || tags.url),
      opening_hours: cleanString(tags.opening_hours),
      cuisine: null,
      facilities: extractFacilities(tags),
      image: null,
      source: 'OpenStreetMap',
      source_id: sourceId,
      license: 'ODbL 1.0',
      attribution: '© OpenStreetMap contributors',
      last_verified: nowISO
    });
  }

  // 2. Process Restaurants
  for (const el of restroElements) {
    const tags = el.tags || {};
    const name = cleanString(tags.name || tags['name:en']);
    if (!name) continue;

    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    if (lat == null || lng == null) continue;

    const distanceKm = Number(haversineDistance(destLat, destLng, lat, lng).toFixed(2));
    const sourceId = `${el.type}/${el.id}`;
    const id = `osm-${el.type}-${el.id}`;

    let category = 'Restaurant';
    const a = (tags.amenity || '').toLowerCase();
    if (a === 'cafe') category = 'Cafe';
    else if (a === 'fast_food') category = 'Fast Food';
    else if (a === 'food_court') category = 'Food Court';
    else if (a === 'bakery') category = 'Bakery';
    else if (a === 'bar' || a === 'pub') category = 'Bar & Pub';
    if (name.toLowerCase().includes('dhaba') || (tags.cuisine && tags.cuisine.toLowerCase().includes('dhaba'))) category = 'Dhaba';

    const cuisines = extractCuisines(tags);
    const isPureVeg = tags['diet:vegetarian'] === 'only' || tags['diet:vegan'] === 'only' || name.toLowerCase().includes('pure veg');
    const hasVeg = isPureVeg || tags['diet:vegetarian'] === 'yes';

    rawRestaurants.push({
      id,
      name,
      category,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      distance_km: distanceKm,
      address: extractAddress(tags, dest.state),
      state: dest.state,
      destination: dest.title,
      destination_slug: dest.slug,
      phone: cleanString(tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile),
      website: cleanString(tags.website || tags['contact:website'] || tags.url),
      opening_hours: cleanString(tags.opening_hours),
      cuisine: cuisines,
      is_pure_veg: isPureVeg,
      has_veg_options: hasVeg,
      facilities: extractFacilities(tags),
      image: null,
      source: 'OpenStreetMap',
      source_id: sourceId,
      license: 'ODbL 1.0',
      attribution: '© OpenStreetMap contributors',
      last_verified: nowISO
    });
  }

  return {
    hotels: deduplicatePlaces(rawHotels),
    restaurants: deduplicatePlaces(rawRestaurants)
  };
}

// Deduplicate based on ID, coordinates (< 50m) and name similarity
function deduplicatePlaces(places) {
  const seenIds = new Set();
  const result = [];

  for (const p of places) {
    if (seenIds.has(p.id)) continue;

    const isDup = result.some(existing => {
      const dist = haversineDistance(existing.latitude, existing.longitude, p.latitude, p.longitude);
      if (dist < 0.05) { // within 50 meters
        const norm1 = normalizeName(existing.name);
        const norm2 = normalizeName(p.name);
        if (norm1 === norm2 || (norm1.length > 5 && norm2.length > 5 && (norm1.includes(norm2) || norm2.includes(norm1)))) {
          return true;
        }
      }
      return false;
    });

    if (!isDup) {
      seenIds.add(p.id);
      result.push(p);
    }
  }

  // Sort by distance from destination center
  result.sort((a, b) => a.distance_km - b.distance_km);
  return result;
}

// Process single destination
async function ingestDestination(slug) {
  const filePath = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Skip] Destination file not found: ${filePath}`);
    return null;
  }

  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const lat = dest.weather?.lat ?? dest.lat;
  const lng = dest.weather?.lng ?? dest.lng;

  if (lat == null || lng == null) {
    console.warn(`[Skip] No valid coordinates for ${slug}`);
    return null;
  }

  console.log(`Ingesting ${dest.title} (${dest.state}) @ [${lat}, ${lng}]...`);
  const { hotelElements, restroElements } = await fetchPlacesForDestination(lat, lng, 8000);
  const { hotels, restaurants } = processElements(hotelElements, restroElements, dest);

  const hotelFile = path.join(HOTELS_DIR, `${slug}.json`);
  const restroFile = path.join(RESTAURANTS_DIR, `${slug}.json`);
  const nowISO = new Date().toISOString();

  fs.writeFileSync(hotelFile, JSON.stringify({
    destination: dest.title,
    slug: dest.slug,
    state: dest.state,
    coordinates: { lat, lng },
    count: hotels.length,
    overpass_verified: true,
    verified_at: nowISO,
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    items: hotels
  }, null, 2));

  fs.writeFileSync(restroFile, JSON.stringify({
    destination: dest.title,
    slug: dest.slug,
    state: dest.state,
    coordinates: { lat, lng },
    count: restaurants.length,
    overpass_verified: true,
    verified_at: nowISO,
    license: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    items: restaurants
  }, null, 2));

  console.log(`  ✓ Saved ${dest.title}: ${hotels.length} hotels, ${restaurants.length} restaurants`);

  return {
    slug: dest.slug,
    title: dest.title,
    state: dest.state,
    hotelCount: hotels.length,
    restaurantCount: restaurants.length
  };
}

// Rebuild master directory indexes scanning all saved files in data/hotels and data/restaurants
function rebuildDirectoryIndexes() {
  const hotelFiles = fs.readdirSync(HOTELS_DIR).filter(f => f.endsWith('.json') && f !== 'directory-index.json');
  const restroFiles = fs.readdirSync(RESTAURANTS_DIR).filter(f => f.endsWith('.json') && f !== 'directory-index.json');

  const hotelDirectory = [];
  for (const f of hotelFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(HOTELS_DIR, f), 'utf8'));
      hotelDirectory.push({
        slug: data.slug,
        title: data.destination || data.slug,
        state: data.state || '',
        count: data.count || (data.items ? data.items.length : 0)
      });
    } catch (_) {}
  }
  hotelDirectory.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  const restroDirectory = [];
  for (const f of restroFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(RESTAURANTS_DIR, f), 'utf8'));
      restroDirectory.push({
        slug: data.slug,
        title: data.destination || data.slug,
        state: data.state || '',
        count: data.count || (data.items ? data.items.length : 0)
      });
    } catch (_) {}
  }
  restroDirectory.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  fs.writeFileSync(
    path.join(HOTELS_DIR, 'directory-index.json'),
    JSON.stringify({
      totalDestinations: hotelDirectory.length,
      totalHotels: hotelDirectory.reduce((sum, d) => sum + d.count, 0),
      destinations: hotelDirectory
    }, null, 2)
  );

  fs.writeFileSync(
    path.join(RESTAURANTS_DIR, 'directory-index.json'),
    JSON.stringify({
      totalDestinations: restroDirectory.length,
      totalRestaurants: restroDirectory.reduce((sum, d) => sum + d.count, 0),
      destinations: restroDirectory
    }, null, 2)
  );

  console.log(`\n📋 Master Directory Indexes Updated:`);
  console.log(`   Hotels: ${hotelDirectory.reduce((sum, d) => sum + d.count, 0)} across ${hotelDirectory.length} destinations`);
  console.log(`   Restaurants: ${restroDirectory.reduce((sum, d) => sum + d.count, 0)} across ${restroDirectory.length} destinations`);
}

// Ingest a batch of destinations with auto-skip and rate pacing
async function runBatch(slugs, options = {}) {
  const force = options.force || false;
  const pauseMs = options.pauseMs || 2500;

  console.log('================================================================');
  console.log(`🚀 STARTING BATCH INGESTION FOR ${slugs.length} DESTINATIONS`);
  console.log('================================================================\n');

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const hotelFile = path.join(HOTELS_DIR, `${slug}.json`);
    const restroFile = path.join(RESTAURANTS_DIR, `${slug}.json`);

    if (!force && fs.existsSync(hotelFile) && fs.existsSync(restroFile)) {
      console.log(`[${i + 1}/${slugs.length}] [Skip] ${slug} already ingested.`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${slugs.length}] Processing ${slug}...`);
    try {
      const summary = await ingestDestination(slug);
      if (summary) {
        processed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${slug}:`, err.message);
      failed++;
    }

    // Rate-limit pause
    await new Promise(r => setTimeout(r, pauseMs));
  }

  // Always update directory indexes after batch completes
  rebuildDirectoryIndexes();

  console.log('\n================================================================');
  console.log(`🏁 BATCH COMPLETE — Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('================================================================\n');
}

// Get uningested destinations ordered by popularity (review count)
function getTopUnprocessedDestinations(limit = 30) {
  const idxPath = path.join(DEST_DIR, 'index.json');
  if (!fs.existsSync(idxPath)) return [];
  const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  const existing = new Set(
    fs.readdirSync(HOTELS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'directory-index.json')
      .map(f => f.replace('.json', ''))
  );

  return (idx.destinations || [])
    .filter(d => !existing.has(d.slug))
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, limit)
    .map(d => d.slug);
}

module.exports = {
  ingestDestination,
  runPilot: () => runBatch(PILOT_SLUGS, { force: false }),
  runBatch,
  rebuildDirectoryIndexes,
  getTopUnprocessedDestinations,
  PILOT_SLUGS
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const isPilot = args.includes('--pilot');
  const isReindex = args.includes('--reindex');
  const batchArg = args.find(a => a.startsWith('--batch='));
  const slugsArg = args.find(a => a.startsWith('--slugs='));
  const singleSlug = args[0] && !args[0].startsWith('--') ? args[0] : null;

  if (isReindex) {
    rebuildDirectoryIndexes();
  } else if (singleSlug) {
    ingestDestination(singleSlug)
      .then(() => rebuildDirectoryIndexes())
      .catch(console.error);
  } else if (slugsArg) {
    const list = slugsArg.replace('--slugs=', '').split(',').map(s => s.trim()).filter(Boolean);
    runBatch(list).catch(console.error);
  } else if (batchArg) {
    const count = parseInt(batchArg.replace('--batch=', ''), 10) || 30;
    const slugs = getTopUnprocessedDestinations(count);
    runBatch(slugs).catch(console.error);
  } else if (isPilot) {
    runBatch(PILOT_SLUGS, { force: false }).catch(console.error);
  } else {
    // Default action: run next batch of 30 top destinations
    const slugs = getTopUnprocessedDestinations(30);
    runBatch(slugs).catch(console.error);
  }
}
