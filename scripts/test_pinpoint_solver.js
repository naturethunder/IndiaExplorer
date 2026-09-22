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

// 2. Build global catalog index
console.log('Indexing catalog URLs...');
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

// 3. API Query Helpers
const apiCache = new Map();

async function searchPexels(query) {
  const qk = `pex:${query}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.photos || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => {
        let src = p.src.large2x || p.src.original;
        // Enforce w=1920
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
    return items;
  } catch (e) {
    return [];
  }
}

async function searchUnsplash(query) {
  const qk = `uns:${query}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.results || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => ({
        provider: 'unsplash',
        url: `${p.urls.raw}&auto=format&fit=crop&w=1920&q=85`,
        alt: p.description || p.alt_description || query,
        width: p.width,
        height: p.height
      }));
    apiCache.set(qk, items);
    return items;
  } catch (e) {
    return [];
  }
}

async function verifyLive(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
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

const BANNED_WORDS = [
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'woman posing', 'man posing', 'smiling at camera',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'traffic jam', 'tractor', 'bus', 'train', 'car',
  'sri lanka', 'colombo', 'turkey', 'cappadocia', 'taiwan', 'hungary', 'vietnam', 'thailand', 'switzerland', 'germany'
];

function isCandidateAcceptable(cand, state) {
  const text = `${cand.url} ${cand.alt}`.toLowerCase();
  for (const bw of BANNED_WORDS) {
    if (text.includes(bw)) return false;
  }
  // If destination is NOT Kerala, reject Kerala terms
  if (!state.toLowerCase().includes('kerala')) {
    if (text.includes('munnar') || text.includes('kerala') || text.includes('alappuzha') || text.includes('idukki')) {
      return false;
    }
  }
  return true;
}

async function findReplacementPhoto(queries, state, localUsed) {
  for (const q of queries) {
    const pex = await searchPexels(q);
    const uns = await searchUnsplash(q);
    const combined = [...pex, ...uns];
    for (const c of combined) {
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
  return null;
}

// Test on targets
async function repairDestination(filename) {
  const filePath = path.join(destDir, filename);
  console.log(`\n--- Repairing ${filename} ---`);
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const state = d.state || '';
  const title = d.title || d.name || '';
  
  // Collect all existing valid URLs in this file so we do not duplicate them
  const localUsed = new Set();
  
  // Read deep defects for this file
  const deepDefects = JSON.parse(fs.readFileSync('scratch_deep_defects.json', 'utf8'));
  const fileInfo = deepDefects[filename];
  if (!fileInfo || fileInfo.defects.length === 0) {
    console.log('No defects found for', filename);
    return;
  }

  const defectiveSlots = new Map();
  fileInfo.defects.forEach(df => {
    defectiveSlots.set(df.slot, df.reason);
  });
  console.log(`Defective slots (${defectiveSlots.size}):`, Array.from(defectiveSlots.entries()));

  // Add all non-defective URLs to localUsed
  if (d.heroImage?.src && !defectiveSlots.has('heroImage')) {
    localUsed.add(cleanKey(d.heroImage.src));
  }
  (d.gallery || []).forEach((g, idx) => {
    if (g.src && !defectiveSlots.has(`gallery[${idx}]`)) {
      localUsed.add(cleanKey(g.src));
    }
  });
  (d.topPlaces || []).forEach((p, pIdx) => {
    if (p.image?.src && !defectiveSlots.has(`place[${pIdx}].image`)) {
      localUsed.add(cleanKey(p.image.src));
    }
    (p.photos || []).forEach((ph, phIdx) => {
      const u = typeof ph === 'string' ? ph : ph.src;
      if (u && !defectiveSlots.has(`place[${pIdx}].photos[${phIdx}]`)) {
        localUsed.add(cleanKey(u));
      }
    });
  });

  // 1. Fix gallery[0] and heroImage if defective
  if (defectiveSlots.has('gallery[0]') || defectiveSlots.has('heroImage')) {
    console.log('Resolving heroImage & gallery[0]...');
    const queries = [
      `${title} ${state} landscape`,
      `${title} landmark heritage`,
      `${state} scenic landscape vista`,
      `${state} landmark architecture`
    ];
    const rep = await findReplacementPhoto(queries, state, localUsed);
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
      console.log('Hero & gallery[0] replaced with:', rep.url);
    }
  }

  // 2. Fix gallery[1..4]
  for (let i = 1; i < 5; i++) {
    const slotKey = `gallery[${i}]`;
    if (defectiveSlots.has(slotKey) || !d.gallery[i]) {
      console.log(`Resolving ${slotKey}...`);
      const queries = [
        `${title} ${state} architecture`,
        `${title} scenic vista`,
        `${state} nature landscape`,
        `${state} heritage landmark`
      ];
      const rep = await findReplacementPhoto(queries, state, localUsed);
      if (rep) {
        d.gallery[i] = {
          src: rep.url,
          title: `${title} Heritage Vista ${i + 1}`,
          alt: `${title}, ${state} — Scenic landscape and authentic regional beauty`,
          caption: `Panoramic view of scenic surroundings at ${title}`
        };
        console.log(`${slotKey} replaced with:`, rep.url);
      }
    }
  }

  // Ensure hero sync
  if (d.gallery?.[0]?.src && d.heroImage?.src) {
    d.heroImage.src = d.gallery[0].src;
    d.heroImage.alt = d.gallery[0].alt;
  }

  // 3. Fix TopPlaces
  for (let pIdx = 0; pIdx < (d.topPlaces || []).length; pIdx++) {
    const place = d.topPlaces[pIdx];
    const pName = place.name || `Attraction ${pIdx + 1}`;
    const imgSlot = `place[${pIdx}].image`;
    
    // Fix place.image
    if (defectiveSlots.has(imgSlot)) {
      console.log(`Resolving ${imgSlot} (${pName})...`);
      const queries = [
        `${pName} ${state}`,
        `${pName} landmark`,
        `${place.category || 'nature'} ${state}`,
        `${state} landscape attraction`
      ];
      const rep = await findReplacementPhoto(queries, state, localUsed);
      if (rep) {
        place.image = {
          src: rep.url,
          title: `${pName} Vista`,
          alt: `${pName} near ${title}, ${state} — Scenic landscape and regional beauty`,
          caption: `Scenic surroundings and heritage vistas near ${pName}`
        };
        console.log(`${imgSlot} replaced with:`, rep.url);
      }
    }

    // Fix place.photos[0..2]
    if (!place.photos) place.photos = [];
    for (let phIdx = 0; phIdx < 3; phIdx++) {
      const phSlot = `place[${pIdx}].photos[${phIdx}]`;
      const currentUrl = typeof place.photos[phIdx] === 'string' ? place.photos[phIdx] : place.photos[phIdx]?.src;
      // If defective or missing or duplicate of place.image
      const isDupOfImg = cleanKey(currentUrl) === cleanKey(place.image?.src);
      if (defectiveSlots.has(phSlot) || isDupOfImg || !currentUrl) {
        console.log(`Resolving ${phSlot} (${pName} photo ${phIdx + 1})...`);
        const queries = [
          `${pName} ${state} vista`,
          `${pName} scenery`,
          `${place.category || 'heritage'} ${state}`,
          `${state} travel scenery`
        ];
        const rep = await findReplacementPhoto(queries, state, localUsed);
        if (rep) {
          place.photos[phIdx] = {
            src: rep.url,
            title: `${pName} Scenic Photo ${phIdx + 1}`,
            alt: `${pName} near ${title}, ${state} — Authentic landscape view`,
            caption: `Scenic heritage and nature view at ${pName}`
          };
          console.log(`${phSlot} replaced with:`, rep.url);
        }
      }
    }
  }

  // Save back to disk
  fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
  console.log(`Successfully updated ${filename}`);
}

async function run() {
  await repairDestination('alleppey.json');
  await repairDestination('lansdowne.json');
  await repairDestination('chikmagalur.json');
}

run();
