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

console.log('=== BIHAR DESTINATIONS DIAGNOSTIC ===');
biharFiles.forEach(slug => {
  const filePath = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing file: ${slug}.json`);
    return;
  }
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const galleryCount = d.gallery?.length || 0;
  const placesCount = d.topPlaces?.length || 0;
  const placesPhotos = d.topPlaces?.map(p => p.photos?.length || 0);
  const heroMatch = d.heroImage?.src === d.gallery?.[0]?.src;
  
  const allUrls = [];
  if (d.heroImage?.src) allUrls.push(d.heroImage.src);
  d.gallery?.forEach(g => allUrls.push(g.src));
  d.topPlaces?.forEach(p => {
    if (p.image?.src) allUrls.push(p.image.src);
    p.photos?.forEach(ph => allUrls.push(ph));
  });

  const dupes = allUrls.length - new Set(allUrls).size - (heroMatch ? 1 : 0);

  console.log(`[${slug}] "${d.title}"`);
  console.log(`  - Gallery: ${galleryCount}/5 | Hero Match: ${heroMatch ? 'YES' : 'NO'}`);
  console.log(`  - Places: ${placesCount} places (photos: ${placesPhotos?.join(',')})`);
  console.log(`  - Internal Duplicates: ${dupes > 0 ? `❌ ${dupes}` : '0'}`);
});
