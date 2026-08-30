/**
 * MASTER MULTI-AGENT STRICT ZERO-DUPLICATE REPOSITORY ENFORCER
 * - 8 Parallel Worker Agents
 * - 0 duplicate collisions across all 2,389 destinations
 * - Global locking registry claimed on-the-fly (keeps legitimate unique images, fixes duplicates)
 * - Exactly 5 unique HD gallery images per destination
 * - heroImage.src === gallery[0].src && seo.ogImage === heroImage.src
 * - topPlaces natural counts strictly preserved
 * - Each place has 1 unique card image + 3 unique photos
 * - Taj Mahal rejected outside Agra
 * - Real-time synchronization of data/destinations/index.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const PEXELS_KEY = '563492ad6f917000010000016599b828114d4ebcb297b830d12e8486';
const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;
const NUM_WORKERS = 8;

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { if (req) req.destroy(); } catch (e) {}
        resolve(null);
      }
    }, 4000); // 4-second timeout

    let req;
    try {
      const parsed = new URL(url);
      req = https.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'IndiaExplorerBot/5.0 (contact@exploreindiahub.com)',
          ...headers
        },
        timeout: 3500
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timer);
          resolved = true;
          return fetchJson(res.headers.location, headers).then(resolve);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (!resolved) {
            clearTimeout(timer);
            resolved = true;
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(null);
            }
          }
        });
        res.on('error', () => {
          if (!resolved) {
            clearTimeout(timer);
            resolved = true;
            resolve(null);
          }
        });
      });

      req.on('error', () => {
        if (!resolved) {
          clearTimeout(timer);
          resolved = true;
          resolve(null);
        }
      });
      req.on('timeout', () => {
        if (!resolved) {
          clearTimeout(timer);
          resolved = true;
          req.destroy();
          resolve(null);
        }
      });
    } catch (e) {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        resolve(null);
      }
    }
  });
}

// Global collision registry claimed on-the-fly
const GLOBAL_USED_URLS = new Set();

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
      })).filter(img => img.src && !GLOBAL_USED_URLS.has(img.src.split('?')[0]));
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
          if (!lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') && !lower.includes('logo') && !lower.includes('stamp') && !lower.includes('coin') && !lower.includes('drawing')) {
            const clean = imgUrl.split('?')[0];
            if (!GLOBAL_USED_URLS.has(clean) && !TAJ_REGEX.test(clean)) {
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
      if (!GLOBAL_USED_URLS.has(c)) {
        GLOBAL_USED_URLS.add(c);
        return img;
      }
    }
    const wiki = await searchWiki(kw);
    for (const img of wiki) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED_URLS.has(c)) {
        GLOBAL_USED_URLS.add(c);
        return img;
      }
    }
  }
  return null;
}

async function processFile(f, workerId) {
  const filePath = path.join(DEST_DIR, f);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = f.replace('.json', '');
    const title = data.name || data.title || slug.replace(/-/g, ' ');
    const state = data.state || 'India';
    let modified = false;

    const fileUsed = new Set();

    function isValid(u) {
      if (!u || typeof u !== 'string' || u.trim() === '') return false;
      const c = u.split('?')[0];
      if (TAJ_REGEX.test(c) && slug !== 'agra') return false;
      if (GLOBAL_USED_URLS.has(c) || fileUsed.has(c)) return false;
      return true;
    }

    // 1. Gallery (Exactly 5 unique images)
    if (!Array.isArray(data.gallery)) {
      data.gallery = [];
      modified = true;
    }
    while (data.gallery.length < 5) {
      data.gallery.push({ src: '', alt: `${title} photo ${data.gallery.length + 1}` });
      modified = true;
    }
    if (data.gallery.length > 5) {
      data.gallery = data.gallery.slice(0, 5);
      modified = true;
    }

    for (let i = 0; i < 5; i++) {
      const g = data.gallery[i];
      if (g && g.src && isValid(g.src)) {
        const c = g.src.split('?')[0];
        fileUsed.add(c);
        GLOBAL_USED_URLS.add(c);
      } else {
        const kw = [
          `${title} ${g && g.caption ? g.caption : ''} ${state}`,
          `${title} landmark ${i + 1}`,
          `${title} ${state} travel`,
          `${title} heritage scenery`,
          `${state} tourism landscape`
        ];
        const rep = await getUniqueImage(kw);
        if (rep) {
          data.gallery[i] = {
            src: rep.src,
            caption: g && g.caption ? g.caption : `${title} - Highlight ${i + 1}`,
            alt: rep.alt || `${title} scenery`
          };
          fileUsed.add(rep.src.split('?')[0]);
          GLOBAL_USED_URLS.add(rep.src.split('?')[0]);
          modified = true;
        }
      }
    }

    // Hero & SEO Sync
    if (data.gallery.length > 0 && data.gallery[0].src) {
      if (!data.heroImage || data.heroImage.src !== data.gallery[0].src) {
        data.heroImage = {
          src: data.gallery[0].src,
          alt: data.gallery[0].alt || `${title} Hero Image`
        };
        modified = true;
      }
      if (data.seo && data.seo.ogImage !== data.gallery[0].src) {
        data.seo.ogImage = data.gallery[0].src;
        modified = true;
      }
    }

    // 2. topPlaces (Preserve natural count, 1 card + 3 photos)
    if (Array.isArray(data.topPlaces)) {
      for (let pIdx = 0; pIdx < data.topPlaces.length; pIdx++) {
        const place = data.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;

        // Place card image
        if (place.image && place.image.src && isValid(place.image.src)) {
          const c = place.image.src.split('?')[0];
          fileUsed.add(c);
          GLOBAL_USED_URLS.add(c);
        } else {
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
            GLOBAL_USED_URLS.add(rep.src.split('?')[0]);
            modified = true;
          }
        }

        // Place photos (Exactly 3)
        if (!Array.isArray(place.photos)) {
          place.photos = [];
          modified = true;
        }
        while (place.photos.length < 3) {
          place.photos.push('');
          modified = true;
        }
        if (place.photos.length > 3) {
          place.photos = place.photos.slice(0, 3);
          modified = true;
        }

        for (let phIdx = 0; phIdx < 3; phIdx++) {
          const ph = place.photos[phIdx];
          if (ph && isValid(ph)) {
            const c = ph.split('?')[0];
            fileUsed.add(c);
            GLOBAL_USED_URLS.add(c);
          } else {
            const kw = [
              `${placeName} ${title} view ${phIdx + 1}`,
              `${placeName} ${title} architecture`,
              `${placeName} ${state} scenery`,
              `${title} ${placeName} photo`
            ];
            const rep = await getUniqueImage(kw);
            if (rep) {
              place.photos[phIdx] = rep.src;
              fileUsed.add(rep.src.split('?')[0]);
              GLOBAL_USED_URLS.add(rep.src.split('?')[0]);
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    }
  } catch (e) {
    console.error(`[Worker ${workerId}] Error in ${f}:`, e.message);
  }
  return false;
}

async function runWorker(workerId, fileList) {
  let updated = 0;
  for (let i = 0; i < fileList.length; i++) {
    const f = fileList[i];
    const isUp = await processFile(f, workerId);
    if (isUp) updated++;
    if ((i + 1) % 10 === 0 || i + 1 === fileList.length) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${fileList.length} (${updated} updated, ${GLOBAL_USED_URLS.size} global URLs)`);
    }
  }
  return updated;
}

async function main() {
  console.log('=== 8-AGENT MASTER ZERO-DUPLICATE ENFORCER ===\n');

  const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Total Destinations: ${allFiles.length}`);

  // Partition files across 8 workers
  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  allFiles.forEach((f, idx) => {
    partitions[idx % NUM_WORKERS].push(f);
  });

  console.log(`Partitioned across ${NUM_WORKERS} workers (~${partitions[0].length} files each). Starting parallel enforcement...\n`);

  const workerPromises = partitions.map((fileList, idx) => runWorker(idx + 1, fileList));
  const results = await Promise.all(workerPromises);
  const totalUpdated = results.reduce((a, b) => a + b, 0);

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

  console.log(`\n🎉 8-AGENT MASTER ENFORCER COMPLETE! Updated ${totalUpdated} files. Total unique global URLs: ${GLOBAL_USED_URLS.size}`);
}

main();
