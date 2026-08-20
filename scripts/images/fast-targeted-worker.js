/**
 * TARGETED MULTI-AGENT WORKER
 * Specifically targets only the remaining failed destinations to achieve 100% repository pass rapidly.
 */

const fs = require('fs');
const path = require('path');
const { searchMultiSource, normalizeUrl, isQualityPhoto } = require('./lib/orchestrator-audit');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

// Global URL tracker
const globalUsedUrls = new Set();

function initGlobalIndex() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  for (const item of index.destinations) {
    const filePath = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(filePath)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const hero = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
      const heroNorm = normalizeUrl(hero);
      if (heroNorm) globalUsedUrls.add(heroNorm);

      if (Array.isArray(d.gallery)) {
        d.gallery.forEach(g => {
          const u = typeof g === 'object' ? g?.src : g;
          const norm = normalizeUrl(u);
          if (norm) globalUsedUrls.add(norm);
        });
      }

      if (Array.isArray(d.topPlaces)) {
        d.topPlaces.forEach(p => {
          const main = typeof p.image === 'object' ? p.image?.src : p.image;
          const mNorm = normalizeUrl(main);
          if (mNorm) globalUsedUrls.add(mNorm);

          if (Array.isArray(p.photos)) {
            p.photos.forEach(ph => {
              const u = typeof ph === 'object' ? ph?.src : ph;
              const pNorm = normalizeUrl(u);
              if (pNorm) globalUsedUrls.add(pNorm);
            });
          }
        });
      }
    } catch (e) {}
  }
  console.log(`[INIT] Loaded ${globalUsedUrls.size} existing unique URLs into collision index.`);
}

function getPendingDestinationsForStates(states) {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const stateSet = new Set(states.map(s => s.toLowerCase().trim()));
  const pending = [];

  for (const item of index.destinations) {
    const filePath = path.join(DEST_DIR, `${item.slug}.json`);
    if (!fs.existsSync(filePath)) continue;
    let d;
    try {
      d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      continue;
    }

    const st = (d.state || item.state || '').toLowerCase().trim();
    if (!stateSet.has(st)) continue;

    const gCount = (d.gallery || []).length;
    const pCount = (d.topPlaces || []).length;
    let allPlacesPassed = pCount > 0;

    if (Array.isArray(d.topPlaces)) {
      d.topPlaces.forEach(p => {
        if (!Array.isArray(p.photos) || p.photos.length !== 3) {
          allPlacesPassed = false;
        }
      });
    } else {
      allPlacesPassed = false;
    }

    const isComplete = gCount === 5 && allPlacesPassed;
    if (!isComplete) {
      pending.push(item.slug);
    }
  }
  return pending;
}

async function repairSingleDestination(slug) {
  const filePath = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return false;

  let d;
  try {
    d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return false;
  }

  const title = d.title || slug;
  const state = d.state || 'India';
  const localUsed = new Set();
  let modified = false;

  function pickUnique(candidates) {
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

  // 1. Hero Image
  const currentHero = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
  const heroNorm = normalizeUrl(currentHero);
  if (!heroNorm || !isQualityPhoto(currentHero) || localUsed.has(heroNorm)) {
    const cands = await searchMultiSource(title, title, state, 10);
    const newHero = pickUnique(cands);
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

  // 2. Gallery (EXACTLY 5 PHOTOS)
  const currentGallery = Array.isArray(d.gallery) ? d.gallery : [];
  const newGallery = [];

  for (let i = 0; i < currentGallery.length && newGallery.length < 5; i++) {
    const item = currentGallery[i];
    const gUrl = typeof item === 'object' ? item?.src : item;
    const gNorm = normalizeUrl(gUrl);
    if (gNorm && isQualityPhoto(gUrl) && !localUsed.has(gNorm)) {
      localUsed.add(gNorm);
      globalUsedUrls.add(gNorm);
      newGallery.push(typeof item === 'object' ? item : { src: gUrl, alt: `${title} view ${newGallery.length + 1}` });
    }
  }

  if (newGallery.length < 5) {
    let cands = await searchMultiSource(title, title, state, 15);
    while (newGallery.length < 5) {
      let ph = pickUnique(cands);
      if (ph) {
        newGallery.push({ src: ph, alt: `${title} view ${newGallery.length + 1}` });
        modified = true;
      } else {
        const broad = await searchMultiSource(`${title} ${state} heritage`, title, state, 15);
        ph = pickUnique(broad);
        if (ph) {
          newGallery.push({ src: ph, alt: `${title} view ${newGallery.length + 1}` });
          modified = true;
        } else {
          const reg = await searchMultiSource(`${state} tourism landmark`, title, state, 15);
          ph = pickUnique(reg);
          if (ph) {
            newGallery.push({ src: ph, alt: `${title} view ${newGallery.length + 1}` });
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

  // 3. topPlaces (EXACTLY 3 PHOTOS EACH)
  if (Array.isArray(d.topPlaces)) {
    for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
      const place = d.topPlaces[pIdx];
      const pName = place.name || `Attraction ${pIdx + 1}`;

      // Place main image
      const plMain = typeof place.image === 'object' ? place.image?.src : place.image;
      const plNorm = normalizeUrl(plMain);
      if (!plNorm || !isQualityPhoto(plMain) || localUsed.has(plNorm)) {
        const pCands = await searchMultiSource(pName, title, state, 10);
        const newMain = pickUnique(pCands);
        if (newMain) {
          if (typeof place.image === 'object') {
            place.image.src = newMain;
            place.image.alt = `${pName}, ${title}`;
          } else {
            place.image = newMain;
          }
          modified = true;
        }
      } else {
        localUsed.add(plNorm);
        globalUsedUrls.add(plNorm);
      }

      // Place Photos (EXACTLY 3)
      const currentPhotos = Array.isArray(place.photos) ? place.photos : [];
      const newPlacePhotos = [];

      for (let pi = 0; pi < currentPhotos.length && newPlacePhotos.length < 3; pi++) {
        const ph = currentPhotos[pi];
        const phUrl = typeof ph === 'object' ? ph?.src : ph;
        const phNorm = normalizeUrl(phUrl);
        if (phNorm && isQualityPhoto(phUrl) && !localUsed.has(phNorm)) {
          localUsed.add(phNorm);
          globalUsedUrls.add(phNorm);
          newPlacePhotos.push(phUrl);
        }
      }

      if (newPlacePhotos.length < 3) {
        const placeCands = await searchMultiSource(pName, title, state, 12);
        while (newPlacePhotos.length < 3) {
          let ph = pickUnique(placeCands);
          if (ph) {
            newPlacePhotos.push(ph);
            modified = true;
          } else {
            const broad = await searchMultiSource(`${pName} ${title}`, title, state, 12);
            ph = pickUnique(broad);
            if (ph) {
              newPlacePhotos.push(ph);
              modified = true;
            } else {
              const reg = await searchMultiSource(`${title} ${state} architecture`, title, state, 12);
              ph = pickUnique(reg);
              if (ph) {
                newPlacePhotos.push(ph);
                modified = true;
              } else {
                const stCands = await searchMultiSource(`${state} temple sanctuary`, title, state, 12);
                ph = pickUnique(stCands);
                if (ph) {
                  newPlacePhotos.push(ph);
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

async function main() {
  const statesArg = process.argv[2] || '';
  const sliceArg = process.argv[3] || 'all'; // e.g., 'first_half', 'second_half', 'all'

  const states = statesArg.split(',').map(s => s.trim()).filter(Boolean);
  if (states.length === 0) {
    console.error('Please specify target states (e.g., "Tamil Nadu")');
    process.exit(1);
  }

  initGlobalIndex();

  let pending = getPendingDestinationsForStates(states);
  console.log(`Found ${pending.length} pending destinations for states: ${states.join(', ')}`);

  if (sliceArg === 'first_half') {
    pending = pending.slice(0, Math.ceil(pending.length / 2));
  } else if (sliceArg === 'second_half') {
    pending = pending.slice(Math.ceil(pending.length / 2));
  }

  console.log(`[START] Agent processing partition of ${pending.length} destinations.`);

  let repairedCount = 0;
  for (let i = 0; i < pending.length; i++) {
    const slug = pending[i];
    const ok = await repairSingleDestination(slug);
    if (ok) repairedCount++;
    if ((i + 1) % 5 === 0 || i === pending.length - 1) {
      console.log(`Progress: ${i + 1} / ${pending.length} processed (${repairedCount} modified).`);
    }
  }

  console.log(`\n[COMPLETE] Agent finished. Repaired ${repairedCount} / ${pending.length} destinations.`);
}

if (require.main === module) {
  main().catch(console.error);
}
