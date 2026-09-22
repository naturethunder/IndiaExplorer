const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));

console.log(`Auditing all ${files.length} destination JSON files...`);

const catalog = new Map(); // url -> Array of { file, location }
let totalJsonErrors = 0;
let totalHeroSyncErrors = 0;
let totalGalleryCountErrors = 0;
let totalInternalDupes = 0;
let totalGeographicLeaks = 0;
let totalBannedUrls = 0;

const LEAK_PATTERNS = [
  /binh[_-]?thuan/i,
  /vietnam/i,
  /da[_-]?nang/i,
  /hoi[_-]?an/i,
  /nha[_-]?trang/i,
  /phu[_-]?quoc/i,
  /pixabay\.com\/get\//i,
  /placeholder/i
];

const KERALA_PATTERNS = [
  /mamam[_-]?river/i,
  /angamaly/i,
  /thrissur[_-]?pooram/i,
  /theyyam/i,
  /kathakali/i,
  /kerala[_-]?backwaters/i,
  /alleppey[_-]?houseboat/i
];

const NORTH_CENTRAL_STATES = new Set([
  'Punjab', 'Haryana', 'Rajasthan', 'Delhi', 'Uttar Pradesh', 'Uttarakhand',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Ladakh', 'Madhya Pradesh',
  'Bihar', 'Jharkhand', 'Chhattisgarh', 'Gujarat', 'Maharashtra'
]);

files.forEach(file => {
  const fullPath = path.join(DEST_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    console.error(`[SYNTAX ERROR] ${file}: ${err.message}`);
    totalJsonErrors++;
    return;
  }

  // 1. Hero sync check
  const heroSrc = data.heroImage?.src || (typeof data.heroImage === 'string' ? data.heroImage : '');
  const gallery0Src = data.gallery?.[0]?.src || (typeof data.gallery?.[0] === 'string' ? data.gallery[0] : '');
  if (!heroSrc || !gallery0Src || heroSrc !== gallery0Src) {
    totalHeroSyncErrors++;
  }

  // 2. Gallery count
  if (!data.gallery || data.gallery.length < 5) {
    totalGalleryCountErrors++;
  }

  // 3. Collect all URLs in file
  const fileUrls = [];
  function addUrl(u, loc) {
    if (!u) return;
    const clean = String(u).trim();
    fileUrls.push({ url: clean, loc });
  }

  addUrl(heroSrc, 'heroImage');
  (data.gallery || []).forEach((g, idx) => {
    addUrl(g?.src || (typeof g === 'string' ? g : ''), `gallery[${idx}]`);
  });

  const places = data.topPlaces || data.places || [];
  places.forEach((p, pIdx) => {
    addUrl(p.image?.src || (typeof p.image === 'string' ? p.image : ''), `place[${pIdx}].image`);
    (p.photos || []).forEach((ph, phIdx) => {
      addUrl(ph?.src || (typeof ph === 'string' ? ph : ''), `place[${pIdx}].photos[${phIdx}]`);
    });
  });

  // 4. Internal duplicates (ignoring heroImage === gallery[0])
  const seenInFile = new Map();
  fileUrls.forEach(({ url, loc }) => {
    if (!url) return;
    if (seenInFile.has(url)) {
      const prevLoc = seenInFile.get(url);
      if (!(prevLoc === 'heroImage' && loc === 'gallery[0]')) {
        totalInternalDupes++;
        if (totalInternalDupes <= 10) {
          console.warn(`[INTERNAL DUPE] ${file}: "${url.substring(0, 60)}..." in ${prevLoc} & ${loc}`);
        }
      }
    } else {
      seenInFile.set(url, loc);
    }

    // Catalog cross-collision tracking
    if (!catalog.has(url)) catalog.set(url, []);
    catalog.get(url).push({ file, loc });

    // Banned patterns
    for (const pat of LEAK_PATTERNS) {
      if (pat.test(url)) {
        totalBannedUrls++;
        console.error(`[BANNED PATTERN ${pat}] in ${file} at ${loc}: ${url}`);
      }
    }

    // Kerala in North/Central states
    const destState = data.state || '';
    if (NORTH_CENTRAL_STATES.has(destState)) {
      for (const kpat of KERALA_PATTERNS) {
        if (kpat.test(url)) {
          totalGeographicLeaks++;
          console.error(`[GEOGRAPHIC LEAK] Kerala asset in ${destState} (${file} at ${loc}): ${url}`);
        }
      }
    }
  });
});

// Catalog cross-collision summary
let crossCollisions = 0;
catalog.forEach((appearances, url) => {
  const uniqueFiles = new Set(appearances.map(a => a.file));
  if (uniqueFiles.size > 1) {
    crossCollisions++;
  }
});

console.log('\n================ AUDIT SUMMARY ================');
console.log(`Total Destinations Checked: ${files.length}`);
console.log(`Total Unique Photo URLs in Repository: ${catalog.size}`);
console.log(`JSON Syntax Errors: ${totalJsonErrors}`);
console.log(`Hero Synchronization Errors: ${totalHeroSyncErrors}`);
console.log(`Gallery Count < 5 Errors: ${totalGalleryCountErrors}`);
console.log(`Internal Duplicate URLs: ${totalInternalDupes}`);
console.log(`Banned URL Patterns (Vietnam, Pixabay Session, etc.): ${totalBannedUrls}`);
console.log(`Geographic Leaks (Kerala in North/Central): ${totalGeographicLeaks}`);
console.log(`Cross-Destination Collisions: ${crossCollisions}`);
console.log('================================================\n');

if (totalJsonErrors === 0 && totalBannedUrls === 0 && totalGeographicLeaks === 0) {
  console.log('✓ PASS: Destination integrity, zero syntax errors, and zero geographic leaks certified!');
  process.exit(0);
} else {
  console.error('✗ FAIL: Integrity issues detected.');
  process.exit(1);
}
