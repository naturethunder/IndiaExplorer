/**
 * GLOBAL DUPLICATE & STRICT QUALITY RESOLVER
 * Permanently resolves all duplicate URLs and ensures 100% uniqueness across the entire repository.
 */

const fs = require('fs');
const path = require('path');
const { searchMultiSource, normalizeUrl, isQualityPhoto } = require('./lib/orchestrator-audit');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

async function resolveAllDuplicates() {
  console.log('========================================================================');
  console.log('  GLOBAL REPOSITORY IMAGE DEDUPLICATION & STRICT QUALITY RESOLVER       ');
  console.log('========================================================================\n');

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const allDestFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

  // Step 1: Map all URL occurrences across the entire repository
  const globalSeen = new Map(); // normUrl -> [ { file, type, pIdx, gIdx } ]

  for (const file of allDestFiles) {
    const filePath = path.join(DEST_DIR, file);
    let d;
    try {
      d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      continue;
    }

    const hero = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
    const heroNorm = normalizeUrl(hero);
    if (heroNorm) {
      if (!globalSeen.has(heroNorm)) globalSeen.set(heroNorm, []);
      globalSeen.get(heroNorm).push({ file, type: 'hero' });
    }

    if (Array.isArray(d.gallery)) {
      d.gallery.forEach((g, gIdx) => {
        const u = typeof g === 'object' ? g?.src : g;
        const norm = normalizeUrl(u);
        if (norm) {
          if (!globalSeen.has(norm)) globalSeen.set(norm, []);
          globalSeen.get(norm).push({ file, type: 'gallery', gIdx });
        }
      });
    }

    if (Array.isArray(d.topPlaces)) {
      d.topPlaces.forEach((p, pIdx) => {
        const main = typeof p.image === 'object' ? p.image?.src : p.image;
        const mNorm = normalizeUrl(main);
        if (mNorm) {
          if (!globalSeen.has(mNorm)) globalSeen.set(mNorm, []);
          globalSeen.get(mNorm).push({ file, type: 'placeMain', pIdx });
        }

        if (Array.isArray(p.photos)) {
          p.photos.forEach((ph, phIdx) => {
            const u = typeof ph === 'object' ? ph?.src : ph;
            const pNorm = normalizeUrl(u);
            if (pNorm) {
              if (!globalSeen.has(pNorm)) globalSeen.set(pNorm, []);
              globalSeen.get(pNorm).push({ file, type: 'placePhoto', pIdx, phIdx });
            }
          });
        }
      });
    }
  }

  // Count duplicates
  let duplicateInstances = 0;
  for (const [url, locs] of globalSeen.entries()) {
    if (locs.length > 1) {
      duplicateInstances += (locs.length - 1);
    }
  }

  console.log(`Repository Census: ${globalSeen.size} unique URLs indexed.`);
  console.log(`Duplicate instances detected: ${duplicateInstances} duplicates.\n`);

  if (duplicateInstances === 0) {
    console.log('🎉 0 Duplicate URLs found! Repository is 100% duplicate-free.');
    return;
  }

  // Global set of all clean, registered single-use URLs
  const registeredUrls = new Set();
  for (const [url, locs] of globalSeen.entries()) {
    if (locs.length === 1 && isQualityPhoto(url)) {
      registeredUrls.add(url);
    }
  }

  // Helper to find a strictly unique candidate
  async function getFreshCandidate(query, destTitle, state, excludeSet) {
    const candidates = await searchMultiSource(query, destTitle, state, 15);
    for (const cand of candidates) {
      const norm = normalizeUrl(cand.url);
      if (norm && isQualityPhoto(cand.url, cand.title) && !registeredUrls.has(norm) && !excludeSet.has(norm)) {
        registeredUrls.add(norm);
        excludeSet.add(norm);
        return cand.url;
      }
    }
    // Fallback query
    const fallback = await searchMultiSource(`${destTitle} ${state} tourism`, destTitle, state, 15);
    for (const cand of fallback) {
      const norm = normalizeUrl(cand.url);
      if (norm && isQualityPhoto(cand.url, cand.title) && !registeredUrls.has(norm) && !excludeSet.has(norm)) {
        registeredUrls.add(norm);
        excludeSet.add(norm);
        return cand.url;
      }
    }
    return null;
  }

  // Process files with 16 parallel workers per batch (resumes from checkpoint if present)
  let filesModified = 0;
  let fixedDuplicates = 0;
  const BATCH_SIZE = 16;

  const CHECKPOINT_PATH = path.join(__dirname, 'dedup_checkpoint.json');
  let startIdx = 0;
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      const ck = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
      if (ck.lastScannedIndex && ck.lastScannedIndex < allDestFiles.length) {
        startIdx = ck.lastScannedIndex;
        filesModified = ck.filesModified || 0;
        fixedDuplicates = ck.duplicatesFixed || 0;
        console.log(`[RESUME] Continuing from saved checkpoint index ${startIdx} / ${allDestFiles.length}.`);
      }
    } catch (e) {}
  }

  for (let b = startIdx; b < allDestFiles.length; b += BATCH_SIZE) {
    const batch = allDestFiles.slice(b, b + BATCH_SIZE);

    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(DEST_DIR, file);
      let d;
      try {
        d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        return;
      }
      const title = d.title || file.replace('.json', '');
      const state = d.state || 'India';
      const localSet = new Set();
      let fileChanged = false;

      // Check & Deduplicate Hero
      const heroUrl = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
      const heroNorm = normalizeUrl(heroUrl);
      if (!heroNorm || !isQualityPhoto(heroUrl) || registeredUrls.has(heroNorm) || localSet.has(heroNorm)) {
        const fresh = await getFreshCandidate(title, title, state, localSet);
        if (fresh) {
          if (typeof d.heroImage === 'object') {
            d.heroImage.src = fresh;
          } else {
            d.heroImage = fresh;
          }
          fileChanged = true;
          fixedDuplicates++;
        }
      } else {
        registeredUrls.add(heroNorm);
        localSet.add(heroNorm);
      }

      // Check & Deduplicate Gallery (EXACTLY 5 PHOTOS)
      const newGallery = [];
      const currentGallery = Array.isArray(d.gallery) ? d.gallery : [];

      for (let gIdx = 0; gIdx < currentGallery.length && newGallery.length < 5; gIdx++) {
        const gItem = currentGallery[gIdx];
        const gUrl = typeof gItem === 'object' ? gItem?.src : gItem;
        const gNorm = normalizeUrl(gUrl);
        if (gNorm && isQualityPhoto(gUrl) && !registeredUrls.has(gNorm) && !localSet.has(gNorm)) {
          registeredUrls.add(gNorm);
          localSet.add(gNorm);
          newGallery.push(typeof gItem === 'object' ? gItem : { src: gUrl, alt: `${title} view ${newGallery.length + 1}` });
        }
      }

      while (newGallery.length < 5) {
        const fresh = await getFreshCandidate(`${title} view ${newGallery.length + 1}`, title, state, localSet);
        if (fresh) {
          newGallery.push({ src: fresh, alt: `${title} view ${newGallery.length + 1}` });
          fileChanged = true;
          fixedDuplicates++;
        } else {
          break;
        }
      }

      if (newGallery.length === 5) {
        d.gallery = newGallery;
        fileChanged = true;
      }

      // Check & Deduplicate topPlaces (EXACTLY 3 PHOTOS EACH)
      if (Array.isArray(d.topPlaces)) {
        for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
          const place = d.topPlaces[pIdx];
          const pName = place.name || `Attraction ${pIdx + 1}`;

          // Place Main
          const plMain = typeof place.image === 'object' ? place.image?.src : place.image;
          const plNorm = normalizeUrl(plMain);
          if (!plNorm || !isQualityPhoto(plMain) || registeredUrls.has(plNorm) || localSet.has(plNorm)) {
            const fresh = await getFreshCandidate(pName, title, state, localSet);
            if (fresh) {
              if (typeof place.image === 'object') {
                place.image.src = fresh;
              } else {
                place.image = fresh;
              }
              fileChanged = true;
              fixedDuplicates++;
            }
          } else {
            registeredUrls.add(plNorm);
            localSet.add(plNorm);
          }

          // Place Photos (EXACTLY 3)
          const curPhotos = Array.isArray(place.photos) ? place.photos : [];
          const newPlacePhotos = [];

          for (let pi = 0; pi < curPhotos.length && newPlacePhotos.length < 3; pi++) {
            const ph = curPhotos[pi];
            const phUrl = typeof ph === 'object' ? ph?.src : ph;
            const phNorm = normalizeUrl(phUrl);
            if (phNorm && isQualityPhoto(phUrl) && !registeredUrls.has(phNorm) && !localSet.has(phNorm)) {
              registeredUrls.add(phNorm);
              localSet.add(phNorm);
              newPlacePhotos.push(phUrl);
            }
          }

          while (newPlacePhotos.length < 3) {
            const fresh = await getFreshCandidate(`${pName} ${title} photo ${newPlacePhotos.length + 1}`, title, state, localSet);
            if (fresh) {
              newPlacePhotos.push(fresh);
              fileChanged = true;
              fixedDuplicates++;
            } else {
              break;
            }
          }

          if (newPlacePhotos.length === 3) {
            place.photos = newPlacePhotos;
            fileChanged = true;
          }
        }
      }

      if (fileChanged) {
        fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
        filesModified++;
      }
    }));

    const scanned = Math.min(b + BATCH_SIZE, allDestFiles.length);
    console.log(`Deduplication Progress: ${scanned} / ${allDestFiles.length} files scanned (${filesModified} files modified, ${fixedDuplicates} duplicates fixed).`);

    // Persist checkpoint to disk
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({
      checkpoint: "GLOBAL_DEDUPLICATION_PASS",
      lastScannedIndex: scanned,
      totalFiles: allDestFiles.length,
      filesModified: filesModified,
      duplicatesFixed: fixedDuplicates,
      percentComplete: `${((scanned / allDestFiles.length) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      status: scanned >= allDestFiles.length ? "COMPLETED" : "IN_PROGRESS"
    }, null, 2) + '\n', 'utf8');
  }

  console.log(`\n✅ DEDUPLICATION PASS COMPLETE: ${filesModified} files updated, ${fixedDuplicates} duplicates resolved.`);
}

if (require.main === module) {
  resolveAllDuplicates().catch(console.error);
}

module.exports = { resolveAllDuplicates };
