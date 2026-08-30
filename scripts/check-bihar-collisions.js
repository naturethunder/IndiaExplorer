const fs = require('fs');
const path = require('path');
const DEST_DIR = 'data/destinations';

const biharFiles = [
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
];

const biharSet = new Set(biharFiles.map(s => `${s}.json`));
const allRepoUrls = new Map();

fs.readdirSync(DEST_DIR).forEach(f => {
  if (!f.endsWith('.json') || f === 'index.json') return;
  const item = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
  function track(u) {
    if (!u) return;
    if (!allRepoUrls.has(u)) allRepoUrls.set(u, []);
    allRepoUrls.get(u).push(f);
  }
  if (item.heroImage?.src) track(item.heroImage.src);
  item.gallery?.forEach(g => track(g.src));
  item.topPlaces?.forEach(p => {
    if (p.image?.src) track(p.image.src);
    p.photos?.forEach(ph => track(ph));
  });
});

let biharCollisions = 0;
for (const [url, files] of allRepoUrls.entries()) {
  const hasBihar = files.some(f => biharSet.has(f));
  if (hasBihar && files.length > 1) {
    biharCollisions++;
    console.log(`Collision (${files.length} files): ${url}`);
    console.log(`   Files: ${files.join(', ')}`);
  }
}

console.log(`\nTotal Collisions involving Bihar files: ${biharCollisions}`);
