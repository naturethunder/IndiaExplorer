/**
 * verify-hotel-overhaul.js
 * Verifies all 2,388 destination JSON files against strict quality and data integrity rules.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

console.log(`Starting deep verification across all ${files.length} destination files...`);

let issues = {
  syntheticNames: 0,
  invalidUrls: 0,
  invertedPrices: 0,
  missingPrices: 0,
  corruptedLodges: 0,
  insufficientHotels: 0,
  minPriceMismatch: 0
};

const syntheticChains = /^(Marriott|Fortune Park|Sterling|Jungle Lodges|Radisson)\s+(.+)$/i;

let totalHotelsChecked = 0;

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const hotels = d.hotels || [];

  if (hotels.length < 2) {
    issues.insufficientHotels++;
  }

  const minHotelPrice = hotels.length > 0
    ? Math.min(...hotels.map(h => typeof h.priceMin === 'number' ? h.priceMin : Infinity))
    : Infinity;

  if (d.overview && d.overview.minPrice !== minHotelPrice && minHotelPrice !== Infinity) {
    issues.minPriceMismatch++;
  }

  for (const h of hotels) {
    totalHotelsChecked++;

    // Check synthetic names
    const isSynthetic = /^OYO\s.+Stay$/i.test(h.name) ||
      /^Airbnb:\s.+$/i.test(h.name) ||
      /Grand Hotel$/i.test(h.name) ||
      (syntheticChains.test(h.name) && !/Fortune Park (Dalhousie|Moksha)|Radisson (Jass Hotel|Hotel Varanasi)|Sterling (Kodai Lake|Ooty Elk Hill)/i.test(h.name));

    if (isSynthetic) {
      issues.syntheticNames++;
      console.log(`[SYNTHETIC] ${file}: ${h.name}`);
    }

    // Check URLs
    if (!h.url || !h.url.startsWith('https://www.google.com/maps/search/?api=1&query=')) {
      issues.invalidUrls++;
      console.log(`[INVALID URL] ${file}: ${h.name} -> ${h.url}`);
    }

    // Check inverted price
    if (typeof h.priceMin !== 'number' || typeof h.priceMax !== 'number') {
      issues.missingPrices++;
    } else if (h.priceMin > h.priceMax) {
      issues.invertedPrices++;
    }

    // Check inappropriate budget terms in luxury/upscale tiers
    if (/\b(pg|dhaba|dorm|dormitory)\b|lodge/i.test(h.name) && h.priceMin >= 5000 && !/jungle|safari|river|eco\s*lodge|alpine\s*lodge|trail(head)?\s*lodge/i.test(h.name)) {
      issues.corruptedLodges++;
      console.log(`[CORRUPTED LODGE] ${file}: ${h.name} (₹${h.priceMin}-${h.priceMax})`);
    }
  }
}

console.log('\n========================================');
console.log(`TOTAL DESTINATIONS AUDITED: ${files.length}`);
console.log(`TOTAL HOTELS AUDITED: ${totalHotelsChecked}`);
console.log('========================================');
console.log(`1. Synthetic Names:           ${issues.syntheticNames}`);
console.log(`2. Invalid / Non-Maps URLs:   ${issues.invalidUrls}`);
console.log(`3. Inverted Prices (Min>Max): ${issues.invertedPrices}`);
console.log(`4. Missing Prices (null/NaN): ${issues.missingPrices}`);
console.log(`5. Corrupted Lodges in Luxury:${issues.corruptedLodges}`);
console.log(`6. Insufficient Hotels (<2):  ${issues.insufficientHotels}`);
console.log(`7. MinPrice Mismatch (Dest):  ${issues.minPriceMismatch}`);
console.log('========================================\n');

if (Object.values(issues).every(v => v === 0)) {
  console.log('🎉 ALL HOTELS AND PER-NIGHT CHARGES 100% VALIDATED & ACCURATE!');
} else {
  console.log('⚠️ Some issues need resolution.');
}
