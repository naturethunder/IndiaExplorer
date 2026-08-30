const https = require('https');

const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';

function searchPexels(query) {
  return new Promise(resolve => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`;
    https.get(url, { headers: { Authorization: PEXELS_KEY, 'User-Agent': 'ExploreDesh/1.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const photos = (j.photos || []).map(p => ({
            id: p.id,
            width: p.width,
            height: p.height,
            alt: p.alt || query,
            src: p.src.large2x || p.src.original
          }));
          resolve(photos);
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const terms = [
    'Rann of Kutch white desert',
    'Gujarat heritage fort architecture',
    'ancient Indian stone fort ruins',
    'arid rocky hills desert landscape India'
  ];

  for (const t of terms) {
    const res = await searchPexels(t);
    console.log(`\n📷 Pexels HD results for "${t}": (${res.length} photos)`);
    res.slice(0, 3).forEach((p, idx) => {
      console.log(`  ${idx + 1}. [${p.width}x${p.height}] ${p.alt}\n     ${p.src}`);
    });
  }
}

run();
