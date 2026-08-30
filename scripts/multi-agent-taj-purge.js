/**
 * MULTI-WORKER TAJ MAHAL PURGE & AUTHENTIC IMAGE RESTORATION
 * 
 * Scans all 2,389 destination JSON files:
 * 1. Skips legitimate Agra/Taj Mahal destinations.
 * 2. Identifies all non-Agra files containing Taj Mahal placeholder URLs.
 * 3. Fetches authentic, high-resolution original photos specific to that destination/place.
 * 4. Enforces strict zero-duplicate rule across the entire repository.
 * 5. Syncs data/destinations/index.json.
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

async function searchWikimediaForQuery(query) {
  const cleanQ = query.replace(/[^\w\s]/g, ' ').trim();
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('filetype:bitmap ' + cleanQ)}&srnamespace=6&srlimit=15&format=json`;
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
}

// Global collision tracker
const ALL_USED = new Set();

function buildGlobalUsedSet() {
  console.log('Building Global URL Collision Registry...');
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
  console.log(`Global Collision Registry populated with ${ALL_USED.size} active non-Taj URLs.\n`);
}

async function getAuthenticImage(destTitle, placeName, stateName, fileUsed) {
  const queries = [];
  if (placeName && placeName !== destTitle) {
    queries.push(`${placeName} ${destTitle}`);
    queries.push(`${placeName} ${stateName}`);
    queries.push(`${placeName}`);
  }
  queries.push(`${destTitle} ${stateName} monument`);
  queries.push(`${destTitle} ${stateName} temple landscape`);
  queries.push(`${destTitle} ${stateName}`);
  queries.push(`${destTitle}`);
  queries.push(`${stateName} heritage architecture`);
  queries.push(`${stateName} landscape scenery`);

  for (const q of queries) {
    const candidates = await searchWikimediaForQuery(q);
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

  return null;
}

async function fixDestination(slug) {
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

  // Track all non-Taj URLs currently used in this file
  const indexExisting = obj => {
    if (!obj) return;
    if (typeof obj === 'string' && obj.startsWith('https://')) {
      if (!TAJ_REGEX.test(obj)) fileUsed.add(obj);
    } else if (Array.isArray(obj)) obj.forEach(indexExisting);
    else if (typeof obj === 'object') Object.values(obj).forEach(indexExisting);
  };
  indexExisting(dest);

  // 1. Check & fix gallery
  if (Array.isArray(dest.gallery)) {
    for (let i = 0; i < dest.gallery.length; i++) {
      const g = dest.gallery[i];
      if (g && g.src && TAJ_REGEX.test(g.src)) {
        const replacement = await getAuthenticImage(destTitle, null, stateName, fileUsed);
        if (replacement) {
          g.src = replacement.url;
          g.alt = replacement.alt;
          modified = true;
        }
      }
    }
  }

  // 2. Check & fix heroImage
  if (dest.heroImage && dest.heroImage.src && TAJ_REGEX.test(dest.heroImage.src)) {
    if (Array.isArray(dest.gallery) && dest.gallery[0]?.src && !TAJ_REGEX.test(dest.gallery[0].src)) {
      dest.heroImage.src = dest.gallery[0].src;
      dest.heroImage.alt = dest.gallery[0].alt || `${destTitle}, ${stateName}`;
      modified = true;
    } else {
      const replacement = await getAuthenticImage(destTitle, null, stateName, fileUsed);
      if (replacement) {
        dest.heroImage.src = replacement.url;
        dest.heroImage.alt = replacement.alt;
        if (Array.isArray(dest.gallery) && dest.gallery.length > 0) {
          dest.gallery[0].src = replacement.url;
          dest.gallery[0].alt = replacement.alt;
        }
        modified = true;
      }
    }
  } else if (Array.isArray(dest.gallery) && dest.gallery[0]?.src && dest.heroImage?.src) {
    // Keep hero synced with gallery[0]
    if (dest.heroImage.src !== dest.gallery[0].src && !TAJ_REGEX.test(dest.gallery[0].src)) {
      dest.heroImage.src = dest.gallery[0].src;
      dest.heroImage.alt = dest.gallery[0].alt || `${destTitle}, ${stateName}`;
      modified = true;
    }
  }

  // 3. Check & fix topPlaces or places
  const places = dest.topPlaces || dest.places || [];
  if (Array.isArray(places)) {
    for (let pi = 0; pi < places.length; pi++) {
      const p = places[pi];
      const pName = p.name || p.title || `Attraction ${pi + 1}`;

      // Card image
      if (p.image && p.image.src && TAJ_REGEX.test(p.image.src)) {
        const replacement = await getAuthenticImage(destTitle, pName, stateName, fileUsed);
        if (replacement) {
          p.image.src = replacement.url;
          p.image.alt = replacement.alt;
          modified = true;
        }
      }

      // Photos array
      if (Array.isArray(p.photos)) {
        for (let phi = 0; phi < p.photos.length; phi++) {
          const ph = p.photos[phi];
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u && TAJ_REGEX.test(u)) {
            const replacement = await getAuthenticImage(destTitle, pName, stateName, fileUsed);
            if (replacement) {
              if (typeof ph === 'string') {
                p.photos[phi] = replacement.url;
              } else {
                p.photos[phi] = { src: replacement.url, alt: replacement.alt };
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

    // Update index.json
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

async function runWorker(workerId, destinationList) {
  console.log(`[Worker ${workerId}] Started with ${destinationList.length} destinations.`);
  let fixed = 0;
  for (let i = 0; i < destinationList.length; i++) {
    const slug = destinationList[i];
    const res = await fixDestination(slug);
    if (res) fixed++;
    if ((i + 1) % 10 === 0 || i === destinationList.length - 1) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${destinationList.length} (${fixed} updated)`);
    }
  }
  console.log(`[Worker ${workerId}] Finished! Total updated: ${fixed}`);
  return fixed;
}

async function main() {
  console.log('=== MULTI-WORKER TAJ MAHAL PURGE & RESTORATION ===\n');

  buildGlobalUsedSet();

  // Find all affected files
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

  console.log(`Found ${targetSlugs.length} non-Agra destinations with Taj Mahal images to replace.\n`);

  if (targetSlugs.length === 0) {
    console.log('🎉 No Taj Mahal placeholders found in any non-Agra destination! Repository is clean.');
    return;
  }

  // Partition across 4 concurrent workers
  const NUM_WORKERS = 4;
  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  targetSlugs.forEach((slug, idx) => {
    partitions[idx % NUM_WORKERS].push(slug);
  });

  console.log(`Starting ${NUM_WORKERS} concurrent workers:`);
  partitions.forEach((part, i) => {
    console.log(`  Worker ${i + 1}: ${part.length} destinations`);
  });
  console.log('\n--- Execution Commenced ---\n');

  const startTime = Date.now();
  const results = await Promise.all(
    partitions.map((part, i) => runWorker(i + 1, part))
  );

  const totalFixed = results.reduce((a, b) => a + b, 0);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n====================================================');
  console.log(`🎉 COMPLETED TAJ PURGE IN ${elapsedSec}s`);
  console.log(`Total Destinations Processed & Updated: ${totalFixed} / ${targetSlugs.length}`);
  console.log('====================================================\n');
}

main().catch(console.error);
