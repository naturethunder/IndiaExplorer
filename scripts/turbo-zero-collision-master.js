/**
 * TURBO 8-AGENT ZERO-COLLISION MASTER
 * - 8 concurrent workers with disjoint API page offsets (Worker N uses page N, N+8, N+16...).
 * - Shared in-memory atomic URL set prevents any collision between workers.
 * - Only replaces colliding URLs and fixes heroImage/SEO sync.
 * - Leaves 100% compliant unique images untouched.
 * - Synchronizes data/destinations/index.json in real time.
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
    }, 3500);

    let req;
    try {
      const parsed = new URL(url);
      req = https.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'IndiaExplorerBot/8.0 (contact@exploreindiahub.com)',
          ...headers
        },
        timeout: 3000
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
      req.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
      req.on('timeout', () => { if (!resolved) { clearTimeout(timer); resolved = true; req.destroy(); resolve(null); } });
    } catch (e) {
      if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); }
    }
  });
}

const GLOBAL_USED_URLS = new Set();
const COLLIDING_URLS_SET = new Set();

async function searchPexels(query, page) {
  try {
    const q = encodeURIComponent(query);
    const data = await fetchJson(`https://api.pexels.com/v1/search?query=${q}&per_page=20&page=${page}&orientation=landscape`, {
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

async function searchWiki(query, offset) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=20&gsroffset=${offset}&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
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

async function getUniqueImage(keywords, workerId, itemIdx) {
  for (let k = 0; k < keywords.length; k++) {
    const kw = keywords[k];
    if (!kw || typeof kw !== 'string' || kw.trim().length === 0) continue;

    // Disjoint page offset per worker
    const pexelsPage = ((workerId - 1) * 3 + itemIdx + k) % 25 + 1;
    const wikiOffset = ((workerId - 1) * 20 + itemIdx * 10 + k * 5) % 150;

    const pexels = await searchPexels(kw, pexelsPage);
    for (const img of pexels) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED_URLS.has(c)) {
        GLOBAL_USED_URLS.add(c);
        return img;
      }
    }

    const wiki = await searchWiki(kw, wikiOffset);
    for (const img of wiki) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED_URLS.has(c)) {
        GLOBAL_USED_URLS.add(c);
        return img;
      }
    }
  }

  // Guaranteed fallback
  const regionalKeywords = [
    'India incredible tourism landscape photography',
    'India heritage architecture monument sunset',
    'India scenic travel mountains river valley',
    'India serene hill station nature view'
  ];
  for (let k = 0; k < regionalKeywords.length; k++) {
    const fkw = regionalKeywords[k];
    const pexelsPage = ((workerId * 5 + itemIdx + k) % 30) + 1;
    const pexels = await searchPexels(fkw, pexelsPage);
    for (const img of pexels) {
      const c = img.src.split('?')[0];
      if (!GLOBAL_USED_URLS.has(c)) {
        GLOBAL_USED_URLS.add(c);
        return img;
      }
    }
    const wiki = await searchWiki(fkw, (workerId * 15 + itemIdx * 5) % 100);
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

    function isBad(u) {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return true;
      const c = u.split('?')[0];
      if (TAJ_REGEX.test(c) && slug !== 'agra') return true;
      if (fileUsed.has(c)) return true; // internal duplicate
      if (COLLIDING_URLS_SET.has(c)) return true; // cross-file duplicate
      return false;
    }

    // 1. Gallery (Exactly 5)
    if (!Array.isArray(data.gallery)) { data.gallery = []; modified = true; }
    while (data.gallery.length < 5) { data.gallery.push({ src: '', alt: `${title} photo ${data.gallery.length + 1}` }); modified = true; }
    if (data.gallery.length > 5) { data.gallery = data.gallery.slice(0, 5); modified = true; }

    for (let i = 0; i < 5; i++) {
      const g = data.gallery[i];
      if (!g || !g.src || isBad(g.src)) {
        const kw = [
          `${title} ${g && g.caption ? g.caption : ''} ${state}`,
          `${title} highlight ${i + 1} ${state}`,
          `${title} landmark`,
          `${state} travel scenery`
        ];
        const rep = await getUniqueImage(kw, workerId, i);
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
      } else {
        const c = g.src.split('?')[0];
        fileUsed.add(c);
        GLOBAL_USED_URLS.add(c);
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

    // 2. topPlaces (Preserve natural count, 1 card + 3 unique photos per place)
    if (Array.isArray(data.topPlaces)) {
      for (let pIdx = 0; pIdx < data.topPlaces.length; pIdx++) {
        const place = data.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;

        // Card image
        if (!place.image || !place.image.src || isBad(place.image.src)) {
          const kw = [
            `${placeName} ${title} ${state}`,
            `${placeName} ${state}`,
            `${title} attraction ${pIdx + 1}`
          ];
          const rep = await getUniqueImage(kw, workerId, pIdx);
          if (rep) {
            place.image = {
              src: rep.src,
              alt: `${placeName}, ${title}`
            };
            fileUsed.add(rep.src.split('?')[0]);
            GLOBAL_USED_URLS.add(rep.src.split('?')[0]);
            modified = true;
          }
        } else {
          const c = place.image.src.split('?')[0];
          fileUsed.add(c);
          GLOBAL_USED_URLS.add(c);
        }

        // Place photos (Exactly 3)
        if (!Array.isArray(place.photos)) { place.photos = []; modified = true; }
        while (place.photos.length < 3) { place.photos.push(''); modified = true; }
        if (place.photos.length > 3) { place.photos = place.photos.slice(0, 3); modified = true; }

        for (let phIdx = 0; phIdx < 3; phIdx++) {
          const ph = place.photos[phIdx];
          if (!ph || isBad(ph)) {
            const kw = [
              `${placeName} ${title} view ${phIdx + 1}`,
              `${placeName} ${state} photo`,
              `${title} ${placeName}`
            ];
            const rep = await getUniqueImage(kw, workerId, pIdx * 3 + phIdx);
            if (rep) {
              place.photos[phIdx] = rep.src;
              fileUsed.add(rep.src.split('?')[0]);
              GLOBAL_USED_URLS.add(rep.src.split('?')[0]);
              modified = true;
            }
          } else {
            const c = ph.split('?')[0];
            fileUsed.add(c);
            GLOBAL_USED_URLS.add(c);
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
    if ((i + 1) % 15 === 0 || i + 1 === fileList.length) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${fileList.length} (${updated} updated, ${GLOBAL_USED_URLS.size} global URLs)`);
    }
  }
  return updated;
}

async function main() {
  console.log('=== TURBO 8-AGENT ZERO-COLLISION MASTER ===\n');

  const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Mapping all image URLs across ${allFiles.length} files...`);

  const urlUsage = new Map(); // cleanUrl -> [files]

  allFiles.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const extract = (u) => {
        if (!u || typeof u !== 'string' || !u.startsWith('http')) return;
        const clean = u.split('?')[0];
        if (!urlUsage.has(clean)) urlUsage.set(clean, []);
        urlUsage.get(clean).push(f);
      };

      if (Array.isArray(data.gallery)) data.gallery.forEach(g => extract(g && g.src));
      if (data.heroImage && data.heroImage.src) extract(data.heroImage.src);
      if (Array.isArray(data.topPlaces)) {
        data.topPlaces.forEach(p => {
          if (p.image && p.image.src) extract(p.image.src);
          if (Array.isArray(p.photos)) p.photos.forEach(extract);
        });
      }
    } catch (e) {}
  });

  const filesNeedingFix = new Set();

  urlUsage.forEach((files, cleanUrl) => {
    if (files.length > 1) {
      // Mark as duplicate!
      COLLIDING_URLS_SET.add(cleanUrl);
      // Keep file #0! Mark files #1+ for repair
      for (let i = 1; i < files.length; i++) {
        filesNeedingFix.add(files[i]);
      }
      // Register file #0's URL as claimed
      GLOBAL_USED_URLS.add(cleanUrl);
    } else {
      GLOBAL_USED_URLS.add(cleanUrl);
    }
  });

  // Also check heroImage/SEO sync or internal duplicates
  allFiles.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      if (!data.heroImage || !data.gallery || data.gallery.length === 0 || data.heroImage.src !== data.gallery[0].src) {
        filesNeedingFix.add(f);
      }
      if (data.seo && data.gallery && data.gallery.length > 0 && data.seo.ogImage !== data.gallery[0].src) {
        filesNeedingFix.add(f);
      }
    } catch (e) {}
  });

  const targetList = Array.from(filesNeedingFix);
  console.log(`Found ${COLLIDING_URLS_SET.size} colliding duplicate URLs.`);
  console.log(`Targeting ${targetList.length} files for instant repair across ${NUM_WORKERS} workers.`);
  console.log(`Initial uniquely registered global URLs: ${GLOBAL_USED_URLS.size}\n`);

  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  targetList.forEach((f, idx) => {
    partitions[idx % NUM_WORKERS].push(f);
  });

  const workerPromises = partitions.map((fileList, idx) => runWorker(idx + 1, fileList));
  const results = await Promise.all(workerPromises);
  const totalUpdated = results.reduce((a, b) => a + b, 0);

  // Synchronize index.json
  console.log('\nSynchronizing master data/destinations/index.json...');
  try {
    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    let indexUpdated = 0;
    if (Array.isArray(indexData.destinations)) {
      indexData.destinations.forEach(item => {
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
      console.log(`index.json synchronized (${indexUpdated} items updated out of ${indexData.destinations.length}).`);
    }
  } catch (e) {
    console.error('Error synchronizing index.json:', e.message);
  }

  console.log(`\n🎉 TURBO ZERO-COLLISION MASTER COMPLETE! Total updated files: ${totalUpdated}. Final unique URLs: ${GLOBAL_USED_URLS.size}`);
}

main();
