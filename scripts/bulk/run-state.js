/**
 * run-state.js <state-key> — orchestrate the bulk-ingest pipeline for one state:
 *   1. fetch-candidates.js  (Wikidata — notable places, real coords)
 *   2. fetch-places.js      (Wikipedia — real nearby attractions + descriptions)
 *   3. derive.js            (→ data/bulk/<state>.json)
 *   4. build-json-data.js   (regenerate the whole JSON data layer, merged)
 *   5. build-stubs.js       (redirect stubs for the new slugs)
 *
 * Photos are a separate, resumable background job: fetch-photos.js.
 *
 * Usage: node scripts/bulk/run-state.js rajasthan
 */
const { execFileSync } = require('child_process');
const path = require('path');

const stateKey = process.argv[2];
if (!stateKey) {
  console.error('Usage: node scripts/bulk/run-state.js <state-key>');
  process.exit(1);
}

const HERE = __dirname;
const SCRIPTS = path.resolve(__dirname, '..');

function run(script, args) {
  console.log('\n━━ ' + path.basename(script) + ' ' + (args || []).join(' ') + ' ━━');
  execFileSync('node', [script].concat(args || []), { stdio: 'inherit' });
}

run(path.join(HERE, 'fetch-candidates.js'), [stateKey]);
run(path.join(HERE, 'fetch-places.js'), [stateKey]);
run(path.join(HERE, 'derive.js'), [stateKey]);
run(path.join(SCRIPTS, 'build-json-data.js'));
run(path.join(SCRIPTS, 'build-stubs.js'));

console.log('\n[run-state] ' + stateKey + ' complete. Photos: node scripts/bulk/fetch-photos.js ' + stateKey);
