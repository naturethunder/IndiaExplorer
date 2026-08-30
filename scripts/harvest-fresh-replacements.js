/**
 * harvest-fresh-replacements.js
 * 
 * Harvests 500+ brand new HD images from Wikimedia Commons for Indian monuments,
 * temples, forts, waterfalls, hills, wildlife, and scenery.
 * Filters out all defects (diagrams, portraits, coins, maps, flags, SVGs).
 * Ensures zero collision with all current repository URLs.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');

// 1. Gather all currently used URLs
const CURRENT_URLS = new Set();
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

files.forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
    const collect = (obj) => {
      if (!obj) return;
      if (typeof obj === 'string' && obj.startsWith('http')) {
        CURRENT_URLS.add(obj.split('?')[0].toLowerCase());
      } else if (Array.isArray(obj)) {
        obj.forEach(collect);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(collect);
      }
    };
    collect(d);
  } catch (e) {}
});

console.log(`Current repository has ${CURRENT_URLS.size} unique URLs in use.`);

// Search queries designed for authentic Indian scenery and monuments
const queries = [
  'ancient temple architecture India',
  'ancient rock cut caves India',
  'historical forts in Maharashtra',
  'hill station landscape Uttarakhand',
  'tea gardens Western Ghats Kerala',
  'Himalayan valley Himachal Pradesh',
  'heritage palace Rajasthan architecture',
  'scenic waterfalls of Karnataka',
  'beaches of Goa scenic landscape',
  'nature reserve wildlife sanctuary India',
  'Ganges ghats Varanasi sunset',
  'Dravidian temple gopuram Tamil Nadu',
  'Kashmir valley landscape scenery',
  'Sikkim mountain pass nature view',
  'Meghalaya living root bridge waterfalls',
  'Assam tea estate landscape Brahmaputra',
  'Odisha ancient temple carvings',
  'Madhya Pradesh heritage monument Khajuraho',
  'Gujarat stepwell architecture Patan',
  'historical monuments in Delhi heritage',
  'nature landscape Western Ghats monsoon',
  'ancient stone temples Karnataka Hoysala',
  'scenic lakes of Ladakh landscape',
  'tiger reserve forest Madhya Pradesh scenery',
  'Coorg coffee plantation green hills',
  'Munnar tea plantations misty hills',
  'Ooty Nilgiri hills landscape nature'
];

function httpGetJson(url) {
  return new Promise(resolve => {
    https.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'ExploreDeshHarvester/2.0 (travel explore project; admin@exploredesh.org)'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
  });
}

const BAD_TITLE_REGEX = /(stamp|coin|banknote|map|flag|diagram|chart|census|icon|portrait|selfie|headshot|logo|seal|coat_of_arms|schematic|graph|table|infographic|\.svg|\.pdf|\.ogg|\.webm|\.mp4|\.wav)/i;

async function harvestImages() {
  console.log(`Searching Wikimedia Commons for fresh imagery across ${queries.length} curated categories...\n`);
  
  const harvested = [];
  const seenHarvested = new Set();

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    process.stdout.write(`[${i + 1}/${queries.length}] Searching: "${q}"... `);

    try {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('filetype:bitmap ' + q)}&srnamespace=6&srlimit=40&format=json`;
      const sRes = await httpGetJson(searchUrl);
      if (!sRes?.query?.search?.length) {
        console.log('0 found');
        continue;
      }

      const titles = sRes.query.search
        .map(x => x.title)
        .filter(t => !BAD_TITLE_REGEX.test(t));

      if (titles.length === 0) {
        console.log('filtered out');
        continue;
      }

      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles.map(t => encodeURIComponent(t)).join('|')}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json`;
      const iRes = await httpGetJson(infoUrl);

      let countFromQuery = 0;
      if (iRes?.query?.pages) {
        Object.values(iRes.query.pages).forEach(p => {
          const ii = p.imageinfo?.[0];
          const url = (ii?.url || '').split('?')[0];
          const width = ii?.width || 0;
          const clean = url.toLowerCase();

          if (url && /\.(jpe?g|png)$/i.test(url) && width >= 800) {
            if (!BAD_TITLE_REGEX.test(url) && !CURRENT_URLS.has(clean) && !seenHarvested.has(clean)) {
              seenHarvested.add(clean);
              const desc = (ii?.extmetadata?.ImageDescription?.value || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
              const title = p.title.replace(/^File:/i, '').replace(/\.(jpe?g|png)$/i, '').replace(/_/g, ' ');
              harvested.push({
                src: url + '?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
                alt: desc || title || q
              });
              countFromQuery++;
            }
          }
        });
      }
      console.log(`+${countFromQuery} new HD images (Total: ${harvested.length})`);
    } catch (err) {
      console.log('Error:', err.message);
    }

    // Brief delay to be polite to Wikimedia API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Successfully harvested ${harvested.length} fresh, unique, HD images.`);
  fs.writeFileSync(path.join(ROOT, 'scripts', 'fresh_replacements_pool.json'), JSON.stringify(harvested, null, 2), 'utf8');
}

harvestImages();
