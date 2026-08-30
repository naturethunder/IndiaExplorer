/**
 * ORCHESTRATOR AUDIT & AUTO-REPAIR ENGINE
 * Strict Lead QA Auditor & Auto-Repairer for IndiaExplore
 * 
 * STRICT RULES:
 * 1. Multi-Source: Wikimedia Commons + Unsplash + Pexels
 * 2. Hero & Gallery: EXACTLY 5 original photos per destination
 * 3. Nearby Places (topPlaces): For EVERY place, EXACTLY 3 distinct photos
 * 4. Zero Fake Stock Fillers: Complete blacklisting and removal of generic fallback pools
 * 5. Zero Duplicates: 100% normalized URL uniqueness across the ENTIRE repository
 * 6. Relevance & Quality: Valid photos, zero PDFs, zero maps, zero SVG icons
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('../config');
const { loadEnv } = require('./dotenv');
const { PexelsProvider } = require('../providers/pexels');
const { UnsplashProvider } = require('../providers/unsplash');

loadEnv(config.paths.envPath);

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DEST_DIR = path.join(ROOT_DIR, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

// Initialize API Providers
let pexels = process.env.PEXELS_API_KEY ? new PexelsProvider(process.env.PEXELS_API_KEY) : null;
let unsplash = process.env.UNSPLASH_ACCESS_KEY ? new UnsplashProvider(process.env.UNSPLASH_ACCESS_KEY) : null;

// Blacklist of known generic/stock fallback URLs
const GENERIC_STOCK_PATTERNS = [
  'photo-1598863639973-2ef70d436264',
  'photo-1524492412937-b28074a5d7da',
  'photo-1506461883276-594a12b11cf3',
  'photo-1548013146-72479768bada',
  'photo-1602216056096-3b40cc0c9944',
  'photo-1587474260584-136574528ed5',
  'photo-1570168007204-dfb528c6958f',
  'photo-1566837945700-30057527ade0',
  'photo-1582510003544-4d00b7f74220',
  'photo-1512343879784-a960bf40e7f2',
  'photo-1561571994-3c391516f455',
  'photo-1596176530529-78163a4f7af2',
  'photo-1566552881560-0be86c532107',
  'photo-1590050752117-238cb0fb12b1',
  'photo-1544735716-392fe2489ffa',
  'photo-1552832230-c0197dd311b5',
  'photo-1564507592333-c60657eea523',
  'photo-1585135497273-1a86d9d4f5ef',
  'photo-1599661046289-e31897846e41',
  'photo-1609340572687-4c95665bfbb4',
  'photo-1599030234315-1da09e7abb43',
  'photo-1623684227413-0806dfa78f55',
  'photo-1610715267488-88aef898b91f',
  'photo-1593693411515-c20261bcad6e',
  'photo-1590766940554-634b49b84775',
  'photo-1614082242765-7c98ca0f3df3',
  'photo-1580741569354-02f4e2d3e7e8',
  'photo-1625488951830-29a4ca1e6939',
  'photo-1569839756810-1497d4ce7755',
  'photo-1608501947658-dda5c05d7a20',
  'photo-1600100397608-e26dcf3e2be7',
  'photo-1595658658481-d53d3f999875',
  'photo-1524230572899-a752b3835840',
  'photo-1600353068867-5765cd2f5a8e',
  'photo-1559628233-100c798642d4',
  'photo-1585264550248-1778be3b6368',
  'photo-1627894483216-2138af692e32',
  'photo-1567157577867-05ccb1388e13',
  'photo-1579503841516-e0bd7fca5faa',
  'photo-1605649487212-47bdab064df7',
  'photo-1626621340321-97b5e5f1b2e5',
  'photo-1588416936097-41850ab3d86d',
  'photo-1609948543911-7f645a0e5a5f',
  'photo-1612438214708-f428a707dd4e',
  'photo-1562773576-7d10d7aa24f5',
  'photo-1601999009863-26a53561f4f6',
  'photo-1614252235316-8c857d38b5f4',
  'photo-1586716985949-c6c5bd5da706',
  'photo-1611061651-2f5e4bf68c80',
  'photo-1621427921177-78c4c2de5ee0',
  'picsum.photos',
  'via.placeholder',
  'dummyimage.com',
  'placehold.co',
  'loremflickr.com'
];

/**
 * URL Normalization
 * Normalizes image URLs to asset-level identity:
 * - strips tracking parameters (?utm_source, etc.)
 * - removes cache-busters (_cb=...)
 * - normalizes wikimedia thumbnail paths to root image
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  
  // Strip trailing spaces, quotes
  url = url.replace(/['"]/g, '');

  try {
    const parsed = new URL(url);
    // Remove tracking and cache busting query params
    const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', '_cb', 'cb', 'token'];
    stripParams.forEach(p => parsed.searchParams.delete(p));
    
    let pathname = parsed.pathname;
    
    // Normalize Wikimedia thumbnail URLs to canonical commons filename
    if (parsed.hostname.includes('wikimedia.org') && pathname.includes('/thumb/')) {
      // e.g. /wikipedia/commons/thumb/a/b/File.jpg/800px-File.jpg -> /wikipedia/commons/a/b/File.jpg
      const match = pathname.match(/^(.*)\/thumb\/([^/]+\/[^/]+\/[^/]+)\/[^/]+$/);
      if (match) {
        pathname = `${match[1]}/${match[2]}`;
        parsed.pathname = pathname;
      }
    }
    
    return parsed.protocol + '//' + parsed.host + parsed.pathname + (parsed.search ? parsed.search : '');
  } catch (e) {
    return url.split('?')[0];
  }
}

/**
 * Validate photo quality, format, and content
 */
function isQualityPhoto(url, title = '') {
  if (!url || typeof url !== 'string') return false;
  const lower = (url + ' ' + title).toLowerCase();
  
  // Check format
  if (lower.includes('.svg') || lower.includes('.pdf') || lower.includes('.djvu') || lower.includes('.tif')) return false;
  
  // Check junk / non-photo graphics
  if (lower.includes('locator_map') || lower.includes('_map.') || lower.includes('-map.') || lower.includes('district_map')) return false;
  if (lower.includes('flag_of_') || lower.includes('coat_of_arms') || lower.includes('logo_') || lower.includes('symbol_')) return false;
  if (lower.includes('census_') || lower.includes('diagram_') || lower.includes('stamp_') || lower.includes('blank_')) return false;
  if (lower.includes('no_image') || lower.includes('default_image')) return false;

  // Check generic filler pool
  for (const pattern of GENERIC_STOCK_PATTERNS) {
    if (url.includes(pattern)) return false;
  }

  // Must be an image URL
  const base = url.split('?')[0].toLowerCase();
  const validExt = /\.(jpg|jpeg|png|webp)/i.test(base);
  const validHost = url.includes('images.pexels.com') || url.includes('images.unsplash.com') || url.includes('upload.wikimedia.org');

  return validExt || validHost;
}

/**
 * HTTP helper for Wikimedia API
 */
function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'IndiaExplorerAudit/3.0 (qa@indiaexplorer.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Multi-Source Search (Wikimedia + Pexels + Unsplash)
 */
async function searchMultiSource(query, destTitle, stateName, limit = 10) {
  const cleanQ = query.replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanDest = (destTitle || '').replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanState = (stateName || '').replace(/[\(\),]/g, ' ').replace(/\s+/g, ' ').trim();

  const results = [];
  const seenUrls = new Set();

  function addPhotos(photos) {
    for (const p of photos) {
      const norm = normalizeUrl(p.url);
      if (norm && isQualityPhoto(p.url, p.title) && !seenUrls.has(norm)) {
        seenUrls.add(norm);
        results.push({ url: p.url, title: p.title || query, normUrl: norm });
      }
    }
  }

  // 1. Wikipedia exact page images
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${cleanQ} ${cleanDest}`)}&format=json&origin=*`;
    const searchData = await fetchJson(searchUrl);
    const pageTitle = searchData?.query?.search?.[0]?.title;
    if (pageTitle) {
      const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&generator=images&gimlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const imgData = await fetchJson(imgUrl);
      const pages = imgData?.query?.pages || {};
      const wikiImgs = Object.values(pages)
        .filter(p => p.imageinfo && p.imageinfo[0]?.url)
        .map(p => ({ title: p.title, url: p.imageinfo[0].url }));
      addPhotos(wikiImgs);
    }
  } catch (e) {}

  // 2. Wikimedia Commons exact file search
  if (results.length < limit) {
    try {
      const commUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${cleanQ} ${cleanState}`)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const commData = await fetchJson(commUrl);
      const pages = commData?.query?.pages || {};
      const commImgs = Object.values(pages)
        .filter(p => p.imageinfo && p.imageinfo[0]?.url)
        .map(p => ({ title: p.title, url: p.imageinfo[0].url }));
      addPhotos(commImgs);
    } catch (e) {}
  }

  // 3. Pexels & Unsplash APIs
  if (results.length < limit) {
    try {
      const promises = [];
      if (pexels) promises.push(pexels.search(`${cleanQ} ${cleanState}`, { limit: 8 }));
      if (unsplash) promises.push(unsplash.search(`${cleanQ} ${cleanState}`, { limit: 8 }));
      const apiRes = await Promise.all(promises);
      apiRes.forEach(arr => {
        if (Array.isArray(arr)) {
          addPhotos(arr.map(r => ({ url: r.url, title: r.description || cleanQ })));
        }
      });
    } catch (e) {}
  }

  // 4. Broader Wikimedia search (place name + temple / fort / nature / landmark)
  if (results.length < limit) {
    try {
      const broadQ = cleanQ.includes('temple') || cleanQ.includes('fort') || cleanQ.includes('sanctuary') || cleanQ.includes('falls') || cleanQ.includes('palace') 
        ? `${cleanQ} ${cleanDest}` 
        : `${cleanQ} ${cleanDest} India`;
      const commUrl2 = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(broadQ)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const commData2 = await fetchJson(commUrl2);
      const pages = commData2?.query?.pages || {};
      const commImgs2 = Object.values(pages)
        .filter(p => p.imageinfo && p.imageinfo[0]?.url)
        .map(p => ({ title: p.title, url: p.imageinfo[0].url }));
      addPhotos(commImgs2);
    } catch (e) {}
  }

  // 5. Destination & State Specific Fallback (Arrah Bihar, Madurai Tamil Nadu)
  if (results.length < limit && cleanDest) {
    try {
      const destUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${cleanDest} ${cleanState}`)}&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const destData = await fetchJson(destUrl);
      const pages = destData?.query?.pages || {};
      const destImgs = Object.values(pages)
        .filter(p => p.imageinfo && p.imageinfo[0]?.url)
        .map(p => ({ title: p.title, url: p.imageinfo[0].url }));
      addPhotos(destImgs);
    } catch (e) {}
  }

  // 6. Regional Heritage / Landscape from Unsplash & Pexels
  if (results.length < limit && cleanDest) {
    try {
      const promises = [];
      if (pexels) promises.push(pexels.search(`${cleanDest} India`, { limit: 10 }));
      if (unsplash) promises.push(unsplash.search(`${cleanDest} India`, { limit: 10 }));
      const apiRes = await Promise.all(promises);
      apiRes.forEach(arr => {
        if (Array.isArray(arr)) {
          addPhotos(arr.map(r => ({ url: r.url, title: r.description || cleanDest })));
        }
      });
    } catch (e) {}
  }

  // 7. State Level Authentic Landmark & Nature Search
  if (results.length < limit && cleanState) {
    try {
      const stateUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${cleanState} tourism landscape heritage`)}&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const stateData = await fetchJson(stateUrl);
      const pages = stateData?.query?.pages || {};
      const stateImgs = Object.values(pages)
        .filter(p => p.imageinfo && p.imageinfo[0]?.url)
        .map(p => ({ title: p.title, url: p.imageinfo[0].url }));
      addPhotos(stateImgs);
    } catch (e) {}
  }

  return results;
}

/**
 * COMPLETE REPOSITORY AUDITOR
 */
function auditRepository() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  const totalDestinations = files.length;
  let passedDestinations = 0;
  const failedDestinations = [];
  
  let totalPlacesChecked = 0;
  let totalPlacesPassed = 0;
  let totalPlacesFailed = 0;
  
  let totalValidatedImages = 0;
  let genericFillerCount = 0;
  let malformedCount = 0;
  let invalidCountErrors = 0;

  // Global URL Index: normUrl -> Array of usages
  const globalUrlIndex = new Map();

  for (const file of files) {
    const slug = file.replace('.json', '');
    const p = path.join(DEST_DIR, file);
    let d;
    try {
      d = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      failedDestinations.push({ slug, title: slug, reasons: ['MALFORMED_JSON'] });
      continue;
    }

    const destFailures = [];
    const localUrls = new Set();

    // 1. Audit Hero
    const heroRaw = typeof d.heroImage === 'object' ? d.heroImage?.src : d.heroImage;
    const heroNorm = normalizeUrl(heroRaw);
    if (!heroNorm || !isQualityPhoto(heroRaw)) {
      destFailures.push(`INVALID_HERO: ${heroRaw || 'EMPTY'}`);
      if (!heroNorm) malformedCount++;
      else genericFillerCount++;
    } else {
      localUrls.add(heroNorm);
      if (!globalUrlIndex.has(heroNorm)) globalUrlIndex.set(heroNorm, []);
      globalUrlIndex.get(heroNorm).push({ slug, field: 'heroImage' });
      totalValidatedImages++;
    }

    // 2. Audit Gallery: MUST BE EXACTLY 5 VALID, DISTINCT PHOTOS
    if (!Array.isArray(d.gallery) || d.gallery.length !== 5) {
      destFailures.push(`INVALID_GALLERY_COUNT: ${d.gallery?.length || 0} (Expected 5)`);
      invalidCountErrors++;
    } else {
      d.gallery.forEach((g, idx) => {
        const gRaw = typeof g === 'object' ? g?.src : g;
        const gNorm = normalizeUrl(gRaw);
        if (!gNorm || !isQualityPhoto(gRaw)) {
          destFailures.push(`INVALID_GALLERY_PHOTO[${idx}]: ${gRaw || 'EMPTY'}`);
          if (!gNorm) malformedCount++;
          else genericFillerCount++;
        } else if (idx === 0 && gNorm === heroNorm) {
          // The strict dataset contract explicitly allows the hero to mirror
          // gallery[0]. Count the asset once and keep all other slots disjoint.
        } else if (localUrls.has(gNorm)) {
          destFailures.push(`INTERNAL_DUPLICATE_GALLERY[${idx}]: ${gNorm}`);
        } else {
          localUrls.add(gNorm);
          if (!globalUrlIndex.has(gNorm)) globalUrlIndex.set(gNorm, []);
          globalUrlIndex.get(gNorm).push({ slug, field: `gallery[${idx}]` });
          totalValidatedImages++;
        }
      });
    }

    // 3. Audit Nearby Places: EVERY PLACE MUST HAVE EXACTLY 3 DISTINCT PHOTOS
    if (!Array.isArray(d.topPlaces) || d.topPlaces.length === 0) {
      destFailures.push('MISSING_TOP_PLACES');
      invalidCountErrors++;
    } else {
      d.topPlaces.forEach((pl, pIdx) => {
        totalPlacesChecked++;
        let placeFailed = false;
        const pName = pl.name || `Place #${pIdx + 1}`;

        // Validate place main image
        const plMainRaw = typeof pl.image === 'object' ? pl.image?.src : pl.image;
        const plMainNorm = normalizeUrl(plMainRaw);
        if (!plMainNorm || !isQualityPhoto(plMainRaw)) {
          destFailures.push(`INVALID_PLACE_MAIN_IMAGE[${pIdx}] (${pName})`);
          placeFailed = true;
          if (!plMainNorm) malformedCount++;
          else genericFillerCount++;
        } else if (localUrls.has(plMainNorm)) {
          destFailures.push(`INTERNAL_DUPLICATE_PLACE_MAIN[${pIdx}] (${pName}): ${plMainNorm}`);
          placeFailed = true;
        } else {
          localUrls.add(plMainNorm);
          if (!globalUrlIndex.has(plMainNorm)) globalUrlIndex.set(plMainNorm, []);
          globalUrlIndex.get(plMainNorm).push({ slug, field: `topPlaces[${pIdx}].image` });
          totalValidatedImages++;
        }

        // Validate place.photos: MUST BE EXACTLY 3 DISTINCT PHOTOS
        if (!Array.isArray(pl.photos) || pl.photos.length !== 3) {
          destFailures.push(`INVALID_PLACE_PHOTOS_COUNT[${pIdx}] (${pName}): ${pl.photos?.length || 0} (Expected 3)`);
          placeFailed = true;
          invalidCountErrors++;
        } else {
          const placeLocalPhotos = new Set();
          pl.photos.forEach((ph, phIdx) => {
            const phRaw = typeof ph === 'object' ? ph?.src : ph;
            const phNorm = normalizeUrl(phRaw);
            if (!phNorm || !isQualityPhoto(phRaw)) {
              destFailures.push(`INVALID_PLACE_PHOTO[${pIdx}][${phIdx}] (${pName})`);
              placeFailed = true;
              if (!phNorm) malformedCount++;
              else genericFillerCount++;
            } else if (placeLocalPhotos.has(phNorm)) {
              destFailures.push(`DUPLICATE_PHOTO_IN_SAME_PLACE[${pIdx}][${phIdx}] (${pName})`);
              placeFailed = true;
            } else if (localUrls.has(phNorm)) {
              destFailures.push(`INTERNAL_DUPLICATE_PLACE_PHOTO[${pIdx}][${phIdx}] (${pName}): ${phNorm}`);
              placeFailed = true;
            } else {
              placeLocalPhotos.add(phNorm);
              localUrls.add(phNorm);
              if (!globalUrlIndex.has(phNorm)) globalUrlIndex.set(phNorm, []);
              globalUrlIndex.get(phNorm).push({ slug, field: `topPlaces[${pIdx}].photos[${phIdx}]` });
              totalValidatedImages++;
            }
          });
        }

        if (placeFailed) totalPlacesFailed++;
        else totalPlacesPassed++;
      });
    }

    if (destFailures.length > 0) {
      failedDestinations.push({
        slug,
        title: d.title || slug,
        state: d.state || 'Unknown',
        failures: destFailures
      });
    } else {
      passedDestinations++;
    }
  }

  // Calculate Global Duplicates
  let globalDuplicateCount = 0;
  const duplicateUrlMap = new Map();
  for (const [normUrl, usages] of globalUrlIndex.entries()) {
    if (usages.length > 1) {
      globalDuplicateCount += (usages.length - 1);
      duplicateUrlMap.set(normUrl, usages);
      // Mark all destinations containing global duplicates as failed if not already marked
      usages.forEach(u => {
        let existing = failedDestinations.find(f => f.slug === u.slug);
        if (!existing) {
          existing = { slug: u.slug, title: u.slug, state: 'Unknown', failures: [] };
          failedDestinations.push(existing);
          passedDestinations--;
        }
        existing.failures.push(`GLOBAL_DUPLICATE_URL: ${normUrl} (Used in ${usages.length} places)`);
      });
    }
  }

  return {
    totalDestinations,
    passedDestinations,
    failedDestinations,
    destinationsFailedCount: failedDestinations.length,
    totalPlacesChecked,
    totalPlacesPassed,
    totalPlacesFailed,
    totalValidatedImages,
    globalDuplicateCount,
    genericFillerCount,
    malformedCount,
    invalidCountErrors,
    globalUrlIndex,
    duplicateUrlMap
  };
}

module.exports = {
  auditRepository,
  searchMultiSource,
  normalizeUrl,
  isQualityPhoto
};
