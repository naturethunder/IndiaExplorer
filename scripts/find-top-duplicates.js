const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../data/destinations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');

const urlMap = new Map(); // url -> { count: number, destinations: Set<string> }

files.forEach(f => {
  const slug = f.replace('.json', '');
  try {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const d = JSON.parse(raw);
    const extractUrls = (obj) => {
      if (!obj) return;
      if (typeof obj === 'string' && (obj.startsWith('http://') || obj.startsWith('https://'))) {
        const u = obj.split('?')[0]; // normalize
        if (!urlMap.has(u)) {
          urlMap.set(u, { count: 0, destinations: new Set() });
        }
        const item = urlMap.get(u);
        item.count++;
        item.destinations.add(slug);
      } else if (Array.isArray(obj)) {
        obj.forEach(extractUrls);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(extractUrls);
      }
    };
    extractUrls(d);
  } catch(e) {}
});

const duplicates = [];
for (const [url, data] of urlMap.entries()) {
  if (data.destinations.size > 1) {
    duplicates.push({
      url,
      destCount: data.destinations.size,
      totalCount: data.count,
      destinations: Array.from(data.destinations)
    });
  }
}

duplicates.sort((a, b) => b.destCount - a.destCount);

console.log('====================================================');
console.log('      CROSS-DESTINATION DUPLICATE IMAGE AUDIT       ');
console.log('====================================================');
console.log(`Total Unique Normalized URLs: ${urlMap.size}`);
console.log(`URLs used across >1 Destination: ${duplicates.length}\n`);

console.log('Top 25 Most Repeated Images Across Destinations:');
duplicates.slice(0, 25).forEach((item, idx) => {
  let filename = '';
  try {
    filename = decodeURIComponent(item.url.split('/').pop());
  } catch(e) {
    filename = item.url.split('/').pop();
  }
  console.log(`\n#${idx + 1}. [Used in ${item.destCount} destinations (${item.totalCount} times)]`);
  console.log(`    File/Name: ${filename}`);
  console.log(`    URL: ${item.url}`);
  console.log(`    Sample Destinations: ${item.destinations.slice(0, 6).join(', ')}`);
});
