const { execSync } = require('child_process');
const fs = require('fs');

// 1. Files in git log --since="3 days ago"
const logFiles = execSync('git log --since="3 days ago" --name-only --oneline', { encoding: 'utf8' })
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('data/destinations/') && l.endsWith('.json') && !l.endsWith('index.json'));

const uniqueLogFiles = Array.from(new Set(logFiles)).sort();

// 2. Files in git diff 17833b6e^ HEAD
const diffFiles = execSync('git diff --name-only 17833b6e^ HEAD -- "data/destinations/*.json"', { encoding: 'utf8' })
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('data/destinations/') && l.endsWith('.json') && !l.endsWith('index.json'));

const uniqueDiffFiles = Array.from(new Set(diffFiles)).sort();

console.log('Unique destinations in git log since 3 days ago:', uniqueLogFiles.length);
console.log('Unique destinations in git diff 17833b6e^ HEAD:', uniqueDiffFiles.length);

// Check if there are any other commits
const commits = execSync('git log --since="4 days ago" --format="%h | %cd | %s"', { encoding: 'utf8' });
console.log('\nCommits in last 4 days:');
console.log(commits);

// Save both lists
fs.writeFileSync('scratch_target_destinations.json', JSON.stringify(uniqueDiffFiles, null, 2));
