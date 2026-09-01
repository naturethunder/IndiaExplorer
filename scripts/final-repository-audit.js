const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

console.log('=== COMPREHENSIVE REPOSITORY-WIDE INTEGRITY AUDIT ===');
console.log(`Total destination files: ${files.length}\n`);

let tajViolations = 0;
let galleryViolations = 0;
let heroSyncViolations = 0;
let placePhotoViolations = 0;
let internalDupsViolations = 0;

const globalUrlMap = new Map(); // cleanUrl -> Set(files)

files.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
    const slug = f.replace('.json', '');
    const fileUrls = new Set();
    let hasInternalDup = false;

    const recordUrl = (u) => {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return;
      const clean = u.split('?')[0];
      if (fileUrls.has(clean)) {
        hasInternalDup = true;
      }
      fileUrls.add(clean);
      if (!globalUrlMap.has(clean)) globalUrlMap.set(clean, new Set());
      globalUrlMap.get(clean).add(f);

      if (/Taj_Mahal_in_March_2004/i.test(clean) && slug !== 'agra') {
        tajViolations++;
        console.error(`[Taj Violation] ${f} has Taj Mahal monument: ${clean}`);
      }
    };

    // 1. Gallery check
    if (!Array.isArray(data.gallery) || data.gallery.length !== 5) {
      galleryViolations++;
    } else {
      data.gallery.forEach(g => recordUrl(g && g.src));
    }

    // 2. Hero & SEO Sync
    if (!data.heroImage || !data.gallery || data.gallery.length === 0 || data.heroImage.src !== data.gallery[0].src) {
      heroSyncViolations++;
    }
    if (data.seo && data.gallery && data.gallery.length > 0 && data.seo.ogImage !== data.gallery[0].src) {
      heroSyncViolations++;
    }

    // 3. TopPlaces check
    if (Array.isArray(data.topPlaces)) {
      data.topPlaces.forEach((p, pIdx) => {
        if (p.image && p.image.src) recordUrl(p.image.src);
        if (!Array.isArray(p.photos) || p.photos.length !== 3) {
          placePhotoViolations++;
        } else {
          p.photos.forEach(recordUrl);
        }
      });
    }

    if (hasInternalDup) internalDupsViolations++;
  } catch (e) {
    console.error(`Error reading ${f}:`, e.message);
  }
});

let crossFileCollisions = 0;
const collidingUrls = [];
globalUrlMap.forEach((set, url) => {
  if (set.size > 1) {
    crossFileCollisions++;
    if (collidingUrls.length < 10) collidingUrls.push({ url, files: Array.from(set) });
  }
});

console.log('--- AUDIT RESULTS ---');
console.log(`1. Total Destination Files Audited: ${files.length}`);
console.log(`2. Total Unique URLs Across Repository: ${globalUrlMap.size}`);
console.log(`3. Taj Mahal Monument Purge Violations: ${tajViolations} (Target: 0)`);
console.log(`4. Cross-file Duplicate Collisions: ${crossFileCollisions} (Target: 0)`);
console.log(`5. Internal File Duplicate Violations: ${internalDupsViolations} (Target: 0)`);
console.log(`6. Gallery Length Violations (!= 5 images): ${galleryViolations} (Target: 0)`);
console.log(`7. Hero & SEO Sync Violations: ${heroSyncViolations} (Target: 0)`);
console.log(`8. Place Photos Violations (!= 3 photos/place): ${placePhotoViolations} (Target: 0)`);

if (crossFileCollisions > 0) {
  console.log('\nSample collisions:', JSON.stringify(collidingUrls.slice(0, 5), null, 2));
}

// Index verification
let indexItemsCount = 0;
try {
  const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  indexItemsCount = Array.isArray(indexData) ? indexData.length : (indexData.destinations ? indexData.destinations.length : 0);
  console.log(`\n9. Master index.json Items: ${indexItemsCount}`);
} catch (e) {
  console.error('\nError reading index.json:', e.message);
}

const totalViolations = tajViolations + crossFileCollisions + internalDupsViolations + galleryViolations + heroSyncViolations + placePhotoViolations;

console.log('\n=============================================');
if (totalViolations > 0) {
  console.error(`❌ AUDIT FAILED: ${totalViolations} integrity violations detected.`);
  process.exit(1);
} else {
  console.log('✅ AUDIT PASSED: 100% repository integrity verified (0 violations).');
  process.exit(0);
}

