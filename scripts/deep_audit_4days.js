const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
console.log(`Found ${allFiles.length} total destination files.`);

// 1. Identify which files differ between Saturday (17833b6e) and Local, and between HEAD and Local
const satDiffList = new Set(
  execSync('git diff --name-only 17833b6e data/destinations/', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(f => path.basename(f))
);

const headDiffList = new Set(
  execSync('git diff --name-only HEAD data/destinations/', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(f => path.basename(f))
);

const gitDiffList = new Set(
  execSync('git diff --name-only 17833b6e..HEAD data/destinations/', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(f => path.basename(f))
);

console.log(`Differ vs Saturday (17833b6e): ${satDiffList.size}`);
console.log(`Differ in Git (17833b6e..HEAD): ${gitDiffList.size}`);
console.log(`Differ locally vs HEAD: ${headDiffList.size}`);

function cleanUrl(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].trim().toLowerCase();
}

// 2. Global Catalog Duplicate & Blurry Analysis across all 2,393 files in Local
const globalUrlMap = new Map(); // cleanUrl -> [destSlugs]
const internalDupDests = new Set();
const crossDupDests = new Set();
const blurryImageDests = new Set();
const wrongImageDests = new Set();
const goodChangedToWrongDests = new Set();

const genericStockPhrases = [
  'scenic landscape and authentic regional beauty',
  'scenic surroundings and heritage vistas near',
  'scenic heritage and nature view at',
  'panoramic landscape view of',
  'scenic vista',
  'heritage vista'
];

function isGenericStockAlt(alt) {
  if (!alt || typeof alt !== 'string') return false;
  const l = alt.toLowerCase();
  return genericStockPhrases.some(p => l.includes(p));
}

function isBlurryOrLowRes(url) {
  if (!url || typeof url !== 'string') return false;
  const l = url.toLowerCase();
  // Small flickr sizes: _s (75px), _t (100px), _m (240px), _n (320px)
  if (l.includes('staticflickr.com') && /_[stmn]\.jpg/.test(l)) return true;
  // Query parameters with very low resolution
  if (/[?&](w|width)=(50|100|150|200|250|300)(&|$)/.test(l)) return true;
  if (/[?&](h|height)=(50|100|150|200|250|300)(&|$)/.test(l)) return true;
  return false;
}

// Scan all destinations for duplicate URLs, blurry URLs, and geographic misattributions
console.log('Scanning all destinations for duplicates, blurry assets, and misattributions...');
const localDestData = new Map();

for (const file of allFiles) {
  const filePath = path.join(destDir, file);
  try {
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    localDestData.set(file, d);
    const slug = d.slug || file.replace('.json', '');
    const state = (d.state || '').toLowerCase();

    const seenInDest = new Set();
    let hasInternalDup = false;
    let hasBlurry = false;
    let hasWrongImage = false;

    function checkSlot(url, alt, slotName) {
      if (!url) return;
      const ck = cleanUrl(url);

      // Track internal duplicates
      // Note: heroImage and gallery[0] are allowed to be identical (hero sync invariant)
      if (seenInDest.has(ck)) {
        if (!(slotName === 'gallery[0]' && cleanUrl(d.heroImage?.src) === ck)) {
          hasInternalDup = true;
        }
      } else {
        seenInDest.add(ck);
      }

      // Track cross-destination duplicates
      if (!globalUrlMap.has(ck)) {
        globalUrlMap.set(ck, []);
      }
      globalUrlMap.get(ck).push(slug);

      // Check blurry
      if (isBlurryOrLowRes(url)) {
        hasBlurry = true;
      }

      // Check geographic / misattribution errors in alt or URL
      const fullText = `${url} ${alt || ''}`.toLowerCase();
      // Out-of-state leak checks
      if (!state.includes('kerala') && (fullText.includes('munnar') || fullText.includes('kattappana') || fullText.includes('alappuzha'))) {
        hasWrongImage = true;
      }
      if (!state.includes('ladakh') && !state.includes('jammu') && (fullText.includes('ladakh') || fullText.includes('pangong'))) {
        hasWrongImage = true;
      }
      if (state.includes('ladakh') && (fullText.includes('western_ghats') || fullText.includes('coorg') || fullText.includes('dhauli') || fullText.includes('bheemana'))) {
        hasWrongImage = true;
      }
      if (state.includes('karnataka') && fullText.includes('brihadeeswarar')) {
        hasWrongImage = true;
      }
      // Check if tragedy in title/alt
      if (fullText.includes('stampede') || fullText.includes('train accident') || fullText.includes('landslide tragedy')) {
        hasWrongImage = true;
      }
    }

    if (d.heroImage?.src) checkSlot(d.heroImage.src, d.heroImage.alt, 'heroImage');
    (d.gallery || []).forEach((g, i) => {
      if (g.src) checkSlot(g.src, g.alt, `gallery[${i}]`);
    });
    (d.topPlaces || []).forEach((p, pIdx) => {
      if (p.image?.src) checkSlot(p.image.src, p.image.alt, `place[${pIdx}].image`);
      (p.photos || []).forEach((ph, phIdx) => {
        const u = typeof ph === 'string' ? ph : ph.src;
        const a = typeof ph === 'string' ? '' : ph.alt;
        if (u) checkSlot(u, a, `place[${pIdx}].photos[${phIdx}]`);
      });
    });

    if (hasInternalDup) internalDupDests.add(file);
    if (hasBlurry) blurryImageDests.add(file);
    if (hasWrongImage) wrongImageDests.add(file);

  } catch (e) {}
}

// Calculate cross-destination duplicates
for (const [url, slugs] of globalUrlMap.entries()) {
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size > 1) {
    for (const s of uniqueSlugs) {
      crossDupDests.add(`${s}.json`);
    }
  }
}

console.log(`Local Destinations with Internal Duplicate URLs: ${internalDupDests.size}`);
console.log(`Local Destinations with Cross-Destination Shared URLs: ${crossDupDests.size}`);
console.log(`Local Destinations with Blurry / Low-Res URLs: ${blurryImageDests.size}`);
console.log(`Local Destinations with Geographically Mislabeled/Wrong Images: ${wrongImageDests.size}`);

// 3. Compare Saturday (17833b6e) vs Local to find where good images changed to wrong/generic images
console.log('\nAnalyzing Saturday vs Local for Good-to-Wrong Image transitions...');

const goodToWrongExamples = [];

for (const file of satDiffList) {
  let satData = null;
  try {
    const raw = execSync(`git show 17833b6e:data/destinations/${file}`, { encoding: 'utf8' });
    satData = JSON.parse(raw);
  } catch (e) {
    continue;
  }
  const localData = localDestData.get(file);
  if (!localData || !satData) continue;

  const destType = (satData.type || localData.type || '').toLowerCase();
  const isMonumentType = ['spiritual', 'heritage', 'monument', 'fort', 'temple', 'palace', 'caves'].includes(destType);

  let hasGoodToWrong = false;
  const changes = [];

  // Check Hero Image
  const satHero = satData.heroImage?.src || '';
  const localHero = localData.heroImage?.src || '';
  if (satHero && localHero && cleanUrl(satHero) !== cleanUrl(localHero)) {
    // Was Saturday a specific wikimedia / flickr monument photo, and Local a generic pexels landscape?
    const satWasWiki = satHero.includes('wikimedia.org') || satHero.includes('wikipedia.org');
    const localIsPexels = localHero.includes('pexels.com') || localHero.includes('unsplash.com');
    const localAltGeneric = isGenericStockAlt(localData.heroImage?.alt);

    if (satWasWiki && localIsPexels && (localAltGeneric || isMonumentType)) {
      hasGoodToWrong = true;
      changes.push({
        slot: 'heroImage',
        satUrl: satHero,
        satAlt: satData.heroImage?.alt,
        localUrl: localHero,
        localAlt: localData.heroImage?.alt
      });
    }
  }

  // Check Places
  const satPlaces = satData.topPlaces || [];
  const localPlaces = localData.topPlaces || [];

  for (let i = 0; i < Math.min(satPlaces.length, localPlaces.length); i++) {
    const sp = satPlaces[i];
    const lp = localPlaces[i];
    const spImg = sp.image?.src || (sp.photos?.[0] ? (typeof sp.photos[0] === 'string' ? sp.photos[0] : sp.photos[0].src) : '');
    const lpImg = lp.image?.src || (lp.photos?.[0] ? (typeof lp.photos[0] === 'string' ? lp.photos[0] : lp.photos[0].src) : '');

    if (spImg && lpImg && cleanUrl(spImg) !== cleanUrl(lpImg)) {
      const satWasWiki = spImg.includes('wikimedia.org') || spImg.includes('wikipedia.org');
      const localIsPexels = lpImg.includes('pexels.com') || lpImg.includes('unsplash.com');
      const localAltGeneric = isGenericStockAlt(lp.image?.alt);

      if (satWasWiki && localIsPexels && (localAltGeneric || isMonumentType)) {
        hasGoodToWrong = true;
        changes.push({
          slot: `place[${i}]: ${sp.name}`,
          satUrl: spImg,
          satAlt: sp.image?.alt,
          localUrl: lpImg,
          localAlt: lp.image?.alt
        });
      }
    }
  }

  if (hasGoodToWrong) {
    goodChangedToWrongDests.add(file);
    if (goodToWrongExamples.length < 15) {
      goodToWrongExamples.push({
        file,
        title: satData.title || localData.title,
        state: satData.state || localData.state,
        type: destType,
        changes
      });
    }
  }
}

console.log(`Total Destinations where authentic/monument photos changed to generic/wrong stock: ${goodChangedToWrongDests.size}`);

// Write comprehensive output to a scratch JSON
const reportData = {
  totalDestinations: allFiles.length,
  differVsSaturday: satDiffList.size,
  differInGitCommits: gitDiffList.size,
  differInLocalWorkingTree: headDiffList.size,
  goodChangedToWrongCount: goodChangedToWrongDests.size,
  goodChangedToWrongFiles: Array.from(goodChangedToWrongDests),
  goodChangedToWrongExamples: goodToWrongExamples,
  internalDuplicateDestsCount: internalDupDests.size,
  internalDuplicateDests: Array.from(internalDupDests),
  crossDestinationDuplicateDestsCount: crossDupDests.size,
  crossDestinationDuplicateDests: Array.from(crossDupDests),
  blurryImageDestsCount: blurryImageDests.size,
  blurryImageDests: Array.from(blurryImageDests),
  wrongImageDestsCount: wrongImageDests.size,
  wrongImageDests: Array.from(wrongImageDests)
};

fs.writeFileSync('scratch_deep_audit_4days.json', JSON.stringify(reportData, null, 2));
console.log('Report successfully saved to scratch_deep_audit_4days.json');
