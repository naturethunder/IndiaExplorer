const { execFileSync } = require('child_process');

const scripts = [
  'scripts/curate-bihar-batch2-full.js',
  'scripts/curate-bihar-batch3-full.js',
  'scripts/curate-bihar-batch4-full.js',
  'scripts/curate-bihar-batch5-full.js',
  'scripts/curate-bihar-batch6-full.js',
  'scripts/curate-bihar-batch7-full.js',
  'scripts/curate-bihar-batch8-full.js',
  'scripts/curate-bihar-batch9-full.js',
  'scripts/curate-bihar-batch10-full.js'
];

async function runAll() {
  console.log('========================================================');
  console.log('STARTING REMAINING BIHAR CURATION PIPELINE (33 DESTINATIONS)');
  console.log('========================================================\n');

  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    console.log(`\n▶️ EXECUTING BATCH ${i + 2}: ${s}`);
    try {
      execFileSync('node', [s], { stdio: 'inherit' });
    } catch (e) {
      console.error(`❌ Error executing ${s}:`, e.message);
    }
  }

  console.log('\n========================================================');
  console.log('🏁 ALL BIHAR BATCHES COMPLETED!');
  console.log('========================================================');
}

runAll().catch(console.error);
