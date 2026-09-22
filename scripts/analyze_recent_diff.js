const { execSync } = require('child_process');
const fs = require('fs');

const diff = execSync('git diff data/destinations/').toString('utf8');

const addedUrls = [];
diff.split('\n').forEach(line => {
  if (line.startsWith('+') && !line.startsWith('+++') && line.includes('http')) {
    const match = line.match(/https?:\/\/[^\s",]+/);
    if (match) addedUrls.push(match[0]);
  }
});

console.log('Total added URLs in working tree diff:', addedUrls.length);

const domains = {};
addedUrls.forEach(u => {
  try {
    const d = new URL(u).hostname;
    domains[d] = (domains[d] || 0) + 1;
  } catch(e) {}
});
console.log('Domains breakdown:', domains);

// Let's check which files have newly added pexels or unsplash photos
const fileDiffs = diff.split('diff --git a/');
const pexelsFiles = [];

fileDiffs.forEach(fd => {
  const lines = fd.split('\n');
  const filename = lines[0].split(' ')[0];
  const addedPexels = lines.filter(l => l.startsWith('+') && (l.includes('pexels.com') || l.includes('unsplash.com')));
  if (addedPexels.length > 0) {
    pexelsFiles.push({ file: filename, count: addedPexels.length, samples: addedPexels.slice(0, 3) });
  }
});

console.log('\nFiles with Pexels / Unsplash added:', pexelsFiles.length);
pexelsFiles.forEach(pf => {
  console.log(' - ' + pf.file + ' (' + pf.count + ' added)');
  pf.samples.forEach(s => console.log('    ' + s.trim().slice(0, 90)));
});
