const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
}

// 1. Pexels API Search
async function searchPexels(query, limit = 5) {
  if (!env.PEXELS_API_KEY) return [];
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => ({
      provider: 'pexels',
      title: p.alt || query,
      url: p.src.large2x || p.src.original,
      width: p.width,
      height: p.height
    }));
  } catch (e) {
    return [];
  }
}

// 2. Unsplash API Search
async function searchUnsplash(query, limit = 5) {
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

// 3. Pixabay API Search
async function searchPixabay(query, limit = 5) {
  if (!env.PIXABAY_API_KEY) return [];
  try {
    const url = `https://pixabay.com/api/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${limit}&orientation=horizontal`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map(p => ({
      provider: 'pixabay',
      title: p.tags || query,
      url: p.largeImageURL || p.webformatURL,
      width: p.imageWidth,
      height: p.imageHeight
    }));
  } catch (e) {
    return [];
  }
}

// 4. Openverse API Search
async function searchOpenverse(query, limit = 5) {
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

// 5. Wikimedia Commons Search
async function searchWikimedia(query, limit = 15) {
  try {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=' + limit + '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': 'ExploreDesh/1.0 (info@exploredesh.org)' } });
    const data = await res.json();
    const pages = data.query?.pages || {};
    const items = [];
    for (const p of Object.values(pages)) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      let thumb = ii.thumburl || ii.url;
      if (!thumb) continue;
      let cleanUrl = thumb.replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/').split('?')[0];
      if (!cleanUrl.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
      const lower = cleanUrl.toLowerCase();
      if (lower.includes('map') || lower.includes('flag') || lower.includes('logo') || lower.includes('diagram') || lower.includes('icon') || lower.includes('stamp') || lower.includes('census') || lower.includes('sundarban') || lower.includes('.pdf') || lower.includes('.djvu')) continue;
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

module.exports = {
  searchPexels,
  searchUnsplash,
  searchPixabay,
  searchOpenverse,
  searchWikimedia
};
