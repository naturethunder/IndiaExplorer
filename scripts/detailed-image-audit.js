const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const destFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

console.log(`Found ${destFiles.length} distinct destination JSON files (excluding index.json).`);

// Helper to normalize image URL (strip query params and normalize thumbnail paths)
function getCleanImageKey(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  const qIdx = clean.indexOf('?');
  if (qIdx !== -1) clean = clean.substring(0, qIdx);
  
  // Wikimedia thumbnail normalization e.g. /thumb/.../800px-filename.jpg -> filename.jpg
  const wikiMatch = clean.match(/\/thumb\/[^\/]+\/[^\/]+\/([^\/]+)\/[0-9]+px-(?:[^\/]+)$/i);
  if (wikiMatch) {
    return 'wikimedia:' + decodeURIComponent(wikiMatch[1]).toLowerCase();
  }
  
  // Unsplash photo id normalization e.g. https://images.unsplash.com/photo-1548013146-72479768bada
  const unsplashMatch = clean.match(/unsplash\.com\/(photo-[a-zA-Z0-9-]+)/i);
  if (unsplashMatch) {
    return 'unsplash:' + unsplashMatch[1].toLowerCase();
  }

  // Pexels photo ID normalization e.g. pexels.com/photos/12345/
  const pexelsMatch = clean.match(/pexels\.com\/photos\/([0-9]+)/i);
  if (pexelsMatch) {
    return 'pexels:' + pexelsMatch[1];
  }

  return clean.toLowerCase();
}

function extractDestinationImages(d, filename) {
  const images = []; // { field, url, key }
  
  // 1. Hero Image
  const heroUrl = (d.heroImage && (d.heroImage.src || (typeof d.heroImage === 'string' ? d.heroImage : ''))) || d.image || '';
  if (heroUrl && typeof heroUrl === 'string' && heroUrl.startsWith('http')) {
    images.push({ field: 'heroImage', url: heroUrl, key: getCleanImageKey(heroUrl) });
  }

  // 2. Gallery
  if (Array.isArray(d.gallery)) {
    d.gallery.forEach((g, idx) => {
      const gUrl = (g && (g.src || (typeof g === 'string' ? g : ''))) || '';
      if (gUrl && typeof gUrl === 'string' && gUrl.startsWith('http')) {
        images.push({ field: `gallery[${idx}]`, url: gUrl, key: getCleanImageKey(gUrl) });
      }
    });
  }

  // 3. Top Places
  if (Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach((p, pIdx) => {
      const pName = p.name || `Place_${pIdx}`;
      const pImg = (p.image && (p.image.src || (typeof p.image === 'string' ? p.image : ''))) || '';
      if (pImg && typeof pImg === 'string' && pImg.startsWith('http')) {
        images.push({ field: `topPlaces[${pIdx}:${pName}].image`, url: pImg, key: getCleanImageKey(pImg) });
      }
      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph, phIdx) => {
          const phUrl = (ph && (ph.src || (typeof ph === 'string' ? ph : ''))) || '';
          if (phUrl && typeof phUrl === 'string' && phUrl.startsWith('http')) {
            images.push({ field: `topPlaces[${pIdx}:${pName}].photos[${phIdx}]`, url: phUrl, key: getCleanImageKey(phUrl) });
          }
        });
      }
    });
  }

  // 4. Other place structures if any (places)
  if (Array.isArray(d.places)) {
    d.places.forEach((p, pIdx) => {
      const pName = p.name || `Place_${pIdx}`;
      const pImg = (p.image && (p.image.src || (typeof p.image === 'string' ? p.image : ''))) || '';
      if (pImg && typeof pImg === 'string' && pImg.startsWith('http')) {
        images.push({ field: `places[${pIdx}:${pName}].image`, url: pImg, key: getCleanImageKey(pImg) });
      }
      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph, phIdx) => {
          const phUrl = (ph && (ph.src || (typeof ph === 'string' ? ph : ''))) || '';
          if (phUrl && typeof phUrl === 'string' && phUrl.startsWith('http')) {
            images.push({ field: `places[${pIdx}:${pName}].photos[${phIdx}]`, url: phUrl, key: getCleanImageKey(phUrl) });
          }
        });
      }
    });
  }

  return images;
}

// Data collection
const intraDestDuplicates = []; // destinations where images repeat inside
const crossDestKeyMap = new Map(); // key -> [{ file, slug, name, field, url }]
let totalImageCount = 0;
let pdfImagesList = [];

destFiles.forEach(file => {
  const content = fs.readFileSync(path.join(DEST_DIR, file), 'utf8');
  const d = JSON.parse(content);
  const slug = d.slug || file.replace('.json', '');
  const name = d.name || slug;

  const images = extractDestinationImages(d, file);
  totalImageCount += images.length;

  // Check for PDF URLs accidentally used as images
  images.forEach(img => {
    if (img.url.toLowerCase().includes('.pdf')) {
      pdfImagesList.push({ file, slug, field: img.field, url: img.url });
    }
  });

  // Check intra-destination duplicates
  const seenKeys = new Map(); // key -> field
  const localDupes = [];

  images.forEach(img => {
    if (seenKeys.has(img.key)) {
      localDupes.push({
        firstField: seenKeys.get(img.key),
        duplicateField: img.field,
        url: img.url,
        key: img.key
      });
    } else {
      seenKeys.set(img.key, img.field);
    }

    // Cross-destination tracking
    if (!crossDestKeyMap.has(img.key)) crossDestKeyMap.set(img.key, []);
    crossDestKeyMap.get(img.key).push({
      file,
      slug,
      name,
      field: img.field,
      url: img.url
    });
  });

  if (localDupes.length > 0) {
    // Categorize intra duplicates
    let heroVsGallery = 0;
    let heroVsPlace = 0;
    let galleryVsPlace = 0;
    let withinGallery = 0;
    let withinPlaces = 0;

    localDupes.forEach(dup => {
      const f1 = dup.firstField;
      const f2 = dup.duplicateField;
      if (f1 === 'heroImage' && f2.startsWith('gallery')) heroVsGallery++;
      else if (f1 === 'heroImage' && f2.startsWith('topPlaces')) heroVsPlace++;
      else if (f1.startsWith('gallery') && f2.startsWith('topPlaces')) galleryVsPlace++;
      else if (f1.startsWith('gallery') && f2.startsWith('gallery')) withinGallery++;
      else if (f1.startsWith('topPlaces') && f2.startsWith('topPlaces')) withinPlaces++;
    });

    intraDestDuplicates.push({
      file,
      slug,
      name,
      totalDuplicates: localDupes.length,
      heroVsGallery,
      heroVsPlace,
      galleryVsPlace,
      withinGallery,
      withinPlaces,
      details: localDupes
    });
  }
});

// Calculate Cross-destination collisions
const crossDestCollisions = [];
for (const [key, occurrences] of crossDestKeyMap.entries()) {
  const distinctFiles = new Set(occurrences.map(o => o.file));
  if (distinctFiles.size > 1) {
    crossDestCollisions.push({
      key,
      distinctDestinationsCount: distinctFiles.size,
      totalOccurrences: occurrences.length,
      destinations: Array.from(distinctFiles).map(f => f.replace('.json', '')),
      sampleUrl: occurrences[0].url,
      occurrences
    });
  }
}
crossDestCollisions.sort((a, b) => b.distinctDestinationsCount - a.distinctDestinationsCount);

// Specific breakdown of cross-destination collisions:
// How many hero images are shared across destinations?
const crossHeroMap = new Map();
destFiles.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const heroUrl = (d.heroImage && (d.heroImage.src || (typeof d.heroImage === 'string' ? d.heroImage : ''))) || d.image || '';
  if (heroUrl) {
    const key = getCleanImageKey(heroUrl);
    if (!crossHeroMap.has(key)) crossHeroMap.set(key, []);
    crossHeroMap.get(key).push(d.slug || file.replace('.json', ''));
  }
});
const sharedHeroImages = [];
for (const [key, slugs] of crossHeroMap.entries()) {
  if (slugs.length > 1) {
    sharedHeroImages.push({ key, count: slugs.length, destinations: slugs });
  }
}
sharedHeroImages.sort((a, b) => b.count - a.count);

// Write comprehensive report to file
const detailedReport = {
  overview: {
    totalDestinations: destFiles.length,
    totalVisualImageSlots: totalImageCount,
    uniqueImageAssets: crossDestKeyMap.size,
    destinationsWithInternalDuplicates: intraDestDuplicates.length,
    crossDestinationCollisionsCount: crossDestCollisions.length,
    crossDestinationHeroCollisionsCount: sharedHeroImages.length,
    pdfImagesFound: pdfImagesList.length
  },
  intraDestinationSummary: {
    heroVsGalleryRepeats: intraDestDuplicates.filter(d => d.heroVsGallery > 0).length,
    heroVsPlaceRepeats: intraDestDuplicates.filter(d => d.heroVsPlace > 0).length,
    galleryVsPlaceRepeats: intraDestDuplicates.filter(d => d.galleryVsPlace > 0).length,
    withinGalleryRepeats: intraDestDuplicates.filter(d => d.withinGallery > 0).length,
    withinPlacesRepeats: intraDestDuplicates.filter(d => d.withinPlaces > 0).length,
  },
  pdfImagesList,
  sharedHeroImages,
  topCrossDestinationCollisions: crossDestCollisions.slice(0, 50),
  sampleIntraDuplicates: intraDestDuplicates.slice(0, 30)
};

fs.writeFileSync(path.join(ROOT, 'reports', 'detailed-image-duplication-analysis.json'), JSON.stringify(detailedReport, null, 2), 'utf8');

console.log('\n======================================================================');
console.log('              DETAILED IMAGE DUPLICATION AUDIT REPORT                 ');
console.log('======================================================================');
console.log(`📊 Destinations Analyzed:                ${detailedReport.overview.totalDestinations.toLocaleString()}`);
console.log(`🖼️  Total Image Slots (Hero/Gallery/Places): ${detailedReport.overview.totalVisualImageSlots.toLocaleString()}`);
console.log(`✨ Unique Image Assets:                  ${detailedReport.overview.uniqueImageAssets.toLocaleString()}`);
console.log('----------------------------------------------------------------------');
console.log(`🚨 1. CROSS-DESTINATION REUSED IMAGES:   ${detailedReport.overview.crossDestinationCollisionsCount} distinct image assets are reused across different destinations`);
console.log(`   - Cross-Destination HERO Collisions:  ${detailedReport.overview.crossDestinationHeroCollisionsCount} (Hero images shared by >1 destination)`);
console.log(`🚨 2. INTRA-DESTINATION DUPLICATES:       ${detailedReport.overview.destinationsWithInternalDuplicates} destinations have repeated images inside the same page`);
console.log(`   - Hero repeated in Gallery:           ${detailedReport.intraDestinationSummary.heroVsGalleryRepeats} destinations`);
console.log(`   - Hero repeated in Top Places:        ${detailedReport.intraDestinationSummary.heroVsPlaceRepeats} destinations`);
console.log(`   - Gallery repeated in Top Places:     ${detailedReport.intraDestinationSummary.galleryVsPlaceRepeats} destinations`);
console.log(`   - Duplicate images within Gallery:    ${detailedReport.intraDestinationSummary.withinGalleryRepeats} destinations`);
console.log(`   - Duplicate images within Places:     ${detailedReport.intraDestinationSummary.withinPlacesRepeats} destinations`);
console.log(`📄 3. PDF Files used as Images:          ${detailedReport.overview.pdfImagesFound} files found`);
console.log('======================================================================\n');
