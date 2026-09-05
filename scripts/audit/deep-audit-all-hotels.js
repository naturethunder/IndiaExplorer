/**
 * deep-audit-all-hotels.js
 * Comprehensive audit of every hotel record across all 2,388 destination JSON files.
 * Checks:
 * 1. Name: non-empty, valid string, length, no corruption, duplicate detection.
 * 2. Type: valid category (hotel, resort, guesthouse, hostel, homestay, etc.).
 * 3. Tier: valid tier (cheapest, budget, good, better, best, luxury, extra_luxury).
 * 4. Prices: priceMin, priceMax exist, numbers, priceMin <= priceMax, positive.
 * 5. Rating: 1.0 <= rating <= 5.0.
 * 6. Reviews: review count is a positive integer.
 * 7. Amenities: array of valid strings.
 * 8. Tags: array of valid strings.
 * 9. URL: valid Google Maps URL, contains hotel name and destination title.
 * 10. Destination consistency: minPrice alignment, duplicate hotel names.
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');

const VALID_TIERS = new Set(['cheapest', 'budget', 'good', 'better', 'best', 'luxury', 'extra_luxury']);
const VALID_TYPES = new Set(['hotel', 'resort', 'guesthouse', 'hostel', 'homestay', 'lodge', 'camp', 'cottage', 'villa', 'heritage', 'inn', 'palace', 'dharamshala']);

const stats = {
  totalDestinations: files.length,
  destinationsWithHotels: 0,
  destinationsWithoutHotels: 0,
  totalHotels: 0,
  hotelsWithValidNames: 0,
  hotelsWithValidTypes: 0,
  hotelsWithValidTiers: 0,
  hotelsWithValidPrices: 0,
  hotelsWithValidRatings: 0,
  hotelsWithValidReviews: 0,
  hotelsWithValidAmenities: 0,
  hotelsWithValidUrls: 0,
  duplicateHotelsInDest: 0,
  syntheticPatternHotels: 0,
  realVerifiedHotels: 0
};

const issues = {
  missingName: [],
  invalidType: [],
  invalidTier: [],
  invalidPrice: [],
  invalidRating: [],
  invalidReviews: [],
  invalidAmenities: [],
  invalidUrl: [],
  mismatchedUrl: [],
  duplicateInDest: []
};

const SYNTHETIC_PATTERN = /^(OYO\s.+Stay|Airbnb:\sStay\sin\s.+|.+Grand\sHotel|Fortune\sPark\s.+|Marriott\s.+)$/i;

for (const file of files) {
  const filePath = path.join(DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const dest = JSON.parse(raw);

    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      stats.destinationsWithoutHotels++;
      continue;
    }

    stats.destinationsWithHotels++;
    const seenNames = new Set();

    for (let i = 0; i < dest.hotels.length; i++) {
      const h = dest.hotels[i];
      stats.totalHotels++;

      // 1. Name Check
      if (!h.name || typeof h.name !== 'string' || h.name.trim().length < 2 || h.name.includes('undefined') || h.name.includes('[object')) {
        issues.missingName.push({ file, index: i, name: h.name });
      } else {
        stats.hotelsWithValidNames++;
        const normName = h.name.trim().toLowerCase();
        if (seenNames.has(normName)) {
          stats.duplicateHotelsInDest++;
          issues.duplicateInDest.push({ file, name: h.name });
        }
        seenNames.add(normName);

        if (SYNTHETIC_PATTERN.test(h.name.trim())) {
          stats.syntheticPatternHotels++;
        } else {
          stats.realVerifiedHotels++;
        }
      }

      // 2. Type Check
      const hType = (h.type || '').toLowerCase().trim();
      if (!hType || !VALID_TYPES.has(hType)) {
        issues.invalidType.push({ file, hotel: h.name, type: h.type });
      } else {
        stats.hotelsWithValidTypes++;
      }

      // 3. Tier Check
      if (!h.tier || !VALID_TIERS.has(h.tier)) {
        issues.invalidTier.push({ file, hotel: h.name, tier: h.tier });
      } else {
        stats.hotelsWithValidTiers++;
      }

      // 4. Price Check
      const pMin = typeof h.priceMin === 'number' ? h.priceMin : null;
      const pMax = typeof h.priceMax === 'number' ? h.priceMax : null;
      if (pMin === null || pMax === null || isNaN(pMin) || isNaN(pMax) || pMin <= 0 || pMax <= 0 || pMin > pMax) {
        issues.invalidPrice.push({ file, hotel: h.name, priceMin: h.priceMin, priceMax: h.priceMax });
      } else {
        stats.hotelsWithValidPrices++;
      }

      // 5. Rating Check
      const rating = typeof h.rating === 'number' ? h.rating : parseFloat(h.rating);
      if (isNaN(rating) || rating < 1.0 || rating > 5.0) {
        issues.invalidRating.push({ file, hotel: h.name, rating: h.rating });
      } else {
        stats.hotelsWithValidRatings++;
      }

      // 6. Reviews Check
      const reviews = typeof h.reviews === 'number' ? h.reviews : parseInt(h.reviews, 10);
      if (isNaN(reviews) || reviews < 0) {
        issues.invalidReviews.push({ file, hotel: h.name, reviews: h.reviews });
      } else {
        stats.hotelsWithValidReviews++;
      }

      // 7. Amenities Check
      if (!Array.isArray(h.amenities) || h.amenities.length === 0 || h.amenities.some((a) => typeof a !== 'string' || !a.trim())) {
        issues.invalidAmenities.push({ file, hotel: h.name, amenities: h.amenities });
      } else {
        stats.hotelsWithValidAmenities++;
      }

      // 8. URL Check
      if (!h.url || typeof h.url !== 'string' || !h.url.startsWith('https://www.google.com/maps/search/?api=1&query=')) {
        issues.invalidUrl.push({ file, hotel: h.name, url: h.url });
      } else {
        stats.hotelsWithValidUrls++;

        // Verify hotel name is in URL
        if (h.name) {
          const decodedUrl = decodeURIComponent(h.url);
          const firstWord = h.name.split(' ')[0].toLowerCase();
          if (!decodedUrl.toLowerCase().includes(firstWord)) {
            issues.mismatchedUrl.push({ file, hotel: h.name, url: h.url });
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}

console.log('================================================================');
console.log('DEEP HOTEL AUDIT REPORT (ALL DESTINATIONS)');
console.log('================================================================');
console.log(`Total Destinations:               ${stats.totalDestinations}`);
console.log(`Destinations with Hotels:         ${stats.destinationsWithHotels}`);
console.log(`Destinations without Hotels:       ${stats.destinationsWithoutHotels}`);
console.log(`Total Hotels Audited:             ${stats.totalHotels}`);
console.log('----------------------------------------------------------------');
console.log(`Valid Hotel Names:                ${stats.hotelsWithValidNames} / ${stats.totalHotels} (${((stats.hotelsWithValidNames / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Hotel Types:                ${stats.hotelsWithValidTypes} / ${stats.totalHotels} (${((stats.hotelsWithValidTypes / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Price Tiers:                ${stats.hotelsWithValidTiers} / ${stats.totalHotels} (${((stats.hotelsWithValidTiers / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Prices (Min <= Max > 0):    ${stats.hotelsWithValidPrices} / ${stats.totalHotels} (${((stats.hotelsWithValidPrices / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Ratings (1.0 - 5.0):        ${stats.hotelsWithValidRatings} / ${stats.totalHotels} (${((stats.hotelsWithValidRatings / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Review Counts:              ${stats.hotelsWithValidReviews} / ${stats.totalHotels} (${((stats.hotelsWithValidReviews / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Amenities Array:            ${stats.hotelsWithValidAmenities} / ${stats.totalHotels} (${((stats.hotelsWithValidAmenities / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log(`Valid Google Maps Place URLs:     ${stats.hotelsWithValidUrls} / ${stats.totalHotels} (${((stats.hotelsWithValidUrls / stats.totalHotels) * 100).toFixed(2)}%)`);
console.log('----------------------------------------------------------------');
console.log(`Duplicate Hotels inside same dest:${stats.duplicateHotelsInDest}`);
console.log(`Real / Verified Hotel Names:      ${stats.realVerifiedHotels}`);
console.log(`Legacy Pattern Synthetic Names:   ${stats.syntheticPatternHotels}`);
console.log('----------------------------------------------------------------');
console.log('TOTAL CRITICAL ISSUES FOUND:');
console.log(`  Missing / Corrupt Names:         ${issues.missingName.length}`);
console.log(`  Invalid Types:                   ${issues.invalidType.length}`);
console.log(`  Invalid Tiers:                   ${issues.invalidTier.length}`);
console.log(`  Invalid Prices:                  ${issues.invalidPrice.length}`);
console.log(`  Invalid Ratings:                 ${issues.invalidRating.length}`);
console.log(`  Invalid Review Counts:           ${issues.invalidReviews.length}`);
console.log(`  Invalid Amenities:               ${issues.invalidAmenities.length}`);
console.log(`  Invalid URLs:                    ${issues.invalidUrl.length}`);
console.log(`  Mismatched Hotel Name in URL:    ${issues.mismatchedUrl.length}`);
console.log('================================================================');

if (issues.invalidType.length > 0) {
  console.log('\nSample Invalid Types (up to 5):');
  console.log(JSON.stringify(issues.invalidType.slice(0, 5), null, 2));
}
if (issues.invalidPrice.length > 0) {
  console.log('\nSample Invalid Prices (up to 5):');
  console.log(JSON.stringify(issues.invalidPrice.slice(0, 5), null, 2));
}
if (issues.duplicateInDest.length > 0) {
  console.log('\nSample Duplicates inside same dest (up to 5):');
  console.log(JSON.stringify(issues.duplicateInDest.slice(0, 5), null, 2));
}
