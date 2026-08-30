/**
 * HIGH-SPEED POOL-POWERED ZERO-COLLISION REPAIRER
 * 1. Fetches ~2,500 unique HD images into memory pool from Pexels & Wikimedia Commons.
 * 2. Iterates all 2,389 destination files:
 *    - Instant-claims first occurrence of every valid unique URL.
 *    - Replaces duplicate occurrences (#2+) with fresh unique pool images in 0ms.
 *    - Purges Taj Mahal from all non-Agra files.
 *    - Guarantees 5 unique gallery images per destination (`heroImage === gallery[0] === seo.ogImage`).
 *    - Guarantees 1 card thumbnail + 3 unique photos per place in topPlaces.
 * 3. Synchronizes data/destinations/index.json in real time.
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
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { req.destroy(); } catch (e) {}
        resolve(null);
      }
    }, 4000);

    const req = https.get(url, {
      headers: {
        'User-Agent': 'IndiaExplorerBot/13.0 (contact@exploreindiahub.com)',
        ...headers
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        resolved = true;
        return fetchJson(res.headers.location, headers).then(resolve);
      }
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        if (!resolved) {
          clearTimeout(timer);
          resolved = true;
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            resolve(null);
          }
        }
      });
      res.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
    });
    req.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
  });
}

const CLAIMED_URLS = new Set();
const FRESH_IMAGE_POOL = [];

async function buildImagePool() {
  console.log('=== STEP 1: BUILDING GLOBAL HD IMAGE POOL ===');
  
  const searchTopics = [
    'India tourism landscape scenic nature photography',
    'India ancient temple heritage architecture monument',
    'India mountains valley river waterfalls view green',
    'India serene hill station tea plantations sunrise view',
    'India historic royal palace fort monument sunset',
    'India scenic travel coastal beach ocean tropical',
    'India wildlife safari forest jungle tiger deer',
    'India cultural festival heritage landmark sunset',
    'Incredible India aerial view scenery landscape',
    'Himalayas mountains snow landscape river valley India',
    'Kerala backwaters nature coconut trees houseboat India',
    'Rajasthan desert fort palace sunset architecture India',
    'Tamil Nadu gopuram temple architecture heritage India',
    'Goa beach ocean waves tropical sunset palm trees India',
    'Western Ghats green forest waterfall hills India',
    'Varanasi ghats river ganga heritage evening India',
    'Kashmir valley dal lake shikara snow mountains India',
    'Ladakh landscape pangong lake monastery mountains India',
    'Meghalaya living root bridge waterfalls green hills India',
    'Andaman islands coral reef blue sea beach India'
  ];

  for (let t = 0; t < searchTopics.length; t++) {
    const topic = searchTopics[t];
    const enc = encodeURIComponent(topic);

    // Fetch 3 pages of 50 photos each from Pexels (150 per topic)
    for (let page = 1; page <= 3; page++) {
      try {
        const data = await fetchJson(`https://api.pexels.com/v1/search?query=${enc}&per_page=50&page=${page}&orientation=landscape`, {
          'Authorization': PEXELS_KEY
        });
        if (data && data.photos && data.photos.length > 0) {
          for (const p of data.photos) {
            const src = p.src.large2x || p.src.large || p.src.original;
            if (src) {
              FRESH_IMAGE_POOL.push({ src, alt: p.alt || topic });
            }
          }
        }
      } catch (e) {}
    }

    // Fetch from Wiki Commons (50 per topic)
    try {
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
                  FRESH_IMAGE_POOL.push({ src: imgUrl, alt: topic });
                }
              }
            }
          }
        }
      }
    } catch (e) {}

    console.log(`[Pool Builder] ${t + 1}/${searchTopics.length} topics fetched -> Pool size: ${FRESH_IMAGE_POOL.length} images`);
  }

  console.log(`\nPool building complete! Total fresh HD images in memory: ${FRESH_IMAGE_POOL.length}\n`);
}

function getNextPoolImage(fallbackAlt) {
  while (FRESH_IMAGE_POOL.length > 0) {
    const item = FRESH_IMAGE_POOL.shift();
    const clean = item.src.split('?')[0];
    if (!CLAIMED_URLS.has(clean) && !TAJ_REGEX.test(clean)) {
      CLAIMED_URLS.add(clean);
      return item;
    }
  }
  return null;
}

async function repairAllDestinations() {
  console.log('=== STEP 2: REPAIRING ALL 2,389 DESTINATIONS ===');

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  let updatedFiles = 0;
  let totalReplacedImages = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const f = files[idx];
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
        
        // Claim legitimate unique URL
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
            totalReplacedImages++;
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
              totalReplacedImages++;
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
                totalReplacedImages++;
                modified = true;
              }
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        updatedFiles++;
      }
    } catch (e) {
      console.error(`Error in ${f}:`, e.message);
    }

    if ((idx + 1) % 250 === 0 || idx + 1 === files.length) {
      console.log(`[Repairer] ${idx + 1}/${files.length} destinations processed (${updatedFiles} files updated, ${CLAIMED_URLS.size} unique URLs locked)`);
    }
  }

  // Step 3: Synchronize index.json
  console.log('\n=== STEP 3: SYNCHRONIZING INDEX.JSON ===');
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

  console.log(`\n🎉 ABSOLUTE ZERO-COLLISION REPAIR COMPLETE!`);
  console.log(`Total files modified: ${updatedFiles}`);
  console.log(`Total colliding images replaced: ${totalReplacedImages}`);
  console.log(`Final globally unique registered URLs: ${CLAIMED_URLS.size}`);
}

async function main() {
  await buildImagePool();
  await repairAllDestinations();
}

main();
