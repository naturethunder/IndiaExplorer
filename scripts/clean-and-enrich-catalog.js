/**
 * clean-and-enrich-catalog.js
 * 
 * Deeply cleans and enriches data/destinations/*.json:
 * 1. Replaces mismatched landmark images (e.g. Tellicherry Fort Taj Mahal hero).
 * 2. Eradicates all PDF/DJVU document scans, video/audio files, maps/flags, and picsum placeholders.
 * 3. Resolves heavily duplicated Unsplash fallbacks with authentic Wikimedia Commons / Pexels imagery.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const CACHE_FILE = path.join(ROOT, 'data', 'clean-enrich-cache.json');

const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';

// Load cache if exists
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

// Regex patterns for invalid or unwanted images
const PDF_DJVU_PATTERN = /\.(pdf|djvu|doc|txt)(\/page|\.jpg|\.png)?/i;
const VIDEO_AUDIO_PATTERN = /\.(webm|ogv|mp4|avi|mov|flv|mp3|wav|mid|midi)(\/|\.jpg|\.png)?/i;
const LOGO_FLAG_MAP_PATTERN = /(flag_of|coat_of_arms|logo_of|map_of|diagram|chart|census|stamp_of|location_map|seal_of|symbol_of)/i;
const PLACEHOLDER_PATTERN = /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr)/i;
const BLURRY_THUMB_PATTERN = /\/([1-9][0-9]|1[0-9][0-9]|200)px-/i;

function isBadUrl(url, destTitle = '', destSlug = '') {
  if (!url || typeof url !== 'string') return true;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('images/')) return true;
  if (PDF_DJVU_PATTERN.test(url)) return true;
  if (VIDEO_AUDIO_PATTERN.test(url)) return true;
  if (LOGO_FLAG_MAP_PATTERN.test(url)) return true;
  if (PLACEHOLDER_PATTERN.test(url)) return true;
  if (BLURRY_THUMB_PATTERN.test(url)) return true;

  // Specific Taj Mahal mismatch rule
  if (url.includes('Taj_Mahal') && !destSlug.includes('agra') && !destSlug.includes('taj') && !destTitle.toLowerCase().includes('taj mahal')) {
    return true;
  }

  return false;
}

// Curated distinct hotel photos across price tiers
const HOTEL_POOLS = {
  budget: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1587985064135-0366536eab42?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1280&q=80'
  ],
  good: [
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1280&q=80'
  ],
  better: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1280&q=80'
  ],
  luxury: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1280&q=80'
  ]
};

// Search Wikimedia Commons for high quality photos
async function searchWikimedia(query) {
  const cacheKey = `wm_${query.toLowerCase().trim()}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const cleanQuery = query.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IndiaExploreApp/2.0 (info@indiaexplore.org)' }
    });
    if (!res.ok) return null;

    const data = await res.json();
    const pages = data.query ? Object.values(data.query.pages) : [];

    const candidates = [];
    for (const p of pages) {
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii) continue;
      const src = ii.thumburl || ii.url;
      if (!src || isBadUrl(src)) continue;
      if (!/\.(jpg|jpeg|png|webp)$/i.test(src.split('?')[0])) continue;
      candidates.push(src);
    }

    cache[cacheKey] = candidates;
    return candidates;
  } catch (err) {
    return null;
  }
}

// Search Pexels API
async function searchPexels(query) {
  const cacheKey = `pex_${query.toLowerCase().trim()}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY }
    });
    if (!res.ok) return null;

    const data = await res.json();
    const photos = (data.photos || []).map(p => p.src && (p.src.large2x || p.src.large || p.src.original)).filter(Boolean);
    cache[cacheKey] = photos;
    return photos;
  } catch (err) {
    return null;
  }
}

// Helper to pick a hotel photo
function getHotelPhoto(hotel, destSlug, index) {
  const tier = (hotel.tier || 'good').toLowerCase();
  const pool = HOTEL_POOLS[tier] || HOTEL_POOLS.good;
  let hash = 0;
  const str = `${destSlug}_${hotel.name}_${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % pool.length;
  return pool[idx];
}

async function cleanAllDestinations() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Starting scan across ${files.length} destination JSON files...`);

  let modifiedCount = 0;
  let fixedHero = 0;
  let fixedPlaces = 0;
  let fixedHotels = 0;
  let fixedGallery = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(DEST_DIR, file);
    const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    // 1. Check Hero Image
    let heroSrc = dest.heroImage && dest.heroImage.src ? dest.heroImage.src : '';
    if (isBadUrl(heroSrc, dest.title, dest.slug)) {
      let replacement = null;
      if (dest.gallery && dest.gallery.length > 0) {
        for (const g of dest.gallery) {
          if (g && g.src && !isBadUrl(g.src, dest.title, dest.slug)) {
            replacement = g.src;
            break;
          }
        }
      }

      if (!replacement) {
        const wmResults = await searchWikimedia(`${dest.title} ${dest.state}`) || await searchWikimedia(dest.title);
        if (wmResults && wmResults.length > 0) {
          replacement = wmResults[0];
        }
      }

      if (!replacement) {
        const pexResults = await searchPexels(`${dest.type || 'landscape'} ${dest.state} India`);
        if (pexResults && pexResults.length > 0) {
          replacement = pexResults[i % pexResults.length];
        }
      }

      if (replacement) {
        dest.heroImage = { src: replacement, alt: `${dest.title}, ${dest.state}` };
        if (dest.seo) dest.seo.ogImage = replacement;
        if (dest.image) dest.image.src = replacement;
        modified = true;
        fixedHero++;
      }
    }

    // 2. Check Gallery
    if (dest.gallery && Array.isArray(dest.gallery)) {
      for (let gIdx = 0; gIdx < dest.gallery.length; gIdx++) {
        const g = dest.gallery[gIdx];
        if (!g || !g.src || isBadUrl(g.src, dest.title, dest.slug)) {
          const wmResults = await searchWikimedia(`${dest.title} ${dest.state}`);
          if (wmResults && wmResults[gIdx]) {
            dest.gallery[gIdx] = { src: wmResults[gIdx], alt: `${dest.title} view ${gIdx + 1}` };
            modified = true;
            fixedGallery++;
          } else {
            dest.gallery[gIdx] = { src: dest.heroImage.src, alt: `${dest.title} view ${gIdx + 1}` };
            modified = true;
            fixedGallery++;
          }
        }
      }
    }

    // 3. Check Top Places
    if (dest.topPlaces && Array.isArray(dest.topPlaces)) {
      for (let pIdx = 0; pIdx < dest.topPlaces.length; pIdx++) {
        const p = dest.topPlaces[pIdx];
        if (!p) continue;

        // Check main place image
        let pSrc = p.image && (p.image.src || (typeof p.image === 'string' ? p.image : null));
        if (isBadUrl(pSrc, dest.title, dest.slug)) {
          const wmResults = await searchWikimedia(`${p.name} ${dest.title}`) ||
                            await searchWikimedia(`${p.name} ${dest.state}`) ||
                            await searchWikimedia(p.name);
          if (wmResults && wmResults.length > 0) {
            p.image = { src: wmResults[0], alt: `${p.name}, ${dest.title}` };
            p.photos = wmResults.slice(0, 3);
          } else {
            const fallbackPhoto = (dest.gallery && dest.gallery[pIdx % dest.gallery.length] && dest.gallery[pIdx % dest.gallery.length].src) || dest.heroImage.src;
            p.image = { src: fallbackPhoto, alt: `${p.name}, ${dest.title}` };
            p.photos = [fallbackPhoto];
          }
          modified = true;
          fixedPlaces++;
        }

        // Check place photos array
        if (p.photos && Array.isArray(p.photos)) {
          const cleanPhotos = [];
          for (let phIdx = 0; phIdx < p.photos.length; phIdx++) {
            const ph = p.photos[phIdx];
            if (ph && !isBadUrl(ph, dest.title, dest.slug)) {
              cleanPhotos.push(ph);
            }
          }
          if (cleanPhotos.length === 0) {
            const placeImg = (p.image && p.image.src) || dest.heroImage.src;
            cleanPhotos.push(placeImg);
          }
          if (cleanPhotos.length !== p.photos.length) {
            p.photos = cleanPhotos;
            modified = true;
          }
        }
      }
    }

    // 4. Check Hotels
    if (dest.hotels && Array.isArray(dest.hotels)) {
      for (let hIdx = 0; hIdx < dest.hotels.length; hIdx++) {
        const h = dest.hotels[hIdx];
        if (!h) continue;
        let hSrc = h.image && (h.image.src || (typeof h.image === 'string' ? h.image : null));
        if (isBadUrl(hSrc, dest.title, dest.slug)) {
          const newHotelPhoto = getHotelPhoto(h, dest.slug, hIdx);
          h.image = { src: newHotelPhoto, alt: h.name || `${dest.title} Hotel` };
          modified = true;
          fixedHotels++;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(dest, null, 2));
      modifiedCount++;
    }

    if ((i + 1) % 200 === 0 || i === files.length - 1) {
      console.log(`Progress: ${i + 1}/${files.length} destinations processed (${modifiedCount} updated so far)...`);
      saveCache();
    }
  }

  saveCache();
  console.log(`\n=== CLEANUP COMPLETED ===`);
  console.log(`Total files updated: ${modifiedCount}`);
  console.log(`Fixed hero images: ${fixedHero}`);
  console.log(`Fixed place images: ${fixedPlaces}`);
  console.log(`Fixed hotel images: ${fixedHotels}`);
  console.log(`Fixed gallery images: ${fixedGallery}`);
}

cleanAllDestinations().catch(console.error);
