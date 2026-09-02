/**
 * ExploreDesh — Image Availability Audit Script
 * Checks ALL destination JSON files for:
 *  1. Structural issues: empty heroImage.src, missing gallery URLs, missing place photos
 *  2. Live HTTP availability: 404, 403, 429, timeout on every image URL
 *
 * Usage: node scripts/audit-image-availability.js
 * Options:
 *   --structural-only   Skip HTTP checks (fast, instant)
 *   --http-check        Also check HTTP status of all URLs (slow, ~5-15 min)
 *   --sample=50         Only HTTP-check a random sample of N URLs
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');
const args = process.argv.slice(2);
const STRUCTURAL_ONLY = args.includes('--structural-only');
const HTTP_CHECK = args.includes('--http-check');
const SAMPLE_ARG = args.find(a => a.startsWith('--sample='));
const SAMPLE_SIZE = SAMPLE_ARG ? parseInt(SAMPLE_ARG.split('=')[1]) : null;

// Concurrency limit for HTTP checks
const HTTP_CONCURRENCY = 20;
const HTTP_TIMEOUT_MS = 8000;

// ─── Structural Audit ──────────────────────────────────────────────────────────

function structuralAudit(dest, slug) {
  const issues = [];

  // heroImage
  if (!dest.heroImage || !dest.heroImage.src || dest.heroImage.src.trim() === '') {
    issues.push({ type: 'MISSING_HERO', field: 'heroImage.src', url: '' });
  }

  // gallery
  const gallery = dest.gallery || [];
  if (gallery.length < 5) {
    issues.push({ type: 'SHORT_GALLERY', field: 'gallery', url: `Only ${gallery.length}/5 entries` });
  }
  gallery.forEach((g, i) => {
    if (!g.src || g.src.trim() === '') {
      issues.push({ type: 'EMPTY_GALLERY_URL', field: `gallery[${i}].src`, url: '' });
    }
  });

  // topPlaces
  const places = dest.topPlaces || [];
  if (places.length === 0) {
    issues.push({ type: 'NO_PLACES', field: 'topPlaces', url: 'No places defined' });
  }
  places.forEach((p, pi) => {
    const pname = p.name || `place[${pi}]`;
    if (!p.image || !p.image.src || p.image.src.trim() === '') {
      issues.push({ type: 'MISSING_PLACE_CARD_IMAGE', field: `topPlaces[${pi}].image.src`, url: '', place: pname });
    }
    const photos = p.photos || [];
    if (photos.length < 3) {
      issues.push({ type: 'SHORT_PLACE_PHOTOS', field: `topPlaces[${pi}].photos`, url: `Only ${photos.length}/3 photos`, place: pname });
    }
    photos.forEach((ph, phi) => {
      if (!ph || ph.trim() === '') {
        issues.push({ type: 'EMPTY_PLACE_PHOTO', field: `topPlaces[${pi}].photos[${phi}]`, url: '', place: pname });
      }
    });
  });

  return issues;
}

// ─── Collect all URLs from a destination ──────────────────────────────────────

function collectUrls(dest, slug) {
  const urls = [];
  if (dest.heroImage && dest.heroImage.src) {
    urls.push({ slug, field: 'heroImage.src', url: dest.heroImage.src });
  }
  (dest.gallery || []).forEach((g, i) => {
    if (g.src) urls.push({ slug, field: `gallery[${i}].src`, url: g.src });
  });
  (dest.topPlaces || []).forEach((p, pi) => {
    const pname = p.name || `place[${pi}]`;
    if (p.image && p.image.src) {
      urls.push({ slug, field: `topPlaces[${pi}].image.src`, url: p.image.src, place: pname });
    }
    (p.photos || []).forEach((ph, phi) => {
      if (ph) urls.push({ slug, field: `topPlaces[${pi}].photos[${phi}]`, url: ph, place: pname });
    });
  });
  return urls;
}

// ─── HTTP HEAD check ───────────────────────────────────────────────────────────

function checkUrl(entry) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(entry.url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        { method: 'HEAD', hostname: parsed.hostname, path: parsed.pathname + parsed.search, timeout: HTTP_TIMEOUT_MS,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': '' } },
        (res) => {
          resolve({ ...entry, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
        }
      );
      req.on('timeout', () => { req.destroy(); resolve({ ...entry, status: 'TIMEOUT', ok: false }); });
      req.on('error', (e) => { resolve({ ...entry, status: 'ERROR:' + e.code, ok: false }); });
      req.end();
    } catch (e) {
      resolve({ ...entry, status: 'INVALID_URL', ok: false });
    }
  });
}

async function runHttpChecks(allUrls) {
  let checked = 0;
  const failed = [];
  const total = allUrls.length;

  // Process in batches of HTTP_CONCURRENCY
  for (let i = 0; i < total; i += HTTP_CONCURRENCY) {
    const batch = allUrls.slice(i, i + HTTP_CONCURRENCY);
    const results = await Promise.all(batch.map(checkUrl));
    results.forEach(r => {
      if (!r.ok) failed.push(r);
    });
    checked += batch.length;
    if (checked % 200 === 0 || checked === total) {
      process.stdout.write(`\r  HTTP checked: ${checked}/${total} | Broken so far: ${failed.length}   `);
    }
  }
  process.stdout.write('\n');
  return failed;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ExploreDesh — Image Availability Audit');
  console.log('══════════════════════════════════════════════════════════');

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`\n📁 Scanning ${files.length} destination files...\n`);

  // ── Structural audit (fast) ──
  const structuralIssues = [];
  const allUrlEntries = [];
  let parseErrors = 0;

  for (const file of files) {
    const slug = file.replace('.json', '');
    let dest;
    try {
      dest = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    } catch (e) {
      console.error(`  ❌ JSON parse error: ${file} — ${e.message}`);
      parseErrors++;
      continue;
    }
    const issues = structuralAudit(dest, slug);
    if (issues.length > 0) {
      structuralIssues.push({ slug, issues });
    }
    allUrlEntries.push(...collectUrls(dest, slug));
  }

  // ── Structural Results ──
  console.log('─── Structural Audit Results ─────────────────────────────');
  if (structuralIssues.length === 0) {
    console.log('  ✅ No structural issues found (all heroes, galleries, and place photos present)');
  } else {
    console.log(`  ❌ ${structuralIssues.length} destinations have structural issues:\n`);
    structuralIssues.forEach(({ slug, issues }) => {
      console.log(`  📌 ${slug}`);
      issues.forEach(iss => {
        const placeInfo = iss.place ? ` (${iss.place})` : '';
        console.log(`     [${iss.type}] ${iss.field}${placeInfo}: ${iss.url || '(empty)'}`);
      });
    });
  }

  console.log(`\n  Total URLs collected: ${allUrlEntries.length}`);
  console.log(`  Parse errors: ${parseErrors}`);

  // ── URL domain breakdown ──
  const domainCount = {};
  allUrlEntries.forEach(e => {
    try {
      const host = new URL(e.url).hostname;
      domainCount[host] = (domainCount[host] || 0) + 1;
    } catch (_) { domainCount['INVALID'] = (domainCount['INVALID'] || 0) + 1; }
  });
  console.log('\n─── Image Source Breakdown ───────────────────────────────');
  Object.entries(domainCount).sort((a, b) => b[1] - a[1]).forEach(([host, count]) => {
    const pct = ((count / allUrlEntries.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`  ${host.padEnd(35)} ${String(count).padStart(6)} (${pct}%) ${bar}`);
  });

  // Detect Pixabay /get/ session links
  const pixabayGet = allUrlEntries.filter(e => e.url.includes('pixabay.com/get/'));
  if (pixabayGet.length > 0) {
    console.log(`\n  ⚠️  Pixabay /get/ expiring session links: ${pixabayGet.length}`);
    const bySlug = {};
    pixabayGet.forEach(e => { bySlug[e.slug] = (bySlug[e.slug] || 0) + 1; });
    Object.entries(bySlug).slice(0, 20).forEach(([slug, n]) => console.log(`     • ${slug} (${n})`));
    if (Object.keys(bySlug).length > 20) console.log(`     ... and ${Object.keys(bySlug).length - 20} more`);
  }

  // ── HTTP Check (optional) ──
  if (STRUCTURAL_ONLY) {
    console.log('\n  (Skipping HTTP checks — use --http-check to enable)\n');
    return;
  }

  if (!HTTP_CHECK && !SAMPLE_SIZE) {
    console.log('\n─── HTTP Availability ─────────────────────────────────────');
    console.log('  ℹ️  Run with --http-check to test all URLs, or --sample=100 for a sample.');
    console.log('  This will make ~' + allUrlEntries.length + ' HEAD requests.\n');
    return;
  }

  let urlsToCheck = allUrlEntries;
  if (SAMPLE_SIZE) {
    // Random sample
    const shuffled = [...allUrlEntries].sort(() => Math.random() - 0.5);
    urlsToCheck = shuffled.slice(0, SAMPLE_SIZE);
    console.log(`\n─── HTTP Check (random sample of ${SAMPLE_SIZE}) ──────────────────`);
  } else {
    console.log(`\n─── HTTP Check (all ${allUrlEntries.length} URLs) ──────────────────────`);
    console.log('  ⏳ This may take 5–15 minutes...\n');
  }

  const failed = await runHttpChecks(urlsToCheck);

  console.log('\n─── HTTP Results ──────────────────────────────────────────');
  if (failed.length === 0) {
    console.log('  ✅ All checked URLs returned HTTP 200 OK');
  } else {
    console.log(`  ❌ ${failed.length} broken/unavailable URLs:\n`);

    // Group by status code
    const byStatus = {};
    failed.forEach(f => {
      const s = String(f.status);
      byStatus[s] = byStatus[s] || [];
      byStatus[s].push(f);
    });
    Object.entries(byStatus).sort((a,b) => b[1].length - a[1].length).forEach(([status, items]) => {
      console.log(`\n  HTTP ${status} (${items.length} URLs):`);
      items.slice(0, 15).forEach(f => {
        const placeInfo = f.place ? ` → ${f.place}` : '';
        console.log(`    • [${f.slug}]${placeInfo}`);
        console.log(`      ${f.url}`);
      });
      if (items.length > 15) console.log(`    ... and ${items.length - 15} more`);
    });

    // Save full report
    const reportPath = path.join(__dirname, '..', 'reports', 'broken-images-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalChecked: urlsToCheck.length,
      totalFailed: failed.length,
      byStatus: Object.fromEntries(Object.entries(byStatus).map(([s, items]) => [s, items.length])),
      failures: failed
    }, null, 2));
    console.log(`\n  📄 Full report saved: reports/broken-images-report.json`);
  }

  console.log('\n══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
