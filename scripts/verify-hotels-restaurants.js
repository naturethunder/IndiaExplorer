#!/usr/bin/env node
/**
 * scripts/verify-hotels-restaurants.js
 * ============================================================
 * Geospatial Data Integrity & Schema Invariant Auditor
 *
 * Verifies 100% of hotel and restaurant records across data/hotels/
 * and data/restaurants/ against strict production invariants:
 *   1. Geographic bounding box [Lat: 6.0°–37.5°N, Lng: 68.0°–97.5°E]
 *   2. Zero fabricated prices, ratings, or reviews (strict null retention)
 *   3. ODbL 1.0 license and © OpenStreetMap contributors attribution
 *   4. Master directory-index.json synchronization with disk files & item counts
 *   5. Bidirectional slug symmetry between hotels and restaurants
 *
 * Exit code: 0 on 100% pass, 1 on any violation.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOTELS_DIR = path.join(ROOT, 'data', 'hotels');
const RESTAURANTS_DIR = path.join(ROOT, 'data', 'restaurants');

// India Geographical Bounding Box
const GEO_BOUNDS = {
  MIN_LAT: 6.0,
  MAX_LAT: 37.5,
  MIN_LNG: 68.0,
  MAX_LNG: 97.5
};

const BANNED_FABRICATION_KEYS = [
  'rating', 'ratings', 'user_rating', 'aggregate_rating', 'stars',
  'review', 'reviews', 'review_count', 'reviews_count',
  'price', 'price_tier', 'pricing', 'avg_cost', 'cost'
];

function runAudit() {
  console.log('================================================================');
  console.log('🛰️  EXPLOREDESH GEOSPATIAL & METADATA INTEGRITY AUDIT');
  console.log('================================================================\n');

  let passedChecks = 0;
  let failedChecks = 0;
  const violations = [];

  function recordPass(msg) {
    passedChecks++;
  }

  function recordFail(msg) {
    failedChecks++;
    violations.push(msg);
    console.error(`  ❌ [FAIL] ${msg}`);
  }

  // 1. Directory existence checks
  if (!fs.existsSync(HOTELS_DIR)) {
    recordFail(`Hotels directory does not exist: ${HOTELS_DIR}`);
    return summarizeAndExit(passedChecks, failedChecks, violations);
  }
  recordPass('Hotels directory exists');

  if (!fs.existsSync(RESTAURANTS_DIR)) {
    recordFail(`Restaurants directory does not exist: ${RESTAURANTS_DIR}`);
    return summarizeAndExit(passedChecks, failedChecks, violations);
  }
  recordPass('Restaurants directory exists');

  // 2. Discover files
  const hotelFiles = fs.readdirSync(HOTELS_DIR).filter(f => f.endsWith('.json') && f !== 'directory-index.json');
  const restroFiles = fs.readdirSync(RESTAURANTS_DIR).filter(f => f.endsWith('.json') && f !== 'directory-index.json');

  const hotelSlugs = new Set(hotelFiles.map(f => f.replace('.json', '')));
  const restroSlugs = new Set(restroFiles.map(f => f.replace('.json', '')));

  console.log(`📁 Scanning Data Repositories:`);
  console.log(`   Hotels:      ${hotelFiles.length} destination files`);
  console.log(`   Restaurants: ${restroFiles.length} destination files\n`);

  // 3. Bidirectional Symmetry
  for (const slug of hotelSlugs) {
    if (!restroSlugs.has(slug)) {
      recordFail(`Asymmetric destination: "${slug}" exists in hotels/ but missing from restaurants/`);
    } else {
      recordPass(`Symmetric slug: ${slug}`);
    }
  }

  for (const slug of restroSlugs) {
    if (!hotelSlugs.has(slug)) {
      recordFail(`Asymmetric destination: "${slug}" exists in restaurants/ but missing from hotels/`);
    }
  }

  let totalHotelCount = 0;
  let totalRestroCount = 0;
  const hotelCountsBySlug = {};
  const restroCountsBySlug = {};

  // 4. Audit Hotel Files
  console.log(`🏨 Auditing Hotels (${hotelFiles.length} files)...`);
  for (const file of hotelFiles) {
    const slug = file.replace('.json', '');
    const filePath = path.join(HOTELS_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      recordFail(`Hotel file corrupt/invalid JSON: ${file} (${err.message})`);
      continue;
    }

    if (!data.destination || typeof data.destination !== 'string') {
      recordFail(`Hotel file "${file}" missing valid "destination" name`);
    }
    if (data.slug !== slug) {
      recordFail(`Hotel file "${file}" slug mismatch (expected "${slug}", got "${data.slug}")`);
    }
    if (!data.state || typeof data.state !== 'string') {
      recordFail(`Hotel file "${file}" missing valid "state"`);
    }
    if (data.license !== 'ODbL 1.0') {
      recordFail(`Hotel file "${file}" missing or invalid license (expected "ODbL 1.0", got "${data.license}")`);
    }
    if (data.attribution !== '© OpenStreetMap contributors') {
      recordFail(`Hotel file "${file}" missing or invalid attribution (expected "© OpenStreetMap contributors", got "${data.attribution}")`);
    }
    if (!Array.isArray(data.items)) {
      recordFail(`Hotel file "${file}" items is not an array`);
      continue;
    }
    if (data.count !== data.items.length) {
      recordFail(`Hotel file "${file}" count mismatch (field: ${data.count}, actual: ${data.items.length})`);
    }

    hotelCountsBySlug[slug] = data.items.length;
    totalHotelCount += data.items.length;

    // Check individual items
    for (const [idx, item] of data.items.entries()) {
      if (!item.id || !String(item.id).startsWith('osm-')) {
        recordFail(`Hotel in "${file}" [#${idx}] invalid OSM id: "${item.id}"`);
      }
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        recordFail(`Hotel in "${file}" [#${idx}] missing or empty name`);
      }
      if (!item.category) {
        recordFail(`Hotel in "${file}" [#${idx}] missing category`);
      }

      // Geo-bounds check
      if (typeof item.latitude !== 'number' || item.latitude < GEO_BOUNDS.MIN_LAT || item.latitude > GEO_BOUNDS.MAX_LAT) {
        recordFail(`Hotel "${item.name}" in "${file}" latitude out of India bounds: ${item.latitude}`);
      }
      if (typeof item.longitude !== 'number' || item.longitude < GEO_BOUNDS.MIN_LNG || item.longitude > GEO_BOUNDS.MAX_LNG) {
        recordFail(`Hotel "${item.name}" in "${file}" longitude out of India bounds: ${item.longitude}`);
      }

      // Distance
      if (typeof item.distance_km !== 'number' || item.distance_km < 0) {
        recordFail(`Hotel "${item.name}" in "${file}" invalid distance_km: ${item.distance_km}`);
      }

      // Attribution & License
      if (item.source !== 'OpenStreetMap' || item.license !== 'ODbL 1.0' || item.attribution !== '© OpenStreetMap contributors') {
        recordFail(`Hotel "${item.name}" in "${file}" missing verified OSM source metadata`);
      }

      // Strict Zero-Fabrication check
      for (const key of BANNED_FABRICATION_KEYS) {
        if (item[key] != null) {
          recordFail(`Hotel "${item.name}" in "${file}" contains fabricated field "${key}": ${JSON.stringify(item[key])}`);
        }
      }
      if (item.image !== null) {
        recordFail(`Hotel "${item.name}" in "${file}" contains non-null image (stock/fabricated)`);
      }

      recordPass(`Valid hotel item: ${item.id}`);
    }
  }

  // 5. Audit Restaurant Files
  console.log(`🍽️  Auditing Restaurants (${restroFiles.length} files)...`);
  for (const file of restroFiles) {
    const slug = file.replace('.json', '');
    const filePath = path.join(RESTAURANTS_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      recordFail(`Restaurant file corrupt/invalid JSON: ${file} (${err.message})`);
      continue;
    }

    if (!data.destination || typeof data.destination !== 'string') {
      recordFail(`Restaurant file "${file}" missing valid "destination" name`);
    }
    if (data.slug !== slug) {
      recordFail(`Restaurant file "${file}" slug mismatch (expected "${slug}", got "${data.slug}")`);
    }
    if (!data.state || typeof data.state !== 'string') {
      recordFail(`Restaurant file "${file}" missing valid "state"`);
    }
    if (data.license !== 'ODbL 1.0') {
      recordFail(`Restaurant file "${file}" missing or invalid license (expected "ODbL 1.0", got "${data.license}")`);
    }
    if (data.attribution !== '© OpenStreetMap contributors') {
      recordFail(`Restaurant file "${file}" missing or invalid attribution (expected "© OpenStreetMap contributors", got "${data.attribution}")`);
    }
    if (!Array.isArray(data.items)) {
      recordFail(`Restaurant file "${file}" items is not an array`);
      continue;
    }
    if (data.count !== data.items.length) {
      recordFail(`Restaurant file "${file}" count mismatch (field: ${data.count}, actual: ${data.items.length})`);
    }

    restroCountsBySlug[slug] = data.items.length;
    totalRestroCount += data.items.length;

    // Check individual items
    for (const [idx, item] of data.items.entries()) {
      if (!item.id || !String(item.id).startsWith('osm-')) {
        recordFail(`Restaurant in "${file}" [#${idx}] invalid OSM id: "${item.id}"`);
      }
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        recordFail(`Restaurant in "${file}" [#${idx}] missing or empty name`);
      }
      if (!item.category) {
        recordFail(`Restaurant in "${file}" [#${idx}] missing category`);
      }

      // Geo-bounds check
      if (typeof item.latitude !== 'number' || item.latitude < GEO_BOUNDS.MIN_LAT || item.latitude > GEO_BOUNDS.MAX_LAT) {
        recordFail(`Restaurant "${item.name}" in "${file}" latitude out of India bounds: ${item.latitude}`);
      }
      if (typeof item.longitude !== 'number' || item.longitude < GEO_BOUNDS.MIN_LNG || item.longitude > GEO_BOUNDS.MAX_LNG) {
        recordFail(`Restaurant "${item.name}" in "${file}" longitude out of India bounds: ${item.longitude}`);
      }

      // Distance
      if (typeof item.distance_km !== 'number' || item.distance_km < 0) {
        recordFail(`Restaurant "${item.name}" in "${file}" invalid distance_km: ${item.distance_km}`);
      }

      // Attribution & License
      if (item.source !== 'OpenStreetMap' || item.license !== 'ODbL 1.0' || item.attribution !== '© OpenStreetMap contributors') {
        recordFail(`Restaurant "${item.name}" in "${file}" missing verified OSM source metadata`);
      }

      // Strict Zero-Fabrication check
      for (const key of BANNED_FABRICATION_KEYS) {
        if (item[key] != null) {
          recordFail(`Restaurant "${item.name}" in "${file}" contains fabricated field "${key}": ${JSON.stringify(item[key])}`);
        }
      }
      if (item.image !== null) {
        recordFail(`Restaurant "${item.name}" in "${file}" contains non-null image (stock/fabricated)`);
      }

      // Strict dietary flags validation
      if (typeof item.is_pure_veg !== 'boolean') {
        recordFail(`Restaurant "${item.name}" in "${file}" is_pure_veg is not boolean`);
      }
      if (typeof item.has_veg_options !== 'boolean') {
        recordFail(`Restaurant "${item.name}" in "${file}" has_veg_options is not boolean`);
      }

      recordPass(`Valid restaurant item: ${item.id}`);
    }
  }

  // 6. Directory Index Verification: data/hotels/directory-index.json
  console.log(`📋 Verifying Hotel Master Index...`);
  const hotelIdxFile = path.join(HOTELS_DIR, 'directory-index.json');
  if (!fs.existsSync(hotelIdxFile)) {
    recordFail('hotels/directory-index.json does not exist');
  } else {
    try {
      const hIdx = JSON.parse(fs.readFileSync(hotelIdxFile, 'utf8'));
      if (hIdx.totalDestinations !== hotelFiles.length) {
        recordFail(`hotels/directory-index.json totalDestinations mismatch: index says ${hIdx.totalDestinations}, disk has ${hotelFiles.length}`);
      } else {
        recordPass(`hotels/directory-index.json totalDestinations matches disk (${hotelFiles.length})`);
      }

      if (hIdx.totalHotels !== totalHotelCount) {
        recordFail(`hotels/directory-index.json totalHotels mismatch: index says ${hIdx.totalHotels}, disk items sum to ${totalHotelCount}`);
      } else {
        recordPass(`hotels/directory-index.json totalHotels matches disk sum (${totalHotelCount})`);
      }

      const indexedSlugs = new Set((hIdx.destinations || []).map(d => d.slug));
      for (const slug of hotelSlugs) {
        if (!indexedSlugs.has(slug)) {
          recordFail(`hotels/directory-index.json missing slug: "${slug}"`);
        }
      }
      for (const d of hIdx.destinations || []) {
        if (!hotelSlugs.has(d.slug)) {
          recordFail(`hotels/directory-index.json contains phantom slug not on disk: "${d.slug}"`);
        }
        if (d.count !== hotelCountsBySlug[d.slug]) {
          recordFail(`hotels/directory-index.json count mismatch for "${d.slug}": index says ${d.count}, file has ${hotelCountsBySlug[d.slug]}`);
        }
      }
    } catch (err) {
      recordFail(`hotels/directory-index.json parsing error: ${err.message}`);
    }
  }

  // 7. Directory Index Verification: data/restaurants/directory-index.json
  console.log(`📋 Verifying Restaurant Master Index...`);
  const restroIdxFile = path.join(RESTAURANTS_DIR, 'directory-index.json');
  if (!fs.existsSync(restroIdxFile)) {
    recordFail('restaurants/directory-index.json does not exist');
  } else {
    try {
      const rIdx = JSON.parse(fs.readFileSync(restroIdxFile, 'utf8'));
      if (rIdx.totalDestinations !== restroFiles.length) {
        recordFail(`restaurants/directory-index.json totalDestinations mismatch: index says ${rIdx.totalDestinations}, disk has ${restroFiles.length}`);
      } else {
        recordPass(`restaurants/directory-index.json totalDestinations matches disk (${restroFiles.length})`);
      }

      if (rIdx.totalRestaurants !== totalRestroCount) {
        recordFail(`restaurants/directory-index.json totalRestaurants mismatch: index says ${rIdx.totalRestaurants}, disk items sum to ${totalRestroCount}`);
      } else {
        recordPass(`restaurants/directory-index.json totalRestaurants matches disk sum (${totalRestroCount})`);
      }

      const indexedSlugs = new Set((rIdx.destinations || []).map(d => d.slug));
      for (const slug of restroSlugs) {
        if (!indexedSlugs.has(slug)) {
          recordFail(`restaurants/directory-index.json missing slug: "${slug}"`);
        }
      }
      for (const d of rIdx.destinations || []) {
        if (!restroSlugs.has(d.slug)) {
          recordFail(`restaurants/directory-index.json contains phantom slug not on disk: "${d.slug}"`);
        }
        if (d.count !== restroCountsBySlug[d.slug]) {
          recordFail(`restaurants/directory-index.json count mismatch for "${d.slug}": index says ${d.count}, file has ${restroCountsBySlug[d.slug]}`);
        }
      }
    } catch (err) {
      recordFail(`restaurants/directory-index.json parsing error: ${err.message}`);
    }
  }

  return summarizeAndExit(passedChecks, failedChecks, violations, {
    totalDestinations: hotelFiles.length,
    totalHotels: totalHotelCount,
    totalRestaurants: totalRestroCount
  });
}

function summarizeAndExit(passed, failed, violations, stats = {}) {
  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY & EXECUTIVE SCORECARD');
  console.log('================================================================');
  console.log(`  Destinations Audited:       ${stats.totalDestinations || 0}`);
  console.log(`  Total Verified Hotels:      ${stats.totalHotels || 0}`);
  console.log(`  Total Verified Restaurants: ${stats.totalRestaurants || 0}`);
  console.log(`  Total Invariant Checks:     ${passed + failed}`);
  console.log(`  Passed Checks:              ${passed}`);
  console.log(`  Violations / Defects:       ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    console.error(`\n❌ AUDIT FAILED with ${failed} violation(s):`);
    violations.slice(0, 20).forEach((v, i) => console.error(`  ${i + 1}. ${v}`));
    if (violations.length > 20) {
      console.error(`  ... and ${violations.length - 20} more violations.`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ 100% AUDIT PASS: Zero fabricated records, valid ODbL licenses, and 100% geo-compliance verified.');
    process.exit(0);
  }
}

if (require.main === module) {
  runAudit();
}

module.exports = { runAudit };
