const fs = require('fs');
const { execSync } = require('child_process');

const report = JSON.parse(fs.readFileSync('scratch_saturday_reconciliation.json', 'utf8'));
const filesToRevert = report.toRevert.map(x => x.file);

console.log(`Reverting ${filesToRevert.length} clean files to Saturday commit 17833b6e...`);

const batchSize = 25;
for (let i = 0; i < filesToRevert.length; i += batchSize) {
  const batch = filesToRevert.slice(i, i + batchSize);
  const args = batch.map(f => `"${f}"`).join(' ');
  execSync(`git checkout 17833b6e -- ${args}`, { stdio: 'inherit' });
  console.log(`Reverted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToRevert.length / batchSize)}`);
}

console.log('Successfully reverted all 245 authentic destinations to Saturday baseline!');
