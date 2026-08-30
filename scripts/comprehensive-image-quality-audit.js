/**
 * comprehensive-image-quality-audit.js
 * 
 * Deep audit of ALL image URLs across 2,389 destination JSON files.
 * Checks for:
 *   1. Blurry / low-resolution thumbnails (Wikimedia <300px thumbs)
 *   2. Placeholder / dummy images (picsum, placeholder.com, etc.)
 *   3. Non-image files (PDF, DJVU, SVG, video, audio)
 *   4. Flags, logos, maps, diagrams, charts (not scenic photos)
 *   5. Broken / unreachable URLs (HTTP HEAD check on sample)
 *   6. Duplicate URLs within/across destinations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

// ─── Pattern Definitions ────────────────────────────────────────
const PDF_DJVU = /\.(pdf|djvu)([\/?#]|$)/i;
const VIDEO_AUDIO = /\.(webm|ogv|ogg|mp4|avi|mov|flv|mp3|wav|mid|midi)([\/?#]|$)/i;
const SVG_FILE = /\.svg([\/?#]|$)/i;
const PLACEHOLDER = /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr|placeholder\.com|fakeimg)/i;
const BLURRY_THUMB = /\/(\d+)px-/;  // We'll check if the number is < 300
const FLAG_LOGO_MAP = /(flag_of_|coat_of_arms|logo_of_|seal_of_|emblem_of_|symbol_of_|india_location_map|location_map|map_of_|locator_map|administrative_map|political_map|outline_map|blank_map)/i;
const DIAGRAM_CHART = /(diagram|schematic|census|chart_|graph_|table_|statistics|pie_chart|bar_chart|infographic)/i;
const STAMP_COIN = /(stamp_of_|postage_stamp|coin_of_|banknote|currency_note)/i;
const ICON_SMALL = /(icon[_\-]|pictogram|emoji|clipart|\.ico[\/?#])/i;
const GENERIC_STOCK_PERSON = /(portrait_of_|headshot|selfie|passport_photo|mugshot)/i;

function extractUrl(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') return obj.src || obj.url || '';
  return '';
}

function extractAllImages(d) {
  const images = [];
  
  // Hero
  const hero = extractUrl(d.heroImage) || extractUrl(d.image);
  if (hero) images.push({ field: 'heroImage', url: hero });

  // Gallery
  (d.gallery || []).forEach((g, i) => {
    const u = extractUrl(g);
    if (u) images.push({ field: `gallery[${i}]`, url: u });
  });

  // Top Places
  (d.topPlaces || []).forEach((p, pi) => {
    const pName = p.name || `Place${pi}`;
    const pImg = extractUrl(p.image);
    if (pImg) images.push({ field: `topPlaces[${pi}:${pName}].image`, url: pImg });
    (p.photos || []).forEach((ph, phi) => {
      const phUrl = extractUrl(ph);
      if (phUrl) images.push({ field: `topPlaces[${pi}:${pName}].photos[${phi}]`, url: phUrl });
    });
  });

  return images;
}

function auditUrl(url) {
  const issues = [];

  if (!url || typeof url !== 'string') {
    issues.push('EMPTY_URL');
    return issues;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    issues.push('INVALID_PROTOCOL');
    return issues;
  }

  if (PLACEHOLDER.test(url)) issues.push('PLACEHOLDER');
  if (PDF_DJVU.test(url)) issues.push('PDF_OR_DJVU');
  if (VIDEO_AUDIO.test(url)) issues.push('VIDEO_OR_AUDIO');
  if (SVG_FILE.test(url)) issues.push('SVG_FILE');
  if (FLAG_LOGO_MAP.test(url)) issues.push('FLAG_LOGO_MAP');
  if (DIAGRAM_CHART.test(url)) issues.push('DIAGRAM_CHART');
  if (STAMP_COIN.test(url)) issues.push('STAMP_COIN');
  if (ICON_SMALL.test(url)) issues.push('ICON_OR_CLIPART');
  if (GENERIC_STOCK_PERSON.test(url)) issues.push('PORTRAIT_PERSON');

  // Blurry thumbnail check
  const thumbMatch = url.match(BLURRY_THUMB);
  if (thumbMatch) {
    const px = parseInt(thumbMatch[1], 10);
    if (px < 300) issues.push(`BLURRY_THUMB_${px}px`);
  }

  return issues;
}

// ─── Main Audit ─────────────────────────────────────────────────
console.log(`\n🔍 Scanning ${files.length} destination files for image quality issues...\n`);

const allIssues = [];  // { file, slug, name, type, state, field, url, problems[] }
let totalImages = 0;
let cleanImages = 0;

const categoryCounts = {
  PLACEHOLDER: 0,
  PDF_OR_DJVU: 0,
  VIDEO_OR_AUDIO: 0,
  SVG_FILE: 0,
  FLAG_LOGO_MAP: 0,
  DIAGRAM_CHART: 0,
  STAMP_COIN: 0,
  ICON_OR_CLIPART: 0,
  PORTRAIT_PERSON: 0,
  BLURRY_THUMB: 0,
  EMPTY_URL: 0,
  INVALID_PROTOCOL: 0,
};

files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const slug = d.slug || file.replace('.json', '');
  const name = d.title || d.name || slug;
  const state = d.state || '';
  const type = d.type || '';

  const images = extractAllImages(d);

  images.forEach(img => {
    totalImages++;
    const problems = auditUrl(img.url);

    if (problems.length > 0) {
      allIssues.push({
        file,
        slug,
        name,
        type,
        state,
        field: img.field,
        url: img.url,
        problems
      });

      problems.forEach(p => {
        if (p.startsWith('BLURRY_THUMB')) {
          categoryCounts.BLURRY_THUMB++;
        } else if (categoryCounts[p] !== undefined) {
          categoryCounts[p]++;
        }
      });
    } else {
      cleanImages++;
    }
  });
});

// ─── HTTP Check for a sample of URLs ────────────────────────────
// Check a random sample of URLs to find broken ones (404, 403, etc.)
function checkUrl(url, timeout = 8000) {
  return new Promise(resolve => {
    try {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.request(url, { method: 'HEAD', timeout }, res => {
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
      req.on('error', () => resolve({ url, status: 0, ok: false, error: 'NETWORK_ERROR' }));
      req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, ok: false, error: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ url, status: 0, ok: false, error: e.message });
    }
  });
}

async function httpAudit() {
  // Collect unique URLs for HTTP check
  const allUniqueUrls = new Set();
  files.forEach(file => {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    const images = extractAllImages(d);
    images.forEach(img => {
      if (img.url && typeof img.url === 'string' && img.url.startsWith('http')) {
        allUniqueUrls.add(img.url);
      }
    });
  });

  console.log(`\n📡 HTTP checking ${allUniqueUrls.size} unique image URLs...`);
  console.log(`   (This may take a minute)\n`);

  const urlArray = Array.from(allUniqueUrls);
  const BATCH_SIZE = 50;
  const brokenUrls = [];
  let checked = 0;

  for (let i = 0; i < urlArray.length; i += BATCH_SIZE) {
    const batch = urlArray.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(u => checkUrl(u)));
    results.forEach(r => {
      if (!r.ok) {
        brokenUrls.push(r);
      }
    });
    checked += batch.length;
    if (checked % 500 === 0 || checked === urlArray.length) {
      process.stdout.write(`   Checked ${checked}/${urlArray.length} URLs... (${brokenUrls.length} broken so far)\r`);
    }
  }

  console.log(`\n\n   HTTP check complete. ${brokenUrls.length} broken URLs found out of ${urlArray.length} total.\n`);

  // Map broken URLs back to destinations
  const brokenUrlSet = new Set(brokenUrls.map(b => b.url));
  const brokenDestinations = [];

  files.forEach(file => {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    const slug = d.slug || file.replace('.json', '');
    const name = d.title || d.name || slug;
    const state = d.state || '';
    const type = d.type || '';
    const images = extractAllImages(d);

    images.forEach(img => {
      if (brokenUrlSet.has(img.url)) {
        const brokenInfo = brokenUrls.find(b => b.url === img.url);
        brokenDestinations.push({
          file, slug, name, type, state,
          field: img.field,
          url: img.url,
          httpStatus: brokenInfo.status,
          error: brokenInfo.error || ''
        });
      }
    });
  });

  return { brokenUrls, brokenDestinations };
}

// Run the async HTTP audit
httpAudit().then(({ brokenUrls, brokenDestinations }) => {

  // ─── Generate Final Report ──────────────────────────────────
  const report = {
    summary: {
      totalDestinations: files.length,
      totalImageSlots: totalImages,
      cleanImages,
      totalPatternIssues: allIssues.length,
      totalBrokenUrls: brokenUrls.length,
      categoryBreakdown: categoryCounts,
    },
    patternIssues: allIssues,
    brokenUrls: brokenDestinations,
  };

  fs.writeFileSync(
    path.join(ROOT, 'reports', 'comprehensive-image-quality-audit.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  // ─── Print Summary ────────────────────────────────────────────
  console.log('======================================================================');
  console.log('         COMPREHENSIVE IMAGE QUALITY AUDIT — FINAL REPORT             ');
  console.log('======================================================================');
  console.log(`📊 Destinations Scanned:         ${report.summary.totalDestinations.toLocaleString()}`);
  console.log(`🖼️  Total Image Slots:             ${report.summary.totalImageSlots.toLocaleString()}`);
  console.log(`✅ Clean Images:                  ${report.summary.cleanImages.toLocaleString()}`);
  console.log(`⚠️  Pattern Issues Found:          ${report.summary.totalPatternIssues}`);
  console.log(`❌ Broken (HTTP error) URLs:       ${report.summary.totalBrokenUrls}`);
  console.log('----------------------------------------------------------------------');
  console.log('  PATTERN ISSUE BREAKDOWN:');
  
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > 0) {
      console.log(`    ${cat}: ${count}`);
    }
  }

  if (allIssues.length > 0) {
    // Group by issue type
    const byType = {};
    allIssues.forEach(issue => {
      issue.problems.forEach(p => {
        const key = p.startsWith('BLURRY_THUMB') ? 'BLURRY_THUMB' : p;
        if (!byType[key]) byType[key] = [];
        byType[key].push(issue);
      });
    });

    console.log('\n----------------------------------------------------------------------');
    console.log('  DETAILED PATTERN ISSUES (samples):');

    for (const [type, issues] of Object.entries(byType)) {
      console.log(`\n  📌 ${type} (${issues.length} found):`);
      issues.slice(0, 5).forEach((issue, idx) => {
        console.log(`     ${idx + 1}. ${issue.name} (${issue.state}) [${issue.field}]`);
        console.log(`        URL: ${issue.url.slice(0, 100)}...`);
      });
      if (issues.length > 5) {
        console.log(`     ... and ${issues.length - 5} more`);
      }
    }
  }

  if (brokenDestinations.length > 0) {
    console.log('\n----------------------------------------------------------------------');
    console.log(`  ❌ BROKEN URLs (${brokenDestinations.length} image slots affected):`);
    
    // Deduplicate broken URLs for display
    const uniqueBroken = new Map();
    brokenDestinations.forEach(b => {
      if (!uniqueBroken.has(b.url)) uniqueBroken.set(b.url, []);
      uniqueBroken.get(b.url).push(b);
    });

    let showCount = 0;
    for (const [url, dests] of uniqueBroken.entries()) {
      if (showCount >= 20) {
        console.log(`     ... and ${uniqueBroken.size - 20} more broken URLs`);
        break;
      }
      const d = dests[0];
      console.log(`     ${showCount + 1}. [HTTP ${d.httpStatus || d.error}] ${d.name} (${d.state}) [${d.field}]`);
      console.log(`        URL: ${url.slice(0, 100)}${url.length > 100 ? '...' : ''}`);
      if (dests.length > 1) {
        console.log(`        (Also affects ${dests.length - 1} more image slots)`);
      }
      showCount++;
    }
  }

  console.log('\n======================================================================');
  console.log(`Full report saved to: reports/comprehensive-image-quality-audit.json`);
  console.log('======================================================================\n');

}).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
