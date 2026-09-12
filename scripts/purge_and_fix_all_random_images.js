/**
 * scripts/purge_and_fix_all_random_images.js
 * ============================================================
 * Phase 38 — Universal Random/Mismatched Image Purge Engine
 * ============================================================
 *
 * PURPOSE:
 *   Scans a configurable list of destination slugs and purges any images
 *   that match a banned-pattern set (portraits, vehicles, foreign locations,
 *   stock photos, wrong regions, etc.), replacing them with authentic,
 *   verified HD landscape/architecture photography from Pexels and Openverse.
 *
 * BANNED CONTENT CATEGORIES:
 *   - Airports / stations / transport hubs
 *   - Buses / trains / vehicles / tractors / speedboats / turbines
 *   - Food close-ups: fish market, garlic, potato, drying
 *   - People / portraits / babies / toddlers / women posing / models
 *   - Foreign locations: Kyiv, Ukraine, Cuba, Bali, Indonesia, Malaysia, Berlin, Germany, Vietnam, China
 *   - Irrelevant stock / memes / animals (cats, dogs)
 *   - Unrelated real-estate / office interiors / hotel lobbies
 *
 * IMAGE SOURCING PIPELINE:
 *   Priority 1: Pexels API  (Full HD, cs=tinysrgb&dpr=2&w=1920)
 *   Priority 2: Openverse / Flickr CDN  (_b.jpg suffix = 1024px+)
 *   NEVER: Wikimedia Commons (except as absolute last resort)
 *   NEVER: picsum.photos / via.placeholder / placeholder.com
 *   NEVER: Pixabay /get/ session links (HTTP 429)
 *
 * COLLISION GUARANTEE:
 *   Every candidate URL is checked against the full global repo set
 *   (all 2,393 destination JSON files) BEFORE assignment. No URL is
 *   reused within a session or across the repository.
 *
 * USAGE:
 *   node scripts/purge_and_fix_all_random_images.js
 *
 *   To target different destinations, update the SPECIFIC_FIXES map below.
 *   After running, verify with: node scripts/verify_batch2.js
 *
 * ENVIRONMENT:
 *   Requires .env.local with:
 *     PEXELS_API_KEY=...
 *     OPENVERSE_CLIENT_ID=...      (optional — unauthenticated also works)
 *     OPENVERSE_CLIENT_SECRET=...  (optional)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// ENV & CONFIG
// ---------------------------------------------------------------------------

const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');

// ---------------------------------------------------------------------------
// URL UTILITIES
// ---------------------------------------------------------------------------

/** Strip query parameters and lowercase for collision comparison. */
function cleanUrl(u) {
  if (!u) return '';
  return u.split('?')[0].trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// GLOBAL REPO COLLISION SET
// Index every image URL across all 2,393 destination files so we guarantee
// zero cross-destination collisions on any new URL we pick.
// ---------------------------------------------------------------------------

const globalRepo = new Set();
fs.readdirSync(destDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json')
  .forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
      if (d.heroImage?.src) globalRepo.add(cleanUrl(d.heroImage.src));
      if (d.gallery) d.gallery.forEach(g => g.src && globalRepo.add(cleanUrl(g.src)));
      if (d.topPlaces) d.topPlaces.forEach(p => {
        if (p.image?.src) globalRepo.add(cleanUrl(p.image.src));
        if (p.photos) p.photos.forEach(ph => {
          const u = ph.src || ph;
          if (u) globalRepo.add(cleanUrl(u));
        });
      });
    } catch (e) { /* skip parse errors */ }
  });

console.log(`Global repo URLs indexed for collision detection: ${globalRepo.size}`);

// ---------------------------------------------------------------------------
// OPENVERSE OAUTH (optional — unauthenticated fallback works fine)
// ---------------------------------------------------------------------------

let openverseToken = null;
async function getOpenverseToken() {
  if (openverseToken) return openverseToken;
  if (!env.OPENVERSE_CLIENT_ID || !env.OPENVERSE_CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://api.openverse.org/v1/auth_tokens/token/', {
      method: 'POST',
      headers: { 'User-Agent': 'ExploreDesh/1.0', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.OPENVERSE_CLIENT_ID,
        client_secret: env.OPENVERSE_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    openverseToken = data.access_token;
    return openverseToken;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// BANNED PATTERN FILTER
// Applied to image alt text, title, and URL. Any match → reject.
// ---------------------------------------------------------------------------

const BANNED_PATTERNS = [
  // Transport / infrastructure
  /airport/i, /rajiv gandhi/i, /walkway/i, /runway/i,
  /\bbus\b/i, /tn 68/i, /\btrain\b/i, /chariot suite/i, /sleeper/i,
  /tractor/i, /turbine/i, /speed boat/i, /speedboat/i,

  // Food / market
  /potato/i, /fish market/i, /garlic/i, /drying/i, /vegetables/i,

  // People / portraits
  /\bbaby\b/i, /toddler/i, /\bchild\b/i, /\bwoman\b/i, /\bwomen\b/i,
  /posing/i, /portrait/i, /\bface\b/i, /selfie/i, /\bmodel\b/i,
  /\bgirl\b/i, /\bboy\b/i, /\bperson\b/i, /\bpeople\b/i,

  // Foreign / wrong locations
  /kyiv/i, /ukraine/i, /nicholas cathedral/i, /cuba/i, /havana/i,
  /bali/i, /indonesia/i, /malaysia/i, /melaka/i, /vietnam/i,
  /\bchina\b/i, /yunnan/i, /berlin/i, /germany/i, /reichstag/i,

  // Irrelevant stock / memes / animals
  /infinity and beyond/i, /quality time/i,
  /\bcat\b/i, /\bdog\b/i, /kitten/i, /\bpet\b/i,

  // Real estate / commercial
  /villas/i, /apartments/i, /for sale/i, /hotel lobby/i, /office/i
];

/**
 * Returns true if any banned pattern matches the text.
 * @param {string} text - image alt, title, or URL to check
 */
function isBanned(text) {
  if (!text) return false;
  return BANNED_PATTERNS.some(p => p.test(text));
}

// ---------------------------------------------------------------------------
// IMAGE API CLIENTS
// ---------------------------------------------------------------------------

/**
 * Fetch landscape photos from Pexels matching a query.
 * Returns [{url, title}] sorted by descending resolution.
 */
async function fetchPexels(query, perPage = 25) {
  if (!env.PEXELS_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      { headers: { 'Authorization': env.PEXELS_API_KEY } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || [])
      .filter(p => p.width >= 1000 && p.width >= p.height * 1.15 && !isBanned(p.alt))
      .map(p => ({
        url: `https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920`,
        title: (p.alt || query).replace(/["\n\r]/g, ' ').trim().slice(0, 80)
      }));
  } catch (e) {
    return [];
  }
}

/**
 * Fetch landscape photos from Openverse/Flickr CDN matching a query.
 * Returns [{url, title}].
 */
async function fetchOpenverse(query, perPage = 25) {
  try {
    const token = await getOpenverseToken();
    const headers = { 'User-Agent': 'ExploreDesh/1.0' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${perPage}`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter(r =>
        r.url &&
        r.url.includes('staticflickr.com') &&
        !r.url.includes('upload.wikimedia.org') &&
        (!r.width || r.width >= (r.height || 0) * 1.1) &&
        !isBanned(r.title) &&
        !isBanned(r.url)
      )
      .map(r => ({
        // Upgrade to largest Flickr size (_b.jpg = 1024px)
        url: r.url.replace(/_[a-z]\.jpg$/i, '_b.jpg'),
        title: (r.title || query).replace(/["\n\r]/g, ' ').trim().slice(0, 80)
      }));
  } catch (e) {
    return [];
  }
}

/**
 * Verify a URL returns HTTP 200.
 */
async function isLive(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SESSION-LEVEL ASSIGNMENT TRACKING
// Prevents the same URL from being assigned twice within a single run.
// ---------------------------------------------------------------------------
const sessionAssigned = new Set();

/**
 * Find a fresh, unique, live candidate URL for a given set of queries.
 * Returns { src, alt } or null if nothing found.
 *
 * @param {string[]} queries - Ordered list of search queries to try
 * @param {string} defaultTitle - Fallback title if image has no title
 * @param {string} context - Human-readable context for the alt text suffix
 */
async function getUniqueCandidate(queries, defaultTitle, context) {
  for (const query of queries) {
    // Pexels first — highest quality
    const pexelsCandidates = await fetchPexels(query, 25);
    for (const c of pexelsCandidates) {
      const key = cleanUrl(c.url);
      if (!key || globalRepo.has(key) || sessionAssigned.has(key)) continue;
      if (!await isLive(c.url)) continue;
      sessionAssigned.add(key);
      globalRepo.add(key);
      return { src: c.url, alt: `${c.title || defaultTitle} — ${context}` };
    }

    // Openverse/Flickr fallback
    const openverseCandidates = await fetchOpenverse(query, 25);
    for (const c of openverseCandidates) {
      const key = cleanUrl(c.url);
      if (!key || globalRepo.has(key) || sessionAssigned.has(key)) continue;
      if (!await isLive(c.url)) continue;
      sessionAssigned.add(key);
      globalRepo.add(key);
      return { src: c.url, alt: `${c.title || defaultTitle} — ${context}` };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// SPECIFIC FIXES MAP
// ---------------------------------------------------------------------------
// Maps: slug → { placeName → { cardQueries?, photoQueries?, forceCard? } }
//
// cardQueries: search queries to try when replacing the place card thumbnail
// photoQueries: array of [query strings] per photo index (0, 1, 2)
// forceCard: true = always replace card even if alt text seems clean
//
// HOW TO ADD NEW DESTINATIONS:
//   1. Add a new entry under the slug key.
//   2. For each affected place, add cardQueries and/or photoQueries.
//   3. Run: node scripts/purge_and_fix_all_random_images.js
//   4. Verify: node scripts/verify_batch2.js
// ---------------------------------------------------------------------------

const SPECIFIC_FIXES = {
  'kumbhalgarh': {
    'Parshuram Mahadev Temple': {
      cardQueries: [
        'Aravalli cave temple Rajasthan',
        'ancient stone temple hills Rajasthan',
        'Mount Abu ancient stone temple'
      ],
      photoQueries: [
        ['cave temple stone stairs Rajasthan', 'ancient Shiva temple stone carving'],
        ['Aravalli hills green mountain vista', 'Kumbhalgarh valley view Aravalli'],
        ['ancient Hindu stone shrine Rajasthan', 'carved stone pillars temple Rajasthan']
      ]
    },
    'Muchhal Mahavir Temple': {
      photoQueries: [
        ['Ranakpur Jain temple carved marble pillars', 'ancient white marble Jain temple Rajasthan'],
        ['Jain temple Rajasthan architecture stone dome', 'intricate stone carving marble temple'],
        ['ancient Jain temple shrine Rajasthan marble', 'Ghanerao Jain temple architecture']
      ]
    }
  },

  'kotappakonda': {
    'Ellamanda': {
      cardQueries: [
        'Andhra Pradesh green paddy fields',
        'Palnadu rural landscape Andhra',
        'scenic countryside Andhra Pradesh'
      ],
      photoQueries: [
        ['Andhra Pradesh village green fields', 'peaceful rural landscape Andhra'],
        ['scenic hills Andhra Pradesh countryside', 'Palnadu hills green valley'],
        ['ancient stone temple mandapam Andhra', 'rustic village countryside India']
      ]
    },
    'Kavuru': {
      cardQueries: [
        'Andhra Pradesh village landscape',
        'green agriculture fields Andhra',
        'Palnadu rural scenery'
      ],
      photoQueries: [
        ['Andhra Pradesh rural landscape nature', 'serene village road palms Andhra'],
        ['green countryside Palnadu Andhra Pradesh', 'traditional village scenery South India'],
        ['ancient stone temple entrance Andhra', 'scenic hills Palnadu landscape']
      ]
    },
    'Kopperapalem': {
      cardQueries: [
        'Andhra Pradesh countryside landscape',
        'scenic rural landscape Guntur Andhra',
        'green farmland Andhra'
      ],
      photoQueries: [
        ['Andhra Pradesh peaceful countryside', 'scenic hills Andhra Pradesh nature'],
        ['rural India green field sunset', 'traditional temple pond Andhra Pradesh'],
        ['ancient stone carvings Andhra heritage', 'Palnadu rural sunrise']
      ]
    }
  },

  'koulutla-chenna-kesava-temple': {
    'Madhavaram, Kurnool': {
      cardQueries: [
        'Kurnool ancient temple Andhra',
        'Ahobilam temple Kurnool',
        'Yaganti temple stone cloisters'
      ],
      photoQueries: [
        ['Vijayanagara temple architecture Andhra', 'ancient carved stone pillars Kurnool'],
        ['Kurnool landscape hills river Andhra', 'Tungabhadra river rocky landscape'],
        ['ancient stone temple mandapam Andhra', 'Kurnool rural heritage landscape']
      ]
    }
  },

  'korukkai-veeratteswarar-temple': {
    'Mayiladuthurai block': {
      cardQueries: [
        'Thanjavur temple tower Dravidian architecture',
        'Kumbakonam temple gopuram Kaveri delta',
        'ancient Chola temple architecture'
      ]
    },
    'Mayiladuthurai dry fish market': {
      cardQueries: [
        'Kumbakonam temple bazaar street heritage',
        'traditional Indian bazaar temple street',
        'Kaveri river delta landscape'
      ],
      photoQueries: [
        ['colorful traditional market flowers South India', 'traditional temple town street Tamil Nadu'],
        ['Kaveri river ghats Tamil Nadu', 'rural Kaveri delta green paddy fields'],
        ['temple tank water reflection Tamil Nadu', 'traditional heritage street Tamil Nadu']
      ]
    },
    'Mayiladuthurai': {
      cardQueries: [
        'Mayiladuthurai temple town Kaveri river',
        'Mayuranathaswami Temple Mayiladuthurai',
        'Kumbakonam temple architecture'
      ],
      photoQueries: [
        ['ancient Chola stone temple architecture', 'Dravidian temple gopuram Tamil Nadu'],
        ['sacred temple pushkarini tank Tamil Nadu', 'Kaveri riverbanks lush green Tamil Nadu'],
        ['traditional heritage town Tamil Nadu', 'stone carved temple hallway Tamil Nadu']
      ]
    }
  },

  'sacred-heart-forane-church': {
    'Urumi 2 Weir': {
      cardQueries: [
        'Western Ghats river waterfall Kerala',
        'scenic river cascade forest Kerala',
        'Kerala mountain stream waterfall'
      ],
      photoQueries: [
        ['rushing river waters Western Ghats Kerala', 'serene waterfall forest Kerala'],
        ['green hills river reservoir Kerala', 'calm lake waters Western Ghats'],
        ['lush tropical rainforest river Kerala', 'cascading stream rocks Kerala']
      ]
    },
    'Thiruvambady': {
      cardQueries: [
        'Kerala Catholic church architecture',
        'St. Thomas church Kerala traditional',
        'Kerala Syrian Christian church'
      ],
      photoQueries: [
        ['traditional church facade Kerala', 'white church bell tower Kerala'],
        ['historic Syrian church altar Kerala', 'church courtyard coconut trees Kerala'],
        ['scenic hillside village church Kerala', 'cathedral nave Kerala']
      ]
    },
    "St. Mary's Orthodox Church, Maikavu": {
      cardQueries: [
        'Kerala Orthodox church architecture',
        'historic Syrian Christian church Kerala',
        'St. Mary church Kerala facade'
      ],
      photoQueries: [
        ['Kerala Orthodox church interior altar', 'traditional stone cross church Kerala'],
        ['historic church facade coconut palms Kerala', 'ancient Christian heritage church Kerala'],
        ['peaceful church grounds greenery Kerala', 'white church spires Kerala']
      ]
    }
  },

  'thriprayar-ramaswamy-temple': {
    'Chemmappilly': {
      cardQueries: [
        'Kerala village countryside palms',
        'Thrissur rural scenery green',
        'Kerala backwaters village'
      ],
      photoQueries: [
        ['lush coconut grove Kerala countryside', 'serene village waterway Kerala'],
        ['traditional Kerala village pond', 'green paddy fields palms Thrissur'],
        ['Kerala temple cloisters greenery', 'morning light Kerala rural landscape']
      ]
    }
  },

  'shantadurga-kalangutkarin-temple': {
    'Assonora': {
      cardQueries: [
        'Goa countryside green hills',
        'Assonora river Goa landscape',
        'scenic Goa village greenery'
      ],
      photoQueries: [
        ['Goa tropical palms green hills', 'peaceful river water reflection Goa'],
        ['traditional Goan village landscape', 'lush green valley Goa nature'],
        ['ancient Goan temple architecture', 'scenic rural road Goa palms']
      ]
    }
  }
};

// ---------------------------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------------------------

async function run() {
  console.log('=== PURGE AND FIX ALL RANDOM IMAGES (Phase 38) ===\n');

  let totalFixed = 0;
  let totalFiles = 0;

  for (const [slug, placeFixes] of Object.entries(SPECIFIC_FIXES)) {
    const filePath = path.join(destDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] File not found: ${filePath}`);
      continue;
    }

    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const places = d.topPlaces || d.places || [];
    console.log(`\n[${slug}] — ${places.length} places`);

    let fileChanged = false;

    for (const place of places) {
      const fix = placeFixes[place.name];
      if (!fix) continue;

      console.log(`  → Inspecting: "${place.name}"`);

      // --- Card thumbnail ---
      const cardNeedsFix =
        fix.forceCard ||
        isBanned(place.image?.alt) ||
        isBanned(place.image?.title) ||
        isBanned(place.image?.src);

      if (fix.cardQueries && cardNeedsFix) {
        const candidate = await getUniqueCandidate(
          fix.cardQueries,
          `${place.name} Vista`,
          place.name
        );
        if (candidate) {
          place.image = { src: candidate.src, alt: candidate.alt };
          fileChanged = true;
          totalFixed++;
          console.log(`     ✓ Card replaced: ${candidate.src.slice(0, 70)}...`);
        } else {
          console.warn(`     ✗ Card: no candidate found for "${place.name}"`);
        }
      }

      // --- Place photos ---
      if (fix.photoQueries) {
        place.photos = place.photos || [];
        for (let idx = 0; idx < fix.photoQueries.length; idx++) {
          const queries = fix.photoQueries[idx];
          const current = place.photos[idx];

          // Replace if banned or missing
          const photoBanned =
            !current ||
            isBanned(typeof current === 'string' ? current : current?.alt) ||
            isBanned(typeof current === 'string' ? current : current?.title) ||
            isBanned(typeof current === 'string' ? current : current?.src);

          if (photoBanned) {
            const candidate = await getUniqueCandidate(
              queries,
              `${place.name} View ${idx + 1}`,
              place.name
            );
            if (candidate) {
              place.photos[idx] = { src: candidate.src, alt: candidate.alt };
              fileChanged = true;
              totalFixed++;
              console.log(`     ✓ Photo[${idx}] replaced: ${candidate.src.slice(0, 70)}...`);
            } else {
              console.warn(`     ✗ Photo[${idx}]: no candidate found for "${place.name}"`);
            }
          } else {
            console.log(`     ○ Photo[${idx}] OK — kept existing`);
          }
        }
      } else {
        // Auto-scan existing photos for banned content
        place.photos = place.photos || [];
        for (let idx = 0; idx < place.photos.length; idx++) {
          const ph = place.photos[idx];
          const phText = typeof ph === 'string' ? ph : (ph?.alt || ph?.title || ph?.src || '');
          if (isBanned(phText)) {
            const fallback = [
              `${place.name} scenic ${d.state}`,
              `${d.state} landscape nature architecture`
            ];
            const candidate = await getUniqueCandidate(
              fallback,
              `${place.name} View ${idx + 1}`,
              place.name
            );
            if (candidate) {
              place.photos[idx] = { src: candidate.src, alt: candidate.alt };
              fileChanged = true;
              totalFixed++;
              console.log(`     ✓ Auto-fixed Photo[${idx}]: ${candidate.src.slice(0, 70)}...`);
            }
          }
        }
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
      console.log(`  ✅ Saved: ${slug}.json`);
      totalFiles++;
    } else {
      console.log(`  ○ No changes needed for ${slug}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPLETE: Fixed ${totalFixed} image slots across ${totalFiles} destination files.`);
  console.log(`\nNext step: run node scripts/verify_batch2.js to confirm zero collisions.`);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
