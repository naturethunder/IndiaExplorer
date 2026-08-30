const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../data/destinations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');

const domains = {};
let totalUrls = 0;

function checkUrl(u) {
  if (typeof u !== 'string') return;
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('//')) {
    totalUrls++;
    try {
      const parsed = new URL(u.startsWith('//') ? 'https:' + u : u);
      const host = parsed.hostname;
      domains[host] = (domains[host] || 0) + 1;
    } catch(e) {
      domains['invalid_url'] = (domains['invalid_url'] || 0) + 1;
    }
  } else if (u.startsWith('/') || u.startsWith('.')) {
    domains['local_relative_path'] = (domains['local_relative_path'] || 0) + 1;
  }
}

files.forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (d.heroImage && d.heroImage.src) checkUrl(d.heroImage.src);
    if (Array.isArray(d.gallery)) d.gallery.forEach(g => g && checkUrl(g.src));
    const places = d.topPlaces || d.places || [];
    if (Array.isArray(places)) {
      places.forEach(p => {
        if (p.image && p.image.src) checkUrl(p.image.src);
        if (Array.isArray(p.photos)) {
          p.photos.forEach(ph => checkUrl(typeof ph === 'string' ? ph : ph?.src));
        }
      });
    }
  } catch(e){}
});

console.log('Total image URLs in dataset:', totalUrls);
console.log('\n--- Host / Domain Breakdown ---');
Object.entries(domains).sort((a, b) => b[1] - a[1]).forEach(([host, count]) => {
  const pct = ((count / totalUrls) * 100).toFixed(2);
  console.log(`  ${host}: ${count} (${pct}%)`);
});
