const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const targetFiles = JSON.parse(fs.readFileSync('scratch_image_changed_files.json', 'utf8'))
  .filter(f => f.endsWith('.json') && !f.endsWith('index.json'))
  .map(f => path.basename(f));

// Build catalog URL index (all 2393 files) to check cross-destination collisions
console.log('Indexing catalog URLs for cross-destination collision detection...');
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const catalogUrlMap = new Map(); // cleanKey -> Set(filenames)

function cleanKey(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].trim().toLowerCase();
}

for (const file of allFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, file), 'utf8'));
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
      if (!catalogUrlMap.has(u)) catalogUrlMap.set(u, new Set());
      catalogUrlMap.get(u).add(file);
    }
  } catch(e) {}
}
console.log(`Indexed ${catalogUrlMap.size} unique URLs across ${allFiles.length} files.`);

// Foreign & negative patterns
const FOREIGN_PATTERNS = [
  'munnar', 'kerala', 'alappuzha', 'idukki', 'wayanad', 'kochi', // if destination is NOT in Kerala!
  'sri lanka', 'colombo', 'haputale', 'polonnaruwa', 'kandy', 'galle', 'sigiriya',
  'turkey', 'türkiye', 'cappadocia', 'istanbul', 'kars', 'rize',
  'taiwan', 'taipei', 'hungary', 'hajdúszoboszló',
  'vietnam', 'thailand', 'bangkok', 'bali', 'indonesia', 'philippines',
  'alps', 'switzerland', 'germany', 'france', 'italy', 'rome', 'spain', 'london', 'uk',
  'united states', 'california', 'minnesota', 'florida', 'texas', 'new york', 'canada',
  'new zealand', 'auckland', 'australia', 'egypt', 'nile', 'peru'
];

const BANNED_SUBJECTS = [
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'woman posing', 'man posing', 'smiling at camera',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'traffic jam', 'tractor', 'bus', 'train', 'car'
];

const fileDefects = {};
let totalDefectiveFiles = 0;
let totalDefectCount = 0;

for (const file of targetFiles) {
  const filePath = path.join(destDir, file);
  if (!fs.existsSync(filePath)) continue;
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const state = (d.state || '').toLowerCase();
  const destTitle = (d.title || d.name || '').toLowerCase();
  
  const defects = [];
  const localKeys = new Map(); // cleanKey -> [slotLabels]

  function auditSlot(url, slotLabel, title = '', alt = '', caption = '') {
    if (!url || typeof url !== 'string' || !url.trim()) {
      defects.push({ slot: slotLabel, reason: 'MISSING_URL', url });
      return;
    }

    const ck = cleanKey(url);
    const combined = `${url} ${title} ${alt} ${caption}`.toLowerCase();

    // 1. Wikimedia rejection
    if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
      defects.push({ slot: slotLabel, reason: 'WIKIMEDIA', url });
      return;
    }

    // 2. Pixabay session URLs or placeholder domains
    if (url.includes('pixabay.com/get/g') || url.includes('picsum.photos') || url.includes('placeholder') || url.includes('dummyimage')) {
      defects.push({ slot: slotLabel, reason: 'INVALID_PROVIDER', url });
      return;
    }

    // 3. Negative subjects (people, power lines, etc.)
    for (const bs of BANNED_SUBJECTS) {
      if (combined.includes(bs)) {
        defects.push({ slot: slotLabel, reason: `BANNED_SUBJECT_${bs.toUpperCase().replace(/\s+/g, '_')}`, url });
        return;
      }
    }

    // 4. Foreign patterns
    for (const fp of FOREIGN_PATTERNS) {
      // If fp is a Kerala place (like 'munnar', 'kerala') but the destination is actually in Kerala, that's allowed!
      if (['munnar', 'kerala', 'alappuzha', 'idukki', 'wayanad', 'kochi'].includes(fp) && state.includes('kerala')) {
        continue;
      }
      if (combined.includes(fp)) {
        defects.push({ slot: slotLabel, reason: `GEOGRAPHIC_MISMATCH_${fp.toUpperCase().replace(/\s+/g, '_')}`, url });
        return;
      }
    }

    // 5. Cross-state major misattributions (e.g. Karnataka / Tamil Nadu / Himachal / Rajasthan)
    if (state.includes('karnataka')) {
      if (combined.includes('himachal') || combined.includes('rajasthan') || combined.includes('kashmir') || combined.includes('tamil nadu') || combined.includes('delhi')) {
        defects.push({ slot: slotLabel, reason: 'STATE_MISMATCH', url });
        return;
      }
    } else if (state.includes('tamil nadu')) {
      if (combined.includes('himachal') || combined.includes('kashmir') || combined.includes('rajasthan') || combined.includes('kerala')) {
        defects.push({ slot: slotLabel, reason: 'STATE_MISMATCH', url });
        return;
      }
    } else if (state.includes('kashmir') || state.includes('jammu')) {
      if (combined.includes('kerala') || combined.includes('tamil nadu') || combined.includes('karnataka') || combined.includes('rajasthan')) {
        defects.push({ slot: slotLabel, reason: 'STATE_MISMATCH', url });
        return;
      }
    }

    // 6. Cross-destination collision
    const usedIn = catalogUrlMap.get(ck);
    if (usedIn && usedIn.size > 1) {
      const others = Array.from(usedIn).filter(x => x !== file);
      if (others.length > 0) {
        defects.push({ slot: slotLabel, reason: 'CROSS_COLLISION', count: others.length, sampleOther: others[0], url });
        return;
      }
    }

    // 7. Track intra-destination duplicates (exclude hero === gallery[0])
    if (slotLabel !== 'heroImage') {
      if (!localKeys.has(ck)) localKeys.set(ck, []);
      localKeys.get(ck).push(slotLabel);
    }
  }

  // Audit Hero
  auditSlot(d.heroImage?.src, 'heroImage', d.title, d.heroImage?.alt, '');

  // Audit Gallery
  const gallery = d.gallery || [];
  gallery.forEach((g, idx) => {
    auditSlot(g.src, `gallery[${idx}]`, g.title, g.alt, g.caption);
  });

  // Audit Places
  (d.topPlaces || []).forEach((p, pIdx) => {
    const pName = p.name || `Place ${pIdx}`;
    auditSlot(p.image?.src, `place[${pIdx}].image`, pName, p.image?.alt, p.image?.caption);
    (p.photos || []).forEach((ph, phIdx) => {
      const u = typeof ph === 'string' ? ph : ph.src;
      const alt = typeof ph === 'object' ? ph.alt : '';
      const title = typeof ph === 'object' ? ph.title : '';
      const caption = typeof ph === 'object' ? ph.caption : '';
      auditSlot(u, `place[${pIdx}].photos[${phIdx}]`, title || pName, alt, caption);
    });
  });

  // Flag duplicate slots inside destination
  for (const [ck, slots] of localKeys.entries()) {
    if (slots.length > 1) {
      // The first slot keeps it; subsequent slots must be resolved
      for (let i = 1; i < slots.length; i++) {
        defects.push({ slot: slots[i], reason: `INTERNAL_DUPLICATE_OF_${slots[0]}`, url: '' });
      }
    }
  }

  if (defects.length > 0) {
    totalDefectiveFiles++;
    totalDefectCount += defects.length;
    fileDefects[file] = {
      title: d.title || d.name,
      state: d.state,
      defects
    };
  }
}

console.log(`\n=== DEEP INSPECTION RESULTS ===`);
console.log(`Total Target Files Inspected: ${targetFiles.length}`);
console.log(`Files with Defects: ${totalDefectiveFiles}`);
console.log(`Total Defective Slots: ${totalDefectCount}`);

fs.writeFileSync('scratch_deep_defects.json', JSON.stringify(fileDefects, null, 2));
