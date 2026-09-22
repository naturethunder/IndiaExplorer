const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const changedFiles = JSON.parse(fs.readFileSync('scratch_image_changed_files.json', 'utf8'))
  .filter(f => f.endsWith('.json') && !f.endsWith('index.json'))
  .map(f => path.basename(f));

console.log(`Analyzing the 295 destinations updated in the last 3 days...`);

// Load entire catalog to detect collisions with other destinations
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const targetSet = new Set(changedFiles);

function cleanKey(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].trim().toLowerCase();
}

const catalogMap = new Map(); // cleanUrl -> Set of files

for (const f of allFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
    const urls = [];
    if (d.heroImage?.src) urls.push(d.heroImage.src);
    (d.gallery || []).forEach(g => g.src && urls.push(g.src));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) urls.push(p.image.src);
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph.src;
        if (u) urls.push(u);
      });
    });
    const uniqueInFile = new Set(urls.map(cleanKey).filter(Boolean));
    for (const u of uniqueInFile) {
      if (!catalogMap.has(u)) catalogMap.set(u, new Set());
      catalogMap.get(u).add(f);
    }
  } catch(e) {}
}

const BANNED_WORDS = [
  'wikimedia.org', 'wikipedia.org', 'pixabay.com/get/g',
  'picsum.photos', 'via.placeholder', 'dummyimage', 'placeholder',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'selfie', 'portrait', 'close-up of face', 'fashion model',
  'hajdúszoboszló', 'hungary', 'taipei', 'taiwan', 'cappadocia', 'turkey',
  'sri lanka', 'colombo', 'haputale', 'polonnaruwa', 'vietnam', 'thailand'
];

let filesWithDefects = 0;
const defectReport = [];

for (const file of changedFiles) {
  const filePath = path.join(destDir, file);
  if (!fs.existsSync(filePath)) continue;
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const defects = [];
  const localKeys = new Map(); // cleanKey -> [locations]

  function auditPhoto(url, loc, title = '', alt = '') {
    if (!url || typeof url !== 'string' || !url.trim()) {
      defects.push({ loc, type: 'MISSING', url });
      return;
    }
    const ck = cleanKey(url);
    const combined = `${url} ${title} ${alt}`.toLowerCase();

    // 1. Wikimedia check
    if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
      defects.push({ loc, type: 'WIKIMEDIA', url });
    }

    // 2. Banned semantic patterns
    for (const bw of BANNED_WORDS) {
      if (combined.includes(bw)) {
        defects.push({ loc, type: 'BANNED_PATTERN', word: bw, url });
        break;
      }
    }

    // 3. Resolution / size
    if (url.includes('images.pexels.com')) {
      // Pexels: check if w < 1200 or h > w (portrait)
      const wMatch = url.match(/[?&]w=(\d+)/);
      const hMatch = url.match(/[?&]h=(\d+)/);
      if (wMatch && parseInt(wMatch[1]) < 1200) {
        defects.push({ loc, type: 'LOW_RES_PEXELS', w: wMatch[1], url });
      }
      if (wMatch && hMatch && parseInt(hMatch[1]) > parseInt(wMatch[1])) {
        defects.push({ loc, type: 'PORTRAIT_PEXELS', w: wMatch[1], h: hMatch[1], url });
      }
    } else if (url.includes('images.unsplash.com')) {
      const wMatch = url.match(/[?&]w=(\d+)/);
      const hMatch = url.match(/[?&]h=(\d+)/);
      if (wMatch && parseInt(wMatch[1]) < 1200) {
        defects.push({ loc, type: 'LOW_RES_UNSPLASH', w: wMatch[1], url });
      }
      if (wMatch && hMatch && parseInt(hMatch[1]) > parseInt(wMatch[1])) {
        defects.push({ loc, type: 'PORTRAIT_UNSPLASH', w: wMatch[1], h: hMatch[1], url });
      }
    }

    // 4. Duplicate within file (exclude hero === gallery[0])
    if (loc !== 'heroImage') {
      if (!localKeys.has(ck)) localKeys.set(ck, []);
      localKeys.get(ck).push(loc);
    }

    // 5. Cross-destination collision
    const usedIn = catalogMap.get(ck);
    if (usedIn && usedIn.size > 1) {
      const others = Array.from(usedIn).filter(x => x !== file);
      if (others.length > 0) {
        defects.push({ loc, type: 'CROSS_COLLISION', count: others.length, sampleOther: others[0], url });
      }
    }
  }

  // Check hero
  auditPhoto(d.heroImage?.src, 'heroImage', d.title || d.name, d.heroImage?.alt);

  // Check gallery
  const gallery = d.gallery || [];
  if (gallery.length !== 5) {
    defects.push({ loc: 'gallery', type: 'GALLERY_COUNT', count: gallery.length });
  }
  // Hero sync
  if (gallery.length > 0 && cleanKey(d.heroImage?.src) !== cleanKey(gallery[0]?.src)) {
    defects.push({ loc: 'heroImage_sync', type: 'HERO_SYNC_MISMATCH' });
  }
  gallery.forEach((g, idx) => {
    auditPhoto(g.src, `gallery[${idx}]`, g.title, g.alt);
  });

  // Check places
  (d.topPlaces || []).forEach((p, pIdx) => {
    const pName = p.name || `Place ${pIdx}`;
    auditPhoto(p.image?.src, `place[${pIdx}].image`, pName, p.image?.alt);
    const photos = p.photos || [];
    if (photos.length !== 3) {
      defects.push({ loc: `place[${pIdx}].photos`, type: 'PLACE_PHOTOS_COUNT', count: photos.length });
    }
    photos.forEach((ph, phIdx) => {
      const u = typeof ph === 'string' ? ph : ph.src;
      const alt = typeof ph === 'object' ? ph.alt : '';
      const title = typeof ph === 'object' ? ph.title : '';
      auditPhoto(u, `place[${pIdx}].photos[${phIdx}]`, title || pName, alt);
    });
  });

  // Collect intra-destination duplicates
  for (const [ck, locs] of localKeys.entries()) {
    if (locs.length > 1) {
      defects.push({ loc: locs.join(', '), type: 'INTERNAL_DUPLICATE', count: locs.length });
    }
  }

  if (defects.length > 0) {
    filesWithDefects++;
    defectReport.push({ file, title: d.title || d.name, state: d.state, defectCount: defects.length, defects });
  }
}

console.log(`\nResults across the 295 destinations:`);
console.log(`Files with Defects: ${filesWithDefects} / ${changedFiles.length}`);

// Group defect types
const defectTypeCounts = {};
for (const r of defectReport) {
  for (const df of r.defects) {
    defectTypeCounts[df.type] = (defectTypeCounts[df.type] || 0) + 1;
  }
}
console.log('Defects breakdown:', defectTypeCounts);

fs.writeFileSync('scratch_295_defects.json', JSON.stringify(defectReport, null, 2));
