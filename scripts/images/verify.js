/**
 * Verification Script - re-validates images after repair
 * Usage: node scripts/images/verify.js [options]
 */

const config = require('./config');
const path = require('path');
const { ImageCache } = require('./lib/cache');
const { loadAllImages } = require('./lib/extractor');
const { runLevel1Audit } = require('./lib/audit-level1');
const { runLevel2Audit } = require('./lib/audit-level2');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('=== IndiaExplore Image Verification ===');
  console.log(`Limit: ${args.limit || 'none'}`);
  console.log(`State: ${args.state || 'all'}`);

  const cachePath = path.join(__dirname, '..', '..', config.paths.cacheDb);
  const cache = new ImageCache(cachePath);
  await cache.init();

  try {
    const images = await loadAllImages({
      limit: args.limit,
      state: args.state,
      destination: args.destination,
    });

    console.log(`\nVerifying ${images.length} images...`);

    // Level 1
    const level1 = runLevel1Audit(images);
    console.log(`\nLevel 1 Results:`);
    console.log(`  OK: ${level1.stats.ok}`);
    console.log(`  Issues: ${level1.stats.total - level1.stats.ok}`);

    // Level 2 on previously problematic images
    const previouslyProblematic = [
      ...level1.missingUrl,
      ...level1.malformedUrl,
      ...level1.placeholder,
      ...level1.invalidLocalPath,
      ...level1.duplicateUrl,
    ];

    if (previouslyProblematic.length > 0) {
      console.log(`\nRe-checking ${previouslyProblematic.length} previously problematic images...`);
      const level2 = await runLevel2Audit(previouslyProblematic, cache);
      console.log(`\nLevel 2 Results:`);
      console.log(`  Now OK: ${level2.stats.ok}`);
      console.log(`  Still Broken: ${level2.stats.broken}`);
      console.log(`  Wrong MIME: ${level2.stats.wrongMime}`);
    }

    // Check applied changes from cache
    console.log('\nChecking applied changes from changes_log...');
    const changes = await getAppliedChanges(cache);
    console.log(`Total changes logged: ${changes.length}`);
    console.log(`  Applied (dry_run=0): ${changes.filter(c => !c.dry_run).length}`);
    console.log(`  Dry-run only: ${changes.filter(c => c.dry_run).length}`);

    // Summary
    console.log('\n================ VERIFICATION SUMMARY ================');
    console.log(`Total images: ${images.length}`);
    console.log(`Currently OK: ${level1.stats.ok}`);
    console.log(`Issues remaining: ${level1.stats.total - level1.stats.ok}`);
    console.log('======================================================');

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
        if (key === 'limit') args.limit = parseInt(args.limit, 10);
      }
    }
  }
  return args;
}

function getAppliedChanges(cache) {
  return cache.data.changesLog.map(c => ({
    ...c,
    dry_run: c.dryRun,
    applied_at: c.appliedAt,
  })).sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});