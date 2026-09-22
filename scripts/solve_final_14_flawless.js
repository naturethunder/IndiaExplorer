const fs = require('fs');
const path = require('path');

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
function cleanKey(u) { return (u || '').split('?')[0].trim().toLowerCase(); }

// Build global catalog index
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

const apiCache = new Map();
async function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function verifyLive(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-1024' },
      signal: ctrl.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (e) { return false; }
}

async function searchPexels(query, page = 1) {
  if (!env.PEXELS_API_KEY) return [];
  const qk = `pex:${query}:${page}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`;
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
        return { provider: 'pexels', url: src, alt: p.alt || query };
      });
    apiCache.set(qk, items);
    await delay(35);
    return items;
  } catch (e) { return []; }
}

async function searchUnsplash(query, page = 1) {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  const qk = `uns:${query}:${page}`;
  if (apiCache.has(qk)) return apiCache.get(qk);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=25&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.results || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => {
        let src = p.urls.raw || p.urls.full || p.urls.regular;
        if (!src.includes('w=')) src += (src.includes('?') ? '&' : '?') + 'auto=format&fit=crop&w=1920&q=85';
        return { provider: 'unsplash', url: src, alt: p.alt_description || p.description || query };
      });
    apiCache.set(qk, items);
    await delay(35);
    return items;
  } catch (e) { return []; }
}

const BANNED_WORDS = [
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'woman posing', 'man posing',
  'transmission tower', 'power line', 'high voltage', 'pylon', 'electric pole',
  'traffic jam', 'tractor', 'bus', 'train', 'car', 'vehicle',
  'sri lanka', 'colombo', 'turkey', 'cappadocia', 'taiwan', 'hungary', 'vietnam', 'thailand', 'switzerland', 'germany'
];

function isAcceptable(cand, state) {
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

async function getPhoto(queries, state, usedKeys) {
  for (const q of queries) {
    for (let page = 1; page <= 8; page++) {
      const pex = await searchPexels(q, page);
      for (const c of pex) {
        const ck = cleanKey(c.url);
        if (repoUrlSet.has(ck) || usedKeys.has(ck)) continue;
        if (!isAcceptable(c, state)) continue;
        const live = await verifyLive(c.url);
        if (!live) continue;
        repoUrlSet.add(ck);
        usedKeys.add(ck);
        return c;
      }
    }
    for (let page = 1; page <= 5; page++) {
      const uns = await searchUnsplash(q, page);
      for (const c of uns) {
        const ck = cleanKey(c.url);
        if (repoUrlSet.has(ck) || usedKeys.has(ck)) continue;
        if (!isAcceptable(c, state)) continue;
        const live = await verifyLive(c.url);
        if (!live) continue;
        repoUrlSet.add(ck);
        usedKeys.add(ck);
        return c;
      }
    }
  }
  return null;
}

const target14 = [
  'koranganatha-temple.json',
  'mukurthi-national-park.json',
  'nahar-singh-mahal.json',
  'ootukulangara-bhagavathy-temple-peruvemba.json',
  'pant-wildlife-sanctuary.json',
  'pasupateeswarar-temple-karur.json',
  'rajagopalaswamy-temple-mannargudi.json',
  'thirparappu-waterfalls.json',
  'thirumarperu.json',
  'thirunadhikkara-cave-temple.json',
  'tirumalai-tamil-nadu.json',
  'tirupalli-mukkudal-tirunethranathar-temple.json',
  'vardhangad-fort.json',
  'yeshwantgad.json'
];

async function solveFlawless() {
  console.log(`Solving all remaining defects across ${target14.length} destinations...`);

  for (const filename of target14) {
    const filePath = path.join(destDir, filename);
    if (!fs.existsSync(filePath)) continue;
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const state = d.state || '';
    const title = d.title || d.name || '';
    const sLower = state.toLowerCase();
    const dLower = (d.name || '').toLowerCase();

    const usedKeys = new Set();
    const allSlots = [];

    if (d.heroImage?.src) allSlots.push({ type: 'hero', get: () => d.heroImage.src, set: u => { d.heroImage.src = u; } });
    (d.gallery || []).forEach((g, idx) => g?.src && allSlots.push({ type: 'gallery', idx, get: () => g.src, set: u => { g.src = u; } }));
    (d.topPlaces || []).forEach((p, pIdx) => {
      if (p.image?.src) allSlots.push({ type: 'placeCover', pIdx, placeName: p.name, get: () => p.image.src, set: u => { p.image.src = u; } });
      (p.photos || []).forEach((ph, phIdx) => {
        allSlots.push({
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

    // Check count of each URL
    const counts = new Map();
    allSlots.forEach(s => {
      const k = cleanKey(s.get());
      counts.set(k, (counts.get(k) || 0) + 1);
    });

    function isDefective(s) {
      const u = s.get().toLowerCase();
      const k = cleanKey(u);

      // Duplicate check: hero === gallery[0] is valid
      if (s.type === 'hero' || (s.type === 'gallery' && s.idx === 0)) {
        if (counts.get(k) > 2) return true;
      } else {
        if (counts.get(k) > 1) return true;
      }

      // Out of state checks
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

    // Mark valid keys as used
    allSlots.forEach(s => {
      if (!isDefective(s)) {
        usedKeys.add(cleanKey(s.get()));
      }
    });

    let touched = false;
    const claimedNow = new Set();

    for (const slot of allSlots) {
      if (slot.type === 'hero') continue;
      const k = cleanKey(slot.get());
      if (isDefective(slot) || claimedNow.has(k)) {
        const placeName = slot.placeName || title;
        console.log(`  [${filename}] Replacing defective ${slot.type} (${placeName})...`);
        const queries = [
          `${placeName} ${state}`,
          `${state} ancient temple architecture`,
          `${state} historical monument heritage`,
          `${state} nature scenic vista`,
          `${state} landscape`,
          `${state} tourism`
        ];
        const rep = await getPhoto(queries, state, usedKeys);
        if (rep) {
          slot.set(rep.url);
          counts.set(k, counts.get(k) - 1);
          counts.set(cleanKey(rep.url), 1);
          claimedNow.add(cleanKey(rep.url));
          touched = true;
        }
      }
    }

    // Fix gallery count if < 5
    if (d.gallery && d.gallery.length < 5) {
      console.log(`  [${filename}] Adding missing gallery photo to reach 5...`);
      while (d.gallery.length < 5) {
        const queries = [`${title} ${state}`, `${state} ancient temple`, `${state} heritage monument`];
        const rep = await getPhoto(queries, state, usedKeys);
        if (rep) {
          d.gallery.push({
            src: rep.url,
            title: `${title} Architecture ${d.gallery.length + 1}`,
            alt: `${title}, ${state} — Historic viewpoint`,
            caption: `Historic surroundings and temple architecture at ${title}`
          });
          touched = true;
        } else {
          break;
        }
      }
    }

    // Synchronize heroImage === gallery[0]
    if (d.gallery?.[0]?.src && d.heroImage) {
      if (d.heroImage.src !== d.gallery[0].src) {
        d.heroImage.src = d.gallery[0].src;
        touched = true;
      }
    }

    if (touched) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
      console.log(`  ✓ Saved flawless fixes to ${filename}`);
    }
  }

  console.log('All 14 flawless fixes completed!');
}

solveFlawless();
