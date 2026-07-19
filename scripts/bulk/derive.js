/**
 * derive.js <state-key> — combine cached candidates + places into full
 * source-shaped destination objects (same shape the legacy D() factory emits)
 * and write data/bulk/<state-key>.json for build-json-data.js to merge.
 *
 * Quality gate: a candidate with no real nearby place (no places checkpoint or
 * empty list) is SKIPPED — every published destination must have ≥1 real
 * attraction with a real description.
 *
 * Usage: node scripts/bulk/derive.js rajasthan
 */
const fs = require('fs');
const path = require('path');
const synth = require('./synth');

const ROOT = path.resolve(__dirname, '..', '..');

function main(stateKey) {
  const cacheDir = path.join(__dirname, 'cache', stateKey);
  const candFile = path.join(cacheDir, 'candidates.json');
  const placesDir = path.join(cacheDir, 'places');
  if (!fs.existsSync(candFile)) {
    console.error('No candidates cache — run fetch-candidates.js ' + stateKey + ' first.');
    process.exit(1);
  }
  const { candidates } = JSON.parse(fs.readFileSync(candFile, 'utf8'));

  const out = [];
  let skippedNoPlaces = 0;
  for (const c of candidates) {
    const pFile = path.join(placesDir, c.slug + '.json');
    if (!fs.existsSync(pFile)) { skippedNoPlaces++; continue; }
    const cached = JSON.parse(fs.readFileSync(pFile, 'utf8'));
    if (!cached.places || !cached.places.length) { skippedNoPlaces++; continue; }

    const places = cached.places.map((p) =>
      synth.makePlace(p.name, p.category, p.distanceKm, p.desc, null));

    // real Wikipedia intro → shortDesc (1st sentence) + description (full intro)
    const desc = (cached.description || '').trim();
    const firstSentence = desc ? (desc.match(/^.*?[.!?](\s|$)/) || [desc])[0].trim() : '';

    out.push(synth.buildDestination({
      slug: c.slug,
      name: c.name,
      state: c.state,
      type: c.type,
      lat: c.lat,
      lng: c.lng,
      altitude: c.altitude,
      shortDesc: firstSentence && firstSentence.length >= 30 ? firstSentence.slice(0, 180) : null,
      description: desc ? desc.slice(0, 600) : null,
      places,
    }));
  }

  const bulkDir = path.join(ROOT, 'data', 'bulk');
  fs.mkdirSync(bulkDir, { recursive: true });
  const outFile = path.join(bulkDir, stateKey + '.json');
  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log('[derive] ' + out.length + ' destinations → ' + path.relative(ROOT, outFile) +
    ' (skipped ' + skippedNoPlaces + ' with no real places)');
  return out;
}

if (require.main === module) main(process.argv[2] || 'rajasthan');
module.exports = { main };
