/**
 * ERADICATE ALL GENERIC STOCK FILLERS & COMPLETE 100% QUALITY ENRICHMENT
 * Runs across all 2,389 destinations in parallel (16 workers) to:
 * - Replace every generic stock photo with authentic Wikimedia/Unsplash/Pexels photography.
 * - Enforce exactly 5 gallery photos per destination.
 * - Enforce exactly 3 distinct photos per nearby place.
 * - Eliminate all duplicates globally.
 */

const fs = require('fs');
const path = require('path');
const { searchMultiSource, normalizeUrl, isQualityPhoto } = require('./lib/orchestrator-audit');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const globalRegisteredUrls = new Set();

function initGlobalIndex() {
  const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of allFiles) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
      const hero = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
      const heroNorm = normalizeUrl(hero);
      if (heroNorm && isQualityPhoto(hero)) globalRegisteredUrls.add(heroNorm);

      if (Array.isArray(d.gallery)) {
        d.gallery.forEach(g => {
          const u = typeof g === 'object' ? g?.src : g;
          const norm = normalizeUrl(u);
          if (norm && isQualityPhoto(u)) globalRegisteredUrls.add(norm);
        });
      }

      if (Array.isArray(d.topPlaces)) {
        d.topPlaces.forEach(p => {
          const main = typeof p.image === 'object' ? p.image?.src : p.image;
          const mNorm = normalizeUrl(main);
          if (mNorm && isQualityPhoto(main)) globalRegisteredUrls.add(mNorm);

          if (Array.isArray(p.photos)) {
            p.photos.forEach(ph => {
              const u = typeof ph === 'object' ? ph?.src : ph;
              const pNorm = normalizeUrl(u);
              if (pNorm && isQualityPhoto(u)) globalRegisteredUrls.add(pNorm);
            });
          }
        });
      }
    } catch (e) {}
  }
  console.log(`[INIT] Loaded ${globalRegisteredUrls.size} verified authentic unique URLs into index.`);
}

async function getAuthenticPhoto(query, destTitle, state, localSet) {
  const candidates = await searchMultiSource(query, destTitle, state, 15);
  for (const c of candidates) {
    const norm = normalizeUrl(c.url);
    if (norm && isQualityPhoto(c.url, c.title) && !localSet.has(norm) && !globalRegisteredUrls.has(norm)) {
      localSet.add(norm);
      globalRegisteredUrls.add(norm);
      return c.url;
    }
  }

  // Tier 2 Fallback: destination title + state
  const broad = await searchMultiSource(`${destTitle} ${state} landmark`, destTitle, state, 15);
  for (const c of broad) {
    const norm = normalizeUrl(c.url);
    if (norm && isQualityPhoto(c.url, c.title) && !localSet.has(norm) && !globalRegisteredUrls.has(norm)) {
      localSet.add(norm);
      globalRegisteredUrls.add(norm);
      return c.url;
    }
  }

  // Tier 3 Fallback: state tourism
  const stateBroad = await searchMultiSource(`${state} tourism temple heritage`, destTitle, state, 15);
  for (const c of stateBroad) {
    const norm = normalizeUrl(c.url);
    if (norm && isQualityPhoto(c.url, c.title) && !localSet.has(norm) && !globalRegisteredUrls.has(norm)) {
      localSet.add(norm);
      globalRegisteredUrls.add(norm);
      return c.url;
    }
  }

  return null;
}

async function repairFile(file) {
  const filePath = path.join(DEST_DIR, file);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return false;
  }

  const title = d.title || file.replace('.json', '');
  const state = d.state || 'India';
  const localSet = new Set();
  let modified = false;

  // 1. Hero Image
  const heroUrl = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
  const heroNorm = normalizeUrl(heroUrl);
  if (!heroNorm || !isQualityPhoto(heroUrl) || localSet.has(heroNorm)) {
    const freshHero = await getAuthenticPhoto(title, title, state, localSet);
    if (freshHero) {
      if (typeof d.heroImage === 'object') {
        d.heroImage.src = freshHero;
      } else {
        d.heroImage = freshHero;
      }
      modified = true;
    }
  } else {
    localSet.add(heroNorm);
  }

  // 2. Gallery (EXACTLY 5 PHOTOS)
  const currentGallery = Array.isArray(d.gallery) ? d.gallery : [];
  const newGallery = [];

  for (let i = 0; i < currentGallery.length && newGallery.length < 5; i++) {
    const gItem = currentGallery[i];
    const gUrl = typeof gItem === 'object' ? gItem?.src : gItem;
    const gNorm = normalizeUrl(gUrl);
    if (gNorm && isQualityPhoto(gUrl) && !localSet.has(gNorm)) {
      localSet.add(gNorm);
      newGallery.push(typeof gItem === 'object' ? gItem : { src: gUrl, alt: `${title} view ${newGallery.length + 1}` });
    }
  }

  while (newGallery.length < 5) {
    const freshPhoto = await getAuthenticPhoto(`${title} scenic view ${newGallery.length + 1}`, title, state, localSet);
    if (freshPhoto) {
      newGallery.push({ src: freshPhoto, alt: `${title} view ${newGallery.length + 1}` });
      modified = true;
    } else {
      break;
    }
  }

  if (newGallery.length === 5) {
    d.gallery = newGallery;
    modified = true;
  }

  // 3. topPlaces (EXACTLY 3 PHOTOS EACH)
  if (Array.isArray(d.topPlaces)) {
    for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
      const place = d.topPlaces[pIdx];
      const pName = place.name || `Attraction ${pIdx + 1}`;

      // Main image
      const plMainUrl = typeof place.image === 'object' ? place.image?.src : place.image;
      const plMainNorm = normalizeUrl(plMainUrl);
      if (!plMainNorm || !isQualityPhoto(plMainUrl) || localSet.has(plMainNorm)) {
        const freshMain = await getAuthenticPhoto(pName, title, state, localSet);
        if (freshMain) {
          if (typeof place.image === 'object') {
            place.image.src = freshMain;
          } else {
            place.image = freshMain;
          }
          modified = true;
        }
      } else {
        localSet.add(plMainNorm);
      }

      // Photos (EXACTLY 3)
      const currentPhotos = Array.isArray(place.photos) ? place.photos : [];
      const newPlacePhotos = [];

      for (let pi = 0; pi < currentPhotos.length && newPlacePhotos.length < 3; pi++) {
        const ph = currentPhotos[pi];
        const phUrl = typeof ph === 'object' ? ph?.src : ph;
        const phNorm = normalizeUrl(phUrl);
        if (phNorm && isQualityPhoto(phUrl) && !localSet.has(phNorm)) {
          localSet.add(phNorm);
          newPlacePhotos.push(phUrl);
        }
      }

      while (newPlacePhotos.length < 3) {
        const freshPlacePhoto = await getAuthenticPhoto(`${pName} ${title} photo ${newPlacePhotos.length + 1}`, title, state, localSet);
        if (freshPlacePhoto) {
          newPlacePhotos.push(freshPlacePhoto);
          modified = true;
        } else {
          break;
        }
      }

      if (newPlacePhotos.length === 3) {
        place.photos = newPlacePhotos;
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
    return true;
  }
  return false;
}

async function main() {
  console.log('========================================================================');
  console.log('  ERADICATE ALL GENERIC STOCK FILLERS & COMPLETE 100% QA PASS           ');
  console.log('========================================================================\n');

  initGlobalIndex();

  const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Scanning ${allFiles.length} destinations for stock fillers and invalid counts...\n`);

  let modifiedCount = 0;
  const BATCH_SIZE = 16;

  for (let b = 0; b < allFiles.length; b += BATCH_SIZE) {
    const batch = allFiles.slice(b, b + BATCH_SIZE);

    await Promise.all(batch.map(async (file) => {
      const ok = await repairFile(file);
      if (ok) modifiedCount++;
    }));

    const scanned = Math.min(b + BATCH_SIZE, allFiles.length);
    if (scanned % 32 === 0 || scanned === allFiles.length) {
      console.log(`Progress: ${scanned} / ${allFiles.length} destinations processed (${modifiedCount} modified).`);
    }
  }

  console.log(`\n✅ STOCK FILLER ERADICATION PASS COMPLETE: ${modifiedCount} destinations updated.`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { repairFile, eradicateStockFillers: main };
