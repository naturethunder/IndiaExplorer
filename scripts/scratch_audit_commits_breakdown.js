const { execSync } = require('child_process');
const fs = require('fs');

const commits = [
  '5fc690fb',
  '89808b01',
  '5dc7e3ff',
  '3ad9b7ea',
  '93f80baf',
  'defd55b5',
  'd6f41a4a',
  '17833b6e'
];

for (const c of commits) {
  const msg = execSync(`git log -n 1 --format="%cd | %s" ${c}`, { encoding: 'utf8' }).trim();
  const rawDiff = execSync(`git show --name-status --pretty="" ${c} -- "data/destinations/*.json"`, { encoding: 'utf8' });
  const lines = rawDiff.split('\n').map(l => l.trim()).filter(Boolean);
  console.log(`\nCommit ${c} (${lines.length} files): ${msg}`);
  if (lines.length > 0 && lines.length <= 10) {
    console.log(lines.join('\n'));
  } else if (lines.length > 10) {
    console.log(`First 5:\n${lines.slice(0, 5).join('\n')}\n...and ${lines.length - 5} more`);
  }
}
