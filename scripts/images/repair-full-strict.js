/**
 * COMPREHENSIVE REPOSITORY IMAGE REPAIR ENGINE
 * Uses multi-source (Pexels + Unsplash + Wikimedia) to fix:
 * - Missing hero/gallery images (target 5 unique per destination)
 * - Missing topPlaces photos (target 3 unique per place)
 * - Junk/PDF/Map/Stock filler images
 * - Global duplicate URL elimination
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const AUDIT_PATH = path.join(ROOT_DIR, 'reports', 'image-audit-final.json');

function normalizeUrl(url) {
  if (!url) return '';
  let u = typeof url === 'object' ? (url.src || '') : String(url);
  u = u.trim();
  try {
    const parsed = new URL(u);
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_content');
    parsed.searchParams.delete('utm_medium');
    return parsed.toString();
  } catch (e) {
    return u;
  }
}

function isValidPhotoUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('.svg') || lower.includes('.pdf') || lower.includes('.djvu')) return false;
  if (lower.includes('map') || lower.includes('locator') || lower.includes('location_') || lower.includes('_map.')) return false;
  if (lower.includes('flag') || lower.includes('coat_of_arms') || lower.includes('logo') || lower.includes('icon')) return false;
  if (lower.includes('census') || lower.includes('diagram') || lower.includes('chart') || lower.includes('stamp')) return false;
  if (lower.includes('picsum.photos') || lower.includes('via.placeholder.com')) return false;
  return true;
}

// --- Provider Implementations ---
function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'IndiaExplorerApp/2.0 (info@indiaexplorer.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchWikipedia(query, limit = 10) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const searchData = await fetchJson(searchUrl);
  const pageTitle = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return [];

  const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&generator=images&gimlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
  const imgData = await fetchJson(imgUrl);
  const pages = imgData?.query?.pages || {};

  return Object.values(pages)
    .filter(p => p.imageinfo && p.imageinfo[0]?.url)
    .map(p => ({
      url: p.imageinfo[0].url,
      provider: 'wikimedia-page'
    }))
    .filter(p => isValidPhotoUrl(p.url))
    .slice(0, limit);
}

async function searchCommons(query, limit = 15) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
  const data = await fetchJson(url);
  const pages = data?.query?.pages || {};

  return Object.values(pages)
    .filter(p => p.imageinfo && p.imageinfo[0]?.url)
    .map(p => ({
      url: p.imageinfo[0].url,
      provider: 'wikimedia-commons'
    }))
    .filter(p => isValidPhotoUrl(p.url))
    .slice(0, limit);
}

async function searchPexels(query, limit = 10) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': key } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => ({
      url: p.src?.large2x || p.src?.large || p.src?.original,
      provider: 'pexels'
    })).filter(p => p.url && isValidPhotoUrl(p.url));
  } catch (e) {
    return [];
  }
}

async function searchUnsplash(query, limit = 10) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${key}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(p => ({
      url: p.urls?.regular || p.urls?.full,
      provider: 'unsplash'
    })).filter(p => p.url && isValidPhotoUrl(p.url));
  } catch (e) {
    return [];
  }
}

async function findMultiProviderPhotos(name, destinationTitle, stateName, limit = 15) {
  const cleanName = name.replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanDest = destinationTitle.replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanState = (stateName || '').replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();

  const results = [];
  const seen = new Set();

  function addPhotos(photos) {
    for (const p of photos) {
      if (p.url && !seen.has(p.url)) {
        seen.add(p.url);
        results.push(p);
      }
    }
  }

  // Priority 1: Pexels & Unsplash (high quality, specific)
  const [pex, uns] = await Promise.all([
    searchPexels(`${cleanName} ${cleanDest} ${cleanState} India`),
    searchUnsplash(`${cleanName} ${cleanDest} ${cleanState} India`)
  ]);
  addPhotos(pex);
  addPhotos(uns);

  // Priority 2: Wikipedia exact page images
  if (results.length < limit) {
    const wiki = await searchWikipedia(`${cleanName} ${cleanDest}`, limit);
    addPhotos(wiki);
  }

  // Priority 3: Wikimedia Commons
  if (results.length < limit) {
    const comm1 = await searchCommons(`${cleanName} ${cleanDest} ${cleanState}`, limit);
    addPhotos(comm1);
  }
  if (results.length < limit) {
    const comm2 = await searchCommons(`${cleanName} ${cleanState}`, limit);
    addPhotos(comm2);
  }
  if (results.length < limit) {
    const comm3 = await searchCommons(cleanName, limit);
    addPhotos(comm3);
  }

  return results.slice(0, limit);
}

// --- Main Repair Engine ---
async function runFullRepair() {
  // Load audit results
  const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));

  // Build global used URL set
  const globalUsed = new Set();
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  for (const item of index.destinations) {
    const p = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(p)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (d.heroImage) {
        const u = normalizeUrl(d.heroImage);
        if (u) globalUsed.add(u);
      }
      if (Array.isArray(d.gallery)) {
        d.gallery.forEach(g => {
          const u = normalizeUrl(g);
          if (u) globalUsed.add(u);
        });
      }
      if (Array.isArray(d.topPlaces)) {
        d.topPlaces.forEach(pl => {
          if (pl.image) {
            const u = normalizeUrl(pl.image);
            if (u) globalUsed.add(u);
          }
          if (Array.isArray(pl.photos)) {
            pl.photos.forEach(ph => {
              const u = normalizeUrl(ph);
              if (u) globalUsed.add(u);
            });
          }
        });
      }
    } catch (e) {}
  }

  console.log(`Global used URLs loaded: ${globalUsed.size}`);

  const failures = audit.failures || [];
  console.log(`Total destinations to repair: ${failures.length}`);

  let processed = 0;
  let repaired = 0;
  let totalPhotosAdded = 0;

  for (const failure of failures) {
    const destFile = path.join(DEST_DIR, `${failure.slug}.json`);
    if (!fs.existsSync(destFile)) continue;

    const d = JSON.parse(fs.readFileSync(destFile, 'utf8'));
    const localUsed = new Set();
    let isModified = false;

    // Collect locally used URLs
    if (d.heroImage) {
      const u = normalizeUrl(d.heroImage);
      if (u) localUsed.add(u);
    }
    if (Array.isArray(d.gallery)) {
      d.gallery.forEach(g => {
        const u = normalizeUrl(g);
        if (u) localUsed.add(u);
      });
    }
    if (Array.isArray(d.topPlaces)) {
      d.topPlaces.forEach(pl => {
        if (pl.image) {
          const u = normalizeUrl(pl.image);
          if (u) localUsed.add(u);
        }
        if (Array.isArray(pl.photos)) {
          pl.photos.forEach(ph => {
            const u = normalizeUrl(ph);
            if (u) localUsed.add(u);
          });
        }
      });
    }

    // 1. Fix Hero & Gallery (ensure 5 unique gallery photos + valid hero)
    const needsGalleryFix = failure.failures.some(f =>
      f.field.startsWith('gallery') || f.field === 'heroImage' || f.field === 'gallery'
    );

    if (needsGalleryFix || d.gallery.length < 5) {
      console.log(`  [${processed + 1}] ${failure.slug}: Fetching hero/gallery photos...`);
      const photos = await findMultiProviderPhotos(d.title, d.title, d.state, 12);
      const validPhotos = photos.filter(p => !localUsed.has(p.url) && !globalUsed.has(p.url));

      // Set hero
      if (validPhotos.length > 0) {
        const hero = validPhotos[0];
        localUsed.add(hero.url);
        globalUsed.add(hero.url);
        if (typeof d.heroImage === 'object') {
          d.heroImage.src = hero.url;
          d.heroImage.alt = `${d.title}, ${d.state}`;
        } else {
          d.heroImage = hero.url;
        }
        isModified = true;
        totalPhotosAdded++;
      }

      // Build gallery to exactly 5
      d.gallery = [];
      for (let i = 1; i < validPhotos.length && d.gallery.length < 5; i++) {
        const photo = validPhotos[i];
        if (!localUsed.has(photo.url) && !globalUsed.has(photo.url)) {
          localUsed.add(photo.url);
          globalUsed.add(photo.url);
          d.gallery.push({
            src: photo.url,
            alt: `${d.title} view ${d.gallery.length + 1}`
          });
          isModified = true;
          totalPhotosAdded++;
        }
      }

      // If still less than 5, try broader searches
      while (d.gallery.length < 5) {
        const extra = await findMultiProviderPhotos(`${d.title} tourism landscape`, d.title, d.state, 8);
        for (const e of extra) {
          if (d.gallery.length >= 5) break;
          if (!localUsed.has(e.url) && !globalUsed.has(e.url)) {
            localUsed.add(e.url);
            globalUsed.add(e.url);
            d.gallery.push({
              src: e.url,
              alt: `${d.title} view ${d.gallery.length + 1}`
            });
            isModified = true;
            totalPhotosAdded++;
          }
        }
        if (d.gallery.length >= 5) break;
        console.log(`    Warning: Could only find ${d.gallery.length}/5 gallery photos for ${failure.slug}`);
        break;
      }
    }

    // 2. Fix topPlaces (ensure 3 unique photos each)
    if (Array.isArray(d.topPlaces)) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;

        const placeHasFailure = failure.failures.some(f =>
          f.field.startsWith(`topPlaces[${pIdx}]`)
        );

        if (!placeHasFailure && Array.isArray(place.photos) && place.photos.length >= 3) continue;

        console.log(`    Fixing place: ${placeName}...`);
        const photos = await findMultiProviderPhotos(placeName, d.title, d.state, 8);
        const validPhotos = photos.filter(p => !localUsed.has(p.url) && !globalUsed.has(p.url));

        const placeLocalSeen = new Set();

        // Main image
        if (validPhotos.length > 0) {
          const main = validPhotos[0];
          localUsed.add(main.url);
          globalUsed.add(main.url);
          placeLocalSeen.add(main.url);

          if (typeof place.image === 'object') {
            place.image.src = main.url;
            place.image.alt = `${placeName}, ${d.title}`;
          } else {
            place.image = main.url;
          }
          isModified = true;
          totalPhotosAdded++;
        }

        // Build photos array to exactly 3
        place.photos = [];
        for (const p of validPhotos) {
          if (place.photos.length >= 3) break;
          if (!placeLocalSeen.has(p.url)) {
            placeLocalSeen.add(p.url);
            localUsed.add(p.url);
            globalUsed.add(p.url);
            place.photos.push(p.url);
            isModified = true;
            totalPhotosAdded++;
          }
        }

        // If still < 3, search specifically for this place
        while (place.photos.length < 3) {
          const extra = await findMultiProviderPhotos(`${placeName} ${d.title}`, d.title, d.state, 6);
          for (const e of extra) {
            if (place.photos.length >= 3) break;
            if (!placeLocalSeen.has(e.url) && !localUsed.has(e.url) && !globalUsed.has(e.url)) {
              placeLocalSeen.add(e.url);
              localUsed.add(e.url);
              globalUsed.add(e.url);
              place.photos.push(e.url);
              isModified = true;
              totalPhotosAdded++;
            }
          }
          if (place.photos.length >= 3) break;
          console.log(`      Warning: Could only find ${place.photos.length}/3 photos for ${placeName}`);
          break;
        }
      }
    }

    if (isModified) {
      fs.writeFileSync(destFile, JSON.stringify(d, null, 2) + '\n', 'utf8');
      repaired++;
      console.log(`  -> Saved: ${failure.slug} (+${totalPhotosAdded} photos total)`);
    }

    processed++;
  }

  console.log(`\n========================================================================`);
  console.log(`  REPAIR COMPLETE`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Repaired:  ${repaired}`);
  console.log(`  Total photos added: ${totalPhotosAdded}`);
  console.log(`========================================================================\n`);

  return { processed, repaired, totalPhotosAdded };
}

if (require.main === module) {
  runFullRepair().catch(console.error);
}

module.exports = { runFullRepair };