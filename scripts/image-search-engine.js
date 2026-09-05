const fs = require('fs');
const path = require('path');

// 1. Load API keys from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
}

// 2. Build global blacklist of used URLs from all other destinations
const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const TARGET_SLUGS = [
  'varanasi',
  'bijapur-fort',
  'munger-fort',
  'nalanda',
  'rohtasgarh-fort',
  'sri-sri-nookambika-ammavari-temple',
  'kaziranga',
  'hoollongapar-gibbon-sanctuary',
  'orang-national-park'
];

function cleanUrlKey(u) {
  if (!u) return '';
  return u.split('?')[0].trim().toLowerCase();
}

const globalUsed = new Set();
fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json').forEach(f => {
  const slug = f.replace('.json', '');
  if (TARGET_SLUGS.includes(slug)) return;
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
    if (d.heroImage?.src) globalUsed.add(cleanUrlKey(d.heroImage.src));
    (d.gallery || []).forEach(g => g.src && globalUsed.add(cleanUrlKey(g.src)));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) globalUsed.add(cleanUrlKey(p.image.src));
      (p.photos || []).forEach(ph => {
        const u = ph.src || ph;
        if (u) globalUsed.add(cleanUrlKey(u));
      });
    });
  } catch(e) {}
});
console.log(`Loaded ${globalUsed.size} unique URLs used in other destinations.`);

// Negative filter words (disallowed images)
const REJECT_WORDS = [
  'fish', 'wallago', 'garra', 'aenigmachanna', 'murrel', 'dog', 'puppy', 'cat', 'kitten',
  'selfie', 'portrait', 'close-up of face', 'fashion model', 'man smiling at camera', 'woman posing',
  'map', 'flag', 'logo', 'diagram', 'icon', 'stamp', 'census', 'drawing',
  'vector', 'clipart', 'infographic', 'chart', 'blueprint', 'document',
  'hajdúszoboszló', 'hungary', 'bastion', 'kalvin', 'ziegelmauer',
  'interim_agreements',
  'taipei', 'taiwan', 'buenos aires', 'argentina', 'vietnam', 'thailand', 'japan', 'china',
  'tokyo', 'seoul', 'korea', 'europe', 'france', 'germany', 'spain', 'italy', 'london',
  'uk', 'united states', 'california', 'new york', 'mexico', 'brazil', 'egypt', 'rome',
  'greece', 'turkey', 'russia', 'canada', 'australia', 'indonesia', 'philippines'
];

function isRejected(title, url, contextState = '') {
  const text = ((title || '') + ' ' + (url || '')).toLowerCase();
  for (const w of REJECT_WORDS) {
    if (text.includes(w)) return true;
  }
  // State mismatch checks:
  if (contextState) {
    const s = contextState.toLowerCase();
    if (s === 'bihar') {
      if (text.includes('delhi') || text.includes('karnataka') || text.includes('tamil nadu') || text.includes('telangana') || text.includes('kerala')) return true;
    } else if (s === 'assam') {
      if (text.includes('rajasthan') || text.includes('gujarat') || text.includes('tamil nadu') || text.includes('kerala') || text.includes('telangana') || text.includes('bihar')) return true;
    } else if (s === 'karnataka') {
      if (text.includes('bihar') || text.includes('assam') || text.includes('delhi') || text.includes('rajasthan')) return true;
    } else if (s.includes('andhra')) {
      if (text.includes('delhi') || text.includes('rajasthan') || text.includes('punjab') || text.includes('bihar') || text.includes('assam')) return true;
    } else if (s.includes('uttar pradesh')) {
      if (text.includes('tamil nadu') || text.includes('kerala') || text.includes('karnataka') || text.includes('assam')) return true;
    }
  }
  return false;
}

// 3. HTTP Validation with timeout
async function isLiveImage(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.status >= 200 && res.status < 400) {
      const ct = res.headers.get('content-type') || '';
      return ct.includes('image') || ct.includes('octet-stream') || res.status === 200;
    }
    return false;
  } catch(e) {
    // If HEAD fails, try a fast GET range
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 4500);
      const res2 = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-2048'
        },
        signal: controller2.signal
      });
      clearTimeout(timeout2);
      return res2.status >= 200 && res2.status < 400;
    } catch(err) {
      return false;
    }
  }
}

// 4. API Search Functions

// A. Unsplash
async function searchUnsplash(query, limit = 10) {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(p => ({
      provider: 'unsplash',
      title: p.description || p.alt_description || query,
      url: `${p.urls.raw}&auto=format&fit=crop&w=1600&q=80`,
      width: p.width,
      height: p.height
    }));
  } catch (e) {
    return [];
  }
}

// B. Pexels
async function searchPexels(query, limit = 10) {
  if (!env.PEXELS_API_KEY) return [];
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => ({
      provider: 'pexels',
      title: p.alt || query,
      url: p.src.large2x || p.src.large || p.src.original,
      width: p.width,
      height: p.height
    }));
  } catch (e) {
    return [];
  }
}

// C. Openverse (Flickr and other creative commons HD)
async function searchOpenverse(query, limit = 10) {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(p => ({
      provider: 'openverse',
      title: p.title || query,
      url: p.url,
      width: p.width,
      height: p.height
    }));
  } catch (e) {
    return [];
  }
}

// D. Wikimedia Commons (LAST FALLBACK ONLY)
async function searchWikimedia(query, limit = 15) {
  try {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=' + limit + '&prop=imageinfo&iiprop=url|size&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': 'ExploreDesh/1.0 (info@exploredesh.org)' } });
    const data = await res.json();
    const pages = data.query?.pages || {};
    const items = [];
    for (const p of Object.values(pages)) {
      const ii = p.imageinfo?.[0];
      if (!ii || !ii.url) continue;
      const cleanUrl = ii.url.split('?')[0];
      if (!cleanUrl.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
      const lower = cleanUrl.toLowerCase();
      if (lower.includes('map') || lower.includes('flag') || lower.includes('logo') || lower.includes('diagram') || lower.includes('icon') || lower.includes('stamp') || lower.includes('census') || lower.includes('.pdf') || lower.includes('.djvu')) continue;
      if (ii.width && ii.width < 1000) continue; // enforce HD
      items.push({
        provider: 'wikimedia',
        title: p.title,
        width: ii.width,
        height: ii.height,
        url: cleanUrl
      });
    }
    return items;
  } catch (e) {
    return [];
  }
}

// 5. Multi-provider search with priority (Unsplash -> Pexels -> Openverse -> Wikimedia in LAST)
async function getCandidatesForQueries(queries, limit = 10) {
  const candidates = [];
  const seenUrls = new Set();

  function addCandidate(item) {
    const key = cleanUrlKey(item.url);
    if (!key || seenUrls.has(key)) return;
    if (isRejected(item.title, item.url)) return;
    seenUrls.add(key);
    candidates.push(item);
  }

  // Pass 1: Unsplash
  for (const q of queries) {
    const res = await searchUnsplash(q, limit);
    for (const item of res) addCandidate(item);
  }

  // Pass 2: Pexels
  for (const q of queries) {
    const res = await searchPexels(q, limit);
    for (const item of res) addCandidate(item);
  }

  // Pass 3: Openverse
  for (const q of queries) {
    const res = await searchOpenverse(q, limit);
    for (const item of res) addCandidate(item);
  }

  // Pass 4: Wikimedia Commons (ONLY IF WE HAVE FEWER CANDIDATES THAN REQUESTED)
  if (candidates.length < limit * 2) {
    for (const q of queries) {
      const res = await searchWikimedia(q, limit);
      for (const item of res) addCandidate(item);
    }
  }

  return candidates;
}

module.exports = {
  env,
  destDir,
  TARGET_SLUGS,
  cleanUrlKey,
  globalUsed,
  isLiveImage,
  isRejected,
  searchUnsplash,
  searchPexels,
  searchOpenverse,
  searchWikimedia,
  getCandidatesForQueries
};
