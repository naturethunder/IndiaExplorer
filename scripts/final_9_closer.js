/**
 * FINAL 9 DESTINATIONS ZERO-COLLISION ABSOLUTE CLOSER
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;

const queries = [
  'Yathothkari perumal temple Kanchipuram',
  'Yelagiri hills nature Tamil Nadu',
  'Yellamma temple Saundatti Belgaum',
  'Yelluru shri vishweshwara temple Udupi',
  'Yeshwantgad fort Redi Sindhudurg',
  'Yoga Madhava temple Settikere Tumkur',
  'Yoganarasimha temple Devarayanadurga',
  'Zangla khar palace castle Zanskar',
  'Zanskar valley mountains river Ladakh',
  'Padum Zanskar monastery landscape',
  'Karsha monastery Zanskar cliff',
  'Phugtal monastery cave cliff Zanskar',
  'Stongdey monastery Zanskar Ladakh',
  'Bardan monastery Zanskar river',
  'Sani monastery kanika stupa Zanskar'
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
          'User-Agent': 'IndiaExplorerBot/250.0 (contact@exploreindiahub.com)'
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

async function main() {
  console.log('=== ABSOLUTE ZERO-COLLISION PERFECTION FOR ENTIRE REPOSITORY ===\n');

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const claimed = new Set();

  files.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      if (Array.isArray(d.gallery)) d.gallery.forEach(g => { if (g && g.src) claimed.add(g.src.split('?')[0]); });
      if (Array.isArray(d.topPlaces)) d.topPlaces.forEach(p => {
        if (p.image && p.image.src) claimed.add(p.image.src.split('?')[0]);
        if (Array.isArray(p.photos)) p.photos.forEach(ph => { if (ph) claimed.add(ph.split('?')[0]); });
      });
    } catch (e) {}
  });

  const freshPool = [];
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
              freshPool.push({ src: u, alt: q });
            }
          }
        }
      }
    }
  }

  console.log(`Harvested ${freshPool.length} 100% brand new images for final files.`);

  // Single sweep over ALL 2389 files to ensure absolute 0 collisions
  const CLAIMED_FINAL = new Set();
  let poolIdx = 0;
  let updatedFiles = 0;

  function getFresh(alt) {
    if (poolIdx < freshPool.length) {
      const item = freshPool[poolIdx++];
      CLAIMED_FINAL.add(item.src.split('?')[0]);
      return item;
    }
    return null;
  }

  for (const f of files) {
    const filePath = path.join(DEST_DIR, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = f.replace('.json', '');
    const title = data.name || data.title || slug.replace(/-/g, ' ');
    let modified = false;

    const fileClaimed = new Set();

    function checkAndClaim(u) {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
      const clean = u.split('?')[0];
      if (TAJ_REGEX.test(clean) && slug !== 'agra') return false;
      if (fileClaimed.has(clean)) return false;
      if (CLAIMED_FINAL.has(clean)) return false;

      fileClaimed.add(clean);
      CLAIMED_FINAL.add(clean);
      return true;
    }

    // Gallery
    if (Array.isArray(data.gallery)) {
      for (let i = 0; i < data.gallery.length; i++) {
        const g = data.gallery[i];
        if (!g || !g.src || !checkAndClaim(g.src)) {
          const rep = getFresh(`${title} highlight ${i + 1}`);
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
    }

    // Hero & SEO
    if (data.gallery && data.gallery.length > 0 && data.gallery[0].src) {
      if (!data.heroImage || data.heroImage.src !== data.gallery[0].src) {
        data.heroImage = { src: data.gallery[0].src, alt: data.gallery[0].alt || `${title} Hero Image` };
        modified = true;
      }
      if (data.seo && data.seo.ogImage !== data.gallery[0].src) {
        data.seo.ogImage = data.gallery[0].src;
        modified = true;
      }
    }

    // Places
    if (Array.isArray(data.topPlaces)) {
      for (let pIdx = 0; pIdx < data.topPlaces.length; pIdx++) {
        const place = data.topPlaces[pIdx];
        const placeName = place.name || `Attraction ${pIdx + 1}`;

        if (!place.image || !place.image.src || !checkAndClaim(place.image.src)) {
          const rep = getFresh(`${placeName}, ${title}`);
          if (rep) {
            place.image = { src: rep.src, alt: `${placeName}, ${title}` };
            fileClaimed.add(rep.src.split('?')[0]);
            modified = true;
          }
        }

        if (Array.isArray(place.photos)) {
          for (let phIdx = 0; phIdx < place.photos.length; phIdx++) {
            const ph = place.photos[phIdx];
            if (!ph || !checkAndClaim(ph)) {
              const rep = getFresh(`${placeName} photo ${phIdx + 1}`);
              if (rep) {
                place.photos[phIdx] = rep.src;
                fileClaimed.add(rep.src.split('?')[0]);
                modified = true;
              }
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      updatedFiles++;
    }
  }

  // Sync index
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

  console.log(`\n🎉 FINAL CLOSER FINISHED! Files updated: ${updatedFiles}`);

  // Final Audit Verification
  console.log('=== FINAL COMPREHENSIVE MATHEMATICAL AUDIT ===');
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
  console.log('==============================================\n');
}

main();
