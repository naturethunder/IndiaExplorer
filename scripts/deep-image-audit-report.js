const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));

console.log('Total destination files found:', files.length);

function extractAllImageUrls(obj, pathPrefix = '', list = []) {
  if (!obj) return list;
  if (typeof obj === 'string') {
    if (obj.startsWith('http://') || obj.startsWith('https://') || obj.startsWith('/images/') || obj.startsWith('images/')) {
      list.push({ path: pathPrefix, url: obj });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      extractAllImageUrls(item, `${pathPrefix}[${idx}]`, list);
    });
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      extractAllImageUrls(obj[key], pathPrefix ? `${pathPrefix}.${key}` : key, list);
    }
  }
  return list;
}

function normalizeUrl(url) {
  try {
    let clean = url.trim();
    const qIndex = clean.indexOf('?');
    if (qIndex !== -1) clean = clean.substring(0, qIndex);
    
    // Wikimedia thumbnail normalization e.g. /thumb/.../800px-filename.jpg -> filename.jpg
    const wikiMatch = clean.match(/\/thumb\/[^\/]+\/[^\/]+\/([^\/]+)\/[0-9]+px-(?:[^\/]+)$/i);
    if (wikiMatch) {
      return 'wikimedia:' + decodeURIComponent(wikiMatch[1]).toLowerCase();
    }
    
    // Unsplash photo id normalization e.g. https://images.unsplash.com/photo-1548013146-72479768bada
    const unsplashMatch = clean.match(/unsplash\.com\/(photo-[a-zA-Z0-9-]+)/i);
    if (unsplashMatch) {
      return 'unsplash:' + unsplashMatch[1].toLowerCase();
    }

    return clean.toLowerCase();
  } catch (e) {
    return url.toLowerCase();
  }
}

// Data structures
let totalImagesCount = 0;
let globalUrlMap = new Map(); // exact url -> array of { file, path }
let normalizedUrlMap = new Map(); // normalized url -> array of { file, path, origUrl }
let internalDuplicateFiles = []; // { file, count, dupes: [...] }

// Breakdown by categories
let heroUrlsMap = new Map();
let galleryUrlsMap = new Map();
let placeUrlsMap = new Map();

files.forEach(file => {
  const content = fs.readFileSync(path.join(DEST_DIR, file), 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('JSON parse error in', file);
    return;
  }

  const urls = extractAllImageUrls(data);
  const seenExactInFile = new Map();
  const fileInternalDupes = [];

  urls.forEach(item => {
    totalImagesCount++;

    // Specific category tracking
    if (item.path.startsWith('heroImage')) {
      if (!heroUrlsMap.has(item.url)) heroUrlsMap.set(item.url, []);
      heroUrlsMap.get(item.url).push(file);
    } else if (item.path.startsWith('gallery')) {
      if (!galleryUrlsMap.has(item.url)) galleryUrlsMap.set(item.url, []);
      galleryUrlsMap.get(item.url).push(file);
    } else if (item.path.includes('topPlaces') || item.path.includes('places')) {
      if (!placeUrlsMap.has(item.url)) placeUrlsMap.set(item.url, []);
      placeUrlsMap.get(item.url).push(file);
    }

    // Global exact tracking
    if (!globalUrlMap.has(item.url)) globalUrlMap.set(item.url, []);
    globalUrlMap.get(item.url).push({ file, path: item.path });

    // Global normalized tracking
    const norm = normalizeUrl(item.url);
    if (!normalizedUrlMap.has(norm)) normalizedUrlMap.set(norm, []);
    normalizedUrlMap.get(norm).push({ file, path: item.path, origUrl: item.url });

    // Intra-file exact duplicate check
    if (seenExactInFile.has(item.url)) {
      fileInternalDupes.push({
        firstPath: seenExactInFile.get(item.url),
        duplicatePath: item.path,
        url: item.url
      });
    } else {
      seenExactInFile.set(item.url, item.path);
    }
  });

  if (fileInternalDupes.length > 0) {
    internalDuplicateFiles.push({
      file,
      slug: data.slug || file.replace('.json', ''),
      name: data.name || file,
      dupeCount: fileInternalDupes.length,
      dupes: fileInternalDupes
    });
  }
});

// Calculate cross-destination exact duplicates
let crossDestExactDupes = [];
for (const [url, locations] of globalUrlMap.entries()) {
  const distinctFiles = new Set(locations.map(l => l.file));
  if (distinctFiles.size > 1) {
    crossDestExactDupes.push({
      url,
      fileCount: distinctFiles.size,
      totalRefs: locations.length,
      files: Array.from(distinctFiles),
      locations
    });
  }
}
crossDestExactDupes.sort((a, b) => b.totalRefs - a.totalRefs);

// Calculate cross-destination normalized duplicates
let crossDestNormDupes = [];
for (const [norm, locations] of normalizedUrlMap.entries()) {
  const distinctFiles = new Set(locations.map(l => l.file));
  if (distinctFiles.size > 1) {
    crossDestNormDupes.push({
      norm,
      fileCount: distinctFiles.size,
      totalRefs: locations.length,
      files: Array.from(distinctFiles),
      origUrls: Array.from(new Set(locations.map(l => l.origUrl)))
    });
  }
}
crossDestNormDupes.sort((a, b) => b.totalRefs - a.totalRefs);

// Also check search-index.json
const searchIndexPath = path.join(ROOT, 'data', 'search-index.json');
let searchIndexStats = { exists: false, totalItems: 0, heroDupes: 0 };
if (fs.existsSync(searchIndexPath)) {
  searchIndexStats.exists = true;
  try {
    const sData = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));
    searchIndexStats.totalItems = sData.length;
    const sHeroMap = new Map();
    sData.forEach(item => {
      const img = item.heroImage?.src || item.heroImage || item.image;
      if (img) {
        if (!sHeroMap.has(img)) sHeroMap.set(img, []);
        sHeroMap.get(img).push(item.slug || item.name);
      }
    });
    let sDupes = 0;
    for (const [img, slugs] of sHeroMap.entries()) {
      if (slugs.length > 1) sDupes++;
    }
    searchIndexStats.heroDupes = sDupes;
  } catch (e) {
    console.error('Error reading search-index.json:', e);
  }
}

// Generate report object
const report = {
  summary: {
    totalDestinationFiles: files.length,
    totalImageReferences: totalImagesCount,
    totalUniqueExactUrls: globalUrlMap.size,
    totalUniqueNormalizedAssets: normalizedUrlMap.size,
    destinationsWithInternalDuplicates: internalDuplicateFiles.length,
    crossDestinationExactDuplicateUrlsCount: crossDestExactDupes.length,
    crossDestinationNormalizedDuplicateAssetsCount: crossDestNormDupes.length,
    searchIndex: searchIndexStats
  },
  internalDuplicates: internalDuplicateFiles,
  topCrossDestinationExactDuplicates: crossDestExactDupes.slice(0, 30),
  topCrossDestinationNormalizedDuplicates: crossDestNormDupes.slice(0, 30)
};

fs.writeFileSync(path.join(ROOT, 'reports', 'duplicate-images-full-audit.json'), JSON.stringify(report, null, 2), 'utf8');

console.log('\n======================================================================');
console.log('                 PROJECT-WIDE IMAGE DUPLICATION AUDIT                  ');
console.log('======================================================================\n');
console.log(`📁 Destinations Scanned:                  ${report.summary.totalDestinationFiles.toLocaleString()}`);
console.log(`🖼️  Total Image References:                ${report.summary.totalImageReferences.toLocaleString()}`);
console.log(`🔑 Total Unique Exact URLs:               ${report.summary.totalUniqueExactUrls.toLocaleString()}`);
console.log(`🎨 Total Unique Normalized Assets:        ${report.summary.totalUniqueNormalizedAssets.toLocaleString()}`);
console.log('----------------------------------------------------------------------');
console.log(`📌 1. Internal Duplicates (Same File):    ${report.summary.destinationsWithInternalDuplicates} destinations affected`);
console.log(`📌 2. Cross-Destination Exact Duplicates:  ${report.summary.crossDestinationExactDuplicateUrlsCount} URLs reused across dests`);
console.log(`📌 3. Cross-Dest Normalized Duplicates:   ${report.summary.crossDestinationNormalizedDuplicateAssetsCount} image assets reused across dests`);
console.log('======================================================================\n');

if (report.summary.destinationsWithInternalDuplicates > 0) {
  console.log('--- SAMPLE DESTINATIONS WITH INTERNAL DUPLICATES ---');
  internalDuplicateFiles.slice(0, 10).forEach((d, idx) => {
    console.log(`${idx + 1}. ${d.name} (${d.slug}) -> ${d.dupeCount} duplicates inside file`);
    d.dupes.slice(0, 3).forEach(dup => {
      console.log(`     - [${dup.firstPath}] and [${dup.duplicatePath}] use same URL: ${dup.url.slice(0, 70)}...`);
    });
  });
  console.log('');
}

if (report.summary.crossDestinationExactDuplicateUrlsCount > 0) {
  console.log('--- TOP 10 REUSED EXACT IMAGE URLS ACROSS DIFFERENT DESTINATIONS ---');
  crossDestExactDupes.slice(0, 10).forEach((d, idx) => {
    console.log(`${idx + 1}. Used in ${d.fileCount} destinations (${d.totalRefs} occurrences total):`);
    console.log(`   URL: ${d.url}`);
    console.log(`   Destinations: ${d.files.slice(0, 6).map(f => f.replace('.json', '')).join(', ')}${d.files.length > 6 ? ` (+ ${d.files.length - 6} more)` : ''}`);
    console.log('');
  });
}

if (report.summary.crossDestinationNormalizedDuplicateAssetsCount > 0) {
  console.log('--- TOP 10 REUSED NORMALIZED IMAGE ASSETS ---');
  crossDestNormDupes.slice(0, 10).forEach((d, idx) => {
    console.log(`${idx + 1}. Asset: ${d.norm}`);
    console.log(`   Used in ${d.fileCount} destinations (${d.totalRefs} occurrences total)`);
    console.log(`   Destinations: ${d.files.slice(0, 6).map(f => f.replace('.json', '')).join(', ')}${d.files.length > 6 ? ` (+ ${d.files.length - 6} more)` : ''}`);
    console.log('');
  });
}
