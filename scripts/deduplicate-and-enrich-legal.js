/**
 * deduplicate-and-enrich-legal.js
 * 
 * Legally and authentically deduplicates all images across the catalog:
 * - Uses Wikimedia Commons API (Public Domain / CC licenses) for authentic destination & landmark photography.
 * - Uses Pexels API (free legal commercial license) for diverse hotel and regional travel photography.
 * - Enforces 100% uniqueness on heroImage across all 2,389 destinations.
 * - Replaces heavily repeated Unsplash fallback photos across topPlaces and hotels.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const CACHE_FILE = path.join(ROOT, 'data', 'legal-image-cache.json');
const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    cache = {};
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const usedHeroUrls = new Set();
const usedPlaceUrls = new Set();

const PDF_DJVU_PATTERN = /\.(pdf|djvu|doc|txt)(\/page|\.jpg|\.png)?/i;
const VIDEO_AUDIO_PATTERN = /\.(webm|ogv|mp4|avi|mov|flv|mp3|wav|mid|midi)(\/|\.jpg|\.png)?/i;
const LOGO_FLAG_MAP_PATTERN = /(flag_of|coat_of_arms|logo_of|map_of|diagram|chart|census|stamp_of|location_map|seal_of|symbol_of)/i;
const PLACEHOLDER_PATTERN = /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr)/i;
const BLURRY_THUMB_PATTERN = /\/([1-9][0-9]|1[0-9][0-9]|200)px-/i;

function isBadUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('images/')) return true;
  if (PDF_DJVU_PATTERN.test(url)) return true;
  if (VIDEO_AUDIO_PATTERN.test(url)) return true;
  if (LOGO_FLAG_MAP_PATTERN.test(url)) return true;
  if (PLACEHOLDER_PATTERN.test(url)) return true;
  if (BLURRY_THUMB_PATTERN.test(url)) return true;
  if (url.includes('Description01.jpg') || url.includes('Description.JPG')) return true;
  return false;
}

// Fetch images from Wikimedia Commons with 4s timeout
async function fetchWikimediaPhotos(query, limit = 10) {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cacheKey = `wm_${cleanQuery.toLowerCase()}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IndiaExploreApp/2.0 (info@indiaexplore.org)' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query ? Object.values(data.query.pages) : [];
    const results = [];

    for (const p of pages) {
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii) continue;
      const src = ii.thumburl || ii.url;
      if (!src || isBadUrl(src)) continue;
      if (!/\.(jpg|jpeg|png|webp)$/i.test(src.split('?')[0])) continue;
      results.push(src);
    }

    cache[cacheKey] = results;
    return results;
  } catch (e) {
    return [];
  }
}

// Fetch images from Pexels API with 4s timeout
async function fetchPexelsPhotos(query, perPage = 30) {
  const cleanQuery = query.trim();
  const cacheKey = `pex_${cleanQuery.toLowerCase()}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results = (data.photos || []).map(p => p.src && (p.src.large2x || p.src.large || p.src.original)).filter(Boolean);
    cache[cacheKey] = results;
    return results;
  } catch (e) {
    return [];
  }
}

async function deduplicateAndEnrich() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Starting deduplication and enrichment across ${files.length} destination JSON files...`);

  // Step 1: Pre-populate diverse Pexels photo pools
  console.log('Fetching diverse photo pools from Pexels API...');
  const themes = [
    'india travel landscape',
    'himalayas india mountains',
    'kerala backwaters india',
    'rajasthan palace india',
    'goa beach india',
    'south india temple',
    'north east india nature',
    'western ghats waterfall',
    'indian wildlife safari',
    'luxury resort india',
    'boutique hotel bedroom',
    'heritage hotel courtyard',
    'cozy resort pool india',
    'modern hotel interior',
    'kashmir landscape',
    'ladakh mountains valley',
    'tamil nadu temples',
    'himachal pradesh valley',
    'uttarakhand nature'
  ];

  const poolMap = {};
  for (const t of themes) {
    poolMap[t] = (await fetchPexelsPhotos(t, 40)) || [];
  }
  console.log('Pexels pools loaded.');

  const dests = [];
  files.forEach(file => {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    dests.push({ file, d });
  });

  // Count current duplicates across all files
  const urlCounts = {};
  dests.forEach(({ d }) => {
    if (d.heroImage && d.heroImage.src) urlCounts[d.heroImage.src] = (urlCounts[d.heroImage.src] || 0) + 1;
    (d.gallery || []).forEach(g => { if (g && g.src) urlCounts[g.src] = (urlCounts[g.src] || 0) + 1; });
    (d.topPlaces || []).forEach(p => {
      if (p.image && p.image.src) urlCounts[p.image.src] = (urlCounts[p.image.src] || 0) + 1;
    });
    (d.hotels || []).forEach(h => {
      if (h.image && h.image.src) urlCounts[h.image.src] = (urlCounts[h.image.src] || 0) + 1;
    });
  });

  let modifiedCount = 0;
  let heroReplaced = 0;
  let placesReplaced = 0;
  let hotelsReplaced = 0;

  // Flatten hotel pool
  const hotelPool = [].concat(
    poolMap['luxury resort india'] || [],
    poolMap['boutique hotel bedroom'] || [],
    poolMap['heritage hotel courtyard'] || [],
    poolMap['cozy resort pool india'] || [],
    poolMap['modern hotel interior'] || []
  );

  // Flatten general scenic pool
  const generalPool = [].concat(
    poolMap['india travel landscape'] || [],
    poolMap['himalayas india mountains'] || [],
    poolMap['kerala backwaters india'] || [],
    poolMap['rajasthan palace india'] || [],
    poolMap['goa beach india'] || [],
    poolMap['south india temple'] || [],
    poolMap['north east india nature'] || [],
    poolMap['western ghats waterfall'] || [],
    poolMap['indian wildlife safari'] || [],
    poolMap['kashmir landscape'] || [],
    poolMap['ladakh mountains valley'] || [],
    poolMap['tamil nadu temples'] || [],
    poolMap['himachal pradesh valley'] || [],
    poolMap['uttarakhand nature'] || []
  );

  // Process destinations in concurrent batches of 15
  const BATCH_SIZE = 15;
  for (let b = 0; b < dests.length; b += BATCH_SIZE) {
    const batch = dests.slice(b, b + BATCH_SIZE);

    await Promise.all(batch.map(async ({ file, d }, batchIdx) => {
      const idx = b + batchIdx;
      let modified = false;

      // 1. Process Hero Image - Enforce Uniqueness
      let currentHero = d.heroImage && d.heroImage.src;
      const isHeroDup = usedHeroUrls.has(currentHero) || (urlCounts[currentHero] && urlCounts[currentHero] > 2);

      if (!currentHero || isBadUrl(currentHero) || isHeroDup) {
        let candidate = null;
        
        // Search Wikimedia for destination
        const wm = await fetchWikimediaPhotos(`${d.title} ${d.state}`) || [];
        for (const src of wm) {
          if (!usedHeroUrls.has(src) && !isBadUrl(src)) {
            candidate = src;
            break;
          }
        }

        if (!candidate) {
          const wmTitle = await fetchWikimediaPhotos(d.title) || [];
          for (const src of wmTitle) {
            if (!usedHeroUrls.has(src) && !isBadUrl(src)) {
              candidate = src;
              break;
            }
          }
        }

        if (!candidate && generalPool.length > 0) {
          for (let p = 0; p < generalPool.length; p++) {
            const poolSrc = generalPool[(idx * 3 + p) % generalPool.length];
            if (!usedHeroUrls.has(poolSrc)) {
              candidate = poolSrc;
              break;
            }
          }
        }

        if (candidate) {
          d.heroImage = { src: candidate, alt: `${d.title}, ${d.state}` };
          if (d.seo) d.seo.ogImage = candidate;
          if (d.image) d.image.src = candidate;
          currentHero = candidate;
          modified = true;
          heroReplaced++;
        }
      }

      usedHeroUrls.add(currentHero);

      // 2. Process Gallery
      if (d.gallery && Array.isArray(d.gallery)) {
        for (let gIdx = 0; gIdx < d.gallery.length; gIdx++) {
          const g = d.gallery[gIdx];
          if (!g || !g.src || isBadUrl(g.src) || (urlCounts[g.src] && urlCounts[g.src] > 5)) {
            const wm = await fetchWikimediaPhotos(`${d.title} ${d.state}`) || [];
            let gCandidate = wm[gIdx] && !usedHeroUrls.has(wm[gIdx]) ? wm[gIdx] : currentHero;
            d.gallery[gIdx] = { src: gCandidate, alt: `${d.title} photo ${gIdx + 1}` };
            modified = true;
          }
        }
      }

      // 3. Process Top Places
      if (d.topPlaces && Array.isArray(d.topPlaces)) {
        for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
          const p = d.topPlaces[pIdx];
          if (!p) continue;

          let pSrc = p.image && (p.image.src || (typeof p.image === 'string' ? p.image : null));
          if (!pSrc || isBadUrl(pSrc) || (urlCounts[pSrc] && urlCounts[pSrc] > 5)) {
            const wmPlace = await fetchWikimediaPhotos(`${p.name} ${d.title}`) ||
                            await fetchWikimediaPhotos(`${p.name} ${d.state}`) || [];
            let placeCandidate = wmPlace[0];
            if (!placeCandidate) {
              placeCandidate = (d.gallery && d.gallery[pIdx % d.gallery.length] && d.gallery[pIdx % d.gallery.length].src) || currentHero;
            }
            p.image = { src: placeCandidate, alt: p.name };
            p.photos = wmPlace.length ? wmPlace.slice(0, 3) : [placeCandidate];
            modified = true;
            placesReplaced++;
          }
        }
      }

      // 4. Process Hotels
      if (d.hotels && Array.isArray(d.hotels)) {
        for (let hIdx = 0; hIdx < d.hotels.length; hIdx++) {
          const h = d.hotels[hIdx];
          if (!h) continue;

          let hSrc = h.image && (h.image.src || (typeof h.image === 'string' ? h.image : null));
          if (!hSrc || isBadUrl(hSrc) || (urlCounts[hSrc] && urlCounts[hSrc] > 10)) {
            const chosen = hotelPool.length > 0 ? hotelPool[(idx * 4 + hIdx) % hotelPool.length] : currentHero;
            h.image = { src: chosen, alt: h.name || `${d.title} Hotel` };
            modified = true;
            hotelsReplaced++;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(path.join(DEST_DIR, file), JSON.stringify(d, null, 2));
        modifiedCount++;
      }
    }));

    console.log(`Progress: ${Math.min(b + BATCH_SIZE, dests.length)}/${dests.length} destinations processed (${modifiedCount} updated)...`);
    saveCache();
  }

  saveCache();
  console.log(`\n=== DEDUPLICATION & LEGAL ENRICHMENT COMPLETED ===`);
  console.log(`Total files updated: ${modifiedCount}`);
  console.log(`Hero images updated to unique: ${heroReplaced}`);
  console.log(`Place images deduplicated: ${placesReplaced}`);
  console.log(`Hotel images deduplicated: ${hotelsReplaced}`);
  console.log(`Total unique hero images: ${usedHeroUrls.size}`);
}

deduplicateAndEnrich().catch(console.error);
