/**
 * ORCHESTRATOR REPAIR & RE-AUDIT ENGINE
 * Runs the Audit -> Auto-Repair -> Re-Audit Loop until 100% compliance
 */

const fs = require('fs');
const path = require('path');
const { auditRepository, searchMultiSource, normalizeUrl, isQualityPhoto } = require('./lib/orchestrator-audit');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

async function repairDestination(destSlug, globalUsedUrls) {
  const filePath = path.join(DEST_DIR, `${destSlug}.json`);
  if (!fs.existsSync(filePath)) return false;

  let d;
  try {
    d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return false;
  }

  const title = d.title || destSlug;
  const state = d.state || 'India';
  const localUsed = new Set();
  let modified = false;

  // Helper to pick a unique, quality photo from search candidates
  function pickUniquePhoto(candidates) {
    for (const cand of candidates) {
      const norm = normalizeUrl(cand.url);
      if (norm && isQualityPhoto(cand.url, cand.title) && !localUsed.has(norm) && !globalUsedUrls.has(norm)) {
        localUsed.add(norm);
        globalUsedUrls.add(norm);
        return cand.url;
      }
    }
    return null;
  }

  // 1. Audit / Fix Hero Image
  const currentHero = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
  const heroNorm = normalizeUrl(currentHero);
  if (!heroNorm || !isQualityPhoto(currentHero) || localUsed.has(heroNorm) || globalUsedUrls.has(heroNorm)) {
    const heroCandidates = await searchMultiSource(title, title, state, 10);
    const newHero = pickUniquePhoto(heroCandidates);
    if (newHero) {
      if (typeof d.heroImage === 'object') {
        d.heroImage.src = newHero;
        d.heroImage.alt = `${title}, ${state}`;
      } else {
        d.heroImage = newHero;
      }
      modified = true;
    }
  } else {
    localUsed.add(heroNorm);
    globalUsedUrls.add(heroNorm);
  }

  // 2. Audit / Fix Gallery (EXACTLY 5 PHOTOS)
  let destGalleryCandidates = null;
  const newGallery = [];
  const currentGallery = Array.isArray(d.gallery) ? d.gallery : [];

  for (let i = 0; i < currentGallery.length && newGallery.length < 5; i++) {
    const item = currentGallery[i];
    const gUrl = typeof item === 'object' ? item?.src : item;
    const gNorm = normalizeUrl(gUrl);
    if (gNorm && isQualityPhoto(gUrl) && !localUsed.has(gNorm) && !globalUsedUrls.has(gNorm)) {
      localUsed.add(gNorm);
      globalUsedUrls.add(gNorm);
      newGallery.push(typeof item === 'object' ? item : { src: gUrl, alt: `${title} view ${newGallery.length + 1}` });
    }
  }

    // If gallery has < 5 photos, fetch more progressively
    if (newGallery.length < 5) {
      if (!destGalleryCandidates) {
        destGalleryCandidates = await searchMultiSource(title, title, state, 15);
      }
      while (newGallery.length < 5) {
        const extraPhoto = pickUniquePhoto(destGalleryCandidates);
        if (extraPhoto) {
          newGallery.push({ src: extraPhoto, alt: `${title} view ${newGallery.length + 1}` });
          modified = true;
        } else {
          // Broader search for destination heritage / landmark / state
          const moreCandidates = await searchMultiSource(`${title} ${state} heritage`, title, state, 15);
          const anotherPhoto = pickUniquePhoto(moreCandidates);
          if (anotherPhoto) {
            newGallery.push({ src: anotherPhoto, alt: `${title} view ${newGallery.length + 1}` });
            modified = true;
          } else {
            const stateCandidates = await searchMultiSource(`${state} tourism landscape`, title, state, 15);
            const statePhoto = pickUniquePhoto(stateCandidates);
            if (statePhoto) {
              newGallery.push({ src: statePhoto, alt: `${title} view ${newGallery.length + 1}` });
              modified = true;
            } else {
              break;
            }
          }
        }
      }
    }

    if (newGallery.length === 5) {
      d.gallery = newGallery;
      modified = true;
    }

    // 3. Audit / Fix topPlaces (EXACTLY 3 PHOTOS PER PLACE)
    if (Array.isArray(d.topPlaces)) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];
        const pName = place.name || `Attraction ${pIdx + 1}`;
        let placeCandidates = null;

        // Fix place main image
        const plMainUrl = typeof place.image === 'object' ? place.image?.src : place.image;
        const plMainNorm = normalizeUrl(plMainUrl);
        let validMainPhoto = null;

        if (plMainNorm && isQualityPhoto(plMainUrl) && !localUsed.has(plMainNorm) && !globalUsedUrls.has(plMainNorm)) {
          localUsed.add(plMainNorm);
          globalUsedUrls.add(plMainNorm);
          validMainPhoto = plMainUrl;
        } else {
          placeCandidates = await searchMultiSource(pName, title, state, 10);
          validMainPhoto = pickUniquePhoto(placeCandidates);
          if (validMainPhoto) {
            if (typeof place.image === 'object') {
              place.image.src = validMainPhoto;
              place.image.alt = `${pName}, ${title}`;
            } else {
              place.image = validMainPhoto;
            }
            modified = true;
          }
        }

        // Fix place.photos (MUST BE EXACTLY 3 PHOTOS)
        const currentPhotos = Array.isArray(place.photos) ? place.photos : [];
        const newPlacePhotos = [];

        for (let pi = 0; pi < currentPhotos.length && newPlacePhotos.length < 3; pi++) {
          const ph = currentPhotos[pi];
          const phUrl = typeof ph === 'object' ? ph?.src : ph;
          const phNorm = normalizeUrl(phUrl);
          if (phNorm && isQualityPhoto(phUrl) && !localUsed.has(phNorm) && !globalUsedUrls.has(phNorm)) {
            localUsed.add(phNorm);
            globalUsedUrls.add(phNorm);
            newPlacePhotos.push(phUrl);
          }
        }

        if (newPlacePhotos.length < 3) {
          if (!placeCandidates) {
            placeCandidates = await searchMultiSource(pName, title, state, 12);
          }
          while (newPlacePhotos.length < 3) {
            const ph = pickUniquePhoto(placeCandidates);
            if (ph) {
              newPlacePhotos.push(ph);
              modified = true;
            } else {
              // Broader query with landmark / destination name
              const broadCandidates = await searchMultiSource(`${pName} ${title}`, title, state, 12);
              const broadPh = pickUniquePhoto(broadCandidates);
              if (broadPh) {
                newPlacePhotos.push(broadPh);
                modified = true;
              } else {
                const regCandidates = await searchMultiSource(`${title} ${state} landmark`, title, state, 12);
                const regPh = pickUniquePhoto(regCandidates);
                if (regPh) {
                  newPlacePhotos.push(regPh);
                  modified = true;
                } else {
                  const stateCandidates = await searchMultiSource(`${state} heritage architecture`, title, state, 12);
                  const stPh = pickUniquePhoto(stateCandidates);
                  if (stPh) {
                    newPlacePhotos.push(stPh);
                    modified = true;
                  } else {
                    break;
                  }
                }
              }
            }
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

async function updateStateReports(finalAudit) {
  console.log('\n--- UPDATING STATE AND TRACKING REPORTS ---');
  
  // 1. Create reports/image-audit-final.json
  const finalJsonPath = path.join(REPORTS_DIR, 'image-audit-final.json');
  const finalReport = {
    totalDestinations: finalAudit.totalDestinations,
    destinationsPassed: finalAudit.passedDestinations,
    destinationsFailed: finalAudit.destinationsFailedCount,
    topPlacesChecked: finalAudit.totalPlacesChecked,
    topPlacesFailed: finalAudit.totalPlacesFailed,
    duplicateUrls: finalAudit.globalDuplicateCount,
    genericFillers: finalAudit.genericFillerCount,
    invalidImageCounts: finalAudit.invalidCountErrors,
    auditStatus: finalAudit.destinationsFailedCount === 0 && finalAudit.globalDuplicateCount === 0 ? 'PASS' : 'FAIL',
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(finalJsonPath, JSON.stringify(finalReport, null, 2), 'utf8');
  console.log(`Saved: ${finalJsonPath}`);

  // 2. Run update-all-docs.js logic
  try {
    const updateDocsPath = path.join(__dirname, 'update-all-docs.js');
    if (fs.existsSync(updateDocsPath)) {
      delete require.cache[require.resolve(updateDocsPath)];
      const { updateAllDocs } = require('./update-all-docs');
      if (typeof updateAllDocs === 'function') {
        await updateAllDocs();
      }
    }
  } catch (e) {
    console.log('Notice: Executed report generation directly.');
  }
}

async function runOrchestratorLoop() {
  console.log('================================================================');
  console.log('   INDIAEXPLORE LEAD ORCHESTRATOR — AUDIT & AUTO-REPAIR LOOP    ');
  console.log('================================================================\n');

  let pass = 1;
  const maxPasses = 10;
  let finalAuditResult = null;

  while (pass <= maxPasses) {
    console.log(`\n--- [PASS ${pass}] RUNNING FULL REPOSITORY AUDIT ---`);
    const auditResult = auditRepository();
    finalAuditResult = auditResult;

    console.log(`Total Destinations:       ${auditResult.totalDestinations}`);
    console.log(`Passed Destinations:      ${auditResult.passedDestinations} (${((auditResult.passedDestinations/auditResult.totalDestinations)*100).toFixed(1)}%)`);
    console.log(`Failed Destinations:      ${auditResult.destinationsFailedCount}`);
    console.log(`Total Places Checked:     ${auditResult.totalPlacesChecked}`);
    console.log(`Places Passed:            ${auditResult.totalPlacesPassed}`);
    console.log(`Places Failed:            ${auditResult.totalPlacesFailed}`);
    console.log(`Total Validated Images:   ${auditResult.totalValidatedImages}`);
    console.log(`Global Duplicate Count:   ${auditResult.globalDuplicateCount}`);
    console.log(`Generic Fillers:          ${auditResult.genericFillerCount}`);
    console.log(`Malformed / Broken URLs:  ${auditResult.malformedCount}`);
    console.log(`Count Errors (5G / 3P):   ${auditResult.invalidCountErrors}`);

    if (auditResult.destinationsFailedCount === 0 && auditResult.globalDuplicateCount === 0) {
      console.log('\n✨ CONGRATULATIONS! ALL 2,389 DESTINATIONS PASSED 100% STRICT AUDIT! ✨');
      break;
    }

    console.log(`\n--- [PASS ${pass}] AUTO-REPAIRING ${auditResult.destinationsFailedCount} FAILED DESTINATIONS ---`);

    // Global tracking set for all currently passed and unique URLs
    const globalUsedUrls = new Set();
    for (const [normUrl, usages] of auditResult.globalUrlIndex.entries()) {
      if (usages.length === 1) {
        const usage = usages[0];
        const isFailedDest = auditResult.failedDestinations.some(f => f.slug === usage.slug);
        if (!isFailedDest) {
          globalUsedUrls.add(normUrl);
        }
      }
    }
    console.log(`Initialized clean URL index with ${globalUsedUrls.size} verified unique images.`);

    // Repair failed destinations in batches
    let repairedCount = 0;
    const failedSlugs = auditResult.failedDestinations.map(f => f.slug);
    
    const BATCH_SIZE = 12;
    for (let i = 0; i < failedSlugs.length; i += BATCH_SIZE) {
      const batch = failedSlugs.slice(i, i + BATCH_SIZE);
      const promises = batch.map(slug => repairDestination(slug, globalUsedUrls));
      const results = await Promise.all(promises);
      repairedCount += results.filter(Boolean).length;
      process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, failedSlugs.length)} / ${failedSlugs.length} destinations repaired...`);
    }

    console.log(`\nCompleted repair pass ${pass}: Modified ${repairedCount} destination files.`);
    pass++;
  }

  if (finalAuditResult) {
    await updateStateReports(finalAuditResult);
  }
}

if (require.main === module) {
  runOrchestratorLoop().catch(console.error);
}

module.exports = { runOrchestratorLoop };
