const fs = require('fs');
const path = require('path');

// 1. Load API keys
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');

function cleanKey(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].trim().toLowerCase();
}

// 2. Build catalog index across all 2,393 files
console.log('Building catalog URL index...');
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const usedCatalogUrls = new Set();

for (const file of allFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, file), 'utf8'));
    if (d.heroImage?.src) usedCatalogUrls.add(cleanKey(d.heroImage.src));
    (d.gallery || []).forEach(g => g.src && usedCatalogUrls.add(cleanKey(g.src)));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) usedCatalogUrls.add(cleanKey(p.image.src));
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph.src;
        if (u) usedCatalogUrls.add(cleanKey(u));
      });
    });
  } catch (e) {}
}
console.log(`Indexed ${usedCatalogUrls.size} unique catalog URLs.`);

// 3. API Query Helpers with Multi-page Caching
const apiCache = new Map();

async function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function verifyLive(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': 'bytes=0-1024'
      },
      signal: ctrl.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    return false;
  }
}

async function searchPexels(query, page = 1) {
  if (!env.PEXELS_API_KEY) return [];
  const qk = `pex:${query}:${page}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=25&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.photos || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => {
        let src = p.src.large2x || p.src.original;
        if (src.includes('?')) {
          src = src.replace(/[?&]h=\d+/g, '').replace(/w=\d+/g, 'w=1920').replace(/\?&+/g, '?').replace(/&&+/g, '&');
          if (!src.includes('w=1920')) src += '&w=1920';
        } else {
          src += '?auto=compress&cs=tinysrgb&w=1920';
        }
        return {
          provider: 'pexels',
          url: src,
          alt: p.alt || query,
          width: p.width,
          height: p.height
        };
      });
    apiCache.set(qk, items);
    await delay(30);
    return items;
  } catch (e) {
    return [];
  }
}

const BANNED_WORDS = [
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'woman posing', 'man posing', 'smiling at camera',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'traffic jam', 'tractor', 'bus', 'train', 'car',
  'sri lanka', 'colombo', 'turkey', 'cappadocia', 'taiwan', 'hungary', 'vietnam', 'thailand', 'switzerland', 'germany', 'alps'
];

function isCandidateAcceptable(cand, state) {
  const text = `${cand.url} ${cand.alt}`.toLowerCase();
  for (const bw of BANNED_WORDS) {
    if (text.includes(bw)) return false;
  }
  if (!state.toLowerCase().includes('kerala')) {
    if (text.includes('munnar') || text.includes('kerala') || text.includes('alappuzha') || text.includes('idukki')) {
      return false;
    }
  }
  return true;
}

async function findPexelsHDPhoto(queries, state, localUsed) {
  for (const q of queries) {
    for (const page of [1, 2, 3]) {
      const pex = await searchPexels(q, page);
      for (const c of pex) {
        const ck = cleanKey(c.url);
        if (usedCatalogUrls.has(ck) || localUsed.has(ck)) continue;
        if (!isCandidateAcceptable(c, state)) continue;
        const live = await verifyLive(c.url);
        if (!live) continue;
        usedCatalogUrls.add(ck);
        localUsed.add(ck);
        return c;
      }
    }
  }
  return null;
}

// 4. Check if slot needs replacement
function isSlotDefective(url, reason) {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) return true;
  if (url.includes('staticflickr.com')) return true; // Upgrade Flickr to Pexels HD as requested
  if (url.includes('pixabay.com/get/g') || url.includes('picsum.photos') || url.includes('placeholder')) return true;
  if (reason) return true;
  return false;
}

// 5. Destination Repair Logic
async function repairDestinationFile(filename, defectsList = []) {
  const filePath = path.join(destDir, filename);
  if (!fs.existsSync(filePath)) return false;
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const state = d.state || '';
  const title = d.title || d.name || '';
  
  const localUsed = new Set();
  const defectiveSlots = new Map();
  defectsList.forEach(df => {
    defectiveSlots.set(df.slot, df.reason);
  });

  // Collect valid non-defective URLs
  if (d.heroImage?.src && !isSlotDefective(d.heroImage.src, defectiveSlots.get('heroImage'))) {
    localUsed.add(cleanKey(d.heroImage.src));
  }
  (d.gallery || []).forEach((g, idx) => {
    if (g.src && !isSlotDefective(g.src, defectiveSlots.get(`gallery[${idx}]`))) {
      localUsed.add(cleanKey(g.src));
    }
  });
  (d.topPlaces || []).forEach((p, pIdx) => {
    if (p.image?.src && !isSlotDefective(p.image.src, defectiveSlots.get(`place[${pIdx}].image`))) {
      localUsed.add(cleanKey(p.image.src));
    }
    (p.photos || []).forEach((ph, phIdx) => {
      const u = typeof ph === 'string' ? ph : ph.src;
      if (u && !isSlotDefective(u, defectiveSlots.get(`place[${pIdx}].photos[${phIdx}]`))) {
        localUsed.add(cleanKey(u));
      }
    });
  });

  let fileModified = false;

  // 1. Hero and gallery[0]
  const heroBad = isSlotDefective(d.heroImage?.src, defectiveSlots.get('heroImage'));
  const gal0Bad = isSlotDefective(d.gallery?.[0]?.src, defectiveSlots.get('gallery[0]'));
  if (heroBad || gal0Bad) {
    const queries = [
      `${title} ${state} landscape`,
      `${title} landmark heritage`,
      `${title} nature view`,
      `${state} scenic landscape vista`,
      `${state} landmark architecture`,
      `${state} tourism landscape`
    ];
    const rep = await findPexelsHDPhoto(queries, state, localUsed);
    if (rep) {
      d.heroImage = {
        src: rep.url,
        alt: `${title}, ${state} — Scenic landscape and authentic regional beauty`,
        title: `${title} Scenic Vista`
      };
      if (!d.gallery) d.gallery = [];
      d.gallery[0] = {
        src: rep.url,
        alt: `${title}, ${state} — Scenic landscape and authentic regional beauty`,
        title: `${title} Scenic Vista`,
        caption: `Panoramic landscape view of ${title} in ${state}`
      };
      fileModified = true;
    }
  }

  // 2. gallery[1..4]
  if (!d.gallery) d.gallery = [];
  while (d.gallery.length < 5) {
    d.gallery.push({ src: '', title: '', alt: '' });
  }
  for (let i = 1; i < 5; i++) {
    const slotKey = `gallery[${i}]`;
    const gSrc = d.gallery[i]?.src;
    if (isSlotDefective(gSrc, defectiveSlots.get(slotKey))) {
      const queries = [
        `${title} ${state} architecture vista ${i}`,
        `${title} ${state} monument`,
        `${state} ancient architecture heritage`,
        `${state} nature scenic vista`,
        `${state} travel landmark`,
        `${state} historic temples`
      ];
      const rep = await findPexelsHDPhoto(queries, state, localUsed);
      if (rep) {
        d.gallery[i] = {
          src: rep.url,
          title: `${title} Heritage Vista ${i + 1}`,
          alt: `${title}, ${state} — Scenic landscape and authentic regional beauty`,
          caption: `Panoramic view of scenic surroundings at ${title}`
        };
        fileModified = true;
      }
    }
  }

  // Ensure hero sync
  if (d.gallery?.[0]?.src && d.heroImage?.src) {
    d.heroImage.src = d.gallery[0].src;
    d.heroImage.alt = d.gallery[0].alt;
  }

  // 3. TopPlaces
  for (let pIdx = 0; pIdx < (d.topPlaces || []).length; pIdx++) {
    const place = d.topPlaces[pIdx];
    const pName = place.name || `Attraction ${pIdx + 1}`;
    const imgSlot = `place[${pIdx}].image`;
    const imgSrc = place.image?.src;
    
    // place.image
    if (isSlotDefective(imgSrc, defectiveSlots.get(imgSlot))) {
      const queries = [
        `${pName} ${state}`,
        `${pName} landmark`,
        `${place.category || 'heritage'} ${state}`,
        `${state} landscape attraction`,
        `${state} scenic travel`
      ];
      const rep = await findPexelsHDPhoto(queries, state, localUsed);
      if (rep) {
        place.image = {
          src: rep.url,
          title: `${pName} Vista`,
          alt: `${pName} near ${title}, ${state} — Scenic landscape and regional beauty`,
          caption: `Scenic surroundings and heritage vistas near ${pName}`
        };
        fileModified = true;
      }
    }

    // place.photos[0..2]
    if (!place.photos) place.photos = [];
    while (place.photos.length < 3) {
      place.photos.push('');
    }
    for (let phIdx = 0; phIdx < 3; phIdx++) {
      const phSlot = `place[${pIdx}].photos[${phIdx}]`;
      const currentUrl = typeof place.photos[phIdx] === 'string' ? place.photos[phIdx] : place.photos[phIdx]?.src;
      const isDupOfImg = cleanKey(currentUrl) === cleanKey(place.image?.src);
      if (isSlotDefective(currentUrl, defectiveSlots.get(phSlot)) || isDupOfImg) {
        const queries = [
          `${pName} ${state} vista ${phIdx + 1}`,
          `${pName} scenery`,
          `${place.category || 'nature'} ${state}`,
          `${state} heritage scenery`,
          `${state} travel scenery`
        ];
        const rep = await findPexelsHDPhoto(queries, state, localUsed);
        if (rep) {
          place.photos[phIdx] = {
            src: rep.url,
            title: `${pName} Scenic Photo ${phIdx + 1}`,
            alt: `${pName} near ${title}, ${state} — Authentic landscape view`,
            caption: `Scenic heritage and nature view at ${pName}`
          };
          fileModified = true;
        }
      }
    }
  }

  if (fileModified) {
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
    return true;
  }
  return false;
}

// 6. Parallel Multi-Agent Worker Queue
async function runParallelWorkers(targetList, concurrency = 4) {
  console.log(`\n=== Running ${concurrency} Parallel Pexels HD Agents across ${targetList.length} destinations ===`);
  const deepDefects = JSON.parse(fs.readFileSync('scratch_deep_defects.json', 'utf8'));
  
  let currentIndex = 0;
  let successCount = 0;

  async function worker(workerId) {
    while (currentIndex < targetList.length) {
      const idx = currentIndex++;
      const filename = targetList[idx];
      const fileDef = deepDefects[filename] || { defects: [] };
      
      console.log(`[Agent ${workerId}] [${idx + 1}/${targetList.length}] Repairing ${filename}...`);
      try {
        const ok = await repairDestinationFile(filename, fileDef.defects);
        if (ok) successCount++;
        console.log(`[Agent ${workerId}] Finished ${filename}: ${ok ? 'UPDATED (100% Pexels HD)' : 'KEPT'}`);
      } catch (err) {
        console.error(`[Agent ${workerId}] Error repairing ${filename}: ${err.message}`);
      }
    }
  }

  const workers = [];
  for (let w = 1; w <= concurrency; w++) {
    workers.push(worker(w));
  }
  await Promise.all(workers);
  console.log(`\n=== Parallel Multi-Agent Run Complete! Successfully repaired ${successCount} files with Pexels True HD ===`);
}

module.exports = { runParallelWorkers, repairDestinationFile };

if (require.main === module) {
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0]) : 40;
  const concurrency = args[1] ? parseInt(args[1]) : 4;
  
  // Find all destinations in the 295 list that still have wikimedia, flickr, or defects
  const targets295 = JSON.parse(fs.readFileSync('scratch_image_changed_files.json', 'utf8'))
    .filter(f => f.endsWith('.json') && !f.endsWith('index.json'))
    .map(f => path.basename(f));
    
  const needsFix = [];
  for (const f of targets295) {
    const fp = path.join(destDir, f);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, 'utf8');
    if (txt.includes('wikimedia.org') || txt.includes('staticflickr.com') || txt.includes('wikipedia.org')) {
      needsFix.push(f);
    }
  }
  
  console.log(`Total destinations in 295 set with Wikimedia/Flickr needing 100% Pexels HD upgrade: ${needsFix.length}`);
  const batch = needsFix.slice(0, count);
  runParallelWorkers(batch, concurrency);
}
