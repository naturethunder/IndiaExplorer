const fs = require('fs');
const path = require('path');

const indexData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/destinations/index.json'), 'utf8'));
const destList = Array.isArray(indexData) ? indexData : (indexData.destinations || []);
const biharItems = destList.filter(d => (d.state && d.state.toLowerCase() === 'bihar') || (d.region && d.region.toLowerCase() === 'bihar'));

console.log(`\n======================================================`);
console.log(`AUDITING ALL ${biharItems.length} BIHAR DESTINATIONS & PLACES`);
console.log(`======================================================\n`);

// 1. Gather all non-Bihar URLs
const nonBiharUrls = new Map(); // url -> filename
const destDir = path.join(__dirname, '../data/destinations');
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const biharSlugs = new Set(biharItems.map(b => b.slug));

for (const file of allFiles) {
  const slug = file.replace('.json', '');
  if (!biharSlugs.has(slug)) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(destDir, file), 'utf8'));
      const extractUrls = (obj) => {
        if (!obj) return;
        if (typeof obj === 'string' && (obj.startsWith('http://') || obj.startsWith('https://'))) {
          nonBiharUrls.set(obj, file);
        } else if (Array.isArray(obj)) {
          obj.forEach(extractUrls);
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(extractUrls);
        }
      };
      extractUrls(data);
    } catch (e) {}
  }
}
console.log(`Loaded ${nonBiharUrls.size} unique URLs from non-Bihar repository files.\n`);

const biharUrls = new Map(); // url -> slug
let totalErrors = 0;
let totalPassed = 0;

for (let i = 0; i < biharItems.length; i++) {
  const item = biharItems[i];
  const file = path.join(destDir, `${item.slug}.json`);
  const prefix = `[${i + 1}/${biharItems.length}] ${item.title || item.name} (${item.slug})`;
  
  if (!fs.existsSync(file)) {
    console.error(`❌ ${prefix}: File not found!`);
    totalErrors++;
    continue;
  }
  
  const dest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fileErrors = [];
  
  // Hero check
  if (!dest.heroImage || !dest.heroImage.src) {
    fileErrors.push('Missing heroImage.src');
  }
  
  // Gallery check
  if (!Array.isArray(dest.gallery) || dest.gallery.length !== 5) {
    fileErrors.push(`Gallery length is ${dest.gallery ? dest.gallery.length : 0}, expected 5`);
  } else {
    if (dest.heroImage && dest.heroImage.src !== dest.gallery[0].src) {
      fileErrors.push('heroImage.src does not match gallery[0].src');
    }
  }
  
  // Top Places check
  const places = dest.topPlaces || dest.places;
  if (!Array.isArray(places) || places.length !== 8) {
    fileErrors.push(`topPlaces count is ${places ? places.length : 0}, expected 8`);
  } else {
    places.forEach((p, pIdx) => {
      if (!p.image || !p.image.src) {
        fileErrors.push(`Place ${pIdx + 1} (${p.name || p.title}) missing card image`);
      }
      if (!Array.isArray(p.photos) || p.photos.length !== 3) {
        fileErrors.push(`Place ${pIdx + 1} (${p.name || p.title}) has ${p.photos ? p.photos.length : 0} photos, expected 3`);
      }
    });
  }
  
  // URL uniqueness checks
  const localUrls = [];
  if (dest.gallery) {
    dest.gallery.forEach(g => g && g.src && localUrls.push(g.src));
  }
  if (places && Array.isArray(places)) {
    places.forEach(p => {
      if (p.image && p.image.src) localUrls.push(p.image.src);
      if (Array.isArray(p.photos)) {
        p.photos.forEach(ph => {
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u) localUrls.push(u);
        });
      }
    });
  }
  
  if (localUrls.length !== 37) {
    fileErrors.push(`Total URLs collected: ${localUrls.length}, expected 37`);
  }
  
  // Internal duplicates check
  const localSet = new Set(localUrls);
  if (localSet.size !== localUrls.length) {
    fileErrors.push(`Internal duplicates detected! Unique: ${localSet.size}/${localUrls.length}`);
  }
  
  // Cross-Bihar collisions
  for (const u of localUrls) {
    if (biharUrls.has(u)) {
      fileErrors.push(`Cross-Bihar collision with ${biharUrls.get(u)}: ${u.slice(0, 70)}...`);
    } else {
      biharUrls.set(u, item.slug);
    }
  }
  
  // Cross-repo collisions
  for (const u of localUrls) {
    if (nonBiharUrls.has(u)) {
      fileErrors.push(`Cross-repo collision with ${nonBiharUrls.get(u)}: ${u.slice(0, 70)}...`);
    }
  }
  
  // Index sync check
  const indexHero = typeof item.heroImage === 'object' ? (item.heroImage.src || '') : (item.heroImage || '');
  if (dest.heroImage && indexHero !== dest.heroImage.src) {
    fileErrors.push(`Index heroImage (${indexHero}) out of sync with dest heroImage (${dest.heroImage.src})`);
  }
  
  if (fileErrors.length > 0) {
    console.error(`❌ ${prefix}: ${fileErrors.length} ERRORS:`);
    fileErrors.forEach(err => console.error(`   - ${err}`));
    totalErrors += fileErrors.length;
  } else {
    console.log(`✅ ${prefix}: 100% PASS (37 unique URLs, 0 internal/global duplicates, 8 places)`);
    totalPassed++;
  }
}

console.log(`\n======================================================`);
console.log(`FINAL BIHAR AUDIT SUMMARY`);
console.log(`======================================================`);
console.log(`Total Bihar Destinations: ${biharItems.length}`);
console.log(`Passed Destinations:     ${totalPassed}/${biharItems.length}`);
console.log(`Total Errors:            ${totalErrors}`);
console.log(`Total Disjoint Bihar URLs: ${biharUrls.size} (38 * 37 = 1,406)`);
console.log(`======================================================\n`);
