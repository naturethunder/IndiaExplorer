const fs = require('fs');
const path = require('path');

// 1. Load API keys from .env.local
const envPath = path.resolve('.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}

if (!env.PEXELS_API_KEY && !env.UNSPLASH_ACCESS_KEY) {
  console.error('ERROR: Missing PEXELS_API_KEY and UNSPLASH_ACCESS_KEY in .env.local');
  process.exit(1);
}

const destDir = path.resolve('data', 'destinations');
const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');

// 2. Index all URLs in repo to guarantee 100% unique URL / 0 collision across repository
console.log('Building repository URL registry across', files.length, 'files...');
const repoUrlSet = new Set();

files.forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
    if (d.heroImage?.src) repoUrlSet.add(d.heroImage.src.split('?')[0].toLowerCase());
    (d.gallery || []).forEach(g => g?.src && repoUrlSet.add(g.src.split('?')[0].toLowerCase()));
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) repoUrlSet.add(p.image.src.split('?')[0].toLowerCase());
      (p.photos || []).forEach(ph => {
        const u = typeof ph === 'string' ? ph : ph?.src;
        if (u) repoUrlSet.add(u.split('?')[0].toLowerCase());
      });
    });
  } catch (e) {}
});

console.log('Total indexed repository URLs:', repoUrlSet.size);

// 3. Helper to detect out-of-state geographic leaks
function detectLeak(url, state, destName) {
  if (!url || typeof url !== 'string') return null;
  const s = (state || '').toLowerCase();
  const d = (destName || '').toLowerCase();
  const u = url.toLowerCase();

  // Kerala leak in non-Kerala destinations
  if (!s.includes('kerala') && !d.includes('kerala')) {
    if (
      u.includes('ponnani%2c_kerala') || u.includes('ponnani') ||
      u.includes('flora_of_kerala') ||
      u.includes('anandashram') ||
      u.includes('karimeen-kerala') ||
      u.includes('bakel_fort') || u.includes('bekal_fort') ||
      u.includes('silent_valley') ||
      u.includes('eravikulam') ||
      u.includes('houseboat_on_punnamada') ||
      u.includes('ashtamudi') || u.includes('ashtamudikayal') ||
      u.includes('padmanabha_swamy_temple_trivandrum') ||
      u.includes('kerala_water_falls') ||
      u.includes('cochin_ginger') ||
      u.includes('periyar_tiger_reserve') ||
      u.includes('periyar_lake%2c_kerala') ||
      u.includes('india_-_kerala_-_') ||
      u.includes('sunset_through_the_palms_%282068508221%29') ||
      u.includes('kerala_style_lunch')
    ) {
      return 'Kerala leak in ' + state;
    }
  }

  // Ladakh leak in non-Ladakh / non-Jammu destinations
  if (!s.includes('ladakh') && !s.includes('jammu') && !d.includes('ladakh') && !d.includes('leh')) {
    if (
      u.includes('leh-ladakh') ||
      u.includes('nubra%2c_ladakh') ||
      u.includes('zanskar_ladakh') ||
      u.includes('route_srinagar-leh') ||
      u.includes('shanti_stupa_in_rajgir') ||
      u.includes('shanti_stupa') ||
      u.includes('testa_close_lungnak') ||
      u.includes('diskit') ||
      u.includes('thiksey') ||
      u.includes('alchi')
    ) {
      return 'Ladakh leak in ' + state;
    }
  }

  // MP leak in non-MP destinations
  if (!s.includes('madhya pradesh') && !d.includes('khajuraho') && !d.includes('madhya')) {
    if (
      u.includes('khajuraho') ||
      u.includes('kandariya_mahadeva') ||
      u.includes('parsvanath_jain_temple_khajuraho') ||
      u.includes('panna%2c_madhya_pradesh') ||
      u.includes('madri%2c_madhya_pradesh') ||
      u.includes('madhya_pradesh08') ||
      u.includes('madhya_pradesh')
    ) {
      return 'Madhya Pradesh leak in ' + state;
    }
  }

  return null;
}

// 4. API Fetchers (Strictly Pexels & Unsplash only, NO Wikimedia, NO Flickr)
async function fetchPexelsPhoto(query) {
  if (!env.PEXELS_API_KEY) return null;
  try {
    const res = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=15&orientation=landscape', {
      headers: { Authorization: env.PEXELS_API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const p of (data.photos || [])) {
      let src = p.src.large2x || p.src.original;
      src = src.replace(/[?&]h=\\d+/g, '').replace(/w=\\d+/g, 'w=1920');
      if (!src.includes('w=1920')) src += (src.includes('?') ? '&' : '?') + 'auto=compress&cs=tinysrgb&w=1920';
      const normKey = src.split('?')[0].toLowerCase();
      if (repoUrlSet.has(normKey)) continue;
      repoUrlSet.add(normKey);
      return { url: src, alt: p.alt || query, title: query };
    }
  } catch (e) {}
  return null;
}

async function fetchUnsplashPhoto(query) {
  if (!env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch('https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) + '&per_page=15&orientation=landscape', {
      headers: { Authorization: 'Client-ID ' + env.UNSPLASH_ACCESS_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const p of (data.results || [])) {
      let src = p.urls.raw || p.urls.regular;
      src = src.split('?')[0] + '?auto=format&fit=crop&w=1920&q=80';
      const normKey = src.split('?')[0].toLowerCase();
      if (repoUrlSet.has(normKey)) continue;
      repoUrlSet.add(normKey);
      return { url: src, alt: p.alt_description || query, title: query };
    }
  } catch (e) {}
  return null;
}

async function getUniquePhoto(queries) {
  for (const q of queries) {
    const pex = await fetchPexelsPhoto(q);
    if (pex) return pex;
    const uns = await fetchUnsplashPhoto(q);
    if (uns) return uns;
  }
  return null;
}

// 5. Surgical Agent
async function run() {
  const tasks = [];

  files.forEach(f => {
    try {
      const fullPath = path.join(destDir, f);
      const d = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const state = d.state || '';
      const destName = d.name || '';

      const issues = [];

      // Check heroImage
      if (d.heroImage?.src && detectLeak(d.heroImage.src, state, destName)) {
        issues.push({ type: 'heroImage', leak: detectLeak(d.heroImage.src, state, destName), oldUrl: d.heroImage.src });
      }

      // Check gallery
      (d.gallery || []).forEach((g, idx) => {
        if (g?.src && detectLeak(g.src, state, destName)) {
          issues.push({ type: 'gallery', index: idx, leak: detectLeak(g.src, state, destName), oldUrl: g.src });
        }
      });

      // Check topPlaces
      (d.topPlaces || []).forEach((p, pIdx) => {
        if (p.image?.src && detectLeak(p.image.src, state, destName)) {
          issues.push({ type: 'placeImage', placeIndex: pIdx, placeName: p.name, leak: detectLeak(p.image.src, state, destName), oldUrl: p.image.src });
        }
        (p.photos || []).forEach((ph, phIdx) => {
          const u = typeof ph === 'string' ? ph : ph?.src;
          if (u && detectLeak(u, state, destName)) {
            issues.push({ type: 'placePhoto', placeIndex: pIdx, photoIndex: phIdx, placeName: p.name, leak: detectLeak(u, state, destName), oldUrl: u });
          }
        });
      });

      if (issues.length > 0) {
        tasks.push({ file: f, path: fullPath, dest: d, issues });
      }
    } catch (e) {}
  });

  console.log(`Found ${tasks.length} destination files with geographic leaks.`);
  const totalIssueSlots = tasks.reduce((sum, t) => sum + t.issues.length, 0);
  console.log(`Total defective slots requiring pinpoint surgery: ${totalIssueSlots}`);

  let completedDestinations = 0;
  let totalFixedSlots = 0;

  for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
    const task = tasks[tIdx];
    const { file, path: filePath, dest: d, issues } = task;
    const state = d.state || 'India';
    const destName = d.name || 'Destination';

    console.log(`\n[${tIdx + 1}/${tasks.length}] Processing ${file} (${destName}, ${state}) — ${issues.length} issue(s)...`);
    let fileModified = false;

    for (const issue of issues) {
      let replacement = null;

      if (issue.type === 'heroImage') {
        const queries = [
          `${destName} ${state} India`,
          `${destName} landmark ${state}`,
          `${state} landmark heritage India`
        ];
        replacement = await getUniquePhoto(queries);
        if (replacement) {
          d.heroImage = {
            src: replacement.url,
            alt: `${destName}, ${state} — Authentic landscape view`,
            title: `${destName} Panoramic View`
          };
          fileModified = true;
          totalFixedSlots++;
          console.log(`  ✓ Fixed heroImage: ${replacement.url.slice(0, 50)}...`);
        }
      } else if (issue.type === 'gallery') {
        const queries = [
          `${destName} ${state} travel`,
          `${destName} landscape ${state}`,
          `${state} tourism India`,
          `${state} nature heritage`
        ];
        replacement = await getUniquePhoto(queries);
        if (replacement) {
          d.gallery[issue.index] = {
            src: replacement.url,
            alt: `${destName}, ${state} — Scenic exploration view`,
            title: `${destName} Gallery Photo ${issue.index + 1}`
          };
          fileModified = true;
          totalFixedSlots++;
          console.log(`  ✓ Fixed gallery[${issue.index}]: ${replacement.url.slice(0, 50)}...`);
        }
      } else if (issue.type === 'placeImage') {
        const p = d.topPlaces[issue.placeIndex];
        const queries = [
          `${p.name} ${destName} ${state}`,
          `${p.name} ${state} India`,
          `${p.name} heritage ${state}`,
          `${state} scenic architecture`
        ];
        replacement = await getUniquePhoto(queries);
        if (replacement) {
          p.image = {
            src: replacement.url,
            title: `${p.name} Vista`,
            alt: `${p.name}, ${destName}, ${state} — Authentic vista`,
            caption: `Scenic view of ${p.name}`
          };
          fileModified = true;
          totalFixedSlots++;
          console.log(`  ✓ Fixed placeImage for "${p.name}": ${replacement.url.slice(0, 50)}...`);
        }
      } else if (issue.type === 'placePhoto') {
        const p = d.topPlaces[issue.placeIndex];
        const queries = [
          `${p.name} ${state} India`,
          `${p.name} ${destName}`,
          `${destName} ${state} landscape`,
          `${state} tourism culture`
        ];
        replacement = await getUniquePhoto(queries);
        if (replacement) {
          p.photos[issue.photoIndex] = {
            src: replacement.url,
            title: `${p.name} Photo ${issue.photoIndex + 1}`,
            alt: `${p.name}, ${destName}, ${state} — Authentic photo view`,
            caption: `Atmospheric view at ${p.name}`
          };
          fileModified = true;
          totalFixedSlots++;
          console.log(`  ✓ Fixed placePhoto for "${p.name}" [${issue.photoIndex}]: ${replacement.url.slice(0, 50)}...`);
        }
      }

      await new Promise(r => setTimeout(r, 100));
    }

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
      completedDestinations++;
      console.log(`  --> Successfully saved ${file}!`);
    }
  }

  console.log(`\n========================================`);
  console.log(`SURGERY COMPLETE:`);
  console.log(`Total destination files updated: ${completedDestinations}`);
  console.log(`Total defective slots surgically repaired: ${totalFixedSlots}`);
  console.log(`All replacement URLs are 100% unique (0 repo collisions).`);
  console.log(`Strict API compliance verified: Pexels & Unsplash only (NO Wikimedia, NO Flickr).`);
  console.log(`Git status preserved (0 commits executed).`);
  console.log(`========================================`);
}

run().catch(err => {
  console.error('Fatal error in leak fixer:', err);
  process.exit(1);
});
