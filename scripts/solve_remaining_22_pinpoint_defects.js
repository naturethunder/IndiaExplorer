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
    const timer = setTimeout(() => ctrl.abort(), 4000);
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
    await delay(50);
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
    await delay(50);
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
    if (text.includes('munnar') || text.includes('kerala') || text.includes('alappuzha') || text.includes('idukki') || text.includes('kattappana') || text.includes('ponnani') || text.includes('houseboat')) {
      return false;
    }
  }
  if (!s.includes('ladakh') && !s.includes('jammu')) {
    if (text.includes('ladakh') || text.includes('leh') || text.includes('pangong') || text.includes('zanskar') || text.includes('nubra')) {
      return false;
    }
  }
  if (!s.includes('madhya pradesh')) {
    if (text.includes('madhya pradesh') || text.includes('khajuraho') || text.includes('thobon') || text.includes('andhakuan')) {
      return false;
    }
  }
  return true;
}

async function findReplacementPhoto(queries, state, localUsed) {
  for (const q of queries) {
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

const remaining22Files = [
  'guru-narasimha-temple.json',
  'manibandh-shaktipeeth.json',
  'mukurthi-national-park.json',
  'nahar-singh-mahal.json',
  'neelakanteshwara-temple.json',
  'neelamperoor-palli-bhagavathi-temple.json',
  'ootukulangara-bhagavathy-temple-peruvemba.json',
  'our-lady-of-immaculate-conception-church-mt-poinsur.json',
  'pant-wildlife-sanctuary.json',
  'pariyur-kondathu-kaliamman.json',
  'pasupateeswarar-temple-karur.json',
  'rajagopalaswamy-temple-mannargudi.json',
  'siddhivinayak-temple-mumbai.json',
  'thirparappu-waterfalls.json',
  'thirumarperu.json',
  'thirumayam-fort.json',
  'thirunadhikkara-cave-temple.json',
  'tirumalai-tamil-nadu.json',
  'tirupalli-mukkudal-tirunethranathar-temple.json',
  'vardhangad-fort.json',
  'wagheshwari-temple.json',
  'yeshwantgad.json'
];

async function solveAll() {
  console.log(`Starting pinpoint surgery on remaining ${remaining22Files.length} files...`);
  let fixedCount = 0;

  for (const filename of remaining22Files) {
    const filePath = path.join(destDir, filename);
    if (!fs.existsSync(filePath)) continue;
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const state = d.state || '';
    const title = d.title || d.name || '';
    const sLower = state.toLowerCase();
    const dLower = (d.name || '').toLowerCase();

    const seenInFile = new Map();
    const heroKey = cleanKey(d.heroImage?.src);
    
    // Count occurrences of URLs to detect internal duplicates
    const allUrls = [];
    if (d.heroImage?.src) allUrls.push({ type: 'hero', get: () => d.heroImage.src, set: u => { d.heroImage.src = u; } });
    (d.gallery || []).forEach((g, i) => g?.src && allUrls.push({ type: 'gallery', idx: i, get: () => g.src, set: u => { g.src = u; } }));
    (d.topPlaces || []).forEach((p, pIdx) => {
      if (p.image?.src) allUrls.push({ type: 'placeCover', pIdx, placeName: p.name, get: () => p.image.src, set: u => { p.image.src = u; } });
      (p.photos || []).forEach((ph, phIdx) => {
        const u = typeof ph === 'string' ? ph : ph?.src;
        if (u) allUrls.push({
          type: 'placePhoto',
          pIdx,
          phIdx,
          placeName: p.name,
          get: () => typeof p.photos[phIdx] === 'string' ? p.photos[phIdx] : p.photos[phIdx].src,
          set: nu => {
            if (typeof p.photos[phIdx] === 'string') p.photos[phIdx] = nu;
            else p.photos[phIdx].src = nu;
          }
        });
      });
    });

    const urlCounts = new Map();
    allUrls.forEach(item => {
      const k = cleanKey(item.get());
      urlCounts.set(k, (urlCounts.get(k) || 0) + 1);
    });

    function isSlotDefective(item) {
      const u = item.get().toLowerCase();
      const k = cleanKey(u);
      
      // Duplication check (hero === gallery[0] is allowed)
      if (item.type === 'hero' || (item.type === 'gallery' && item.idx === 0)) {
        if (urlCounts.get(k) > 2) return true;
      } else {
        if (urlCounts.get(k) > 1) return true;
      }

      // Out-of-state leak checks
      if (!sLower.includes('kerala') && !dLower.includes('kerala')) {
        if (u.includes('ponnani') || u.includes('flora_of_kerala') || u.includes('anandashram') ||
            u.includes('karimeen-kerala') || u.includes('bakel_fort') || u.includes('bekal_fort') ||
            u.includes('silent_valley') || u.includes('eravikulam') || u.includes('houseboat_on_punnamada') ||
            u.includes('ashtamudi') || u.includes('padmanabha_swamy') || u.includes('kerala_water_falls') ||
            u.includes('cochin_ginger') || u.includes('alleppey') || u.includes('alappuzha') || u.includes('kumarakom')) {
          return true;
        }
      }
      if (!sLower.includes('ladakh') && !sLower.includes('jammu') && !dLower.includes('ladakh') && !dLower.includes('leh')) {
        if (u.includes('leh-ladakh') || u.includes('nubra%2c_ladakh') || u.includes('zanskar_ladakh') ||
            u.includes('route_srinagar-leh') || u.includes('shanti_stupa_in_rajgir') || u.includes('shanti_stupa') ||
            u.includes('testa_close_lungnak') || u.includes('pangong')) {
          return true;
        }
      }
      if (!sLower.includes('madhya pradesh') && !dLower.includes('khajuraho')) {
        if (u.includes('khajuraho') || u.includes('kandariya_mahadeva') || u.includes('parsvanath_jain_temple_khajuraho') ||
            u.includes('panna%2c_madhya_pradesh') || u.includes('madri%2c_madhya_pradesh')) {
          return true;
        }
      }
      return false;
    }

    const localUsed = new Set();
    allUrls.forEach(item => {
      const k = cleanKey(item.get());
      if (!isSlotDefective(item)) {
        localUsed.add(k);
      }
    });

    let fileChanged = false;
    const claimedInRun = new Set();

    for (const item of allUrls) {
      if (item.type === 'hero') continue; // Never change hero directly if gallery[0] is being synchronized
      if (isSlotDefective(item) || claimedInRun.has(cleanKey(item.get()))) {
        const placeName = item.placeName || title;
        console.log(`  [${filename}] Fixing ${item.type} (place: ${placeName})...`);
        const queries = [
          `${placeName} ${state}`,
          `${placeName} landmark`,
          `${title} ${state}`,
          `${state} heritage architecture`,
          `${state} scenic landscape`,
          `${state} nature tourism`
        ];
        const rep = await findReplacementPhoto(queries, state, localUsed);
        if (rep) {
          item.set(rep.url);
          urlCounts.set(cleanKey(rep.url), 1);
          claimedInRun.add(cleanKey(rep.url));
          fileChanged = true;
          fixedCount++;
        }
      }
    }

    // Ensure heroImage.src === gallery[0].src
    if (d.gallery?.[0]?.src && d.heroImage) {
      if (d.heroImage.src !== d.gallery[0].src) {
        d.heroImage.src = d.gallery[0].src;
        fileChanged = true;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
      console.log(`  ✓ Saved surgical fixes to ${filename}`);
    }
  }

  console.log(`\nAll remaining pinpoint fixes completed! Total slots repaired: ${fixedCount}`);
}

solveAll();
