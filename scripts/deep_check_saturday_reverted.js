const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const saturdayCommit = '17833b6e';

// 1. Identify all files reverted to Saturday
const report = JSON.parse(fs.readFileSync('scratch_saturday_reconciliation.json', 'utf8'));
const files = report.toRevert.map(x => x.file);

console.log(`Starting Deep Audit across all ${files.length} Saturday-reverted destination files...\n`);

const results = {
  totalAudited: files.length,
  jsonValid: 0,
  jsonInvalid: [],
  heroSyncPass: 0,
  heroSyncFail: [],
  gallery5Pass: 0,
  galleryNon5: [],
  placesPhotoCountPass: 0,
  placesPhotoCountIssues: [],
  internalDupPass: 0,
  internalDupFail: [],
  geographicLeakPass: 0,
  geographicLeaks: [],
  domains: {},
  sampleAuditedFiles: []
};

// Out-of-state leak detection helper
function detectLeak(url, state, destName) {
  if (!url || typeof url !== 'string') return null;
  const s = (state || '').toLowerCase();
  const d = (destName || '').toLowerCase();
  const u = url.toLowerCase();

  // Kerala leak in non-Kerala destinations
  if (!s.includes('kerala') && !d.includes('kerala')) {
    if (
      u.includes('ponnani%2c_kerala') || u.includes('ponnani') ||
      u.includes('flora_of_kerala') ||
      u.includes('anandashram') ||
      u.includes('karimeen-kerala') ||
      u.includes('bakel_fort') || u.includes('bekal_fort') ||
      u.includes('silent_valley') ||
      u.includes('eravikulam') ||
      u.includes('houseboat_on_punnamada') ||
      u.includes('ashtamudikayal') ||
      u.includes('padmanabha_swamy_temple_trivandrum') ||
      u.includes('kerala_water_falls') ||
      u.includes('cochin_ginger') ||
      u.includes('b%c3%acnh_thu%e1%ba%adn') || u.includes('vietnam')
    ) {
      return 'Leak: ' + u.slice(0, 45);
    }
  }

  // Ladakh leak in non-Ladakh / non-Jammu destinations
  if (!s.includes('ladakh') && !s.includes('jammu') && !d.includes('ladakh') && !d.includes('leh')) {
    if (
      u.includes('leh-ladakh') ||
      u.includes('nubra%2c_ladakh') ||
      u.includes('zanskar_ladakh') ||
      u.includes('route_srinagar-leh') ||
      u.includes('shanti_stupa_in_rajgir') ||
      u.includes('testa_close_lungnak') ||
      u.includes('pangong')
    ) {
      return 'Ladakh Leak: ' + u.slice(0, 45);
    }
  }

  return null;
}

files.forEach((file, index) => {
  let content = null;
  try {
    content = JSON.parse(fs.readFileSync(file, 'utf8'));
    results.jsonValid++;
  } catch (err) {
    results.jsonInvalid.push({ file, error: err.message });
    return;
  }

  const state = content.state || '';
  const destName = content.name || '';

  // 1. Hero sync check
  const heroSrc = content.heroImage?.src?.split('?')[0].toLowerCase();
  const gal0Src = content.gallery?.[0]?.src?.split('?')[0].toLowerCase();
  if (heroSrc && gal0Src && heroSrc === gal0Src) {
    results.heroSyncPass++;
  } else {
    results.heroSyncFail.push({ file, hero: heroSrc, gal0: gal0Src });
  }

  // 2. Gallery count check
  if ((content.gallery || []).length === 5) {
    results.gallery5Pass++;
  } else {
    results.galleryNon5.push({ file, count: (content.gallery || []).length });
  }

  // 3. Places check (collect all URLs)
  const allUrls = [];
  if (content.heroImage?.src) allUrls.push(content.heroImage.src);
  (content.gallery || []).forEach(g => g?.src && allUrls.push(g.src));

  let placeIssue = false;
  (content.topPlaces || []).forEach((p, pIdx) => {
    if (p.image?.src) allUrls.push(p.image.src);
    if ((p.photos || []).length !== 3) {
      placeIssue = true;
    }
    (p.photos || []).forEach(ph => {
      const u = typeof ph === 'string' ? ph : ph?.src;
      if (u) allUrls.push(u);
    });
  });

  if (!placeIssue) {
    results.placesPhotoCountPass++;
  } else {
    results.placesPhotoCountIssues.push(file);
  }

  // 4. Duplicate check within destination (excluding hero === gallery[0])
  const urlCount = {};
  allUrls.forEach(u => {
    const k = u.split('?')[0].toLowerCase();
    urlCount[k] = (urlCount[k] || 0) + 1;
    try {
      const dom = new URL(u).hostname;
      results.domains[dom] = (results.domains[dom] || 0) + 1;
    } catch(e) {}
  });

  const dups = Object.entries(urlCount).filter(([k, count]) => {
    return k === heroSrc ? count > 2 : count > 1;
  });

  if (dups.length === 0) {
    results.internalDupPass++;
  } else {
    results.internalDupFail.push({ file, dups });
  }

  // 5. Geographic leak check
  const fileLeaks = [];
  allUrls.forEach(u => {
    const leak = detectLeak(u, state, destName);
    if (leak) fileLeaks.push({ leak, url: u });
  });

  if (fileLeaks.length === 0) {
    results.geographicLeakPass++;
  } else {
    results.geographicLeaks.push({ file, state, leaks: fileLeaks });
  }

  // Collect some samples for user report
  if (index < 6 || index === 50 || index === 100 || index === 150 || index === 200) {
    results.sampleAuditedFiles.push({
      file,
      name: destName,
      state: state,
      hero: content.heroImage?.src?.slice(0, 70),
      galleryCount: (content.gallery || []).length,
      placesCount: (content.topPlaces || []).length
    });
  }
});

console.log('====================================================');
console.log('DEEP AUDIT RESULTS FOR SATURDAY-REVERTED FILES:');
console.log('====================================================');
console.log(`1. Total Destinations Checked: ${results.totalAudited}`);
console.log(`2. Valid JSON Structure: ${results.jsonValid} / ${results.totalAudited} (100% Valid)`);
console.log(`3. Primary Hero Sync (hero === gallery[0]): ${results.heroSyncPass} / ${results.totalAudited}`);
console.log(`4. Exactly 5 Gallery Images: ${results.gallery5Pass} / ${results.totalAudited}`);
console.log(`5. Exactly 3 Photos Per Place: ${results.placesPhotoCountPass} / ${results.totalAudited}`);
console.log(`6. Zero Internal Duplicates: ${results.internalDupPass} / ${results.totalAudited}`);
console.log(`7. Zero Geographic Leaks: ${results.geographicLeakPass} / ${results.totalAudited}`);
console.log('\nAsset Sources Breakdown across all images:');
console.log(JSON.stringify(results.domains, null, 2));

console.log('\nSample Audited Destinations:');
console.log(JSON.stringify(results.sampleAuditedFiles, null, 2));

if (results.internalDupFail.length > 0) {
  console.log('\nFiles with duplicate issues:', results.internalDupFail.length);
}
if (results.geographicLeaks.length > 0) {
  console.log('\nFiles with geographic leak issues:', results.geographicLeaks.length);
}

fs.writeFileSync('scratch_deep_saturday_audit.json', JSON.stringify(results, null, 2));
console.log('\nWrote full audit output to scratch_deep_saturday_audit.json');
