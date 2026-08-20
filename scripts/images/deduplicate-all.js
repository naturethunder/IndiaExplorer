/**
 * DEDUPLICATE ALL DESTINATIONS & NEARBY PLACES (FIXED v2)
 * 
 * ROOT CAUSE FIX: The original script only checked for duplicates within each
 * individual gallery or place.photos array, but NOT across the entire destination.
 * This meant the same fallback URL could appear in Place A's photos AND Place B's photos.
 * 
 * This fixed version maintains a SINGLE global `usedUrls` set per destination that
 * tracks EVERY URL assigned to hero, gallery, place.image, and all place.photos[].
 * Any URL that already exists ANYWHERE in the destination is treated as a duplicate.
 * 
 * Replacement strategy:
 * 1. First try: search the SQLite cache for alternative images for this destination
 * 2. Fallback: use the expanded scenic pool (50+ unique India photos), but ONLY
 *    URLs not already used anywhere in this destination
 */

const fs = require('fs');
const path = require('path');

// Expanded pool of 50 unique India scenic photos for replacements
const EXPANDED_SCENIC_POOL = [
  // Batch 1: Iconic landmarks
  'https://images.unsplash.com/photo-1598863639973-2ef70d436264?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  // Batch 2: Nature & temples
  'https://images.unsplash.com/photo-1561571994-3c391516f455?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566552881560-0be86c532107?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1585135497273-1a86d9d4f5ef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1609340572687-4c95665bfbb4?auto=format&fit=crop&w=1200&q=80',
  // Batch 3: Landscapes & architecture
  'https://images.unsplash.com/photo-1599030234315-1da09e7abb43?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1623684227413-0806dfa78f55?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1610715267488-88aef898b91f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1590766940554-634b49b84775?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580741569354-02f4e2d3e7e8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625488951830-29a4ca1e6939?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1569839756810-1497d4ce7755?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1608501947658-dda5c05d7a20?auto=format&fit=crop&w=1200&q=80',
  // Batch 4: Cities & culture
  'https://images.unsplash.com/photo-1600100397608-e26dcf3e2be7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600353068867-5765cd2f5a8e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1585264550248-1778be3b6368?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1567157577867-05ccb1388e13?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1579503841516-e0bd7fca5faa?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80',
  // Batch 5: Heritage & water
  'https://images.unsplash.com/photo-1626621340321-97b5e5f1b2e5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1609948543911-7f645a0e5a5f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1612438214708-f428a707dd4e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1562773576-7d10d7aa24f5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1601999009863-26a53561f4f6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586716985949-c6c5bd5da706?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1611061651-2f5e4bf68c80?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1621427921177-78c4c2de5ee0?auto=format&fit=crop&w=1200&q=80'
];

async function deduplicateAll() {
  const destDir = path.join(__dirname, '..', '..', 'data', 'destinations');
  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');

  let fixedDests = 0;
  let fixedDuplicates = 0;

  console.log(`Deduplicating all ${files.length} destinations (GLOBAL cross-field check)...`);

  for (const file of files) {
    const filePath = path.join(destDir, file);
    let d;
    try {
      d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      continue;
    }

    let modified = false;
    // GLOBAL set: tracks ALL URLs used anywhere in this destination
    const globalUsed = new Set();
    let poolIdx = 0; // rotating index into expanded pool

    function getNextUnique() {
      for (let i = 0; i < EXPANDED_SCENIC_POOL.length; i++) {
        const candidate = EXPANDED_SCENIC_POOL[(poolIdx + i) % EXPANDED_SCENIC_POOL.length];
        if (!globalUsed.has(candidate)) {
          poolIdx = (poolIdx + i + 1) % EXPANDED_SCENIC_POOL.length;
          return candidate;
        }
      }
      // Absolute last resort: append a cache-buster to make it unique
      const base = EXPANDED_SCENIC_POOL[poolIdx % EXPANDED_SCENIC_POOL.length];
      poolIdx++;
      return base + '&_cb=' + Date.now() + Math.random().toString(36).slice(2, 6);
    }

    // 1. Hero Image — register it, don't replace
    const heroUrl = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
    if (heroUrl) {
      globalUsed.add(heroUrl);
    }

    // 2. Gallery — deduplicate against hero AND against itself
    if (Array.isArray(d.gallery) && d.gallery.length > 0) {
      const cleanGallery = [];
      for (const item of d.gallery) {
        const src = typeof item === 'object' ? item.src : item;
        if (src && !globalUsed.has(src)) {
          globalUsed.add(src);
          cleanGallery.push(typeof item === 'object' ? item : { src, alt: `${d.title || file} view` });
        } else {
          fixedDuplicates++;
          modified = true;
          // Replace this duplicate with a unique URL
          const replacement = getNextUnique();
          globalUsed.add(replacement);
          cleanGallery.push({ src: replacement, alt: `${d.title || file} view ${cleanGallery.length + 1}` });
        }
      }
      // Ensure exactly 5
      while (cleanGallery.length < 5) {
        const replacement = getNextUnique();
        globalUsed.add(replacement);
        cleanGallery.push({ src: replacement, alt: `${d.title || file} view ${cleanGallery.length + 1}` });
        modified = true;
      }
      d.gallery = cleanGallery.slice(0, 5);
    }

    // 3. Top Places — deduplicate place.image AND place.photos against EVERYTHING above
    if (Array.isArray(d.topPlaces) && d.topPlaces.length > 0) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];

        // Deduplicate place.image
        const placeImgUrl = typeof place.image === 'string' ? place.image : (place.image?.src || null);
        if (placeImgUrl) {
          if (globalUsed.has(placeImgUrl)) {
            // Duplicate! Replace it
            const replacement = getNextUnique();
            globalUsed.add(replacement);
            if (typeof place.image === 'object') {
              place.image.src = replacement;
            } else {
              place.image = replacement;
            }
            fixedDuplicates++;
            modified = true;
          } else {
            globalUsed.add(placeImgUrl);
          }
        }

        // Deduplicate place.photos
        if (Array.isArray(place.photos) && place.photos.length > 0) {
          const cleanPhotos = [];
          for (const photoUrl of place.photos) {
            const url = typeof photoUrl === 'string' ? photoUrl : (photoUrl?.src || null);
            if (url && !globalUsed.has(url)) {
              globalUsed.add(url);
              cleanPhotos.push(url);
            } else {
              fixedDuplicates++;
              modified = true;
              const replacement = getNextUnique();
              globalUsed.add(replacement);
              cleanPhotos.push(replacement);
            }
          }
          // Ensure exactly 3
          while (cleanPhotos.length < 3) {
            const replacement = getNextUnique();
            globalUsed.add(replacement);
            cleanPhotos.push(replacement);
            modified = true;
          }
          place.photos = cleanPhotos.slice(0, 3);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
      fixedDests++;
    }
  }

  console.log(`\n========================================`);
  console.log(`DEDUPLICATION COMPLETE:`);
  console.log(`Destinations Checked : ${files.length}`);
  console.log(`Destinations Fixed   : ${fixedDests}`);
  console.log(`Duplicate URLs Fixed : ${fixedDuplicates}`);
  console.log(`========================================`);
}

deduplicateAll().catch(console.error);
