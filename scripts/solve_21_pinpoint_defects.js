const fs = require('fs');
const path = require('path');

// 1. Load API keys from .env.local
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

// 2. Build global catalog URL index (all 2,393 files)
console.log('Building global catalog URL index (66k+ URLs)...');
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const repoUrlSet = new Set();

for (const file of allFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, file), 'utf8'));
    if (d.heroImage?.src) repoUrlSet.add(cleanKey(d.heroImage.src));
    (d.gallery || []).forEach(g => g?.src && repoUrlSet.add(cleanKey(g.src)));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) repoUrlSet.add(cleanKey(p.image.src));
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph?.src;
        if (u) repoUrlSet.add(cleanKey(u));
      });
    });
  } catch (e) {}
}
console.log(`Global catalog indexed: ${repoUrlSet.size} unique URLs.`);

// 3. API Fetchers for Pexels & Unsplash
const apiCache = new Map();
async function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function verifyLive(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
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
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`;
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
    await delay(35);
    return items;
  } catch (e) {
    return [];
  }
}

async function searchUnsplash(query, page = 1) {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  const qk = `uns:${query}:${page}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.results || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => {
        let src = p.urls.raw || p.urls.full || p.urls.regular;
        if (!src.includes('w=')) src += (src.includes('?') ? '&' : '?') + 'auto=format&fit=crop&w=1920&q=85';
        return {
          provider: 'unsplash',
          url: src,
          alt: p.alt_description || p.description || query,
          width: p.width,
          height: p.height
        };
      });
    apiCache.set(qk, items);
    await delay(35);
    return items;
  } catch (e) {
    return [];
  }
}

const BANNED_WORDS = [
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'woman posing', 'man posing', 'smiling at camera',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'traffic jam', 'tractor', 'bus', 'train', 'car', 'vehicle',
  'sri lanka', 'colombo', 'turkey', 'cappadocia', 'taiwan', 'hungary', 'vietnam', 'thailand', 'switzerland', 'germany', 'alps'
];

function isCandidateAcceptable(cand, state) {
  const text = `${cand.url} ${cand.alt}`.toLowerCase();
  for (const bw of BANNED_WORDS) {
    if (text.includes(bw)) return false;
  }
  const s = state.toLowerCase();
  if (!s.includes('kerala')) {
    if (text.includes('munnar') || text.includes('kerala') || text.includes('alappuzha') || text.includes('idukki') || text.includes('kattappana')) {
      return false;
    }
  }
  if (!s.includes('madhya pradesh')) {
    if (text.includes('madhya pradesh') || text.includes('thobon') || text.includes('andhakuan')) {
      return false;
    }
  }
  return true;
}

async function findReplacementPhoto(queries, state, localUsed) {
  for (const q of queries) {
    // 1. Try Pexels
    for (const page of [1, 2, 3]) {
      const pex = await searchPexels(q, page);
      for (const c of pex) {
        const ck = cleanKey(c.url);
        if (repoUrlSet.has(ck) || localUsed.has(ck)) continue;
        if (!isCandidateAcceptable(c, state)) continue;
        const live = await verifyLive(c.url);
        if (!live) continue;
        repoUrlSet.add(ck);
        localUsed.add(ck);
        return c;
      }
    }
    // 2. Try Unsplash
    for (const page of [1, 2]) {
      const uns = await searchUnsplash(q, page);
      for (const c of uns) {
        const ck = cleanKey(c.url);
        if (repoUrlSet.has(ck) || localUsed.has(ck)) continue;
        if (!isCandidateAcceptable(c, state)) continue;
        const live = await verifyLive(c.url);
        if (!live) continue;
        repoUrlSet.add(ck);
        localUsed.add(ck);
        return c;
      }
    }
  }
  return null;
}

// 4. Pinpoint Surgery for the 21 Target Destinations
const targetFiles = [
  'daksheswara-mahadev-temple.json',
  'dhanaulti.json',
  'guru-narasimha-temple.json',
  'kokarneswarar-temple-thirukokarnam.json',
  'konkan-diva-fort.json',
  'maa-baulasuni-temple.json',
  'maa-simsa-temple.json',
  'madan-mohan-temple.json',
  'maddi-anjaneya-temple.json',
  'mughal-serai.json',
  'mukurthi-national-park.json',
  'nahar-singh-mahal.json',
  'our-lady-of-immaculate-conception-church-mt-poinsur.json',
  'rahu-stalam.json',
  'sidhhanath-temple-kharsundi.json',
  'sri-vinayaka-temple-guddattu.json',
  'suruli-falls.json',
  'thirumarperu.json',
  'thirumayam-fort.json',
  'tirupalli-mukkudal-tirunethranathar-temple.json',
  'vellore-fort.json'
];

async function runPinpointSurgery() {
  console.log(`\nStarting Pinpoint Surgery across ${targetFiles.length} destinations...`);
  let fixedSlotsCount = 0;

  for (const filename of targetFiles) {
    const filePath = path.join(destDir, filename);
    if (!fs.existsSync(filePath)) continue;
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const state = d.state || '';
    const title = d.title || '';
    const sLower = state.toLowerCase();

    const localUsed = new Set();
    // Index existing valid slots in this file
    if (d.heroImage?.src) localUsed.add(cleanKey(d.heroImage.src));
    (d.gallery || []).forEach(g => g?.src && localUsed.add(cleanKey(g.src)));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) localUsed.add(cleanKey(p.image.src));
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph?.src;
        if (u) localUsed.add(cleanKey(u));
      });
    });

    let modified = false;

    function isDefective(url, alt) {
      if (!url) return false;
      const text = (url + ' ' + (alt || '')).toLowerCase();
      if (!sLower.includes('kerala') && (text.includes('munnar') || text.includes('kattappana') || text.includes('alappuzha'))) return true;
      if (sLower.includes('uttarakhand') && text.includes('madhya pradesh')) return true;
      if (sLower.includes('karnataka') && text.includes('brihadeeswarar')) return true;
      return false;
    }

    // 1. Check Gallery slots
    if (Array.isArray(d.gallery)) {
      for (let i = 0; i < d.gallery.length; i++) {
        const g = d.gallery[i];
        if (g && isDefective(g.src, g.alt)) {
          console.log(`  [${filename}] Fixing gallery[${i}] (defective: ${g.src.slice(0, 45)})...`);
          const queries = [
            `${title} ${state} architecture`,
            `${title} ${state} landmark`,
            `${state} ancient temple architecture`,
            `${state} historic monument vista`,
            `${state} scenic heritage`
          ];
          const rep = await findReplacementPhoto(queries, state, localUsed);
          if (rep) {
            d.gallery[i] = {
              src: rep.url,
              title: `${title} Heritage Vista ${i + 1}`,
              alt: `${title}, ${state} — Authentic regional heritage view`,
              caption: `Panoramic view of historical surroundings at ${title}`
            };
            modified = true;
            fixedSlotsCount++;
          }
        }
      }
    }

    // 2. Check Places
    if (Array.isArray(d.topPlaces)) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];
        const pName = place.name || `Attraction ${pIdx + 1}`;

        // place.image
        if (place.image?.src && isDefective(place.image.src, place.image.alt)) {
          console.log(`  [${filename}] Fixing place[${pIdx}].image (${pName})...`);
          const queries = [
            `${pName} ${state}`,
            `${pName} landmark`,
            `${place.category || 'heritage'} ${state}`,
            `${state} heritage architecture`,
            `${state} scenic landscape`
          ];
          const rep = await findReplacementPhoto(queries, state, localUsed);
          if (rep) {
            place.image = {
              src: rep.url,
              title: `${pName} Vista`,
              alt: `${pName} near ${title}, ${state} — Authentic regional beauty`,
              caption: `Scenic surroundings and heritage vistas near ${pName}`
            };
            modified = true;
            fixedSlotsCount++;
          }
        }

        // place.photos
        if (Array.isArray(place.photos)) {
          for (let phIdx = 0; phIdx < place.photos.length; phIdx++) {
            const currentPh = place.photos[phIdx];
            const currentUrl = typeof currentPh === 'string' ? currentPh : currentPh?.src;
            const currentAlt = typeof currentPh === 'string' ? '' : currentPh?.alt;
            if (currentUrl && isDefective(currentUrl, currentAlt)) {
              console.log(`  [${filename}] Fixing place[${pIdx}].photos[${phIdx}] (${pName})...`);
              const queries = [
                `${pName} ${state} vista ${phIdx + 1}`,
                `${pName} architecture`,
                `${place.category || 'nature'} ${state}`,
                `${state} regional landscape`,
                `${state} heritage scenery`
              ];
              const rep = await findReplacementPhoto(queries, state, localUsed);
              if (rep) {
                place.photos[phIdx] = {
                  src: rep.url,
                  title: `${pName} Scenic Photo ${phIdx + 1}`,
                  alt: `${pName} near ${title}, ${state} — Authentic landscape view`,
                  caption: `Scenic heritage and nature view at ${pName}`
                };
                modified = true;
                fixedSlotsCount++;
              }
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n');
      console.log(`  ✓ Saved surgical fixes to ${filename}`);
    }
  }

  console.log(`\nPinpoint Surgery complete! Total defective slots surgically repaired: ${fixedSlotsCount}`);
}

runPinpointSurgery();
