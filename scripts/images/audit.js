/**
 * Main Audit Script - runs all audit levels
 * Usage: node scripts/images/audit.js [options]
 * Options:
 *   --level=1|2|3|4    Run specific level (default: all)
 *   --limit=N          Limit destinations processed
 *   --state=STATE      Filter by state
 *   --destination=SLUG Filter by destination slug
 *   --resume           Resume from checkpoint
 *   --dry-run          Don't modify anything (default for audit)
 */

const config = require('./config');
const fs = require('fs');
const path = require('path');
const { ImageCache } = require('./lib/cache');
const { loadAllImages } = require('./lib/extractor');
const { runLevel1Audit } = require('./lib/audit-level1');
const { runLevel2Audit } = require('./lib/audit-level2');
const { runLevel3Audit } = require('./lib/audit-level3');
const { generateReports } = require('./lib/reports');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('=== IndiaExplore Image Audit ===');
  console.log(`Level: ${args.level || 'all'}`);
  console.log(`Limit: ${args.limit || 'none'}`);
  console.log(`State: ${args.state || 'all'}`);
  console.log(`Destination: ${args.destination || 'all'}`);
  console.log(`Resume: ${args.resume ? 'yes' : 'no'}`);

  // Initialize cache
  const cachePath = path.join(__dirname, '..', '..', config.paths.cacheDb);
  const cache = new ImageCache(cachePath);
  await cache.init();

  try {
    // Load images
    const images = await loadAllImages({
      limit: args.limit,
      state: args.state,
      destination: args.destination,
    });

    if (images.length === 0) {
      console.log('No images found matching criteria');
      return;
    }

    const runId = `audit_${Date.now()}`;
    const allResults = {
      runId,
      timestamp: new Date().toISOString(),
      level1: null,
      level2: null,
      level3: null,
      summary: {},
    };

    const runLevel = args.level || 4; // default to all levels

    // Level 1
    if (runLevel >= 1) {
      console.log('\n--- Level 1: URL Validation ---');
      const checkpoint = args.resume ? await cache.getLatestCheckpoint('audit', 1) : null;
      if (checkpoint) {
        console.log(`Resuming from checkpoint: ${checkpoint.last_processed_index}/${checkpoint.total_items}`);
      }
      allResults.level1 = runLevel1Audit(images);
      await cache.saveCheckpoint(runId, 'audit', 1, images.length, images.length, 'completed');
    }

    // Level 2
    if (runLevel >= 2) {
      console.log('\n--- Level 2: HTTP Validation ---');
      const level2Images = allResults.level1?.ok || images.filter(i => true);
      allResults.level2 = await runLevel2Audit(level2Images, cache);
      await cache.saveCheckpoint(runId, 'audit', 2, level2Images.length, level2Images.length, 'completed');
    }

    // Level 3
    if (runLevel >= 3) {
      console.log('\n--- Level 3: Quality Analysis ---');
      const suspicious = [
        ...(allResults.level2?.wrongMime || []),
        ...(allResults.level2?.broken || []),
        ...(allResults.level1?.placeholder || []),
      ].map(i => ({ ...i, destSlug: i.destSlug, fieldPath: i.fieldPath, url: i.url }));
      allResults.level3 = await runLevel3Audit(suspicious, cache);
      await cache.saveCheckpoint(runId, 'audit', 3, suspicious.length, suspicious.length, 'completed');
    }

    // Generate summary
    allResults.summary = generateSummary(allResults);

    // Generate reports
    await generateReports(allResults, cache);

    // Print summary
    printSummary(allResults);

  } finally {
    await cache.close();
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [, key, value] = arg.match(/^--([^=]+)(?:=(.+))?$/) || [];
      if (key) {
        args[key] = value !== undefined ? value : true;
        if (key === 'level') args.level = parseInt(args.level, 10);
        if (key === 'limit') args.limit = parseInt(args.limit, 10);
      }
    }
  }
  return args;
}

function generateSummary(results) {
  const l1 = results.level1?.stats || {};
  const l2 = results.level2?.stats || {};
  const l3 = results.level3?.stats || {};

  return {
    totalImages: l1.total || 0,
    level1: {
      ok: l1.ok || 0,
      missingUrl: l1.missingUrl || 0,
      malformedUrl: l1.malformedUrl || 0,
      duplicateUrl: l1.duplicateUrl || 0,
      placeholder: l1.placeholder || 0,
      invalidLocalPath: l1.invalidLocalPath || 0,
    },
    level2: {
      ok: l2.ok || 0,
      broken: l2.broken || 0,
      wrongMime: l2.wrongMime || 0,
      timeout: l2.timeout || 0,
      error: l2.error || 0,
    },
    level3: {
      ok: l3.ok || 0,
      lowResolution: l3.lowResolution || 0,
      oversized: l3.oversized || 0,
      perceptualDuplicates: l3.perceptualDuplicates || 0,
      downloadError: l3.downloadError || 0,
    },
  };
}

function printSummary(results) {
  const s = results.summary;
  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total Images: ${s.totalImages}`);
  console.log('\nLevel 1 (URL Validation):');
  console.log(`  OK: ${s.level1.ok}`);
  console.log(`  Missing URL: ${s.level1.missingUrl}`);
  console.log(`  Malformed URL: ${s.level1.malformedUrl}`);
  console.log(`  Duplicate URL: ${s.level1.duplicateUrl}`);
  console.log(`  Placeholder: ${s.level1.placeholder}`);
  console.log(`  Invalid Local Path: ${s.level1.invalidLocalPath}`);
  console.log('\nLevel 2 (HTTP Validation):');
  console.log(`  OK: ${s.level2.ok}`);
  console.log(`  Broken: ${s.level2.broken}`);
  console.log(`  Wrong MIME: ${s.level2.wrongMime}`);
  console.log(`  Timeout: ${s.level2.timeout}`);
  console.log(`  Error: ${s.level2.error}`);
  console.log('\nLevel 3 (Quality):');
  console.log(`  OK: ${s.level3.ok}`);
  console.log(`  Low Resolution: ${s.level3.lowResolution}`);
  console.log(`  Oversized: ${s.level3.oversized}`);
  console.log(`  Perceptual Duplicates: ${s.level3.perceptualDuplicates}`);
  console.log(`  Download Error: ${s.level3.downloadError}`);
  console.log('===============================================');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});