const https = require('https');
const fs = require('fs');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ExploreDesh/1.0 (travel@exploredesh.com)' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchWiki(query) {
  const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=' + encodeURIComponent(query) + '&srlimit=25&format=json';
  const data = await fetchJson(searchUrl);
  if (!data || !data.query || !data.query.search) return [];
  const titles = data.query.search.map(s => s.title);
  if (titles.length === 0) return [];

  const infoUrl = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(titles.join('|')) + '&prop=imageinfo&iiprop=url|size|extmetadata&format=json';
  const infoData = await fetchJson(infoUrl);
  if (!infoData || !infoData.query || !infoData.query.pages) return [];

  return Object.values(infoData.query.pages).map(p => {
    const ii = p.imageinfo ? p.imageinfo[0] : null;
    if (!ii) return null;
    return {
      title: p.title,
      width: ii.width,
      height: ii.height,
      size: ii.size,
      url: ii.url,
      description: ii.extmetadata && ii.extmetadata.ObjectName ? ii.extmetadata.ObjectName.value : ''
    };
  }).filter(Boolean);
}

async function run() {
  const queries = [
    'Saramati',
    'Kiphire',
    'Fakim Nagaland',
    'Pungro',
    'Blyth Tragopan',
    'Tragopan blythii',
    'Nagaland landscape',
    'Nagaland mountains',
    'Naga Hills'
  ];

  const all = {};
  for (const q of queries) {
    const res = await searchWiki(q);
    console.log('QUERY: ' + q + ' (' + res.length + ' results)');
    res.forEach(r => {
      if (r.width >= 1920 && !r.url.endsWith('.svg') && !r.url.endsWith('.tif') && !r.url.endsWith('.pdf') && !r.url.endsWith('.webm')) {
        console.log('  [' + r.width + 'x' + r.height + '] ' + r.title);
        all[r.url] = r;
      }
    });
  }

  fs.writeFileSync('scripts/fakim_hd_candidates.json', JSON.stringify(Object.values(all), null, 2));
  console.log('Total HD images found:', Object.keys(all).length);
}

run();
