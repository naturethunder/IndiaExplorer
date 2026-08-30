/**
 * DEFINITIVE ZERO-COLLISION ENFORCER
 * - Synchronous deterministic zero-collision engine.
 * - Uses 6,900+ unique offline HD images from scripts/mega_wiki_pool.json.
 * - Replaces 100% of colliding instances (#2+).
 * - Enforces Taj Mahal purge (0 outside Agra).
 * - Enforces exactly 5 gallery images (heroImage === gallery[0] === seo.ogImage).
 * - Enforces flexible topPlaces (1 card + 3 unique photos per place).
 * - Synchronizes data/destinations/index.json.
 * - Runs full mathematical audit verification.
 */

const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_FILE = path.join(DEST_DIR, 'index.json');
const POOL_FILE = path.join(__dirname, 'mega_wiki_pool.json');
const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;

function run() {
  console.log('=== DEFINITIVE ZERO-COLLISION ENFORCER ===\n');

  const pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
  console.log(`Loaded ${pool.length} offline unique HD images into memory.`);

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Auditing and repairing all ${files.length} destination JSON files...\n`);

  const CLAIMED_URLS = new Set();
  let poolIdx = 0;
  let updatedFiles = 0;
  let totalReplacedImages = 0;

  function getUniqueReplacement(topic) {
    while (poolIdx < pool.length) {
      const item = pool[poolIdx++];
      const clean = item.src.split('?')[0];
      if (!CLAIMED_URLS.has(clean) && !TAJ_REGEX.test(clean)) {
        CLAIMED_URLS.add(clean);
        return item;
      }
    }
    return null;
  }

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const f = files[fIdx];
    const filePath = path.join(DEST_DIR, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = f.replace('.json', '');
    const title = data.name || data.title || slug.replace(/-/g, ' ');
    let modified = false;

    const fileClaimed = new Set();

    function validateAndClaim(u) {
      if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
      const clean = u.split('?')[0];
      if (TAJ_REGEX.test(clean) && slug !== 'agra') return false;
      if (fileClaimed.has(clean)) return false; // internal dup
      if (CLAIMED_URLS.has(clean)) return false; // cross-file dup

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
        const rep = getUniqueReplacement(`${title} highlight ${i + 1}`);
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
          const rep = getUniqueReplacement(`${placeName}, ${title}`);
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
            const rep = getUniqueReplacement(`${placeName} photo ${phIdx + 1}`);
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
  }

  // 3. Synchronize index.json
  console.log('Synchronizing master data/destinations/index.json...');
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

  console.log(`\n🎉 REPAIR COMPLETE!`);
  console.log(`Total destination files updated: ${updatedFiles}`);
  console.log(`Total duplicate images replaced: ${totalReplacedImages}`);
  console.log(`Final unique registered URLs: ${CLAIMED_URLS.size}\n`);

  // 4. Mathematical Audit Verification
  console.log('=== FINAL MATHEMATICAL AUDIT VERIFICATION ===');
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
  console.log('=============================================\n');
}

run();
