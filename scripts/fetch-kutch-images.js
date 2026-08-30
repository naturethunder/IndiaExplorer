const https = require('https');
const fs = require('fs');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ExploreDeshBot/2.0 (admin@exploredesh.org)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const terms = ['Kutch', 'Bhachau', 'Dholavira', 'Kanthkot'];
  const allImages = [];
  const seen = new Set();

  for (const t of terms) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(t)}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|size&iiurlwidth=1280&format=json`;
    const res = await fetchJson(url);
    if (res?.query?.pages) {
      Object.values(res.query.pages).forEach(p => {
        const u = p.imageinfo?.[0]?.url;
        const title = p.title || '';
        const lower = title.toLowerCase();
        if (u && /\.(jpe?g|png)$/i.test(u) && !lower.includes('flag') && !lower.includes('map') && !lower.includes('coa') && !lower.includes('badge') && !lower.includes('coin') && !lower.includes('stamp') && !lower.includes('census') && !lower.includes('pdf')) {
          if (!seen.has(u)) {
            seen.add(u);
            allImages.push({ title: title.replace(/^File:/i, ''), url: u });
          }
        }
      });
    }
  }

  console.log('Total Kutch clean images found:', allImages.length);
  allImages.slice(0, 25).forEach((img, idx) => {
    console.log(`${idx + 1}. ${img.title}\n   ${img.url}`);
  });
}

main();
