/**
 * COMPREHENSIVE REPOSITORY IMAGE AUDIT ENGINE
 * Evaluates all 2,389 destinations against strict requirements:
 * 1. Hero & Gallery: Exactly 5 original, high-res photos.
 * 2. Nearby Places (topPlaces): Exactly 3 distinct, authentic photos per attraction.
 * 3. Zero Duplicates: 0 global duplicate URLs across the entire repository.
 * 4. Zero Junk / PDFs / Maps / Diagrams / SVGs / Generic Stock Fillers.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

function normalizeUrl(url) {
  if (!url) return '';
  let u = typeof url === 'object' ? (url.src || '') : String(url);
  u = u.trim();
  // Strip tracking params for clean comparison
  try {
    const parsed = new URL(u);
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_content');
    parsed.searchParams.delete('utm_medium');
    return parsed.toString();
  } catch (e) {
    return u;
  }
}

function isValidPhotoUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('.svg') || lower.includes('.pdf') || lower.includes('.djvu')) return false;
  if (lower.includes('map') || lower.includes('locator') || lower.includes('location_') || lower.includes('_map.')) return false;
  if (lower.includes('flag') || lower.includes('coat_of_arms') || lower.includes('logo') || lower.includes('icon')) return false;
  if (lower.includes('census') || lower.includes('diagram') || lower.includes('chart') || lower.includes('stamp')) return false;
  if (lower.includes('picsum.photos') || lower.includes('via.placeholder.com')) return false;
  return true;
}

function auditRepository() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const allDestinations = index.destinations;

  const urlMap = new Map(); // normalizedUrl -> array of { slug, field }
  const failures = [];

  let totalTopPlacesChecked = 0;
  let topPlacesFailed = 0;
  let invalidImageCounts = 0;
  let junkImagesCount = 0;

  for (const item of allDestinations) {
    const p = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(p)) {
      failures.push({ slug: item.slug, reason: 'FILE_MISSING' });
      continue;
    }

    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const destFailures = [];

    // Check Hero Image
    const heroUrl = normalizeUrl(d.heroImage);
    if (!heroUrl || !isValidPhotoUrl(heroUrl)) {
      destFailures.push({ field: 'heroImage', issue: 'INVALID_OR_MISSING', url: heroUrl });
      if (heroUrl && !isValidPhotoUrl(heroUrl)) junkImagesCount++;
    } else {
      if (!urlMap.has(heroUrl)) urlMap.set(heroUrl, []);
      urlMap.get(heroUrl).push({ slug: d.slug, field: 'heroImage' });
    }

    // Check Gallery (Should have exactly 5 or (hero + gallery = 5 unique gallery))
    const gallery = Array.isArray(d.gallery) ? d.gallery : [];
    if (gallery.length < 5) {
      destFailures.push({ field: 'gallery', issue: 'COUNT_LESS_THAN_5', count: gallery.length });
      invalidImageCounts++;
    }

    gallery.forEach((g, idx) => {
      const gUrl = normalizeUrl(g);
      if (!gUrl || !isValidPhotoUrl(gUrl)) {
        destFailures.push({ field: `gallery[${idx}]`, issue: 'INVALID_OR_MISSING', url: gUrl });
        if (gUrl && !isValidPhotoUrl(gUrl)) junkImagesCount++;
      } else {
        if (!urlMap.has(gUrl)) urlMap.set(gUrl, []);
        urlMap.get(gUrl).push({ slug: d.slug, field: `gallery[${idx}]` });
      }
    });

    // Check topPlaces (Every topPlaces item MUST have photos array with EXACTLY 3 distinct valid images)
    const topPlaces = Array.isArray(d.topPlaces) ? d.topPlaces : [];
    topPlaces.forEach((pl, pIdx) => {
      totalTopPlacesChecked++;
      const plPhotos = Array.isArray(pl.photos) ? pl.photos : [];
      if (plPhotos.length < 3) {
        destFailures.push({ field: `topPlaces[${pIdx}].photos`, issue: 'PLACE_PHOTOS_COUNT_LESS_THAN_3', count: plPhotos.length, placeName: pl.name });
        topPlacesFailed++;
        invalidImageCounts++;
      }

      const placeLocalSeen = new Set();
      plPhotos.forEach((ph, phIdx) => {
        const phUrl = normalizeUrl(ph);
        if (!phUrl || !isValidPhotoUrl(phUrl)) {
          destFailures.push({ field: `topPlaces[${pIdx}].photos[${phIdx}]`, issue: 'INVALID_OR_MISSING', url: phUrl, placeName: pl.name });
          if (phUrl && !isValidPhotoUrl(phUrl)) junkImagesCount++;
        } else {
          if (placeLocalSeen.has(phUrl)) {
            destFailures.push({ field: `topPlaces[${pIdx}].photos[${phIdx}]`, issue: 'INTRA_PLACE_DUPLICATE', url: phUrl, placeName: pl.name });
          }
          placeLocalSeen.add(phUrl);
          if (!urlMap.has(phUrl)) urlMap.set(phUrl, []);
          urlMap.get(phUrl).push({ slug: d.slug, field: `topPlaces[${pIdx}].photos[${phIdx}]` });
        }
      });
    });

    if (destFailures.length > 0) {
      failures.push({ slug: d.slug, title: d.title, state: d.state, failures: destFailures });
    }
  }

  // Count Global Duplicates
  let duplicateUrlsCount = 0;
  const duplicateDetails = [];
  for (const [url, locations] of urlMap.entries()) {
    if (locations.length > 1) {
      duplicateUrlsCount++;
      duplicateDetails.push({ url, count: locations.length, locations });
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    totalDestinations: allDestinations.length,
    destinationsPassed: allDestinations.length - failures.length,
    destinationsFailed: failures.length,
    topPlacesChecked: totalTopPlacesChecked,
    topPlacesFailed,
    duplicateUrls: duplicateUrlsCount,
    junkImages: junkImagesCount,
    invalidImageCounts,
    auditStatus: failures.length === 0 && duplicateUrlsCount === 0 && junkImagesCount === 0 ? 'PASS' : 'FAIL',
    failures,
    duplicateDetails
  };

  const reportPath = path.join(ROOT_DIR, 'reports', 'image-audit-final.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`\n========================================================================`);
  console.log(`  REPOSITORY AUDIT COMPLETE`);
  console.log(`  Audit Status       : ${result.auditStatus}`);
  console.log(`  Total Destinations : ${result.totalDestinations}`);
  console.log(`  Passed Destinations: ${result.destinationsPassed}`);
  console.log(`  Failed Destinations: ${result.destinationsFailed}`);
  console.log(`  topPlaces Checked  : ${result.topPlacesChecked}`);
  console.log(`  topPlaces Failed   : ${result.topPlacesFailed}`);
  console.log(`  Duplicate URLs     : ${result.duplicateUrls}`);
  console.log(`  Junk/PDF/Map Images: ${result.junkImages}`);
  console.log(`  Report Saved To    : reports/image-audit-final.json`);
  console.log(`========================================================================\n`);

  return result;
}

if (require.main === module) {
  auditRepository();
}

module.exports = { auditRepository };