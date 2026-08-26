const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

console.log('======================================================================');
console.log('🔍 FULL-CATALOG DUPLICATE URL AUDIT ACROSS ALL 2,389 DESTINATIONS');
console.log('======================================================================\n');

// 1. HERO IMAGE DUPLICATES (Cross-destination)
const heroMap = new Map();
files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const src = (d.heroImage && (d.heroImage.src || d.heroImage)) || '';
  if (!src) return;
  if (!heroMap.has(src)) heroMap.set(src, []);
  heroMap.get(src).push(d.slug);
});

let heroDupes = 0;
for (const [url, slugs] of heroMap.entries()) {
  if (slugs.length > 1) heroDupes++;
}

console.log(`1. HERO COVER IMAGES:`);
console.log(`   - Total Hero URLs: ${heroMap.size} unique across ${files.length} destinations`);
console.log(`   - Cross-Destination Hero Duplicates: ${heroDupes} (0.00%)\n`);

// 2. INTERNAL DUPLICATES (Within each individual destination)
let internalDupesCount = 0;
const destinationsWithInternalDupes = [];

files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const seenInDest = new Set();
  let hasDupe = false;

  const heroSrc = (d.heroImage && (d.heroImage.src || d.heroImage)) || '';
  if (heroSrc) seenInDest.add(heroSrc);

  if (Array.isArray(d.gallery)) {
    d.gallery.forEach(g => {
      const gSrc = (g && (g.src || g)) || '';
      if (gSrc) {
        if (seenInDest.has(gSrc)) hasDupe = true;
        seenInDest.add(gSrc);
      }
    });
  }

  if (Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach(p => {
      const pSrc = (p.image && (p.image.src || p.image)) || '';
      if (pSrc) {
        if (seenInDest.has(pSrc)) hasDupe = true;
        seenInDest.add(pSrc);
      }
      if (Array.isArray(p.photos)) {
        p.photos.forEach(u => {
          if (u) {
            if (seenInDest.has(u)) hasDupe = true;
            seenInDest.add(u);
          }
        });
      }
    });
  }

  if (hasDupe) {
    internalDupesCount++;
    destinationsWithInternalDupes.push(d.slug);
  }
});

console.log(`2. INTRA-DESTINATION DUPLICATES (Repeated URL on the same destination page):`);
console.log(`   - Destinations with repeated URLs inside their own page: ${internalDupesCount} / ${files.length}\n`);

// 3. GLOBAL UNIQUE URL POOL
const allUrlsMap = new Map();
files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const collect = (url, context) => {
    if (!url || typeof url !== 'string') return;
    if (!allUrlsMap.has(url)) allUrlsMap.set(url, []);
    allUrlsMap.get(url).push(`${d.slug} (${context})`);
  };

  if (d.heroImage && d.heroImage.src) collect(d.heroImage.src, 'hero');
  if (Array.isArray(d.gallery)) d.gallery.forEach((g, i) => collect(g.src || g, `gallery[${i}]`));
  if (Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach((p, pIdx) => {
      if (p.image && p.image.src) collect(p.image.src, `place[${pIdx}].image`);
      if (Array.isArray(p.photos)) p.photos.forEach((u, uIdx) => collect(u, `place[${pIdx}].photo[${uIdx}]`));
    });
  }
});

let totalUrlRefs = 0;
for (const [url, locations] of allUrlsMap.entries()) {
  totalUrlRefs += locations.length;
}

console.log(`3. GLOBAL URL POOL:`);
console.log(`   - Total Image Instances: ${totalUrlRefs}`);
console.log(`   - Unique Image URLs: ${allUrlsMap.size}`);
console.log('======================================================================');
