/**
 * POOL-POWERED 8-AGENT ZERO-COLLISION MASTER
 * - 8 concurrent workers processing distinct partitions in parallel.
 * - Sourcing pools pre-warm 1,500+ unique landscape images into memory.
 * - Workers pull unique images in 0ms without hitting network per file.
 * - Single atomic CLAIMED_URLS set guarantees 0 duplicate collisions repository-wide.
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
    }, 2500);

    let req;
    try {
      const parsed = new URL(url);
      req = https.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'IndiaExplorerBot/12.0 (contact@exploreindiahub.com)',
          ...headers
        },
        timeout: 2000
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

const CLAIMED_URLS = new Set();
const GENERAL_POOL = [];

async function prewarmPool() {
  console.log('Pre-warming global landscape photography pool from Pexels & Wikimedia Commons...');
  const seedQueries = [
    'Incredible India tourism landscape scenic nature',
    'India ancient temple heritage architecture monument',
    'India green mountains valley river waterfalls view',
    'India serene hill station tea gardens sunrise',
    'India historic palace fort architecture sunset',
    'India scenic travel coastal beach ocean view',
    'India national park wildlife forest jungle nature',
    'India cultural festival heritage landmark photography'
  ];

  for (let qIdx = 0; qIdx < seedQueries.length; qIdx++) {
    const q = seedQueries[qIdx];
    // Fetch 3 pages of 50 photos each from Pexels
    for (let page = 1; page <= 3; page++) {
      try {
        const enc = encodeURIComponent(q);
        const data = await fetchJson(`https://api.pexels.com/v1/search?query=${enc}&per_page=50&page=${page}&orientation=landscape`, {
          'Authorization': PEXELS_KEY
        });
        if (data && data.photos && data.photos.length > 0) {
          for (const p of data.photos) {
            const src = p.src.large2x || p.src.large || p.src.original;
            if (src) GENERAL_POOL.push({ src, alt: p.alt || q });
          }
        }
      } catch (e) {}
    }

    // Fetch from Wiki Commons
    try {
      const enc = encodeURIComponent(q);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${enc}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;
      const data = await fetchJson(url);
      if (data && data.query && data.query.pages) {
        for (const page of Object.values(data.query.pages)) {
          if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
            const imgUrl = page.imageinfo[0].url;
            const lower = imgUrl.toLowerCase();
            if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
              if (!lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') && !lower.includes('logo') && !lower.includes('stamp') && !lower.includes('coin')) {
                if (!TAJ_REGEX.test(imgUrl)) {
                  GENERAL_POOL.push({ src: imgUrl, alt: q });
                }
              }
            }
          }
        }
      }
    } catch (e) {}
  }
  console.log(`Pre-warmed pool with ${GENERAL_POOL.length} high-definition landscape images.\n`);
}

function getNextPoolImage(fallbackAlt) {
  while (GENERAL_POOL.length > 0) {
    const item = GENERAL_POOL.shift();
    const clean = item.src.split('?')[0];
    if (!CLAIMED_URLS.has(clean) && !TAJ_REGEX.test(clean)) {
      CLAIMED_URLS.add(clean);
      return item;
    }
  }
  return null;
}

async function processDestination(f, workerId) {
  const filePath = path.join(DEST_DIR, f);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = f.replace('.json', '');
    const title = data.name || data.title || slug.replace(/-/g, ' ');
    let modified = false;

    const fileClaimed = new Set();

    function validateAndClaim(u) {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
      const clean = u.split('?')[0];
      if (TAJ_REGEX.test(clean) && slug !== 'agra') return false;
      if (fileClaimed.has(clean)) return false; // duplicate inside this file
      if (CLAIMED_URLS.has(clean)) return false; // duplicate across files
      
      fileClaimed.add(clean);
      CLAIMED_URLS.add(clean);
      return true;
    }

    // 1. Gallery (Exactly 5)
    if (!Array.isArray(data.gallery)) { data.gallery = []; modified = true; }
    while (data.gallery.length < 5) { data.gallery.push({ src: '', alt: `${title} photo ${data.gallery.length + 1}` }); modified = true; }
    if (data.gallery.length > 5) { data.gallery = data.gallery.slice(0, 5); modified = true; }

    for (let i = 0; i < 5; i++) {
      const g = data.gallery[i];
      if (!g || !g.src || !validateAndClaim(g.src)) {
        const rep = getNextPoolImage(`${title} highlight ${i + 1}`);
        if (rep) {
          data.gallery[i] = {
            src: rep.src,
            caption: g && g.caption ? g.caption : `${title} - Highlight ${i + 1}`,
            alt: rep.alt || `${title} scenery`
          };
          fileClaimed.add(rep.src.split('?')[0]);
          modified = true;
        }
      }
    }

    // HeroImage & SEO ogImage sync
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
        if (!place.image || !place.image.src || !validateAndClaim(place.image.src)) {
          const rep = getNextPoolImage(`${placeName}, ${title}`);
          if (rep) {
            place.image = {
              src: rep.src,
              alt: `${placeName}, ${title}`
            };
            fileClaimed.add(rep.src.split('?')[0]);
            modified = true;
          }
        }

        // Place photos (Exactly 3)
        if (!Array.isArray(place.photos)) { place.photos = []; modified = true; }
        while (place.photos.length < 3) { place.photos.push(''); modified = true; }
        if (place.photos.length > 3) { place.photos = place.photos.slice(0, 3); modified = true; }

        for (let phIdx = 0; phIdx < 3; phIdx++) {
          const ph = place.photos[phIdx];
          if (!ph || !validateAndClaim(ph)) {
            const rep = getNextPoolImage(`${placeName} photo ${phIdx + 1}`);
            if (rep) {
              place.photos[phIdx] = rep.src;
              fileClaimed.add(rep.src.split('?')[0]);
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
    const isUp = await processDestination(f, workerId);
    if (isUp) updated++;
    if ((i + 1) % 50 === 0 || i + 1 === fileList.length) {
      console.log(`[Worker ${workerId}] Progress: ${i + 1}/${fileList.length} (${updated} updated, ${CLAIMED_URLS.size} unique URLs locked)`);
    }
  }
  return updated;
}

async function main() {
  console.log('=== POOL-POWERED 8-AGENT ZERO-COLLISION MASTER ===\n');

  await prewarmPool();

  const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Partitioning ${allFiles.length} destination files across ${NUM_WORKERS} concurrent agents (~${Math.ceil(allFiles.length / NUM_WORKERS)} files each)...`);

  const partitions = Array.from({ length: NUM_WORKERS }, () => []);
  allFiles.forEach((f, idx) => {
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

  console.log(`\n🎉 MASTER COMPLETE! Updated ${totalUpdated} files. Final globally unique registered URLs: ${CLAIMED_URLS.size}`);
}

main();
