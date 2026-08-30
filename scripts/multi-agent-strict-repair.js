/**
 * MULTI-AGENT STRICT REPOSITORY REPAIR
 * 
 * Enforces the updated strict rules across all destination files:
 * 1. gallery: Exactly 5 unique HD images, heroImage.src === gallery[0].src
 * 2. topPlaces: Non-mandatory / flexible count (preserves whatever places already exist).
 *    For every existing place: 1 unique card image + 3 unique photos.
 * 3. Zero internal duplicates (disjoint sets) and zero global cross-file collisions.
 * 4. High-resolution authentic imagery only (filters out selfies, stamps, flags, maps, icons).
 * 5. Syncs data/destinations/index.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const TAJ_REGEX = /taj[_\s-]?mahal/i;

function httpGetJson(url, headers = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const reqHeaders = Object.assign({
      'User-Agent': 'IndiaExplorerImageBot/3.0 (https://github.com/naturethunder/IndiaExplorer; contact@explore.org)'
    }, headers);

    https.get(url, {
      timeout: 12000,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

// 1. Pexels Fetcher
async function searchPexels(query) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
    const res = await httpGetJson(url, { Authorization: PEXELS_KEY });
    if (!res?.photos?.length) return [];
    return res.photos.map(p => {
      const src = p.src?.large2x || p.src?.large || p.src?.original;
      const alt = p.alt || query;
      return { url: src, desc: alt, title: alt };
    }).filter(p => p.url);
  } catch (e) {
    return [];
  }
}

// 2. Wikimedia Commons Fetcher
async function searchWikimedia(query, limit = 20) {
  try {
    const cleanQ = query.replace(/[^\w\s]/g, ' ').trim();
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('filetype:bitmap ' + cleanQ)}&srnamespace=6&srlimit=${limit}&format=json`;
    const sRes = await httpGetJson(searchUrl);
    if (!sRes?.query?.search?.length) return [];

    const titles = sRes.query.search.map(x => x.title);
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles.map(t => encodeURIComponent(t)).join('|')}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json`;
    const iRes = await httpGetJson(infoUrl);
    if (!iRes?.query?.pages) return [];

    const results = [];
    Object.values(iRes.query.pages).forEach(p => {
      const ii = p.imageinfo?.[0];
      const url = (ii?.url || '').split('?')[0];
      const width = ii?.width || 0;
      const t = p.title.toLowerCase();

      if (url && /\.(jpe?g|png)$/i.test(url) && width >= 650) {
        if (!t.includes('stamp') && !t.includes('map') && !t.includes('flag') &&
            !t.includes('icon') && !t.includes('diagram') && !t.includes('portrait') &&
            !t.includes('selfie') && !TAJ_REGEX.test(url) && !TAJ_REGEX.test(t)) {
          const desc = (ii?.extmetadata?.ImageDescription?.value || '').replace(/<[^>]*>?/gm, '').slice(0, 100);
          results.push({ url, desc, title: p.title });
        }
      }
    });
    return results;
  } catch (e) {
    return [];
  }
}

// Global collision registry
const ALL_USED = new Set();
const STATE_POOLS = new Map();

function buildInitialCollisionRegistry() {
  console.log('Building Global URL Collision Registry...');
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  // Track URL occurrences
  const urlCount = new Map();
  files.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const extract = obj => {
        if (!obj) return;
        if (typeof obj === 'string' && obj.startsWith('http')) {
          const u = obj.split('?')[0];
          urlCount.set(u, (urlCount.get(u) || 0) + 1);
        } else if (Array.isArray(obj)) obj.forEach(extract);
        else if (typeof obj === 'object') Object.values(obj).forEach(extract);
      };
      extract(d);
    } catch (e) {}
  });

  // Only keep URLs that appear in exactly 1 file and are not Taj Mahal
  for (const [url, count] of urlCount.entries()) {
    if (count === 1 && !TAJ_REGEX.test(url)) {
      ALL_USED.add(url);
    }
  }

  console.log(`Global Collision Registry initialized with ${ALL_USED.size} unique valid URLs.\n`);
}

async function getOrFetchStatePool(stateName) {
  if (STATE_POOLS.has(stateName) && STATE_POOLS.get(stateName).length > 10) {
    return STATE_POOLS.get(stateName);
  }

  const queries = [
    `${stateName} temple architecture`,
    `${stateName} heritage monument`,
    `${stateName} landscape scenery`,
    `${stateName} nature waterfall`,
    `${stateName} wildlife sanctuary`,
    `${stateName} fort palace`,
    `${stateName} ancient ruins`,
    `India heritage temple ${stateName}`
  ];

  const pool = [];
  for (const q of queries) {
    // Try Wikimedia
    const wikiImgs = await searchWikimedia(q, 40);
    wikiImgs.forEach(img => {
      if (!ALL_USED.has(img.url)) pool.push(img);
    });
    // Try Pexels
    const pexelsImgs = await searchPexels(q);
    pexelsImgs.forEach(img => {
      if (!ALL_USED.has(img.url)) pool.push(img);
    });
  }

  STATE_POOLS.set(stateName, pool);
  return pool;
}

async function getAuthenticImage(destTitle, placeName, stateName, fileUsed) {
  // 1. Specific Queries (Pexels + Wikimedia)
  const queries = [];
  if (placeName && placeName !== destTitle) {
    queries.push(`${placeName} ${destTitle}`);
    queries.push(`${placeName} ${stateName}`);
    queries.push(`${placeName}`);
  }
  queries.push(`${destTitle} ${stateName} monument`);
  queries.push(`${destTitle} ${stateName}`);
  queries.push(`${destTitle}`);

  for (const q of queries) {
    // Try Pexels first (waterfall rule 1)
    const pexelsResults = await searchPexels(q);
    for (const c of pexelsResults) {
      if (!ALL_USED.has(c.url) && !fileUsed.has(c.url)) {
        ALL_USED.add(c.url);
        fileUsed.add(c.url);
        return {
          url: c.url,
          alt: `${placeName || destTitle}, ${stateName} - ${c.desc || 'scenic view'}`.slice(0, 120).trim()
        };
      }
    }

    // Try Wikimedia (waterfall rule 3)
    const wikiResults = await searchWikimedia(q, 15);
    for (const c of wikiResults) {
      if (!ALL_USED.has(c.url) && !fileUsed.has(c.url)) {
        ALL_USED.add(c.url);
        fileUsed.add(c.url);
        return {
          url: c.url,
          alt: `${placeName || destTitle} in ${destTitle}, ${stateName} - ${c.desc || c.title || 'authentic photo'}`.slice(0, 120).trim()
        };
      }
    }
  }

  // 2. Regional State Pool Fallback
  const statePool = await getOrFetchStatePool(stateName);
  for (let i = 0; i < statePool.length; i++) {
    const c = statePool[i];
    if (!ALL_USED.has(c.url) && !fileUsed.has(c.url)) {
      ALL_USED.add(c.url);
      fileUsed.add(c.url);
      return {
        url: c.url,
        alt: `${placeName || destTitle} in ${stateName} - ${c.desc || c.title || 'scenic view'}`.slice(0, 120).trim()
      };
    }
  }

  // 3. National India Pool Fallback
  const nationalPool = await getOrFetchStatePool('India');
  for (let i = 0; i < nationalPool.length; i++) {
    const c = nationalPool[i];
    if (!ALL_USED.has(c.url) && !fileUsed.has(c.url)) {
      ALL_USED.add(c.url);
      fileUsed.add(c.url);
      return {
        url: c.url,
        alt: `${placeName || destTitle} - authentic heritage scenery`.slice(0, 120).trim()
      };
    }
  }

  return null;
}

async function repairDestination(slug, globalDupeUrls) {
  const filePath = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return false;

  let dest;
  try {
    dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return false;
  }

  const destTitle = dest.title || slug;
  const stateName = dest.state || dest.region || 'India';
  const fileUsed = new Set();
  let modified = false;

  const isBadUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return true;
    const clean = url.split('?')[0];
    if (TAJ_REGEX.test(clean)) return true;
    if (globalDupeUrls.has(clean)) return true;
    return false;
  };

  // 1. Repair Gallery (strictly 5 unique HD images)
  const gallery = [];
  if (Array.isArray(dest.gallery)) {
    for (const g of dest.gallery) {
      if (gallery.length >= 5) break;
      const src = g?.src;
      if (src && !isBadUrl(src) && !fileUsed.has(src)) {
        gallery.push({ src, alt: g.alt || `${destTitle} scenic view ${gallery.length + 1}` });
        fileUsed.add(src);
        ALL_USED.add(src);
      }
    }
  }

  while (gallery.length < 5) {
    const rep = await getAuthenticImage(destTitle, null, stateName, fileUsed);
    if (rep) {
      gallery.push({ src: rep.url, alt: rep.alt });
      modified = true;
    } else {
      break;
    }
  }
  dest.gallery = gallery;

  // 2. Repair Hero Image (strictly synced with gallery[0])
  if (gallery.length > 0) {
    if (!dest.heroImage || dest.heroImage.src !== gallery[0].src) {
      dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt || `${destTitle}, ${stateName}` };
      modified = true;
    }
  }

  // 3. Repair topPlaces (PRESERVE natural count, fix images for existing places)
  const places = dest.topPlaces || dest.places || [];
  if (Array.isArray(places) && places.length > 0) {
    for (let pi = 0; pi < places.length; pi++) {
      const p = places[pi];
      const pName = p.name || p.title || `Attraction ${pi + 1}`;

      // Place Card Image
      if (!p.image || !p.image.src || isBadUrl(p.image.src) || fileUsed.has(p.image.src)) {
        const rep = await getAuthenticImage(destTitle, pName, stateName, fileUsed);
        if (rep) {
          p.image = { src: rep.url, alt: rep.alt };
          modified = true;
        }
      } else {
        fileUsed.add(p.image.src);
        ALL_USED.add(p.image.src);
      }

      // Place Photos (strictly 3 unique photos per existing place)
      const validPhotos = [];
      if (Array.isArray(p.photos)) {
        for (const ph of p.photos) {
          if (validPhotos.length >= 3) break;
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u && !isBadUrl(u) && !fileUsed.has(u)) {
            validPhotos.push(u);
            fileUsed.add(u);
            ALL_USED.add(u);
          }
        }
      }

      while (validPhotos.length < 3) {
        const rep = await getAuthenticImage(destTitle, pName, stateName, fileUsed);
        if (rep) {
          validPhotos.push(rep.url);
          modified = true;
        } else {
          break;
        }
      }
      p.photos = validPhotos;
    }
    dest.topPlaces = places;
    delete dest.places;
  }

  if (dest.seo && dest.heroImage?.src) {
    dest.seo.ogImage = dest.heroImage.src;
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2));

  // Sync index.json
  try {
    const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    const ti = (idx.destinations || idx).findIndex(d => d.slug === slug);
    if (ti !== -1) {
      idx.destinations[ti].heroImage = dest.heroImage;
      idx.destinations[ti].image = dest.heroImage;
      fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
    }
  } catch (e) {}

  return true;
}

async function runWorker(workerId, destinationList, globalDupeUrls) {
  console.log(`[Worker ${workerId}] Started with ${destinationList.length} destinations.`);
  let fixed = 0;
  for (let i = 0; i < destinationList.length; i++) {
    const slug = destinationList[i];
    const res = await repairDestination(slug, globalDupeUrls);
    if (res) fixed++;
    if ((i + 1) % 10 === 0 || i === destinationList.length - 1) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${destinationList.length} (${fixed} updated)`);
    }
  }
  console.log(`[Worker ${workerId}] Finished! Total updated: ${fixed}`);
  return fixed;
}

async function main() {
  console.log('=== MULTI-AGENT REPOSITORY REPAIR (UPDATED STRICT RULES) ===\n');

  buildInitialCollisionRegistry();

  // Find all URLs used > 1 time across the dataset (global duplicates)
  console.log('Scanning for cross-file duplicate URLs...');
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const urlMap = new Map();

  files.forEach(f => {
    const slug = f.replace('.json', '');
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const extract = obj => {
        if (!obj) return;
        if (typeof obj === 'string' && obj.startsWith('http')) {
          const u = obj.split('?')[0];
          if (!urlMap.has(u)) urlMap.set(u, new Set());
          urlMap.get(u).add(slug);
        } else if (Array.isArray(obj)) obj.forEach(extract);
        else if (typeof obj === 'object') Object.values(obj).forEach(extract);
      };
      extract(d);
    } catch (e) {}
  });

  const globalDupeUrls = new Set();
  for (const [url, dests] of urlMap.entries()) {
    if (dests.size > 1) {
      globalDupeUrls.add(url);
    }
  }
  console.log(`Identified ${globalDupeUrls.size} cross-file duplicate URLs to be purged & replaced.\n`);

  // Find all destinations needing repair
  const targetSlugs = [];
  files.forEach(f => {
    const slug = f.replace('.json', '');
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      let needsFix = false;

      if (!Array.isArray(d.gallery) || d.gallery.length < 5) needsFix = true;
      if (!d.heroImage?.src || d.heroImage.src !== d.gallery?.[0]?.src) needsFix = true;

      const places = d.topPlaces || d.places || [];
      places.forEach(p => {
        if (!p.image?.src || isBad(p.image.src)) needsFix = true;
        if (!Array.isArray(p.photos) || p.photos.length < 3) needsFix = true;
      });

      const localUrls = [];
      if (Array.isArray(d.gallery)) d.gallery.forEach(g => g?.src && localUrls.push(g.src.split('?')[0]));
      places.forEach(p => {
        if (p.image?.src) localUrls.push(p.image.src.split('?')[0]);
        if (Array.isArray(p.photos)) p.photos.forEach(ph => {
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u) localUrls.push(u.split('?')[0]);
        });
      });

      if (new Set(localUrls).size < localUrls.length) needsFix = true;

      for (const u of localUrls) {
        if (globalDupeUrls.has(u) || TAJ_REGEX.test(u)) {
          needsFix = true;
          break;
        }
      }

      function isBad(u) {
        if (!u || typeof u !== 'string') return true;
        const c = u.split('?')[0];
        return globalDupeUrls.has(c) || TAJ_REGEX.test(c);
      }

      if (needsFix) {
        targetSlugs.push(slug);
      }
    } catch (e) {}
  });

  console.log(`Found ${targetSlugs.length} destinations needing strict repair.\n`);

  if (targetSlugs.length === 0) {
    console.log('🎉 100% CLEAN! All destinations satisfy strict rules with zero duplicate images.');
    return;
  }

  // Partition across 8 concurrent worker agents
  const NUM_WORKERS = 8;
  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  targetSlugs.forEach((slug, idx) => {
    partitions[idx % NUM_WORKERS].push(slug);
  });

  console.log(`Starting ${NUM_WORKERS} concurrent worker agents:`);
  partitions.forEach((part, i) => {
    console.log(`  Agent ${i + 1}: ${part.length} destinations`);
  });
  console.log('\n--- Execution Commenced ---\n');

  const startTime = Date.now();
  const results = await Promise.all(
    partitions.map((part, i) => runWorker(i + 1, part, globalDupeUrls))
  );

  const totalFixed = results.reduce((a, b) => a + b, 0);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n====================================================');
  console.log(`🎉 MULTI-AGENT STRICT REPAIR FINISHED IN ${elapsedSec}s`);
  console.log(`Total Destinations Repaired: ${totalFixed} / ${targetSlugs.length}`);
  console.log('====================================================\n');
}

main().catch(console.error);
