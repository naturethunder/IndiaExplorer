/**
 * Image Pipeline Runner - provides npm-style commands
 * Usage:
 *   node scripts/images/run.js audit [options]
 *   node scripts/images/run.js repair [options]
 *   node scripts/images/run.js verify [options]
 *   node scripts/images/run.js report [options]
 */

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = __dirname;

function runScript(script, args) {
  const scriptPath = path.join(SCRIPTS_DIR, script);
  console.log(`\n$ node ${scriptPath} ${args.join(' ')}`);
  const result = spawnSync('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: path.join(SCRIPTS_DIR, '..', '..'),
  });
  return result.status;
}

function printUsage() {
  console.log(`
IndiaExplore Image Pipeline

Commands:
  audit    Run full image audit (Level 1-3)
  repair   Find and fix broken/placeholder images
  verify   Re-validate images after repair
  report   Generate reports from cache

Audit Options:
  node scripts/images/run.js audit [--level=1|2|3] [--limit=N] [--state=STATE] [--destination=SLUG] [--resume]

Repair Options:
  node scripts/images/run.js repair [--dry-run|--apply] [--limit=N] [--min-confidence=N] [--review-threshold=N] [--state=STATE] [--destination=SLUG] [--resume] [--provider=NAME]

Verify Options:
  node scripts/images/run.js verify [--limit=N] [--state=STATE] [--destination=SLUG]

Report Options:
  node scripts/images/run.js report

Environment:
  PEXELS_API_KEY       Pexels API key
  UNSPLASH_ACCESS_KEY  Unsplash access key
  (Wikimedia requires no key)

Examples:
  # Audit first 100 destinations
  node scripts/images/run.js audit --limit=100

  # Dry-run repair for Goa destinations
  node scripts/images/run.js repair --state=Goa --dry-run

  # Apply repairs with high confidence
  node scripts/images/run.js repair --apply --min-confidence=95 --limit=50

  # Verify after repair
  node scripts/images/run.js verify
`);
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'audit':
    process.exit(runScript('audit.js', args));
  case 'repair':
    process.exit(runScript('repair.js', args));
  case 'verify':
    process.exit(runScript('verify.js', args));
  case 'report':
    console.log('Reports are generated automatically after audit/repair/verify');
    console.log('Check the reports/ directory');
    process.exit(0);
  default:
    printUsage();
    process.exit(1);
}