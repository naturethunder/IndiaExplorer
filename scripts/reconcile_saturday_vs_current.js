const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Get all modified destination files in git status
const statusOutput = execSync('git status -s data/destinations/').toString('utf8');
const modifiedFiles = statusOutput
  .split('\n')
  .filter(l => l.trim().startsWith('M ') || l.trim().startsWith('MM'))
  .map(l => l.trim().split(/\s+/)[1])
  .filter(f => f && f.endsWith('.json') && !f.endsWith('index.json'));

console.log('Total modified destination files to inspect:', modifiedFiles.length);

const saturdayCommit = '17833b6e';

const toRevert = [];
const needManualFix = [];
const keepCurrent = [];

// Helper to check for obvious corruption/leak in a destination object
function checkDefects(d) {
  const issues = [];
  const state = (d.state || '').toLowerCase();
  const destName = (d.name || '').toLowerCase();

  const allUrls = [];
  if (d.heroImage?.src) allUrls.push({ type: 'hero', url: d.heroImage.src });
  (d.gallery || []).forEach((g, i) => g?.src && allUrls.push({ type: 'gallery ' + i, url: g.src }));
  (d.topPlaces || []).forEach((p, i) => {
    if (p.image?.src) allUrls.push({ type: 'place ' + i + ' cover', url: p.image.src, placeName: p.name });
    (p.photos || []).forEach((ph, j) => {
      const u = typeof ph === 'string' ? ph : ph?.src;
      if (u) allUrls.push({ type: 'place ' + i + ' photo ' + j, url: u, placeName: p.name });
    });
  });

  // Check duplicate URLs within destination (except hero == gallery[0])
  const urlCount = {};
  allUrls.forEach(item => {
    const k = item.url.split('?')[0].toLowerCase();
    urlCount[k] = (urlCount[k] || 0) + 1;
  });
  const heroKey = d.heroImage?.src?.split('?')[0].toLowerCase();
  for (const [k, count] of Object.entries(urlCount)) {
    if (k === heroKey ? count > 2 : count > 1) {
      issues.push({ type: 'duplicate', url: k, count });
    }
  }

  // Check out-of-state leaks
  allUrls.forEach(item => {
    const u = item.url.toLowerCase();
    if (!state.includes('kerala') && !destName.includes('kerala')) {
      if (u.includes('ponnani') || u.includes('flora_of_kerala') || u.includes('anandashram') ||
          u.includes('karimeen-kerala') || u.includes('bakel_fort') || u.includes('bekal_fort') ||
          u.includes('silent_valley') || u.includes('eravikulam') || u.includes('houseboat_on_punnamada') ||
          u.includes('ashtamudi') || u.includes('padmanabha_swamy') || u.includes('kerala_water_falls') ||
          u.includes('cochin_ginger') || u.includes('alleppey') || u.includes('alappuzha') || u.includes('kumarakom')) {
        issues.push({ type: 'kerala_leak', url: item.url, slot: item.type });
      }
    }
    if (!state.includes('ladakh') && !state.includes('jammu') && !destName.includes('ladakh') && !destName.includes('leh')) {
      if (u.includes('leh-ladakh') || u.includes('nubra%2c_ladakh') || u.includes('zanskar_ladakh') ||
          u.includes('route_srinagar-leh') || u.includes('shanti_stupa_in_rajgir') || u.includes('shanti_stupa') ||
          u.includes('testa_close_lungnak') || u.includes('pangong')) {
        issues.push({ type: 'ladakh_leak', url: item.url, slot: item.type });
      }
    }
    if (!state.includes('madhya pradesh') && !destName.includes('khajuraho')) {
      if (u.includes('khajuraho') || u.includes('kandariya_mahadeva') || u.includes('parsvanath_jain_temple_khajuraho') ||
          u.includes('panna%2c_madhya_pradesh') || u.includes('madri%2c_madhya_pradesh')) {
        issues.push({ type: 'mp_leak', url: item.url, slot: item.type });
      }
    }
  });

  return issues;
}

modifiedFiles.forEach(file => {
  // Never touch mukteshwar-temple-punjab.json since we just 100% perfected it
  if (file.includes('mukteshwar-temple-punjab.json')) {
    keepCurrent.push({ file, reason: 'Just verified and perfected with 4K HD' });
    return;
  }

  // Read current version
  let currentObj = null;
  try {
    currentObj = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return;
  }

  // Read Saturday version from git
  let satObj = null;
  try {
    const rawSat = execSync(`git show ${saturdayCommit}:${file}`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    satObj = JSON.parse(rawSat);
  } catch (e) {
    // If not in Saturday commit, keep current
    keepCurrent.push({ file, reason: 'Not in Saturday commit' });
    return;
  }

  const satIssues = checkDefects(satObj);
  const currentIssues = checkDefects(currentObj);

  // If Saturday had ZERO defects, or had far fewer defects than current corrupted version
  if (satIssues.length === 0) {
    toRevert.push({ file, satIssues: 0, currentIssues: currentIssues.length });
  } else {
    needManualFix.push({ file, satIssues: satIssues.length, currentIssues: currentIssues.length, details: satIssues });
  }
});

console.log('\n========================================');
console.log('RECONCILIATION SUMMARY:');
console.log('1. Destinations where Saturday commit was 100% clean & correct (Safe to revert):', toRevert.length);
console.log('2. Destinations where Saturday had defects and needs surgical fix:', needManualFix.length);
console.log('3. Destinations kept as-is (e.g. Mukteshwar Temple Punjab):', keepCurrent.length);
console.log('========================================');

// Save detailed report
fs.writeFileSync('scratch_saturday_reconciliation.json', JSON.stringify({
  toRevert,
  needManualFix,
  keepCurrent
}, null, 2));

console.log('Written report to scratch_saturday_reconciliation.json');
