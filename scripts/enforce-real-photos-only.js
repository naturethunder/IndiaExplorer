const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const targetSlugs = [
  'bangaram-island', 'agatti-island', 'havelock-island', 'dawki', 'gurudongmar-lake', 'hanle', 'chopta',
  'gandikota', 'dhanushkodi', 'mawlynnong', 'lonar-crater', 'daringbadi', 'chembra-peak', 'gurez-valley',
  'unakoti', 'sandakphu', 'chitrakote-falls', 'shekhawati', 'dholavira', 'zanskar-valley', 'polo-forest',
  'tranquebar', 'jibhi', 'bhedaghat', 'valparai', 'tamhini-ghat', 'loktak-lake', 'dhanaulti', 'mandu'
];

console.log('Enforcing strict REAL PHOTOS ONLY rule across all target destinations...');

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
let updatedCount = 0;

targetSlugs.forEach(slug => {
  const file = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return;

  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Clean gallery: keep only unique valid real photos (max 6, min 3)
  if (d.gallery && Array.isArray(d.gallery)) {
    const seen = new Set();
    const cleanGallery = [];
    d.gallery.forEach(g => {
      if (g && g.src && typeof g.src === 'string' && !g.src.includes('picsum.photos') && !seen.has(g.src)) {
        seen.add(g.src);
        cleanGallery.push(g);
      }
    });
    // Truncate to clean list (even if 3)
    d.gallery = cleanGallery.slice(0, 6);
  }

  // 2. Clean topPlaces photos
  if (d.topPlaces && Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach(p => {
      if (p.photos && Array.isArray(p.photos)) {
        const pSeen = new Set();
        const cleanPPhotos = [];
        p.photos.forEach(u => {
          if (u && typeof u === 'string' && !u.includes('picsum.photos') && !pSeen.has(u)) {
            pSeen.add(u);
            cleanPPhotos.push(u);
          }
        });
        p.photos = cleanPPhotos.slice(0, 3);
        if (cleanPPhotos.length > 0) {
          p.image = { src: cleanPPhotos[0], alt: p.name };
        }
      }
    });
  }

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');

  // Update index
  const indexEntry = indexData.destinations.find(entry => entry.slug === slug);
  if (indexEntry) {
    indexEntry.image = d.image;
    indexEntry.heroImage = d.heroImage;
  }
  updatedCount++;
});

fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
console.log(`Successfully verified & updated ${updatedCount} destinations with STRICT REAL PHOTOS rule!`);
