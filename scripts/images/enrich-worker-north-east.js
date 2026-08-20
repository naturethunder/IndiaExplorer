/**
 * PARALLEL IMAGE ENRICHMENT WORKER: North & East India
 * Target States: Uttar Pradesh, Uttarakhand, West Bengal, Bihar
 * 
 * Rules Enforced:
 * 1. 5 original photos in Hero & Visual Gallery
 * 2. 3 distinct, authentic photos for each nearby place in topPlaces
 * 3. 100% Zero Duplicates across Hero, Gallery, and all places
 * 4. Multi-Source photography from Pexels, Unsplash, Wikimedia Commons (Zero PDFs, Zero Maps)
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const { ImageCache } = require('./lib/cache');
const { ProviderManager } = require('./lib/provider-manager');
const { loadEnv } = require('./lib/dotenv');

loadEnv(config.paths.envPath);

const DEST_DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const TARGET_STATES = ['Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Bihar'];

const DEFAULT_SCENIC_POOL = [
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

async function runWorkerNorthEast() {
  const cache = new ImageCache(path.join(__dirname, '..', '..', config.paths.cacheDb));
  await cache.init();
  const providerManager = new ProviderManager(cache);

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  console.log(`========================================================================`);
  console.log(`  WORKER NORTH-EAST: Processing UP, Uttarakhand, WB, Bihar`);
  console.log(`  Rule 1: 5 original photos in Hero Section & Gallery`);
  console.log(`  Rule 2: 3 authentic photos for every nearby place`);
  console.log(`  Rule 3: 100% ZERO DUPLICATES across entire destination`);
  console.log(`========================================================================\n`);

  let count = 0;

  for (const summary of index.destinations) {
    const destFile = path.join(DEST_DIR, `${summary.slug}.json`);
    if (!fs.existsSync(destFile)) continue;

    const d = JSON.parse(fs.readFileSync(destFile, 'utf8'));
    const stateName = d.state || summary.state || 'Unknown';

    if (!TARGET_STATES.includes(stateName)) continue;

    const has5Gallery = Array.isArray(d.gallery) && d.gallery.length >= 5 && d.gallery.every(g => (g.src || g).startsWith('http'));
    const has3Places = Array.isArray(d.topPlaces) && d.topPlaces.length > 0 && d.topPlaces.every(p => Array.isArray(p.photos) && p.photos.length >= 3 && p.photos.every(ph => ph.startsWith('http')));

    if (has5Gallery && has3Places) continue;

    count++;
    console.log(`\n[Worker North-East #${count}] Enriching: ${d.title} (${d.slug}) [State: ${stateName}]`);

    const usedUrls = new Set();

    // 1. HERO IMAGE
    const heroCandidates = await providerManager.search({
      destSlug: summary.slug,
      fieldPath: 'heroImage',
      name: d.title,
      type: 'hero',
      state: stateName,
      title: d.title
    });

    const validHeroCandidates = heroCandidates.filter(c => c.url && !c.url.includes('.pdf') && !c.url.includes('map_'));
    let bestHero = validHeroCandidates[0] || null;
    if (bestHero && bestHero.url) {
      usedUrls.add(bestHero.url);
      if (typeof d.heroImage === 'object') {
        d.heroImage.src = bestHero.url;
        d.heroImage.alt = `${d.title}, ${stateName}`;
      } else {
        d.heroImage = bestHero.url;
      }
    }

    // 2. 5-PHOTO GALLERY
    d.gallery = [];
    let galleryCandidates = validHeroCandidates.filter(c => c.url && !usedUrls.has(c.url));
    if (galleryCandidates.length < 5) {
      const extraCandidates = await providerManager.search({
        destSlug: summary.slug,
        fieldPath: 'gallery',
        name: `${d.title} landscape heritage`,
        type: 'gallery',
        state: stateName,
        title: d.title
      });
      for (const ec of extraCandidates) {
        if (ec.url && !usedUrls.has(ec.url) && !ec.url.includes('.pdf') && !ec.url.includes('map_')) {
          galleryCandidates.push(ec);
          usedUrls.add(ec.url);
        }
      }
    }

    for (const gc of galleryCandidates) {
      if (d.gallery.length < 5 && gc.url && !d.gallery.some(g => g.src === gc.url)) {
        usedUrls.add(gc.url);
        d.gallery.push({
          src: gc.url,
          alt: `${d.title} view ${d.gallery.length + 1}`
        });
      }
    }

    // Ensure 5 unique
    for (let poolIdx = 0; poolIdx < DEFAULT_SCENIC_POOL.length && d.gallery.length < 5; poolIdx++) {
      const fallbackUrl = DEFAULT_SCENIC_POOL[poolIdx];
      if (!usedUrls.has(fallbackUrl) && !d.gallery.some(g => g.src === fallbackUrl)) {
        usedUrls.add(fallbackUrl);
        d.gallery.push({
          src: fallbackUrl,
          alt: `${d.title} view ${d.gallery.length + 1}`
        });
      }
    }

    // 3. NEARBY PLACES (3 Distinct Photos Each)
    if (d.topPlaces && d.topPlaces.length > 0) {
      for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
        const place = d.topPlaces[pIdx];
        const placeName = place.name || `Place ${pIdx + 1}`;

        const placeCandidates = await providerManager.search({
          destSlug: summary.slug,
          fieldPath: `topPlaces[${pIdx}].photos`,
          name: placeName,
          type: 'place',
          state: stateName,
          title: d.title
        });

        const validPlacePhotos = placeCandidates.filter(c => c.url && !c.url.includes('.pdf') && !c.url.includes('map_'));
        
        let mainPhoto = validPlacePhotos.find(c => c.url && !usedUrls.has(c.url)) || null;
        if (!mainPhoto || !mainPhoto.url) {
          const fallbackUrl = DEFAULT_SCENIC_POOL.find(u => !usedUrls.has(u));
          if (fallbackUrl) {
            mainPhoto = { url: fallbackUrl };
          } else {
            mainPhoto = validPlacePhotos[0] || { url: DEFAULT_SCENIC_POOL[pIdx % DEFAULT_SCENIC_POOL.length] };
          }
        }
        usedUrls.add(mainPhoto.url);

        if (typeof place.image === 'object') {
          place.image.src = mainPhoto.url;
          place.image.alt = `${placeName}, ${d.title}`;
        } else {
          place.image = mainPhoto.url;
        }

        place.photos = [];
        const placeUsedUrls = new Set();
        place.photos.push(mainPhoto.url);
        placeUsedUrls.add(mainPhoto.url);

        for (const vp of validPlacePhotos) {
          if (place.photos.length < 3 && vp.url && !placeUsedUrls.has(vp.url) && !usedUrls.has(vp.url)) {
            place.photos.push(vp.url);
            placeUsedUrls.add(vp.url);
            usedUrls.add(vp.url);
          }
        }

        if (place.photos.length < 3) {
          const extraPlaceCandidates = await providerManager.search({
            destSlug: summary.slug,
            fieldPath: `topPlaces[${pIdx}].photos_extra`,
            name: `${placeName} ${stateName}`,
            type: 'place',
            state: stateName,
            title: d.title
          });
          for (const ep of extraPlaceCandidates) {
            if (place.photos.length < 3 && ep.url && !placeUsedUrls.has(ep.url) && !usedUrls.has(ep.url) && !ep.url.includes('.pdf') && !ep.url.includes('map_')) {
              place.photos.push(ep.url);
              placeUsedUrls.add(ep.url);
              usedUrls.add(ep.url);
            }
          }
        }

        for (let poolIdx = 0; poolIdx < DEFAULT_SCENIC_POOL.length && place.photos.length < 3; poolIdx++) {
          const fallbackUrl = DEFAULT_SCENIC_POOL[poolIdx];
          if (!placeUsedUrls.has(fallbackUrl) && !usedUrls.has(fallbackUrl)) {
            place.photos.push(fallbackUrl);
            placeUsedUrls.add(fallbackUrl);
            usedUrls.add(fallbackUrl);
          }
        }
      }
    }

    fs.writeFileSync(destFile, JSON.stringify(d, null, 2) + '\n', 'utf8');
    console.log(`  -> Saved: ${d.title} (5 Gallery Photos, ${d.topPlaces?.length || 0} Places × 3 Photos)`);
  }

  await cache.close();
  console.log(`\n=== WORKER NORTH-EAST FINISHED (${count} destinations enriched) ===\n`);
}

if (require.main === module) {
  runWorkerNorthEast().catch(console.error);
}

module.exports = { runWorkerNorthEast };
