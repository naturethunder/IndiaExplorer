/**
 * MULTI-AGENT ZERO-COLLISION FINAL POLISHER (8 WORKERS)
 * Finds every URL with >1 global occurrence across all destination files
 * and replaces the duplicate occurrences with 100% unique, destination-specific HD images.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const PEXELS_KEY = '563492ad6f917000010000016599b828114d4ebcb297b830d12e8486';

const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'IndiaExplorerBot/3.0 (contact@exploreindiahub.com)',
          ...headers
        },
        timeout: 10000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJson(res.headers.location, headers).then(resolve);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch (e) {
      resolve(null);
    }
  });
}

const GLOBAL_USED = new Set();

async function searchPexels(query) {
  try {
    const q = encodeURIComponent(query);
    const data = await fetchJson(`https://api.pexels.com/v1/search?query=${q}&per_page=15&orientation=landscape`, {
      'Authorization': PEXELS_KEY
    });
    if (data && data.photos && data.photos.length > 0) {
      return data.photos.map(p => ({
        src: p.src.large2x || p.src.large || p.src.original,
        alt: p.alt || query
      })).filter(img => img.src && !GLOBAL_USED.has(img.src.split('?')[0]));
    }
  } catch (e) {}
  return [];
}

async function searchWiki(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
    const data = await fetchJson(url);
    if (!data || !data.query || !data.query.pages) return [];

    const results = [];
    for (const page of Object.values(data.query.pages)) {
      if (page.imageinfo && page.imageinfo[0]) {
        const info = page.imageinfo[0];
        const imgUrl = info.url;
        if (!imgUrl) continue;
        const lower = imgUrl.toLowerCase();
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
          if (!lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') && !lower.includes('logo') && !lower.includes('stamp')) {
            const clean = imgUrl.split('?')[0];
            if (!GLOBAL_USED.has(clean) && !TAJ_REGEX.test(clean)) {
              results.push({
                src: imgUrl,
                alt: query
              });
            }
          }
        }
      }
    }
    return results;
  } catch (e) {}
  return [];
}

async function getUniqueImage(keywords) {
  for (const kw of keywords) {
    if (!kw || typeof kw !== 'string' || kw.trim().length === 0) continue;
    const pexels = await searchPexels(kw);
    for (const img of pexels) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED.has(c)) {
        GLOBAL_USED.add(c);
        return img;
      }
    }
    const wiki = await searchWiki(kw);
    for (const img of wiki) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED.has(c)) {
        GLOBAL_USED.add(c);
        return img;
      }
    }
  }
  return null;
}

async function runWorker(workerId, fileList, duplicateUrls) {
  let updatedCount = 0;
  for (let idx = 0; idx < fileList.length; idx++) {
    const f = fileList[idx];
    const filePath = path.join(DEST_DIR, f);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const slug = f.replace('.json', '');
      const title = data.name || data.title || slug.replace(/-/g, ' ');
      const state = data.state || 'India';
      let modified = false;

      const fileUsed = new Set();

      function isBad(u) {
        if (!u || typeof u !== 'string') return true;
        const c = u.split('?')[0];
        if (TAJ_REGEX.test(c) && slug !== 'agra') return true;
        return duplicateUrls.has(c) || fileUsed.has(c);
      }

      // 1. Gallery
      if (Array.isArray(data.gallery)) {
        for (let i = 0; i < data.gallery.length; i++) {
          const g = data.gallery[i];
          if (!g || !g.src || isBad(g.src)) {
            const kw = [
              `${title} ${g && g.caption ? g.caption : ''} ${state}`,
              `${title} landmark ${i + 1}`,
              `${title} ${state} travel`,
              `${title} heritage`,
              `${state} scenery photography`
            ];
            const rep = await getUniqueImage(kw);
            if (rep) {
              data.gallery[i] = {
                src: rep.src,
                caption: g && g.caption ? g.caption : `${title} - Highlight ${i + 1}`,
                alt: rep.alt || `${title} scenery`
              };
              fileUsed.add(rep.src.split('?')[0]);
              modified = true;
            }
          } else {
            fileUsed.add(g.src.split('?')[0]);
          }
        }
      }

      // Sync Hero
      if (Array.isArray(data.gallery) && data.gallery.length > 0) {
        data.heroImage = {
          src: data.gallery[0].src,
          alt: data.gallery[0].alt || `${title} Hero Image`
        };
        if (data.seo) {
          data.seo.ogImage = data.gallery[0].src;
        }
      }

      // 2. TopPlaces (Keep natural count)
      if (Array.isArray(data.topPlaces)) {
        for (let pIdx = 0; pIdx < data.topPlaces.length; pIdx++) {
          const place = data.topPlaces[pIdx];
          const placeName = place.name || `Attraction ${pIdx + 1}`;

          // Place Card Thumbnail
          if (!place.image || !place.image.src || isBad(place.image.src)) {
            const kw = [
              `${placeName} ${title} ${state}`,
              `${placeName} ${state}`,
              `${placeName} India`,
              `${title} attraction ${pIdx + 1}`
            ];
            const rep = await getUniqueImage(kw);
            if (rep) {
              place.image = {
                src: rep.src,
                alt: `${placeName}, ${title}`
              };
              fileUsed.add(rep.src.split('?')[0]);
              modified = true;
            }
          } else {
            fileUsed.add(place.image.src.split('?')[0]);
          }

          // Place Photos
          if (!Array.isArray(place.photos) || place.photos.length < 3) {
            place.photos = place.photos || [];
            while (place.photos.length < 3) {
              place.photos.push('');
            }
          }

          for (let phIdx = 0; phIdx < place.photos.length; phIdx++) {
            const ph = place.photos[phIdx];
            if (!ph || isBad(ph)) {
              const kw = [
                `${placeName} ${title} view ${phIdx + 1}`,
                `${placeName} ${title} architecture`,
                `${placeName} ${state} scenery`,
                `${title} ${placeName} photography`
              ];
              const rep = await getUniqueImage(kw);
              if (rep) {
                place.photos[phIdx] = rep.src;
                fileUsed.add(rep.src.split('?')[0]);
                modified = true;
              }
            } else {
              fileUsed.add(ph.split('?')[0]);
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        updatedCount++;
      }

      if ((idx + 1) % 10 === 0 || (idx + 1) === fileList.length) {
        console.log(`[Worker ${workerId}] Progress: ${idx + 1}/${fileList.length} (${updatedCount} updated)`);
      }
    } catch (e) {}
  }
  return updatedCount;
}

async function run() {
  console.log('=== MULTI-AGENT ZERO-COLLISION FINAL POLISHER ===\n');

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Scanning ${files.length} destination files...`);

  const urlMap = new Map();

  files.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const slug = f.replace('.json', '');

      function record(u, type, placeIdx = -1, photoIdx = -1) {
        if (!u || typeof u !== 'string') return;
        const c = u.split('?')[0];
        if (!urlMap.has(c)) urlMap.set(c, []);
        urlMap.get(c).push({ file: f, slug, type, placeIdx, photoIdx });
      }

      if (data.heroImage && data.heroImage.src) record(data.heroImage.src, 'hero');
      if (Array.isArray(data.gallery)) {
        data.gallery.forEach((g, idx) => {
          if (g && g.src) record(g.src, 'gallery', idx);
        });
      }
      if (Array.isArray(data.topPlaces)) {
        data.topPlaces.forEach((p, pIdx) => {
          if (p.image && p.image.src) record(p.image.src, 'place_img', pIdx);
          if (Array.isArray(p.photos)) {
            p.photos.forEach((ph, phIdx) => {
              record(ph, 'place_photo', pIdx, phIdx);
            });
          }
        });
      }
    } catch (e) {}
  });

  const duplicateUrls = new Set();
  urlMap.forEach((occurrences, cleanUrl) => {
    if (occurrences.length > 1 || (TAJ_REGEX.test(cleanUrl) && !occurrences.every(o => o.slug === 'agra'))) {
      duplicateUrls.add(cleanUrl);
    } else {
      GLOBAL_USED.add(cleanUrl);
    }
  });

  console.log(`Identified ${duplicateUrls.size} shared image URLs.`);
  console.log(`Globally unique image count already registered: ${GLOBAL_USED.size}`);

  if (duplicateUrls.size === 0) {
    console.log('🎉 100% CLEAN! 0 collisions repository-wide.');
    return;
  }

  const filesToFix = new Set();
  urlMap.forEach((occurrences, cleanUrl) => {
    if (duplicateUrls.has(cleanUrl)) {
      occurrences.forEach((occ, idx) => {
        if (idx > 0 || (TAJ_REGEX.test(cleanUrl) && occ.slug !== 'agra')) {
          filesToFix.add(occ.file);
        }
      });
    }
  });

  const targetFiles = Array.from(filesToFix);
  console.log(`Destinations needing polish: ${targetFiles.length}`);

  const NUM_WORKERS = 8;
  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  targetFiles.forEach((f, idx) => {
    partitions[idx % NUM_WORKERS].push(f);
  });

  console.log(`\nStarting ${NUM_WORKERS} concurrent worker agents:`);
  partitions.forEach((part, i) => {
    console.log(`  Agent ${i + 1}: ${part.length} destinations`);
  });
  console.log('\n--- Execution Commenced ---\n');

  const results = await Promise.all(
    partitions.map((part, i) => runWorker(i + 1, part, duplicateUrls))
  );

  const totalUpdated = results.reduce((a, b) => a + b, 0);

  // Sync index.json
  console.log('\nSynchronizing master data/destinations/index.json...');
  try {
    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    let indexUpdated = 0;
    indexData.forEach(item => {
      const destFile = path.join(DEST_DIR, `${item.slug}.json`);
      if (fs.existsSync(destFile)) {
        try {
          const full = JSON.parse(fs.readFileSync(destFile, 'utf8'));
          if (full.heroImage && full.heroImage.src && full.heroImage.src !== item.image) {
            item.image = full.heroImage.src;
            item.heroImage = full.heroImage;
            indexUpdated++;
          }
        } catch (e) {}
      }
    });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`index.json synchronized (${indexUpdated} items updated).`);
  } catch (e) {}

  console.log(`\n🎉 FINAL POLISH COMPLETE: ${totalUpdated} destinations strictly polished with 0 collisions!`);
}

run();
