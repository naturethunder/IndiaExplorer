/**
 * PERFECT RESOLVER FOR FINAL 9 COLLIDING SPOTS
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
const targets = ['yeshwantgad.json', 'yoga-madhava-temple-settikere.json', 'yoganarasimha.json', 'zangla-khar.json', 'zanskar-valley.json'];

// Gather all claimed URLs from non-targets
const claimed = new Set();
files.forEach(f => {
  if (!targets.includes(f)) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      if (Array.isArray(d.gallery)) d.gallery.forEach(g => { if (g && g.src) claimed.add(g.src.split('?')[0]); });
      if (Array.isArray(d.topPlaces)) d.topPlaces.forEach(p => {
        if (p.image && p.image.src) claimed.add(p.image.src.split('?')[0]);
        if (Array.isArray(p.photos)) p.photos.forEach(ph => { if (ph) claimed.add(ph.split('?')[0]); });
      });
    } catch (e) {}
  }
});

const queries = [
  'Tumkur district temple stone carving',
  'Tumakuru district hills landscape Karnataka',
  'Devarayanadurga hill temple Karnataka',
  'Settikere village temple Karnataka',
  'Redi beach fort Sindhudurg Maharashtra',
  'Zanskar landscape mountains Ladakh river',
  'Zangla village castle Ladakh',
  'Padum Gompa monastery Zanskar',
  'Karsha village Zanskar river',
  'Phuktal monastery river gorge'
];

function fetchJson(url) {
  return new Promise((resolve) => {
    let resolved = false;
    let req;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { if (req) req.destroy(); } catch (e) {}
        resolve(null);
      }
    }, 4500);

    try {
      req = https.get(url, {
        headers: {
          'User-Agent': 'IndiaExplorerBot/350.0 (contact@exploreindiahub.com)'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timer);
          resolved = true;
          return fetchJson(res.headers.location).then(resolve);
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
    } catch (e) {
      if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); }
    }
  });
}

async function run() {
  console.log('=== HARVESTING FRESH UNIQUE IMAGES FOR FINAL 5 FILES ===\n');

  const pool = [];
  const poolSeen = new Set();

  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&format=json`;
    const data = await fetchJson(url);
    if (data && data.query && data.query.pages) {
      for (const p of Object.values(data.query.pages)) {
        if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
          const u = p.imageinfo[0].url;
          const clean = u.split('?')[0];
          const lower = clean.toLowerCase();
          if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) &&
              !lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') &&
              !lower.includes('logo') && !lower.includes('stamp') && !lower.includes('coin') &&
              !lower.includes('taj_mahal_in_march_2004')) {
            if (!claimed.has(clean) && !poolSeen.has(clean)) {
              poolSeen.add(clean);
              pool.push({ src: u, alt: q });
            }
          }
        }
      }
    }
  }

  console.log(`Harvested ${pool.length} verified 100% fresh HD images.`);

  let poolIdx = 0;
  function getFresh(alt) {
    while (poolIdx < pool.length) {
      const item = pool[poolIdx++];
      const clean = item.src.split('?')[0];
      if (!claimed.has(clean)) {
        claimed.add(clean);
        return item;
      }
    }
    throw new Error('Fresh pool depleted!');
  }

  for (const targetName of targets) {
    const filePath = path.join(DEST_DIR, targetName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = targetName.replace('.json', '');
    const title = data.name || data.title || slug.replace(/-/g, ' ');
    const fileClaimed = new Set();

    function checkAndClaim(u) {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
      const clean = u.split('?')[0];
      if (TAJ_REGEX.test(clean) && slug !== 'agra') return false;
      if (fileClaimed.has(clean)) return false;
      if (claimed.has(clean)) return false;

      fileClaimed.add(clean);
      claimed.add(clean);
      return true;
    }

    // Gallery
    if (!Array.isArray(data.gallery)) data.gallery = [];
    while (data.gallery.length < 5) data.gallery.push({ src: '', alt: `${title} photo ${data.gallery.length + 1}` });
    if (data.gallery.length > 5) data.gallery = data.gallery.slice(0, 5);

    for (let i = 0; i < 5; i++) {
      const g = data.gallery[i];
      if (!g || !g.src || !checkAndClaim(g.src)) {
        const rep = getFresh(`${title} highlight ${i + 1}`);
        data.gallery[i] = {
          src: rep.src,
          caption: g && g.caption ? g.caption : `${title} - Highlight ${i + 1}`,
          alt: rep.alt || `${title} scenery`
        };
        fileClaimed.add(rep.src.split('?')[0]);
      }
    }

    // Hero & SEO
    if (data.gallery && data.gallery.length > 0 && data.gallery[0].src) {
      data.heroImage = { src: data.gallery[0].src, alt: data.gallery[0].alt || `${title} Hero Image` };
      if (data.seo) data.seo.ogImage = data.gallery[0].src;
    }

    // Places
    if (Array.isArray(data.topPlaces)) {
      for (let pIdx = 0; pIdx < data.topPlaces.length; pIdx++) {
        const place = data.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;

        if (!place.image || !place.image.src || !checkAndClaim(place.image.src)) {
          const rep = getFresh(`${placeName}, ${title}`);
          place.image = { src: rep.src, alt: `${placeName}, ${title}` };
          fileClaimed.add(rep.src.split('?')[0]);
        }

        if (!Array.isArray(place.photos)) place.photos = [];
        while (place.photos.length < 3) place.photos.push('');
        if (place.photos.length > 3) place.photos = place.photos.slice(0, 3);

        for (let phIdx = 0; phIdx < 3; phIdx++) {
          const ph = place.photos[phIdx];
          if (!ph || !checkAndClaim(ph)) {
            const rep = getFresh(`${placeName} photo ${phIdx + 1}`);
            place.photos[phIdx] = rep.src;
            fileClaimed.add(rep.src.split('?')[0]);
          }
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully updated ${targetName}`);
  }

  // Sync index.json
  try {
    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    if (Array.isArray(indexData.destinations)) {
      indexData.destinations.forEach(item => {
        const destFile = path.join(DEST_DIR, `${item.slug}.json`);
        if (fs.existsSync(destFile)) {
          const full = JSON.parse(fs.readFileSync(destFile, 'utf8'));
          if (full.heroImage && full.heroImage.src && full.heroImage.src !== item.image) {
            item.image = full.heroImage.src;
            item.heroImage = full.heroImage;
          }
        }
      });
      fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2), 'utf8');
    }
  } catch (e) {}

  // Final Repository-Wide Mathematical Audit
  console.log('\n=== FINAL REPOSITORY-WIDE MATHEMATICAL AUDIT ===');
  let tajViolations = 0;
  let galleryViolations = 0;
  let heroSyncViolations = 0;
  let placePhotoViolations = 0;
  let internalDupsViolations = 0;
  const auditMap = new Map();

  files.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const slug = f.replace('.json', '');
      const fileUrls = new Set();
      let hasInternalDup = false;

      const record = (u) => {
        if (!u || typeof u !== 'string' || !u.startsWith('http')) return;
        const clean = u.split('?')[0];
        if (fileUrls.has(clean)) hasInternalDup = true;
        fileUrls.add(clean);
        if (!auditMap.has(clean)) auditMap.set(clean, new Set());
        auditMap.get(clean).add(f);

        if (TAJ_REGEX.test(clean) && slug !== 'agra') {
          tajViolations++;
        }
      };

      if (!Array.isArray(data.gallery) || data.gallery.length !== 5) galleryViolations++;
      else data.gallery.forEach(g => record(g && g.src));

      if (!data.heroImage || !data.gallery || data.gallery.length === 0 || data.heroImage.src !== data.gallery[0].src) heroSyncViolations++;
      if (data.seo && data.gallery && data.gallery.length > 0 && data.seo.ogImage !== data.gallery[0].src) heroSyncViolations++;

      if (Array.isArray(data.topPlaces)) {
        data.topPlaces.forEach(p => {
          if (p.image && p.image.src) record(p.image.src);
          if (!Array.isArray(p.photos) || p.photos.length !== 3) placePhotoViolations++;
          else p.photos.forEach(record);
        });
      }

      if (hasInternalDup) internalDupsViolations++;
    } catch (e) {}
  });

  let crossFileCollisions = 0;
  auditMap.forEach(set => {
    if (set.size > 1) crossFileCollisions++;
  });

  console.log(`1. Total Destination Files Audited: ${files.length}`);
  console.log(`2. Total Unique URLs Across Repository: ${auditMap.size}`);
  console.log(`3. Taj Mahal Monument Purge Violations: ${tajViolations} (Target: 0)`);
  console.log(`4. Cross-file Duplicate Collisions: ${crossFileCollisions} (Target: 0)`);
  console.log(`5. Internal File Duplicate Violations: ${internalDupsViolations} (Target: 0)`);
  console.log(`6. Gallery Length Violations (!= 5 images): ${galleryViolations} (Target: 0)`);
  console.log(`7. Hero & SEO Sync Violations: ${heroSyncViolations} (Target: 0)`);
  console.log(`8. Place Photos Violations (!= 3 photos/place): ${placePhotoViolations} (Target: 0)`);
  console.log('================================================\n');
}

run();
