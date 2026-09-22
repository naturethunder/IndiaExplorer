const { execSync } = require('child_process');
const commits = ['5fc690fb', '89808b01', '5dc7e3ff', '3ad9b7ea', '93f80baf', 'defd55b5', 'd6f41a4a', '17833b6e'];
for (const c of commits) {
  const info = execSync(`git log -n 1 --format="%cd | %s" ${c}`, { encoding: 'utf8' }).trim();
  const files = execSync(`git show --name-only --pretty="" ${c} -- "data/destinations/*.json"`, { encoding: 'utf8' })
    .split('\n').map(l => l.trim()).filter(l => l.startsWith('data/destinations/') && !l.endsWith('index.json'));
  console.log(`${c} [${files.length} dests] | ${info}`);
  if (files.length <= 15 && files.length > 0) {
    console.log('   Files:', files.join(', '));
  }
}
