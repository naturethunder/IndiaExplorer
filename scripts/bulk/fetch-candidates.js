/**
 * fetch-candidates.js <state-key> — Wikidata SPARQL: notable tourist places in
 * an Indian state, with real coords, elevation, instance-of labels, enwiki
 * article and sitelink count (notability). Deduped vs the existing site slugs
 * and vs each other (~3 km). Cached to scripts/bulk/cache/<state>/candidates.json.
 *
 * Usage: node scripts/bulk/fetch-candidates.js rajasthan
 */
const fs = require('fs');
const path = require('path');
const { curlJson } = require('./http');
const { slugify, mapType, haversineKm } = require('./synth');

const ROOT = path.resolve(__dirname, '..', '..');

// state-key → Wikidata QID + the exact state name used across the site
const STATES = {
  'andhra-pradesh':    { qid: 'Q1159', name: 'Andhra Pradesh' },
  'arunachal-pradesh': { qid: 'Q1162', name: 'Arunachal Pradesh' },
  'assam':             { qid: 'Q1164', name: 'Assam' },
  'bihar':             { qid: 'Q1165', name: 'Bihar' },
  'chhattisgarh':      { qid: 'Q1168', name: 'Chhattisgarh' },
  'goa':               { qid: 'Q1171', name: 'Goa' },
  'gujarat':           { qid: 'Q1061', name: 'Gujarat' },
  'haryana':           { qid: 'Q1174', name: 'Haryana' },
  'himachal-pradesh':  { qid: 'Q1177', name: 'Himachal Pradesh' },
  'jharkhand':         { qid: 'Q1184', name: 'Jharkhand' },
  'karnataka':         { qid: 'Q1185', name: 'Karnataka' },
  'kerala':            { qid: 'Q1186', name: 'Kerala' },
  'madhya-pradesh':    { qid: 'Q1188', name: 'Madhya Pradesh' },
  'maharashtra':       { qid: 'Q1191', name: 'Maharashtra' },
  'manipur':           { qid: 'Q1193', name: 'Manipur' },
  'meghalaya':         { qid: 'Q1195', name: 'Meghalaya' },
  'mizoram':           { qid: 'Q1502', name: 'Mizoram' },
  'nagaland':          { qid: 'Q1599', name: 'Nagaland' },
  'odisha':            { qid: 'Q22048', name: 'Odisha' },
  'punjab':            { qid: 'Q22424', name: 'Punjab' },
  'rajasthan':         { qid: 'Q1437', name: 'Rajasthan' },
  'sikkim':            { qid: 'Q1505', name: 'Sikkim' },
  'tamil-nadu':        { qid: 'Q1445', name: 'Tamil Nadu' },
  'telangana':         { qid: 'Q677037', name: 'Telangana' },
  'tripura':           { qid: 'Q1363', name: 'Tripura' },
  'uttar-pradesh':     { qid: 'Q1498', name: 'Uttar Pradesh' },
  'uttarakhand':       { qid: 'Q1499', name: 'Uttarakhand' },
  'west-bengal':       { qid: 'Q1356', name: 'West Bengal' },
  // Union territories
  'jammu-kashmir':     { qid: 'Q66278313', name: 'Jammu & Kashmir' },
  'ladakh':            { qid: 'Q200667', name: 'Ladakh (UT)' },
  'delhi':             { qid: 'Q1353', name: 'Delhi' },
  'puducherry':        { qid: 'Q66743', name: 'Puducherry' },
  'andaman-nicobar':   { qid: 'Q40888', name: 'Andaman & Nicobar' },
  'lakshadweep':       { qid: 'Q26927', name: 'Lakshadweep' },
  'chandigarh':        { qid: 'Q43433', name: 'Chandigarh' },
  'dnh-daman-diu':     { qid: 'Q77997266', name: 'Daman & Diu' },
};

// Tourist-place classes to pull (instance-of, with subclasses where sane).
// Q570116 tourist attraction · Q1322323 hill station · Q46169 national park ·
// Q40080 beach · Q9259 World Heritage Site · Q39614 archaeological site ·
// Q57821 fortification · Q16560 palace · Q44539 temple · Q34038 waterfall ·
// Q23397 lake · Q473972 protected area
const SPARQL = (stateQid) => `
SELECT ?item ?itemLabel ?lat ?lon
       (SAMPLE(?altV) AS ?alt)
       (GROUP_CONCAT(DISTINCT ?typeLabel; separator="|") AS ?types)
       ?sitelinks ?article
WHERE {
  ?item wdt:P131* wd:${stateQid} .
  { ?item wdt:P31/wdt:P279* wd:Q570116 }
  UNION { ?item wdt:P31 wd:Q1322323 }
  UNION { ?item wdt:P31 wd:Q46169 }
  UNION { ?item wdt:P31/wdt:P279* wd:Q40080 }
  UNION { ?item wdt:P31/wdt:P279* wd:Q39614 }
  UNION { ?item wdt:P31/wdt:P279* wd:Q57821 }
  UNION { ?item wdt:P31/wdt:P279* wd:Q16560 }
  UNION { ?item wdt:P31/wdt:P279* wd:Q44539 }
  UNION { ?item wdt:P31 wd:Q34038 }
  UNION { ?item wdt:P31 wd:Q473972 }
  ?item wdt:P625 ?c .
  BIND(geof:latitude(?c) AS ?lat)
  BIND(geof:longitude(?c) AS ?lon)
  OPTIONAL { ?item wdt:P2044 ?altV . }
  ?item wikibase:sitelinks ?sitelinks .
  ?article schema:about ?item ;
           schema:isPartOf <https://en.wikipedia.org/> .
  ?item wdt:P31 ?type .
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
    ?item rdfs:label ?itemLabel .
    ?type rdfs:label ?typeLabel .
  }
}
GROUP BY ?item ?itemLabel ?lat ?lon ?sitelinks ?article
ORDER BY DESC(?sitelinks)
LIMIT 3000`;

function existingDestinations() {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'destinations', 'index.json'), 'utf8'));
  return {
    slugs: new Set(idx.destinations.map((d) => d.slug)),
    coords: idx.destinations.filter((d) => d.lat != null).map((d) => [d.lat, d.lng]),
  };
}

function main(stateKey) {
  const st = STATES[stateKey];
  if (!st) {
    console.error('Unknown state key: ' + stateKey + '\nValid keys: ' + Object.keys(STATES).join(', '));
    process.exit(1);
  }
  const cacheDir = path.join(__dirname, 'cache', stateKey);
  fs.mkdirSync(cacheDir, { recursive: true });
  const outFile = path.join(cacheDir, 'candidates.json');

  console.log('[candidates] ' + st.name + ' (' + st.qid + ') — querying Wikidata…');
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(SPARQL(st.qid));
  const data = curlJson(url, { timeoutSec: 120, accept: 'application/sparql-results+json' });
  const rows = data.results.bindings;
  console.log('[candidates] raw rows: ' + rows.length);

  const existing = existingDestinations();
  const taken = existing.slugs;
  const out = [];
  for (const r of rows) {
    const name = r.itemLabel && r.itemLabel.value;
    if (!name || /^Q\d+$/.test(name)) continue;            // unlabeled entity
    const lat = parseFloat(r.lat.value), lon = parseFloat(r.lon.value);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    const article = r.article && r.article.value;
    if (!article) continue;                                 // notability floor
    const types = (r.types ? r.types.value : '').split('|').filter(Boolean);
    const sitelinks = parseInt(r.sitelinks.value, 10) || 0;

    let slug = slugify(name);
    if (!slug || slug.length < 3) continue;
    if (taken.has(slug)) continue;                          // vs existing 108
    // near-duplicate guards (~3 km): vs already-live destinations, then vs
    // other candidates — rows arrive sorted by notability, so the more
    // notable of two neighbours wins
    if (existing.coords.some((c) => haversineKm(c, [lat, lon]) < 3)) continue;
    const near = out.find((o) => haversineKm([o.lat, o.lng], [lat, lon]) < 3);
    if (near) continue;

    taken.add(slug);
    out.push({
      slug,
      name,
      qid: r.item.value.split('/').pop(),
      state: st.name,
      lat, lng: lon,
      altitude: r.alt ? Math.round(parseFloat(r.alt.value)) : null,
      typeHints: types,
      type: mapType([name].concat(types)),
      sitelinks,
      wikiTitle: decodeURIComponent(article.split('/wiki/').pop()).replace(/_/g, ' '),
    });
  }

  fs.writeFileSync(outFile, JSON.stringify({ state: st.name, stateKey, generated: new Date().toISOString(), candidates: out }, null, 1));
  console.log('[candidates] kept ' + out.length + ' → ' + path.relative(ROOT, outFile));
  const byType = {};
  out.forEach((c) => { byType[c.type] = (byType[c.type] || 0) + 1; });
  console.log('[candidates] by type: ' + JSON.stringify(byType));
  return out;
}

if (require.main === module) main(process.argv[2] || 'rajasthan');
module.exports = { main, STATES };
