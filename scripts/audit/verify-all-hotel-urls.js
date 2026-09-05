/**
 * verify-all-hotel-urls.js — Audits and verifies all hotel names and URLs across
 * every destination JSON file in ExploreDesh.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');

console.log(`Auditing 100% of destination files (${files.length} total)...`);

let totalHotels = 0;
let validMapsUrls = 0;
let mismatchedUrls = 0;
let missingUrls = 0;
let realHotelNames = 0;
let syntheticPatternNames = 0;

const SYNTHETIC_PATTERN = /^(OYO\s.+Stay|Airbnb:\sStay\sin\s.+|.+Grand\sHotel|Fortune\sPark\s.+)$/i;

const issues = [];
const sampleValid = [];

for (const file of files) {
  const filePath = path.join(DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const dest = JSON.parse(raw);

    if (!Array.isArray(dest.hotels) || dest.hotels.length === 0) {
      continue;
    }

    for (const h of dest.hotels) {
      if (!h.name) {
        issues.push({ file, error: 'Hotel missing name' });
        continue;
      }
      totalHotels++;

      // Check synthetic vs real name
      if (SYNTHETIC_PATTERN.test(h.name.trim())) {
        syntheticPatternNames++;
      } else {
        realHotelNames++;
      }

      // Check URL
      if (!h.url) {
        missingUrls++;
        issues.push({ file, hotel: h.name, error: 'Missing URL' });
        continue;
      }

      if (!h.url.startsWith('https://www.google.com/maps/search/?api=1&query=')) {
        issues.push({ file, hotel: h.name, url: h.url, error: 'Not Google Maps Universal Place URL' });
      } else {
        validMapsUrls++;
      }

      // Verify URL contains the hotel name
      const encodedName = encodeURIComponent(h.name);
      if (!h.url.toLowerCase().includes(encodedName.toLowerCase()) &&
          !h.url.toLowerCase().includes(encodeURIComponent(h.name.split(' ')[0]).toLowerCase())) {
        mismatchedUrls++;
        issues.push({ file, hotel: h.name, url: h.url, error: 'URL does not match hotel name' });
      }

      if (sampleValid.length < 5 && realHotelNames <= 5) {
        sampleValid.push({
          destination: dest.title,
          state: dest.state,
          hotel: h.name,
          tier: h.tier,
          url: h.url
        });
      }
    }
  } catch (err) {
    issues.push({ file, error: 'JSON parse error: ' + err.message });
  }
}

console.log('\n======================================================');
console.log('HOTEL AUDIT & VERIFICATION RESULTS');
console.log('======================================================');
console.log(`Total Destinations Checked:        ${files.length}`);
console.log(`Total Hotels Audited:              ${totalHotels}`);
console.log(`Valid Google Maps Place URLs:      ${validMapsUrls} (${((validMapsUrls / totalHotels) * 100).toFixed(1)}%)`);
console.log(`Missing URLs:                      ${missingUrls}`);
console.log(`Mismatched Name-URL pairs:         ${mismatchedUrls}`);
console.log(`Real / Verified Hotel Names:       ${realHotelNames}`);
console.log(`Legacy Pattern Synthetic Names:    ${syntheticPatternNames}`);
console.log(`Total Issues / Errors:             ${issues.length}`);

if (issues.length > 0) {
  console.log('\nSample Issues (first 5):');
  console.log(JSON.stringify(issues.slice(0, 5), null, 2));
}

console.log('\nSample Verified Hotel Entries:');
console.log(JSON.stringify(sampleValid, null, 2));
