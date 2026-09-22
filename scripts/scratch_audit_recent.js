const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const targets = JSON.parse(fs.readFileSync('scratch_combined_targets.json', 'utf8'));

// 1. Build repo-wide URL map to detect cross-destination collisions
console.log(`Building catalog URL index from all destinations...`);
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const targetSet = new Set(targets);

// Map url -> array of destinations using it
function cleanUrlKey(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].trim().toLowerCase();
}

const catalogUrls = new Map(); // cleanKey -> Set of files

for (const f of allFiles) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
    const urls = [];
    if (d.heroImage?.src) urls.push(d.heroImage.src);
    (d.gallery || []).forEach(g => g.src && urls.push(g.src));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) urls.push(p.image.src);
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph.src;
        if (u) urls.push(u);
      });
    });

    // heroImage === gallery[0] is expected, so dedupe per file
    const fileUnique = new Set(urls.map(cleanUrlKey).filter(Boolean));
    for (const u of fileUnique) {
      if (!catalogUrls.has(u)) catalogUrls.set(u, new Set());
      catalogUrls.get(u).add(f);
    }
  } catch (e) {}
}

console.log(`Indexed ${catalogUrls.size} unique URLs across ${allFiles.length} catalog destinations.`);

// Negative semantic patterns
const BANNED_PATTERNS = [
  /wikimedia\.org/i,
  /wikipedia\.org/i,
  /pixabay\.com\/get\/g/i,
  /picsum\.photos/i,
  /via\.placeholder/i,
  /dummyimage/i,
  /placeholder/i,
  /\.svg(\?|$)/i,
  /\.pdf(\?|$)/i,
  /\.gif(\?|$)/i,
  /transmission\s*tower/i,
  /power\s*line/i,
  /high\s*voltage/i,
  /pylon/i,
  /electric\s*pole/i,
  /selfie/i,
  /portrait/i,
  /model\s*posing/i,
  /close-up\s*of\s*face/i,
  /smiling\s*at\s*camera/i,
  /hajdúszoboszló/i,
  /hungary/i,
  /taipei/i,
  /taiwan/i,
  /cappadocia/i,
  /istanbul/i,
  /turkey/i,
  /sri\s*lanka/i,
  /colombo/i,
  /haputale/i,
  /polonnaruwa/i,
  /vietnam/i,
  /thailand/i,
  /tokyo/i,
  /seoul/i,
  /angkor/i,
  /alps/i,
  /minnesota/i
];

const issuesByDest = {};
let totalIssues = 0;
let wikimediaCount = 0;
let crossCollisionCount = 0;
let internalDupCount = 0;
let heroSyncCount = 0;
let galleryCountMismatch = 0;
let placePhotoMismatch = 0;
let bannedSemanticCount = 0;

for (const targetFile of targets) {
  const filePath = path.join(destDir, targetFile);
  if (!fs.existsSync(filePath)) continue;
  
  let d;
  try {
    d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    issuesByDest[targetFile] = [{ type: 'PARSE_ERROR', error: e.message }];
    continue;
  }

  const destIssues = [];
  const localUrlCounts = new Map();

  function checkUrl(url, label, title = '', alt = '') {
    if (!url || typeof url !== 'string' || !url.trim()) {
      destIssues.push({ type: 'MISSING_URL', label, title });
      return;
    }
    const cleanKey = cleanUrlKey(url);
    const combinedText = `${url} ${title} ${alt}`;

    // Wikimedia check
    if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
      destIssues.push({ type: 'WIKIMEDIA_URL', label, url, title });
      wikimediaCount++;
    }

    // Banned semantic patterns
    for (const pat of BANNED_PATTERNS) {
      if (pat.test(combinedText)) {
        destIssues.push({ type: 'BANNED_PATTERN', pattern: pat.toString(), label, url, title });
        bannedSemanticCount++;
        break;
      }
    }

    // Unsplash low res check (< 1600 or portrait)
    if (url.includes('images.unsplash.com')) {
      const matchW = url.match(/[?&]w=(\d+)/);
      if (matchW && parseInt(matchW[1]) < 1600) {
        destIssues.push({ type: 'LOW_RES_UNSPLASH', label, url, w: matchW[1] });
      }
      if (url.includes('fit=crop') && url.match(/[?&]h=(\d+)/) && matchW) {
        const w = parseInt(matchW[1]);
        const h = parseInt(url.match(/[?&]h=(\d+)/)[1]);
        if (h > w) {
          destIssues.push({ type: 'PORTRAIT_UNSPLASH', label, url, w, h });
        }
      }
    }

    // Cross-destination collision check
    const usedIn = catalogUrls.get(cleanKey);
    if (usedIn && usedIn.size > 1) {
      const otherFiles = Array.from(usedIn).filter(f => f !== targetFile);
      if (otherFiles.length > 0) {
        destIssues.push({ type: 'CROSS_COLLISION', label, url, otherFiles: otherFiles.slice(0, 3) });
        crossCollisionCount++;
      }
    }

    // Internal duplicate tracking (excluding hero === gallery[0])
    if (label !== 'heroImage') {
      const count = (localUrlCounts.get(cleanKey) || 0) + 1;
      localUrlCounts.set(cleanKey, count);
      if (count > 1) {
        destIssues.push({ type: 'INTERNAL_DUPLICATE', label, url });
        internalDupCount++;
      }
    }
  }

  // 1. Hero checks
  const heroSrc = d.heroImage?.src;
  checkUrl(heroSrc, 'heroImage', d.name || d.title, d.heroImage?.alt);

  // 2. Gallery checks
  const gallery = d.gallery || [];
  if (gallery.length !== 5) {
    destIssues.push({ type: 'GALLERY_COUNT_MISMATCH', count: gallery.length });
    galleryCountMismatch++;
  }

  // Hero sync check
  if (gallery.length > 0 && cleanUrlKey(heroSrc) !== cleanUrlKey(gallery[0]?.src)) {
    destIssues.push({ type: 'HERO_SYNC_MISMATCH', heroSrc, gallery0Src: gallery[0]?.src });
    heroSyncCount++;
  }

  gallery.forEach((g, idx) => {
    checkUrl(g.src, `gallery[${idx}]`, g.title, g.alt);
  });

  // 3. TopPlaces checks
  (d.topPlaces || []).forEach((p, pIdx) => {
    const pName = p.name || `Place ${pIdx}`;
    checkUrl(p.image?.src, `place[${pIdx}].image`, pName, p.image?.alt);
    const photos = p.photos || [];
    if (photos.length !== 3) {
      destIssues.push({ type: 'PLACE_PHOTOS_COUNT_MISMATCH', place: pName, count: photos.length });
      placePhotoMismatch++;
    }
    photos.forEach((ph, phIdx) => {
      const u = typeof ph === 'string' ? ph : ph.src;
      const alt = typeof ph === 'object' ? ph.alt : '';
      const title = typeof ph === 'object' ? ph.title : '';
      checkUrl(u, `place[${pIdx}].photos[${phIdx}]`, title || pName, alt);
    });
  });

  if (destIssues.length > 0) {
    issuesByDest[targetFile] = destIssues;
    totalIssues += destIssues.length;
  }
}

console.log(`\n--- AUDIT SUMMARY FOR RECENT DESTINATIONS ---`);
console.log(`Total Destinations Checked: ${targets.length}`);
console.log(`Destinations with Issues: ${Object.keys(issuesByDest).length}`);
console.log(`Total Issue Items: ${totalIssues}`);
console.log(`- Wikimedia URLs: ${wikimediaCount}`);
console.log(`- Cross-Destination Collisions: ${crossCollisionCount}`);
console.log(`- Internal Duplicate URLs: ${internalDupCount}`);
console.log(`- Hero Synchronization Mismatches: ${heroSyncCount}`);
console.log(`- Gallery Count !== 5: ${galleryCountMismatch}`);
console.log(`- Place Photos Count !== 3: ${placePhotoMismatch}`);
console.log(`- Banned Patterns / Semantic Mismatches: ${bannedSemanticCount}`);

fs.writeFileSync('scratch_audit_results.json', JSON.stringify(issuesByDest, null, 2));
