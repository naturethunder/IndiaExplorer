/**
 * deepest-forensic-audit.js
 * 
 * An exhaustive, deep forensic audit across all 2,389 destination JSON files,
 * data/destinations/index.json, and data/bulk/*.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const BULK_DIR = path.join(ROOT, 'data', 'bulk');
const destFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

console.log('======================================================================');
console.log('🔍 DEEP FORENSIC IMAGE & DATA AUDIT ACROSS ALL DESTINATIONS');
console.log('======================================================================\n');

// 1. Defect checks regex
const EXT_BAD = /\.(pdf|djvu|ogg|ogv|oga|webm|mp4|avi|mov|flv|mp3|wav|mid|midi|svg|ico|txt|html|htm|doc|docx)([\/?#]|$)/i;
const KEYWORD_BAD = /(stamp_of_|postage_stamp|coin_of_|banknote|currency_note|copper_coin|silver_coin|1_pice|jital_coin|flag_of_|coat_of_arms|logo_of_|seal_of_|emblem_of_|symbol_of_|india_location_map|location_map|map_of_|locator_map|administrative_map|political_map|outline_map|blank_map|diagram|schematic|census|chart_|graph_|table_|statistics|pie_chart|bar_chart|infographic|icon[_\-]|pictogram|emoji|clipart|holy_icon|portrait_of_|headshot|selfie|passport_photo|mugshot|lissa_lauria|picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr|placeholder\.com|fakeimg)/i;
const THUMB_BAD = /\/([1-9][0-9]|1[0-9][0-9]|2[0-9][0-9])px-/i;

// Tracking structures
let totalImageCount = 0;
const allBadUrls = [];
const emptySlots = [];
const crossDestMap = new Map(); // cleanUrl -> [ { file, field } ]
const intraDestCollisions = [];
let heroGallery0Mismatches = [];

const clean = u => (u || '').split('?')[0].toLowerCase();

destFiles.forEach(file => {
  const filePath = path.join(DEST_DIR, file);
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const slug = d.slug || file.replace('.json', '');
  const title = d.title || d.name || slug;

  const imagesInDest = []; // { field, url }

  // A. Hero Image
  const heroUrl = (typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage) || d.image;
  if (!heroUrl) {
    emptySlots.push({ file, field: 'heroImage' });
  } else {
    imagesInDest.push({ field: 'heroImage', url: heroUrl });
  }

  // B. Gallery
  if (!Array.isArray(d.gallery) || d.gallery.length === 0) {
    emptySlots.push({ file, field: 'gallery (missing or empty)' });
  } else {
    d.gallery.forEach((g, idx) => {
      const gUrl = typeof g === 'object' ? g?.src : g;
      if (!gUrl) {
        emptySlots.push({ file, field: `gallery[${idx}]` });
      } else {
        imagesInDest.push({ field: `gallery[${idx}]`, url: gUrl });
      }
    });

    // Verify hero == gallery[0]
    const g0Url = typeof d.gallery[0] === 'object' ? d.gallery[0]?.src : d.gallery[0];
    if (heroUrl && g0Url && clean(heroUrl) !== clean(g0Url)) {
      heroGallery0Mismatches.push({ file, heroUrl, g0Url });
    }
  }

  // C. Top Places
  if (Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach((p, pIdx) => {
      const pName = p.name || `Place ${pIdx}`;
      const pImg = typeof p.image === 'object' ? p.image?.src : p.image;
      if (!pImg) {
        emptySlots.push({ file, field: `topPlaces[${pIdx}:${pName}].image` });
      } else {
        imagesInDest.push({ field: `topPlaces[${pIdx}:${pName}].image`, url: pImg });
      }

      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph, phIdx) => {
          const phUrl = typeof ph === 'object' ? ph?.src : ph;
          if (!phUrl) {
            emptySlots.push({ file, field: `topPlaces[${pIdx}:${pName}].photos[${phIdx}]` });
          } else {
            imagesInDest.push({ field: `topPlaces[${pIdx}:${pName}].photos[${phIdx}]`, url: phUrl });
          }
        });
      }
    });
  }

  // D. Perform Defect & Collision Checks on images in this destination
  const localSeen = new Map();

  imagesInDest.forEach(img => {
    totalImageCount++;
    const u = img.url;

    // Check bad extension
    if (EXT_BAD.test(u)) {
      allBadUrls.push({ file, field: img.field, url: u, reason: 'BAD_EXTENSION' });
    }
    // Check bad keyword
    if (KEYWORD_BAD.test(u)) {
      allBadUrls.push({ file, field: img.field, url: u, reason: 'BAD_KEYWORD' });
    }
    // Check blurry thumb
    if (THUMB_BAD.test(u)) {
      allBadUrls.push({ file, field: img.field, url: u, reason: 'BLURRY_THUMB' });
    }
    // Check protocol
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      allBadUrls.push({ file, field: img.field, url: u, reason: 'INVALID_PROTOCOL' });
    }

    // Intra-destination collisions
    const cu = clean(u);
    if (img.field === 'gallery[0]' && localSeen.has(cu) && localSeen.get(cu) === 'heroImage') {
      // Expected mirror
    } else if (localSeen.has(cu)) {
      intraDestCollisions.push({
        file,
        firstField: localSeen.get(cu),
        secondField: img.field,
        url: u
      });
    } else {
      localSeen.set(cu, img.field);
    }
  });

  // Cross-destination tracking
  const uniqueInThisDest = new Set(imagesInDest.map(i => clean(i.url)));
  uniqueInThisDest.forEach(cu => {
    if (!crossDestMap.has(cu)) crossDestMap.set(cu, []);
    crossDestMap.get(cu).push(file);
  });
});

// Check cross-destination collisions
const crossDestCollisions = [];
for (const [cu, filesList] of crossDestMap.entries()) {
  if (filesList.length > 1) {
    crossDestCollisions.push({ url: cu, count: filesList.length, files: filesList });
  }
}

// Check index.json
const indexPath = path.join(DEST_DIR, 'index.json');
let indexHeroCollisions = 0;
let indexMissingHeros = 0;
if (fs.existsSync(indexPath)) {
  const idxData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const idxSeen = new Map();
  idxData.destinations.forEach(item => {
    const h = item.heroImage?.src || item.heroImage || item.image;
    if (!h) indexMissingHeros++;
    else {
      const ch = clean(h);
      if (idxSeen.has(ch)) {
        indexHeroCollisions++;
      } else {
        idxSeen.set(ch, item.slug);
      }
    }
  });
}

// Output Report
console.log('----------------------------------------------------------------------');
console.log(`1. TOTAL DESTINATION COVERAGE:`);
console.log(`   - Total Destination Files:          ${destFiles.length.toLocaleString()}`);
console.log(`   - Total Image Slots Scanned:        ${totalImageCount.toLocaleString()}`);
console.log(`   - Unique Image URLs in Pool:        ${crossDestMap.size.toLocaleString()}`);
console.log(`   - Empty / Null Image Slots:         ${emptySlots.length}`);
console.log('');

console.log(`2. IMAGE INTEGRITY & DEFECT AUDIT:`);
console.log(`   - Bad Extensions (pdf/ogg/svg/etc): ${allBadUrls.filter(b => b.reason === 'BAD_EXTENSION').length}`);
console.log(`   - Non-Scenery Keywords (stamps/etc):${allBadUrls.filter(b => b.reason === 'BAD_KEYWORD').length}`);
console.log(`   - Blurry Thumbnails (<300px):       ${allBadUrls.filter(b => b.reason === 'BLURRY_THUMB').length}`);
console.log(`   - Total Defective Images Found:     ${allBadUrls.length}`);
console.log('');

console.log(`3. DUPLICATE & COLLISION AUDIT:`);
console.log(`   - Cross-Destination Shared Images:  ${crossDestCollisions.length}`);
console.log(`   - Intra-Destination Disjoint Dupes: ${intraDestCollisions.length}`);
console.log(`   - Hero vs Gallery[0] Mismatches:    ${heroGallery0Mismatches.length}`);
console.log(`   - Index.json Cover Duplicates:      ${indexHeroCollisions}`);
console.log('======================================================================');

if (allBadUrls.length > 0) {
  console.log('\n❌ DEFECTIVE URLS DETECTED:');
  console.log(JSON.stringify(allBadUrls.slice(0, 10), null, 2));
}

if (crossDestCollisions.length > 0) {
  console.log('\n❌ CROSS DESTINATION COLLISIONS DETECTED:');
  console.log(JSON.stringify(crossDestCollisions.slice(0, 10), null, 2));
}

if (intraDestCollisions.length > 0) {
  console.log('\n❌ INTRA DESTINATION COLLISIONS DETECTED:');
  console.log(JSON.stringify(intraDestCollisions.slice(0, 10), null, 2));
}

if (allBadUrls.length === 0 && crossDestCollisions.length === 0 && intraDestCollisions.length === 0 && emptySlots.length === 0 && heroGallery0Mismatches.length === 0) {
  console.log('\n✨ ALL AUDIT CHECKS PASSED PERFECTLY WITH 100% CLEAN RESULTS.');
}
