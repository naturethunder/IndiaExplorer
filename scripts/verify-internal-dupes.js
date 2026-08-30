const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

function extractUrl(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return obj.src || obj.url || obj.image || '';
  }
  return '';
}

const galleryDupesFound = [];
const placeDupesFound = [];
const heroPlaceCollisions = [];
const galleryPlaceCollisions = [];

files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const heroUrl = extractUrl(d.heroImage) || extractUrl(d.image);
  
  // Gallery
  const galleryUrls = [];
  if (Array.isArray(d.gallery)) {
    d.gallery.forEach((g, idx) => {
      const u = extractUrl(g);
      if (u) galleryUrls.push({ idx, url: u });
    });
  }

  // Places
  const placeUrls = [];
  const places = d.topPlaces || d.places || [];
  if (Array.isArray(places)) {
    places.forEach((p, pIdx) => {
      const mainImg = extractUrl(p.image);
      if (mainImg) placeUrls.push({ placeIdx: pIdx, placeName: p.name, type: 'main', url: mainImg });
      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph, phIdx) => {
          const phUrl = extractUrl(ph);
          if (phUrl) placeUrls.push({ placeIdx: pIdx, placeName: p.name, type: `photo[${phIdx}]`, url: phUrl });
        });
      }
    });
  }

  // 1. Check duplicate within gallery
  const seenG = new Map();
  galleryUrls.forEach(g => {
    if (seenG.has(g.url)) {
      galleryDupesFound.push({ file, firstIdx: seenG.get(g.url), dupIdx: g.idx, url: g.url });
    } else {
      seenG.set(g.url, g.idx);
    }
  });

  // 2. Check duplicate within places
  const seenP = new Map();
  placeUrls.forEach(p => {
    if (seenP.has(p.url)) {
      placeDupesFound.push({ file, first: seenP.get(p.url), dup: p, url: p.url });
    } else {
      seenP.set(p.url, p);
    }
  });

  // 3. Hero vs Places
  placeUrls.forEach(p => {
    if (heroUrl && p.url === heroUrl) {
      heroPlaceCollisions.push({ file, place: p, url: heroUrl });
    }
  });

  // 4. Gallery vs Places
  galleryUrls.forEach(g => {
    placeUrls.forEach(p => {
      if (g.url === p.url) {
        galleryPlaceCollisions.push({ file, galleryIdx: g.idx, place: p, url: g.url });
      }
    });
  });
});

console.log('Results:');
console.log('- Duplicate URLs strictly within Gallery:', galleryDupesFound.length, JSON.stringify(galleryDupesFound, null, 2));
console.log('- Duplicate URLs strictly within Places:', placeDupesFound.length, JSON.stringify(placeDupesFound, null, 2));
console.log('- Hero URL repeated in Places:', heroPlaceCollisions.length, JSON.stringify(heroPlaceCollisions, null, 2));
console.log('- Gallery URL repeated in Places:', galleryPlaceCollisions.length, JSON.stringify(galleryPlaceCollisions, null, 2));
