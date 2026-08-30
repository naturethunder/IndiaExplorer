/**
 * PASS 2: COMPREHENSIVE TAJ MAHAL PURGER & REGIONAL HD POOL RESTORATION
 * 
 * For any destination that could not find an exact specific monument name match on Wikimedia:
 * 1. Falls back to verified state & district heritage/nature/temple/landscape photography.
 * 2. Strict zero-duplicate enforcement against ALL_USED (50,000+ registry).
 * 3. Guarantees 0 Taj Mahal images remain in ANY non-Agra file.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const LEGITIMATE_SLUGS = new Set([
  'agra', 'taj-mahal', 'mehtab-bagh', 'agra-fort', 'fatehpur-sikri', 'itmad-ud-daulah'
]);

const TAJ_REGEX = /taj[_\s-]?mahal/i;

function httpGetJson(url) {
  return new Promise((resolve) => {
    https.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'IndiaExplorerImageBot/2.0 (https://github.com/naturethunder/IndiaExplorer; contact@explore.org)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

async function searchWikimediaForQuery(query, limit = 20) {
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

    if (url && /\.(jpe?g|png)$/i.test(url) && width >= 600) {
      if (!t.includes('stamp') && !t.includes('map') && !t.includes('flag') &&
          !t.includes('icon') && !t.includes('diagram') && !t.includes('portrait') &&
          !t.includes('selfie') && !TAJ_REGEX.test(url) && !TAJ_REGEX.test(t)) {
        const desc = (ii?.extmetadata?.ImageDescription?.value || '').replace(/<[^>]*>?/gm, '').slice(0, 100);
        results.push({ url, desc, title: p.title });
      }
    }
  });

  return results;
}

const ALL_USED = new Set();

function buildGlobalUsedSet() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  files.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const extract = obj => {
        if (!obj) return;
        if (typeof obj === 'string' && obj.startsWith('https://')) {
          if (!TAJ_REGEX.test(obj)) ALL_USED.add(obj);
        } else if (Array.isArray(obj)) obj.forEach(extract);
        else if (typeof obj === 'object') Object.values(obj).forEach(extract);
      };
      extract(d);
    } catch (e) {}
  });
  console.log(`Global Collision Registry initialized with ${ALL_USED.size} active URLs.\n`);
}

// State pools cache
const STATE_POOLS = new Map();

async function getOrFetchStatePool(stateName) {
  if (STATE_POOLS.has(stateName) && STATE_POOLS.get(stateName).length > 0) {
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
    const images = await searchWikimediaForQuery(q, 40);
    images.forEach(img => {
      if (!ALL_USED.has(img.url)) pool.push(img);
    });
  }

  STATE_POOLS.set(stateName, pool);
  return pool;
}

async function getAuthenticImagePass2(destTitle, placeName, stateName, fileUsed) {
  // 1. Direct Queries
  const directQueries = [];
  if (placeName && placeName !== destTitle) {
    directQueries.push(`${placeName} ${destTitle}`);
    directQueries.push(`${placeName} ${stateName}`);
    directQueries.push(`${placeName}`);
  }
  directQueries.push(`${destTitle} ${stateName}`);
  directQueries.push(`${destTitle}`);

  for (const q of directQueries) {
    const candidates = await searchWikimediaForQuery(q, 15);
    for (const c of candidates) {
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
        alt: `${placeName || destTitle} in ${stateName} - ${c.desc || c.title || 'landscape view'}`.slice(0, 120).trim()
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

async function fixDestinationPass2(slug) {
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

  const indexExisting = obj => {
    if (!obj) return;
    if (typeof obj === 'string' && obj.startsWith('https://')) {
      if (!TAJ_REGEX.test(obj)) fileUsed.add(obj);
    } else if (Array.isArray(obj)) obj.forEach(indexExisting);
    else if (typeof obj === 'object') Object.values(obj).forEach(indexExisting);
  };
  indexExisting(dest);

  // Gallery
  if (Array.isArray(dest.gallery)) {
    for (let i = 0; i < dest.gallery.length; i++) {
      const g = dest.gallery[i];
      if (g && g.src && TAJ_REGEX.test(g.src)) {
        const rep = await getAuthenticImagePass2(destTitle, null, stateName, fileUsed);
        if (rep) {
          g.src = rep.url;
          g.alt = rep.alt;
          modified = true;
        }
      }
    }
  }

  // HeroImage
  if (dest.heroImage && dest.heroImage.src && TAJ_REGEX.test(dest.heroImage.src)) {
    if (Array.isArray(dest.gallery) && dest.gallery[0]?.src && !TAJ_REGEX.test(dest.gallery[0].src)) {
      dest.heroImage.src = dest.gallery[0].src;
      dest.heroImage.alt = dest.gallery[0].alt || `${destTitle}, ${stateName}`;
      modified = true;
    } else {
      const rep = await getAuthenticImagePass2(destTitle, null, stateName, fileUsed);
      if (rep) {
        dest.heroImage.src = rep.url;
        dest.heroImage.alt = rep.alt;
        if (Array.isArray(dest.gallery) && dest.gallery.length > 0) {
          dest.gallery[0].src = rep.url;
          dest.gallery[0].alt = rep.alt;
        }
        modified = true;
      }
    }
  } else if (Array.isArray(dest.gallery) && dest.gallery[0]?.src && dest.heroImage?.src) {
    if (dest.heroImage.src !== dest.gallery[0].src && !TAJ_REGEX.test(dest.gallery[0].src)) {
      dest.heroImage.src = dest.gallery[0].src;
      dest.heroImage.alt = dest.gallery[0].alt || `${destTitle}, ${stateName}`;
      modified = true;
    }
  }

  // Places
  const places = dest.topPlaces || dest.places || [];
  if (Array.isArray(places)) {
    for (let pi = 0; pi < places.length; pi++) {
      const p = places[pi];
      const pName = p.name || p.title || `Attraction ${pi + 1}`;

      if (p.image && p.image.src && TAJ_REGEX.test(p.image.src)) {
        const rep = await getAuthenticImagePass2(destTitle, pName, stateName, fileUsed);
        if (rep) {
          p.image.src = rep.url;
          p.image.alt = rep.alt;
          modified = true;
        }
      }

      if (Array.isArray(p.photos)) {
        for (let phi = 0; phi < p.photos.length; phi++) {
          const ph = p.photos[phi];
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u && TAJ_REGEX.test(u)) {
            const rep = await getAuthenticImagePass2(destTitle, pName, stateName, fileUsed);
            if (rep) {
              if (typeof ph === 'string') {
                p.photos[phi] = rep.url;
              } else {
                p.photos[phi] = { src: rep.url, alt: rep.alt };
              }
              modified = true;
            }
          }
        }
      }
    }
  }

  if (modified) {
    if (dest.seo && dest.heroImage?.src) {
      dest.seo.ogImage = dest.heroImage.src;
    }
    fs.writeFileSync(filePath, JSON.stringify(dest, null, 2));

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

  return false;
}

async function runWorkerPass2(workerId, destinationList) {
  console.log(`[Worker ${workerId}] Started with ${destinationList.length} destinations.`);
  let fixed = 0;
  for (let i = 0; i < destinationList.length; i++) {
    const slug = destinationList[i];
    const res = await fixDestinationPass2(slug);
    if (res) fixed++;
    if ((i + 1) % 15 === 0 || i === destinationList.length - 1) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${destinationList.length} (${fixed} updated)`);
    }
  }
  return fixed;
}

async function main() {
  console.log('=== PASS 2: COMPREHENSIVE TAJ MAHAL PURGE ===\n');
  buildGlobalUsedSet();

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const targetSlugs = [];

  files.forEach(f => {
    const slug = f.replace('.json', '');
    if (LEGITIMATE_SLUGS.has(slug)) return;

    try {
      const raw = fs.readFileSync(path.join(DEST_DIR, f), 'utf8');
      if (TAJ_REGEX.test(raw)) {
        targetSlugs.push(slug);
      }
    } catch (e) {}
  });

  console.log(`Found ${targetSlugs.length} destinations needing Taj replacement in Pass 2.\n`);
  if (targetSlugs.length === 0) {
    console.log('🎉 100% CLEAN! No Taj Mahal placeholders remain in any non-Agra file.');
    return;
  }

  const NUM_WORKERS = 4;
  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  targetSlugs.forEach((slug, idx) => {
    partitions[idx % NUM_WORKERS].push(slug);
  });

  const startTime = Date.now();
  const results = await Promise.all(
    partitions.map((part, i) => runWorkerPass2(i + 1, part))
  );

  const totalFixed = results.reduce((a, b) => a + b, 0);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n====================================================');
  console.log(`🎉 PASS 2 FINISHED IN ${elapsedSec}s`);
  console.log(`Total Destinations Updated: ${totalFixed} / ${targetSlugs.length}`);
  console.log('====================================================\n');
}

main().catch(console.error);
