#!/usr/bin/env node
/**
 * One-off: normalize the 6 hand-added Delhi-NCR destinations (added via the now-deleted
 * add-delhi-ncr-destinations.js) from their legacy custom shape to the canonical
 * destination schema (data/destinations/<slug>.json) that js/pages/destination.js expects.
 *
 * Legacy → canonical mappings:
 *   heroImage (string)              → { src, alt }
 *   gallery  ([string])             → [{ src, alt }]
 *   topPlaces[].image (string)      → { src, alt } + photos:[src]
 *   coordinates {lat,lng}           → weather { lat, lng, tempSummer, tempWinter }
 *   reachability {airport,railway}  → howToReach { nearestAirport, nearestRailway, routes }
 *   top-level short/description/…   → overview { short, description, rating, reviewCount, minPrice, distanceFromDelhi, features }
 *   (none)                          → seo { title, description, canonical, keywords }
 * Also backfills lat/lng/distanceFromDelhi into the index.json summary.
 *
 * Idempotent: re-running is a no-op once a file already has `overview`+`weather`.
 */
const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');
const SLUGS = ['new-delhi', 'gurugram', 'faridabad', 'noida', 'manesar', 'neemrana'];

// plains / NCR climate defaults (honest broad ranges; Haridwar/Rishikesh already canonical)
const TEMP_SUMMER = '25°C – 42°C';
const TEMP_WINTER = '6°C – 22°C';

const DELHI = { lat: 28.6139, lng: 77.209 };
function haversineKm(a, b) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(s)));
}
const toImg = (v, alt) => (typeof v === 'string' ? { src: v, alt } : (v && v.src ? v : { src: '', alt }));

const index = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));
let changed = 0;

for (const slug of SLUGS) {
  const p = path.join(DEST_DIR, slug + '.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (d.overview && d.weather && d.howToReach && d.seo) { continue; } // already normalized

  const coords = d.coordinates || {};
  const distDelhi = (coords.lat != null) ? haversineKm(DELHI, coords) : (d.distanceFromDelhi || null);

  // heroImage → object
  d.heroImage = toImg(d.heroImage, d.title + ' — ' + d.state);

  // gallery → [{src,alt}]
  d.gallery = (d.gallery || []).map((g, i) => toImg(g, d.title + ' photo ' + (i + 1)));

  // topPlaces: image string → object + photos[]
  d.topPlaces = (d.topPlaces || []).map(pl => {
    const img = toImg(pl.image, pl.name || d.title);
    return Object.assign({}, pl, {
      image: img,
      photos: (Array.isArray(pl.photos) && pl.photos.length) ? pl.photos : (img.src ? [img.src] : []),
    });
  });

  // weather from coordinates
  d.weather = {
    lat: coords.lat, lng: coords.lng,
    tempSummer: TEMP_SUMMER, tempWinter: TEMP_WINTER,
  };

  // overview
  d.overview = {
    short: d.short || '',
    description: d.description || d.short || '',
    features: d.features || [],
    rating: d.rating,
    reviewCount: d.reviewCount,
    minPrice: d.minPrice,
    distanceFromDelhi: distDelhi,
  };

  // howToReach from reachability
  const r = d.reachability || {};
  const routes = [];
  if (distDelhi != null && slug !== 'new-delhi') {
    routes.push({
      from: 'Delhi', distance: distDelhi,
      byCar: Math.round(distDelhi / 45 * 10) / 10 + ' hr',
      byTrain: '—', byAir: '—', via: 'NH road',
    });
  }
  d.howToReach = {
    routes,
    nearestAirport: r.airport ? { name: r.airport.name, distance: r.airport.distanceKm } : { name: 'Indira Gandhi International Airport (DEL)', distance: distDelhi },
    nearestRailway: r.railway ? { name: r.railway.name, distance: r.railway.distanceKm } : null,
    roadNote: r.nearestCity ? ('Nearest major city: ' + r.nearestCity.name + ' (' + r.nearestCity.distanceKm + ' km).') : '',
  };

  // seo
  d.seo = {
    title: d.title + ' Travel Guide — Places, Stays & How to Reach | IndiaExplore',
    description: (d.short || d.description || '').slice(0, 155),
    canonical: 'destination.html?slug=' + slug,
    ogImage: d.heroImage.src,
    keywords: [d.title, d.state, d.type, 'travel guide', 'places to visit', 'hotels'].filter(Boolean),
  };

  fs.writeFileSync(p, JSON.stringify(d, null, 2));

  // backfill index summary
  const sum = index.destinations.find(x => x.slug === slug);
  if (sum) {
    if (coords.lat != null) { sum.lat = coords.lat; sum.lng = coords.lng; }
    if (distDelhi != null) sum.distanceFromDelhi = distDelhi;
  }
  changed++;
  console.log('normalized', slug, '| distDelhi', distDelhi, 'km | places', d.topPlaces.length, '| gallery', d.gallery.length);
}

fs.writeFileSync(path.join(DEST_DIR, 'index.json'), JSON.stringify(index, null, 2));
console.log('done. normalized', changed, 'files.');
