/**
 * Main Repair Script - fixes broken/placeholder images
 * Usage: node scripts/images/repair.js [options]
 * Options:
 *   --dry-run          Default: true, use --apply to actually write changes
 *   --apply            Actually apply changes (overrides --dry-run)
 *   --limit=N          Limit number of problems to fix
 *   --min-confidence=N Minimum confidence for auto-apply (default: 90)
 *   --review-threshold=N Manual review threshold (default: 70)
 *   --state=STATE      Filter by state
 *   --destination=SLUG Filter by destination slug
 *   --resume           Resume from checkpoint
 *   --provider=NAME    Use specific provider (pexels|unsplash|wikimedia)
 */

const config = require('./config');
const path = require('path');
const { ImageCache } = require('./lib/cache');
const { RepairEngine } = require('./lib/repair');
const { generateReports } = require('./lib/reports');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('=== IndiaExplore Image Repair ===');
  console.log(`Mode: ${args.apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Limit: ${args.limit || 'none'}`);
  console.log(`Min confidence: ${args.minConfidence || config.audit.level4.autoApplyThreshold}`);
  console.log(`Review threshold: ${args.reviewThreshold || config.audit.level4.manualReviewThreshold}`);
  console.log(`State: ${args.state || 'all'}`);
  console.log(`Destination: ${args.destination || 'all'}`);
  console.log(`Provider: ${args.provider || 'all'}`);
  console.log(`Resume: ${args.resume ? 'yes' : 'no'}`);

  // Initialize cache
  const cachePath = path.join(__dirname, '..', '..', config.paths.cacheDb);
  const cache = new ImageCache(cachePath);
  await cache.init();

  try {
    const engine = new RepairEngine(cache, {
      dryRun: !args.apply,
      limit: args.limit,
      minConfidence: args.minConfidence || config.audit.level4.autoApplyThreshold,
      manualReviewThreshold: args.reviewThreshold || config.audit.level4.manualReviewThreshold,
      filters: { state: args.state, destination: args.destination },
    });

    const results = await engine.run();

    // Generate reports
    await generateReports({ repair: results }, cache);

    // Print summary
    printRepairSummary(results);

  } finally {
    await cache.close();
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [, rawKey, value] = arg.match(/^--([^=]+)(?:=(.+))?$/) || [];
      if (rawKey) {
        const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const val = value !== undefined ? value : true;
        args[key] = val;
        args[rawKey] = val;
        if (key === 'limit') args.limit = parseInt(val, 10);
        if (key === 'minConfidence') args.minConfidence = parseInt(val, 10);
        if (key === 'reviewThreshold') args.reviewThreshold = parseInt(val, 10);
      }
    }
  }
  return args;
}

function printRepairSummary(results) {
  console.log('\n================ REPAIR SUMMARY ================');
  console.log(`Auto-applied: ${results.stats.autoApplied}`);
  console.log(`Manual review: ${results.stats.manualReview}`);
  console.log(`Failed: ${results.stats.failed}`);
  console.log(`Skipped: ${results.stats.skipped}`);
  console.log('================================================');

  if (results.autoApplied.length > 0) {
    console.log('\nAuto-applied changes:');
    for (const r of results.autoApplied.slice(0, 10)) {
      console.log(`  ${r.destSlug} / ${r.fieldPath}: ${r.oldUrl} -> ${r.newUrl} (conf: ${r.confidence})`);
    }
    if (results.autoApplied.length > 10) console.log(`  ... and ${results.autoApplied.length - 10} more`);
  }

  if (results.manualReview.length > 0) {
    console.log('\nManual review queue:');
    for (const r of results.manualReview.slice(0, 10)) {
      console.log(`  ${r.destSlug} / ${r.fieldPath}: ${r.issue} -> suggested: ${r.bestCandidate?.url} (conf: ${r.bestCandidate?.confidence})`);
    }
    if (results.manualReview.length > 10) console.log(`  ... and ${results.manualReview.length - 10} more`);
  }
}

main().catch(err => {
  console.error('Repair failed:', err);
  process.exit(1);
});