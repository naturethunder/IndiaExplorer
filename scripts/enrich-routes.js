/**
 * enrich-routes.js — Enriches howToReach.routes for all 2,361 destination JSON files
 * with 12 to 15 major-city routes derived from exact lat/lng coordinates.
 *
 * This ensures that every destination's "How to Reach" panel contains distances
 * and travel modes from cities across all major Indian states (North, South, East,
 * West, Central, Northeast) and updates the #reachCity dropdown seamlessly.
 *
 * Usage: node scripts/enrich-routes.js
 */
const fs = require('fs');
const path = require('path');
const geo = require('./geo-reference.js');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

console.log(`Enriching howToReach.routes for ${files.length} destination JSON files...`);

let enrichedCount = 0;

files.forEach(file => {
  const fp = path.join(DEST_DIR, file);
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const lat = d.weather?.lat || d.lat;
  const lng = d.weather?.lng || d.lng;

  if (typeof lat === 'number' && typeof lng === 'number') {
    const derivedRoutes = geo.majorCityRoutes(lat, lng, d.title || d.name, 36);

    if (!d.howToReach) {
      d.howToReach = {};
    }

    // Always sort derived routes by distance
    derivedRoutes.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    d.howToReach.routes = derivedRoutes;

    fs.writeFileSync(fp, JSON.stringify(d, null, 2), 'utf8');
    enrichedCount++;
  }
});

console.log(`✅ Successfully enriched routes for ${enrichedCount} destinations across all states!`);
