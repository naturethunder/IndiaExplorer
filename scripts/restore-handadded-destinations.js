#!/usr/bin/env node
/**
 * One-off: restore the 28 hand-added offbeat destinations (Bangaram Island, Dawki,
 * Gurudongmar Lake, etc. — documented in CLAUDE.md as added via the standalone
 * add-new-destinations.js script, which bypasses the legacy/bulk pipeline) into
 * data/destinations/index.json after a build-json-data.js run wiped them from the
 * manifest (it regenerates index.json solely from js/data*.js + data/bulk/*.json,
 * which never included these). Their detail JSON files were untouched on disk —
 * this just re-derives each summary from its own detail file and re-merges it.
 *
 * Idempotent: skips any slug already present in index.json.
 */
const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');
const SLUGS = [
  'agatti-island', 'bangaram-island', 'bhedaghat', 'chembra-peak', 'chitrakote-falls',
  'daringbadi', 'dawki', 'dhanaulti', 'dhanushkodi', 'dholavira', 'gandikota',
  'gurez-valley', 'gurudongmar-lake', 'hanle', 'havelock-island', 'jibhi', 'loktak-lake',
  'lonar-crater', 'mandu', 'mawlynnong', 'polo-forest', 'sandakphu', 'shekhawati',
  'tamhini-ghat', 'tranquebar', 'unakoti', 'valparai', 'zanskar-valley',
]; // excludes 'agra' — incomplete/untracked stray file, not production-ready

const DELHI = { lat: 28.6139, lng: 77.209 };
function haversineKm(a, b) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(s)));
}

const index = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));
const PRICE_TIERS = index.meta.priceTiers;
const existingSlugs = new Set(index.destinations.map(d => d.slug));

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

let added = 0, skipped = 0;
const newStates = new Set(index.meta.states);

for (const slug of SLUGS) {
  if (existingSlugs.has(slug)) { skipped++; continue; }
  const p = path.join(DEST_DIR, slug + '.json');
  if (!fs.existsSync(p)) { console.log('SKIP (no file):', slug); continue; }
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const ov = d.overview || {};
  const w = d.weather || {};
  const distDelhi = ov.distanceFromDelhi != null ? ov.distanceFromDelhi
    : (w.lat != null ? haversineKm(DELHI, { lat: w.lat, lng: w.lng }) : null);

  const summary = {
    slug: d.slug,
    title: d.title,
    state: d.state,
    region: d.region || d.state,
    type: d.type,
    badge: d.badge || 'Hidden Gem',
    short: ov.short || ov.description || '',
    bestTime: d.bestTime || { label: '', months: [] },
    rating: ov.rating || 4.5,
    reviewCount: ov.reviewCount || 0,
    minPrice: ov.minPrice || 0,
    distanceFromDelhi: distDelhi,
    lat: w.lat, lng: w.lng,
    image: d.image || d.heroImage,
    heroImage: d.heroImage,
    features: ov.features || [],
    tiers: tiersOf(d.hotels, ov.minPrice || 0),
  };

  index.destinations.push(summary);
  if (summary.state) newStates.add(summary.state);
  added++;
  console.log('restored', slug, '|', summary.state, '|', summary.title);
}

index.meta.states = [...newStates].sort();
index.count = index.destinations.length;

fs.writeFileSync(path.join(DEST_DIR, 'index.json'), JSON.stringify(index, null, 2));
console.log('done. added', added, '| already present', skipped, '| total destinations now', index.destinations.length, '| states', index.meta.states.length);
