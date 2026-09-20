/**
 * scripts/phase2_scanner.js
 * Scans all destination JSON files, finds dirty ones (Wikimedia/Pixabay URLs),
 * excludes already-clean files and Phase 1 targets, then splits into 4 balanced
 * batches for parallel multi-agent repair.
 */

const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const outputDir = path.resolve(__dirname, '..', 'scripts', 'phase2_batches');

// Phase 1 targets (already handled)
const PHASE1_TARGETS = new Set([
  'aazhimala-shiva-temple.json','abaya-hastha-swayambu-sri-lakshmi-narasimha-swamy-temple-agaram-village-hosur.json',
  'adi-badri-temples.json','alampur-navabrahma-temples.json','alleppey.json','ashokdham-temple.json',
  'bajwara-fort.json','bakhira-sanctuary.json','beeramgunta-poleramma-temple.json',
  'chottanikkara-temple.json','church-of-sacred-heart-of-jesus-madanthyar.json',
  'gurudwara-naulakha-sahib.json','jhandewalan-temple.json','kadampanad-church.json',
  'kadampuzha-devi-temple.json','kalsubai-harishchandragad-wildlife-sanctuary.json',
  'kanak-durga-temple.json','karmanghat-hanuman-temple.json','kedareshvara-temple-balligavi.json',
  'kedarnath-temple.json','khaparwas-wildlife-sanctuary.json','kheer-bhawani.json',
  'koyna-wildlife-sanctuary.json','lakhamandal-temple-ruins-and-images.json',
  'lakshmikanta-temple-kalale.json','mallikarjuna-temple-goa.json','mogalrajapuram-caves.json',
  'mundayur-mahadeva-temple.json','nartiang-durga-temple.json','neelamperoor-palli-bhagavathi-temple.json',
  'neelkanth-mahadev-temple.json','nrisingha-temple.json','oachira-temple.json',
  'panniyur-sri-varahamoorthy-temple.json','parthasarathy-temple-mundakkayam.json',
  'pasupateeswarar-temple-karur.json','phansad-wildlife-sanctuary.json','polur-temple-kozhikode.json',
  'portuguese-cemetery.json','poruvazhy-peruviruthy-malanada-temple.json',
  'rangamati-tea-estate-cemetery.json','ravishwarar-temple.json',
  'sri-perungaraiyadi-meenda-ayyanar-temple.json','sri-radha-rani-temple.json',
  'sri-sri-nookambika-ammavari-temple.json',
  'sri-venkatesa-perumal-temple-melathiruppathi-mondipalayam.json','sri-vetrimalai-murugan-temple.json',
  'st-george-forane-church-kallody-wayanad.json','sun-temple.json','tapkeshwar-temple.json',
  'thali-mahadeva-temple-kozhikode.json','thaliyil-mahadeva-temple.json',
  'varinjam-sree-subramanya-swamy-temple.json','vazhappally-maha-siva-temple.json',
  'veerbhadra-temple.json','wagheshwari-temple.json',
  // Manual certified destinations from earlier sessions
  'st-peter-s-church-royapuram.json','martand-sun-temple.json','bumzuva-cave-and-temple.json',
  'gwalior.json','fort-st-anthony-of-simbor.json','nanda-devi-national-park.json',
  'bibhutibhushan-wildlife-sanctuary.json','sinhagad.json','gagron-fort.json',
  'st-john-the-baptist-jacobite-syrian-church-south-parur.json',
  'thirunadhikkara-cave-temple.json','umra-narayan.json'
]);

function isDirty(raw) {
  return raw.includes('upload.wikimedia.org') ||
         raw.includes('wikipedia.org') ||
         raw.includes('pixabay.com/get/') ||
         raw.includes('placeholder') ||
         raw.includes('via.placeholder') ||
         raw.includes('nearest airport');
}

function isClean(raw, parsed) {
  if (isDirty(raw)) return false;
  if (!Array.isArray(parsed.gallery) || parsed.gallery.length !== 5) return false;
  if (parsed.heroImage?.src !== parsed.gallery[0]?.src) return false;
  const places = parsed.topPlaces || [];
  for (const pl of places) {
    if (!pl.image?.src) return false;
    if (!Array.isArray(pl.photos) || pl.photos.length !== 3) return false;
  }
  return true;
}

// Scan all destination files
const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
const dirtyFiles = [];
const cleanFiles = [];
let skippedPhase1 = 0;

for (const f of allFiles) {
  if (PHASE1_TARGETS.has(f)) { skippedPhase1++; continue; }
  try {
    const raw = fs.readFileSync(path.join(destDir, f), 'utf8');
    const parsed = JSON.parse(raw);
    if (isClean(raw, parsed)) {
      cleanFiles.push(f);
    } else {
      dirtyFiles.push(f);
    }
  } catch (e) {
    dirtyFiles.push(f); // treat parse errors as dirty
  }
}

console.log(`\n=== Phase 2 Scanner Results ===`);
console.log(`Phase 1 targets excluded : ${skippedPhase1}`);
console.log(`Already clean            : ${cleanFiles.length}`);
console.log(`Dirty / need repair      : ${dirtyFiles.length}`);
console.log(`Total files scanned      : ${allFiles.length}`);

if (dirtyFiles.length === 0) {
  console.log('\nAll destinations are already clean! No Phase 2 needed.');
  process.exit(0);
}

// Split dirty files into 4 balanced batches
const NUM_WORKERS = 4;
const batches = Array.from({ length: NUM_WORKERS }, () => []);
dirtyFiles.forEach((f, i) => batches[i % NUM_WORKERS].push(f));

// Write batch files
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

for (let i = 0; i < NUM_WORKERS; i++) {
  const batchPath = path.join(outputDir, `batch_${String.fromCharCode(65 + i)}.json`);
  fs.writeFileSync(batchPath, JSON.stringify({ worker: i, files: batches[i] }, null, 2));
  console.log(`\nBatch ${String.fromCharCode(65 + i)} (${batches[i].length} files) -> ${batchPath}`);
  batches[i].slice(0, 5).forEach(f => console.log(`  - ${f}`));
  if (batches[i].length > 5) console.log(`  ... and ${batches[i].length - 5} more`);
}

// Write a shared session state file (for cross-worker collision avoidance)
const sessionStatePath = path.join(outputDir, 'session_state.json');
fs.writeFileSync(sessionStatePath, JSON.stringify({ usedUrls: [], completedFiles: [] }, null, 2));
console.log(`\nShared session state -> ${sessionStatePath}`);
console.log('\nRun workers with:');
for (let i = 0; i < NUM_WORKERS; i++) {
  console.log(`  node scripts/phase2_worker.js ${i}`);
}
