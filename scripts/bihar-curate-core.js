const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEST_DIR = 'data/destinations';
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  try {
    const raw = execFileSync('curl.exe', [
      '-sS', '-L',
      '-H', 'User-Agent: IndiaExplorerBot/1.0 (https://github.com/naturethunder/IndiaExplorer; contact@indiaexplorer.org)',
      url
    ], { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function searchWikimedia(searchTerm, limit = 20) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('filetype:bitmap ' + searchTerm)}&srnamespace=6&srlimit=${limit}&format=json`;
  const sRes = fetchJson(searchUrl);
  if (!sRes || !sRes.query || !sRes.query.search) return [];

  const titles = sRes.query.search.map(x => x.title);
  if (!titles.length) return [];

  await sleep(650);

  const titlesParam = titles.map(t => encodeURIComponent(t)).join('|');
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json`;
  const iRes = fetchJson(infoUrl);
  if (!iRes || !iRes.query || !iRes.query.pages) return [];

  const pages = Object.values(iRes.query.pages);
  return pages.map(p => {
    const ii = p.imageinfo?.[0];
    return {
      title: p.title,
      width: ii?.width || 0,
      height: ii?.height || 0,
      url: (ii?.url || '').split('?')[0],
      thumb: (ii?.thumburl || '').split('?')[0],
      desc: ii?.extmetadata?.ImageDescription?.value || ''
    };
  }).filter(x => {
    if (!x.url || !/\.(jpe?g|png)$/i.test(x.url) || x.width < 700) return false;
    const t = x.title.toLowerCase();
    return !t.includes('stamp') && !t.includes('map') && !t.includes('flag') && !t.includes('satellite') && !t.includes('icon') && !t.includes('diagram') && !t.includes('.ogg') && !t.includes('.pdf') && !t.includes('senate_hall') && !t.includes('narendra_modi') && !t.includes('holy_spirit_church');
  });
}

// 1. Build Global Used URLs Set from all NON-BIHAR files in repository
const BIHAR_SLUGS = new Set([
  'aranya-devi-temple-arrah',
  'ashokdham-temple',
  'baba-garib-sthan-mandir',
  'barela-bird-sanctuary',
  'basilica-of-our-lady-of-divine-grace',
  'bhimbandh-wildlife-sanctuary',
  'bodh-gaya',
  'buxar-fort',
  'chandika-sthan',
  'darbhanga-fort',
  'gautam-budha-wildlife-sanctuary',
  'gurdwara-bal-lila-maini-sangat',
  'gurdwara-handi-sahib',
  'iskcon-temple-patna',
  'kaimur-wildlife-sanctuary',
  'kanwar-lake-bird-sanctuary',
  'kapileshwar-temple',
  'khudneshwar-asthan-morwa',
  'koncheswar-mahadev-temple',
  'kusheshwar-asthan-bird-sanctuary',
  'lal-keshwar-shiv-temple',
  'maa-tara-chandi-temple',
  'mangla-gauri-temple',
  'mundeshwari-temple',
  'munger-fort',
  'nagi-bird-sanctuary',
  'nalanda',
  'nandangarh-stupa-and-rampart',
  'pant-wildlife-sanctuary',
  'pataleshwar-mandir',
  'rajauli-wildlife-sanctuary',
  'rohtasgarh-fort',
  'sundernath',
  'takht-sri-patna-sahib',
  'udaypur-wildlife-sanctuary',
  'vikramshila-gangetic-dolphin-sanctuary',
  'vishnupad-temple-gaya',
  'vishwamitra-ashram-bisaul'
]);

const GLOBAL_USED_URLS = new Set();
fs.readdirSync(DEST_DIR).forEach(f => {
  if (!f.endsWith('.json') || f === 'index.json') return;
  const s = f.replace('.json', '');
  if (BIHAR_SLUGS.has(s)) return; // Skip Bihar files so we freshly curate them
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
    if (d.heroImage?.src) GLOBAL_USED_URLS.add(d.heroImage.src);
    d.gallery?.forEach(g => GLOBAL_USED_URLS.add(g.src));
    d.topPlaces?.forEach(p => {
      if (p.image?.src) GLOBAL_USED_URLS.add(p.image.src);
      p.photos?.forEach(ph => GLOBAL_USED_URLS.add(ph));
    });
  } catch(e) {}
});

console.log(`Loaded ${GLOBAL_USED_URLS.size} globally used URLs from non-Bihar repository files.`);

async function collectUniqueImages(queryList, neededCount) {
  const collected = [];
  for (const q of queryList) {
    if (collected.length >= neededCount) break;
    const res = await searchWikimedia(q, 20);
    for (const item of res) {
      if (item.url && !GLOBAL_USED_URLS.has(item.url) && !collected.some(c => c.url === item.url)) {
        collected.push(item);
        GLOBAL_USED_URLS.add(item.url);
        if (collected.length >= neededCount) break;
      }
    }
    await sleep(600);
  }
  return collected;
}

module.exports = {
  DEST_DIR,
  INDEX_PATH,
  GLOBAL_USED_URLS,
  collectUniqueImages,
  sleep
};
