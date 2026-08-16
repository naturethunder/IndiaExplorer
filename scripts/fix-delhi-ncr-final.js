#!/usr/bin/env node
/**
 * One-off: rebuild the 6 Delhi-NCR destinations (new-delhi, gurugram, faridabad,
 * noida, manesar, neemrana) directly from their preserved source
 * (data/delhi-ncr-source.json) into the canonical schema, replacing the broken
 * output that build-json-data.js produced when this file was still inside
 * data/bulk/ (its ad-hoc shape — title/topPlaces/hotels/coordinates/reachability —
 * doesn't match what the generic bulk mapper (toDestinationJSON) expects, which
 * corrupted titles, double-nested image.src, and let a stray fetch-photos.js
 * `photos[]` array override curated hero images with unrelated Commons hits).
 *
 * Source of truth for images: the source file's own heroImage/topPlaces[].image/
 * gallery fields (curated, real Wikimedia photos) — NOT its polluted `photos[]`.
 * Idempotent: safe to re-run.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'delhi-ncr-source.json'), 'utf8'));

const TEMP_SUMMER = '25°C – 42°C';
const TEMP_WINTER = '6°C – 22°C';
const DELHI = { lat: 28.6139, lng: 77.209 };
function haversineKm(a, b) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(s)));
}
const toImg = (v, alt) => (typeof v === 'string' ? { src: v, alt } : (v && v.src ? { src: v.src, alt: v.alt || alt } : { src: '', alt }));

const index = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));
const PRICE_TIERS = index.meta.priceTiers;
function tiersOf(hotels, minPrice) {
  return Object.keys(PRICE_TIERS).filter(key => {
    const t = PRICE_TIERS[key];
    return (hotels || []).some(h => {
      const lo = h.priceMin != null ? h.priceMin : minPrice;
      const hi = h.priceMax != null ? h.priceMax : lo;
      return lo <= t.max && hi >= t.min;
    });
  });
}

let fixed = 0;
for (const s of SRC) {
  const slug = s.id;
  const coords = s.coordinates || { lat: s.lat, lng: s.lng };
  const distDelhi = (coords.lat != null) ? haversineKm(DELHI, coords) : null;
  const heroImg = toImg(s.heroImage, s.title + ' — ' + s.state);
  const gallery = (s.gallery || []).map((g, i) => toImg(g, s.title + ' photo ' + (i + 1)));
  const topPlaces = (s.topPlaces || []).map(p => {
    const img = toImg(p.image, p.name || s.title);
    return {
      name: p.name, category: p.category, description: p.description,
      image: img, photos: img.src ? [img.src] : [],
    };
  });
  const hotels = (s.hotels || []).map(h => ({
    name: h.name, type: h.type || '', tier: h.tier || '',
    priceMin: h.priceMin != null ? h.priceMin : h.pricePerNight || 0,
    priceMax: h.priceMax != null ? h.priceMax : h.pricePerNight || 0,
    rating: h.rating || 0, reviews: h.reviewCount || 0,
    amenities: h.amenities || [], tags: h.tags || [],
    image: toImg(h.image, h.name),
  }));
  const r = s.reachability || {};
  const routes = [];
  if (distDelhi != null && slug !== 'new-delhi') {
    routes.push({ from: 'Delhi', distance: distDelhi, byCar: Math.round(distDelhi / 45 * 10) / 10 + ' hr', byTrain: '—', byAir: '—', via: 'NH road' });
  }

  const detail = {
    slug, title: s.title, state: s.state, country: 'India', region: s.region || s.state,
    type: s.type, badge: 'Popular', tagline: s.title + ' — ' + s.state,
    heroImage: heroImg,
    overview: {
      short: s.short || '', description: s.description || s.short || '',
      features: [], rating: s.rating, reviewCount: s.reviewCount,
      minPrice: s.minPrice, distanceFromDelhi: distDelhi,
    },
    bestTime: s.bestTime || { label: '', months: [] },
    weather: { lat: coords.lat, lng: coords.lng, tempSummer: TEMP_SUMMER, tempWinter: TEMP_WINTER },
    howToReach: {
      routes,
      nearestAirport: r.airport ? { name: r.airport.name, distance: r.airport.distanceKm } : { name: 'Indira Gandhi International Airport (DEL)', distance: distDelhi },
      nearestRailway: r.railway ? { name: r.railway.name, distance: r.railway.distanceKm } : null,
      roadNote: r.nearestCity ? ('Nearest major city: ' + r.nearestCity.name + ' (' + r.nearestCity.distanceKm + ' km).') : '',
    },
    topPlaces, hotels, gallery,
    seo: {
      title: s.title + ' Travel Guide — Places, Stays & How to Reach | IndiaExplore',
      description: (s.short || s.description || '').slice(0, 155),
      canonical: 'destination.html?slug=' + slug,
      ogImage: heroImg.src,
      keywords: [s.title, s.state, s.type, 'travel guide', 'places to visit', 'hotels'].filter(Boolean),
    },
  };
  fs.writeFileSync(path.join(DEST_DIR, slug + '.json'), JSON.stringify(detail, null, 2));

  const summary = {
    slug, title: s.title, state: s.state, region: detail.region, type: s.type, badge: 'Popular',
    short: s.short || '', bestTime: detail.bestTime,
    rating: s.rating, reviewCount: s.reviewCount, minPrice: s.minPrice,
    distanceFromDelhi: distDelhi, lat: coords.lat, lng: coords.lng,
    image: heroImg, heroImage: heroImg, features: [],
    tiers: tiersOf(hotels, s.minPrice),
  };
  const idx = index.destinations.findIndex(d => d.slug === slug);
  if (idx >= 0) index.destinations[idx] = summary; else index.destinations.push(summary);
  fixed++;
  console.log('fixed', slug, '| hero:', heroImg.src.split('/').pop());
}

index.count = index.destinations.length;
fs.writeFileSync(path.join(DEST_DIR, 'index.json'), JSON.stringify(index, null, 2));
console.log('done. fixed', fixed, '| total destinations', index.destinations.length);
