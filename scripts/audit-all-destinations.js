const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const dests = idx.destinations || idx;

console.log(`\nAuditing ${dests.length} destinations for strict rule compliance...\n`);

const stateReport = {};
let totalPass = 0;
let totalFail = 0;
let missingFiles = 0;

const globalUrls = new Map(); // url -> slug (for cross-file collision detection)

for (let i = 0; i < dests.length; i++) {
  const item = dests[i];
  const filePath = path.join(DEST_DIR, `${item.slug}.json`);

  const state = item.state || item.region || 'Unknown';
  if (!stateReport[state]) {
    stateReport[state] = { pass: 0, fail: 0, errors: [] };
  }

  if (!fs.existsSync(filePath)) {
    missingFiles++;
    stateReport[state].fail++;
    stateReport[state].errors.push(`${item.slug}: FILE MISSING`);
    totalFail++;
    continue;
  }

  let dest;
  try {
    dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    stateReport[state].fail++;
    stateReport[state].errors.push(`${item.slug}: JSON PARSE ERROR`);
    totalFail++;
    continue;
  }

  const issues = [];

  // Check heroImage
  if (!dest.heroImage || !dest.heroImage.src) {
    issues.push('missing heroImage');
  }

  // Check gallery
  if (!Array.isArray(dest.gallery) || dest.gallery.length < 5) {
    issues.push(`gallery has ${dest.gallery ? dest.gallery.length : 0}/5 images`);
  }

  // Check topPlaces
  const places = dest.topPlaces || dest.places || [];
  if (!Array.isArray(places) || places.length < 8) {
    issues.push(`topPlaces has ${places.length}/8 places`);
  } else {
    places.forEach((p, pi) => {
      if (!p.image || !p.image.src) issues.push(`place[${pi}] missing card image`);
      const photos = Array.isArray(p.photos) ? p.photos : [];
      if (photos.length < 3) issues.push(`place[${pi}] has ${photos.length}/3 photos`);
    });
  }

  // Collect all URLs
  const localUrls = [];
  if (Array.isArray(dest.gallery)) {
    dest.gallery.forEach(g => g && g.src && localUrls.push(g.src));
  }
  places.forEach(p => {
    if (p.image && p.image.src) localUrls.push(p.image.src);
    (Array.isArray(p.photos) ? p.photos : []).forEach(ph => {
      const u = typeof ph === 'string' ? ph : ph?.src;
      if (u) localUrls.push(u);
    });
  });

  // Check internal duplicates
  const uniqueLocal = new Set(localUrls);
  if (uniqueLocal.size < localUrls.length) {
    issues.push(`${localUrls.length - uniqueLocal.size} internal duplicate URLs`);
  }

  // Check cross-file collisions
  for (const u of localUrls) {
    if (globalUrls.has(u)) {
      issues.push(`duplicate with ${globalUrls.get(u)}: ${u.slice(-40)}`);
    } else {
      globalUrls.set(u, item.slug);
    }
  }

  if (issues.length > 0) {
    stateReport[state].fail++;
    stateReport[state].errors.push(`${item.slug}: ${issues.join('; ')}`);
    totalFail++;
  } else {
    stateReport[state].pass++;
    totalPass++;
  }

  if ((i + 1) % 100 === 0) {
    process.stdout.write(`  Progress: ${i + 1}/${dests.length}...\r`);
  }
}

console.log(`\n\n=== FULL REPOSITORY AUDIT REPORT ===\n`);
console.log(`Total: ${dests.length} | Pass: ${totalPass} | Fail: ${totalFail} | Missing: ${missingFiles}`);
console.log(`Pass rate: ${((totalPass / dests.length) * 100).toFixed(1)}%\n`);

console.log(`\n=== BY STATE ===`);
Object.entries(stateReport)
  .sort((a, b) => b[1].fail - a[1].fail)
  .forEach(([state, r]) => {
    const total = r.pass + r.fail;
    const pct = ((r.pass / total) * 100).toFixed(0);
    const status = r.fail === 0 ? '✅' : r.fail < total * 0.2 ? '⚠️' : '❌';
    console.log(`${status} ${state}: ${r.pass}/${total} pass (${pct}%)`);
    if (r.fail > 0 && r.errors.length <= 5) {
      r.errors.forEach(e => console.log(`     • ${e.slice(0, 100)}`));
    } else if (r.fail > 0) {
      console.log(`     • ...${r.fail} failures (first: ${r.errors[0].slice(0, 80)})`);
    }
  });

console.log(`\n=== SUMMARY ===`);
const failingStates = Object.entries(stateReport).filter(([,r]) => r.fail > 0);
console.log(`States with issues: ${failingStates.length}`);
console.log(`States clean: ${Object.keys(stateReport).length - failingStates.length}`);
console.log(`Total cross-file collisions tracked: ${globalUrls.size} unique URLs`);
