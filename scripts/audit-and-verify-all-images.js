const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');

const targetSlugs = [
  'bangaram-island', 'agatti-island', 'havelock-island', 'dawki', 'gurudongmar-lake', 'hanle', 'chopta',
  'gandikota', 'dhanushkodi', 'mawlynnong', 'lonar-crater', 'daringbadi', 'chembra-peak', 'gurez-valley',
  'unakoti', 'sandakphu', 'chitrakote-falls', 'shekhawati', 'dholavira', 'zanskar-valley', 'polo-forest',
  'tranquebar', 'jibhi', 'bhedaghat', 'valparai', 'tamhini-ghat', 'loktak-lake', 'dhanaulti', 'mandu'
];

console.log(`Starting deep visual image audit for ${targetSlugs.length} destinations...`);

const report = [];

targetSlugs.forEach(slug => {
  const file = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return;

  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const destInfo = {
    slug,
    title: d.title,
    state: d.state,
    mainImage: d.image ? d.image.src : null,
    heroImage: d.heroImage ? d.heroImage.src : null,
    galleryCount: d.gallery ? d.gallery.length : 0,
    placesCount: d.topPlaces ? d.topPlaces.length : 0,
    hotelsCount: d.hotels ? d.hotels.length : 0,
    placesWithImages: [],
    hotelsWithImages: []
  };

  if (d.topPlaces) {
    d.topPlaces.forEach((p, idx) => {
      destInfo.placesWithImages.push({
        num: idx + 1,
        name: p.name,
        category: p.category,
        imageSrc: p.image ? p.image.src : (p.photos && p.photos[0] ? p.photos[0] : null)
      });
    });
  }

  if (d.hotels) {
    d.hotels.forEach((h, idx) => {
      destInfo.hotelsWithImages.push({
        num: idx + 1,
        name: h.name,
        type: h.type,
        imageSrc: h.image ? h.image.src : null
      });
    });
  }

  report.push(destInfo);
});

console.log(`\n================ AUDIT SUMMARY REPORT ================`);
let totalPlacesChecked = 0;
let totalHotelsChecked = 0;

report.forEach(r => {
  console.log(`\n📍 [${r.title} - ${r.state}] (slug: ${r.slug})`);
  console.log(`  • Main Image: ${r.mainImage}`);
  console.log(`  • Hero Image: ${r.heroImage}`);
  console.log(`  • Gallery Photos: ${r.galleryCount}`);
  console.log(`  • Nearby Places (${r.placesCount}):`);
  r.placesWithImages.forEach(p => {
    totalPlacesChecked++;
    console.log(`      ${p.num}. ${p.name} [${p.category}] -> ${p.imageSrc}`);
  });
  console.log(`  • Hotels / Stays (${r.hotelsCount}):`);
  r.hotelsWithImages.forEach(h => {
    totalHotelsChecked++;
    console.log(`      ${h.num}. ${h.name} [${h.type}] -> ${h.imageSrc}`);
  });
});

console.log(`\n======================================================`);
console.log(`TOTAL DESTINATIONS AUDITED: ${report.length}`);
console.log(`TOTAL NEARBY PLACES CHECKED: ${totalPlacesChecked}`);
console.log(`TOTAL HOTELS / STAYS CHECKED: ${totalHotelsChecked}`);
console.log(`======================================================`);
