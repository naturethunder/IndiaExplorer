/**
 * run-all.js — bulk-ingest EVERY state/UT in fetch-candidates' STATES map.
 * Per state (all sub-steps are resumable/checkpointed): fetch-candidates →
 * fetch-places → derive → data/bulk/<state>.json. Then build-json-data +
 * build-stubs ONCE at the end (not per state — that's the only non-idempotent-
 * cost part). Re-run any time: states with a data/bulk/<state>.json are skipped.
 *
 * A state that throws (network, SPARQL timeout) is logged and skipped — re-run
 * to pick it up; the caches it did write are reused.
 *
 * Usage: node scripts/bulk/run-all.js [--force]   (--force re-derives even if bulk json exists)
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { STATES } = require('./fetch-candidates');

const HERE = __dirname;
const SCRIPTS = path.resolve(__dirname, '..');
const ROOT = path.resolve(__dirname, '..', '..');
const BULK = path.join(ROOT, 'data', 'bulk');
const force = process.argv.includes('--force');

function run(script, args) {
  execFileSync('node', [script].concat(args || []), { stdio: 'inherit' });
}

const keys = Object.keys(STATES);
let ingested = 0, skipped = 0, failed = [];

for (const key of keys) {
  if (!force && fs.existsSync(path.join(BULK, key + '.json'))) {
    console.log('\n══ ' + key + ' — already ingested, skipping ══');
    skipped++;
    continue;
  }
  console.log('\n══════════ ' + key + ' (' + (ingested + skipped + failed.length + 1) + '/' + keys.length + ') ══════════');
  try {
    run(path.join(HERE, 'fetch-candidates.js'), [key]);
    run(path.join(HERE, 'fetch-places.js'), [key]);
    run(path.join(HERE, 'derive.js'), [key]);
    ingested++;
  } catch (e) {
    console.error('══ ' + key + ' FAILED: ' + (e.message || '').split('\n')[0] + ' — re-run run-all.js to retry ══');
    failed.push(key);
  }
}

console.log('\n━━━━━━ ingest pass done: ' + ingested + ' new, ' + skipped + ' skipped, ' + failed.length + ' failed ' +
  (failed.length ? '(' + failed.join(', ') + ')' : '') + ' ━━━━━━');

console.log('\n━━ build-json-data.js ━━');
run(path.join(SCRIPTS, 'build-json-data.js'));
console.log('\n━━ build-stubs.js ━━');
run(path.join(SCRIPTS, 'build-stubs.js'));

console.log('\n[run-all] complete.' + (failed.length ? ' Retry failed states: node scripts/bulk/run-all.js' : ''));
