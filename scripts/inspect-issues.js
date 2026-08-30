const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const reportPath = path.join(ROOT, 'reports', 'comprehensive-image-quality-audit.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('=== SUMMARY OF DETECTED ISSUES ===');
console.log(JSON.stringify(report.summary.categoryBreakdown, null, 2));

const issuesByType = {};
report.patternIssues.forEach(item => {
  item.problems.forEach(p => {
    const k = p.startsWith('BLURRY_THUMB') ? 'BLURRY_THUMB' : p;
    if (!issuesByType[k]) issuesByType[k] = [];
    issuesByType[k].push({
      file: item.file,
      slug: item.slug,
      name: item.name,
      state: item.state,
      field: item.field,
      problem: p,
      url: item.url
    });
  });
});

for (const [type, list] of Object.entries(issuesByType)) {
  console.log(`\n========================================`);
  console.log(`ISSUE TYPE: ${type} (${list.length} occurrences)`);
  console.log(`========================================`);
  list.forEach((item, idx) => {
    console.log(`${idx + 1}. [${item.state}] ${item.name} (${item.file}) -> ${item.field}`);
    console.log(`   URL: ${item.url}`);
  });
}
