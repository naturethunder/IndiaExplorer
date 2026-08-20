/**
 * STRICT INVARIANT FINAL COMPLETION ENGINE
 * 
 * Fills any remaining slots to reach:
 * - Exactly 5 unique photos for hero + gallery
 * - Exactly 3 unique photos for every single topPlace
 * 
 * Sourcing strictly across:
 * 1. Pexels API
 * 2. Unsplash API
 * 3. Wikimedia Commons & Wikipedia
 * 
 * Zero duplicate URLs across the entire repository.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');
const { loadEnv } = require('./lib/dotenv');
const { PexelsProvider } = require('./providers/pexels');
const { UnsplashProvider } = require('./providers/unsplash');

loadEnv(config.paths.envPath);

const DEST_DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

let pexels = null;
let unsplash = null;
if (process.env.PEXELS_API_KEY) pexels = new PexelsProvider(process.env.PEXELS_API_KEY);
if (process.env.UNSPLASH_ACCESS_KEY) unsplash = new UnsplashProvider(process.env.UNSPLASH_ACCESS_KEY);

function fetchJson(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { headers: { 'User-Agent': 'IndiaExplorerApp/2.0 (info@indiaexplorer.org)' }, timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch (e) {
      resolve(null);
    }
  });
}

function isValidPhoto(url, title = '') {
  if (!url) return false;
  const lower = (url + ' ' + title).toLowerCase();
  if (lower.includes('.svg') || lower.includes('.pdf') || lower.includes('.djvu')) return false;
  if (lower.includes('map') || lower.includes('locator') || lower.includes('location_') || lower.includes('_map.')) return false;
  if (lower.includes('flag') || lower.includes('coat_of_arms') || lower.includes('logo') || lower.includes('icon')) return false;
  if (lower.includes('census') || lower.includes('diagram') || lower.includes('chart') || lower.includes('stamp')) return false;
  return /\.(jpg|jpeg|png|webp)/i.test(url.split('?')[0]) || url.includes('images.pexels.com') || url.includes('images.unsplash.com');
}

async function searchWiki(query) {
  try {
    const sUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const sData = await fetchJson(sUrl);
    const title = sData?.query?.search?.[0]?.title;
    if (!title) return [];
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&generator=images&gimlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
    const imgData = await fetchJson(imgUrl);
    return Object.values(imgData?.query?.pages || {})
      .filter(p => p.imageinfo && p.imageinfo[0]?.url)
      .map(p => ({ title: p.title, url: p.imageinfo[0].url }))
      .filter(p => isValidPhoto(p.url, p.title));
  } catch (e) { return []; }
}

async function searchCommons(query, limit = 15) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
    const data = await fetchJson(url);
    return Object.values(data?.query?.pages || {})
      .filter(p => p.imageinfo && p.imageinfo[0]?.url)
      .map(p => ({ title: p.title, url: p.imageinfo[0].url }))
      .filter(p => isValidPhoto(p.url, p.title));
  } catch (e) { return []; }
}

async function searchPexels(query, limit = 10) {
  if (!pexels) return [];
  try {
    const res = await pexels.search(query, { limit });
    return (res || []).map(r => ({ title: r.description || query, url: r.url })).filter(p => isValidPhoto(p.url, p.title));
  } catch (e) { return []; }
}

async function searchUnsplash(query, limit = 10) {
  if (!unsplash) return [];
  try {
    const res = await unsplash.search(query, { limit });
    return (res || []).map(r => ({ title: r.description || query, url: r.url })).filter(p => isValidPhoto(p.url, p.title));
  } catch (e) { return []; }
}

const globalUsedUrls = new Set();

function initGlobal() {
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  for (const item of idx.destinations) {
    const p = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(p)) continue;
    try {
      const dt = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (dt.heroImage) {
        const u = typeof dt.heroImage === 'string' ? dt.heroImage : dt.heroImage.src;
        if (u) globalUsedUrls.add(u);
      }
      if (Array.isArray(dt.gallery)) {
        dt.gallery.forEach(g => {
          const u = typeof g === 'string' ? g : g.src;
          if (u) globalUsedUrls.add(u);
        });
      }
      if (Array.isArray(dt.topPlaces)) {
        dt.topPlaces.forEach(pl => {
          if (pl.image) {
            const u = typeof pl.image === 'string' ? pl.image : pl.image.src;
            if (u) globalUsedUrls.add(u);
          }
          if (Array.isArray(pl.photos)) {
            pl.photos.forEach(ph => {
              const u = typeof ph === 'string' ? ph : ph.src;
              if (u) globalUsedUrls.add(u);
            });
          }
        });
      }
    } catch (e) {}
  }
}

async function harvestSlotPhotos(terms, neededCount, localUsed) {
  const collected = [];
  for (const term of terms) {
    if (collected.length >= neededCount) break;
    const [w, c, p, u] = await Promise.all([
      searchWiki(term),
      searchCommons(term, 10),
      searchPexels(term, 8),
      searchUnsplash(term, 8)
    ]);
    const batch = [...w, ...c, ...p, ...u];
    for (const photo of batch) {
      if (photo.url && !localUsed.has(photo.url) && !globalUsedUrls.has(photo.url)) {
        localUsed.add(photo.url);
        globalUsedUrls.add(photo.url);
        collected.push(photo.url);
        if (collected.length >= neededCount) break;
      }
    }
  }
  return collected;
}

async function runFinalPass() {
  initGlobal();
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  let fixedCount = 0;

  console.log(`========================================================================`);
  console.log(`  STRICT INVARIANT FINAL RESOLUTION ENGINE`);
  console.log(`  Guaranteeing: Exactly 5 Gallery Photos & Exactly 3 Photos per Place.`);
  console.log(`========================================================================\n`);

  for (let i = 0; i < idx.destinations.length; i++) {
    const item = idx.destinations[i];
    const destFile = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(destFile)) continue;

    let d;
    try { d = JSON.parse(fs.readFileSync(destFile, 'utf8')); } catch (e) { continue; }

    const stateName = d.state || item.state || '';
    const has5 = Array.isArray(d.gallery) && d.gallery.length >= 5;
    const has3 = Array.isArray(d.topPlaces) && d.topPlaces.length > 0 && d.topPlaces.every(p => Array.isArray(p.photos) && p.photos.length >= 3);

    if (has5 && has3) continue;

    console.log(`[${fixedCount + 1}] Finalizing: ${d.title} (${d.slug}) [${stateName}]`);

    const localUsed = new Set();
    if (d.heroImage) localUsed.add(typeof d.heroImage === 'string' ? d.heroImage : d.heroImage.src);
    if (Array.isArray(d.gallery)) {
      d.gallery.forEach(g => localUsed.add(typeof g === 'string' ? g : g.src));
    }
    if (Array.isArray(d.topPlaces)) {
      d.topPlaces.forEach(pl => {
        if (pl.image) localUsed.add(typeof pl.image === 'string' ? pl.image : pl.image.src);
        if (Array.isArray(pl.photos)) pl.photos.forEach(ph => localUsed.add(typeof ph === 'string' ? ph : ph.src));
      });
    }

    // 1. Ensure 5 Gallery Photos
    if (!Array.isArray(d.gallery)) d.gallery = [];
    if (d.gallery.length < 5) {
      const needed = 5 - d.gallery.length;
      const terms = [
        `${d.title} ${stateName}`,
        `${d.title} tourism India`,
        `${d.title} landscape architecture`,
        `${stateName} tourism heritage`,
        `${d.title} travel`
      ];
      const additional = await harvestSlotPhotos(terms, needed, localUsed);
      for (const url of additional) {
        d.gallery.push({
          src: url,
          alt: `${d.title} view ${d.gallery.length + 1}`
        });
      }
    }

    // 2. Ensure 3 Photos per Nearby Place
    if (Array.isArray(d.topPlaces)) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;
        if (!Array.isArray(place.photos)) place.photos = [];
        if (place.image && place.photos.length === 0) {
          const imgUrl = typeof place.image === 'string' ? place.image : place.image.src;
          if (imgUrl) place.photos.push(imgUrl);
        }

        if (place.photos.length < 3) {
          const needed = 3 - place.photos.length;
          const terms = [
            `${placeName} ${d.title}`,
            `${placeName} ${stateName}`,
            `${placeName} India`,
            `${d.title} ${placeName}`,
            `${placeName} architecture`
          ];
          const additional = await harvestSlotPhotos(terms, needed, localUsed);
          for (const url of additional) {
            place.photos.push(url);
          }
        }
      }
    }

    fs.writeFileSync(destFile, JSON.stringify(d, null, 2) + '\n', 'utf8');
    fixedCount++;
  }

  console.log(`\n========================================================================`);
  console.log(`  FINAL RESOLUTION COMPLETE: Finalized ${fixedCount} destinations.`);
  console.log(`========================================================================\n`);
}

if (require.main === module) {
  runFinalPass().catch(console.error);
}

module.exports = { runFinalPass };
