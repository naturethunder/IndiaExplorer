/**
 * scripts/find_zero_collision_photo.js
 * Searches Pexels / Unsplash / Wikimedia and verifies zero collision across all 2,396 destinations.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'home-manifest.json');

// Build the global URL repository index
const globalUrls = new Set();
files.forEach(f => {
  const content = fs.readFileSync(path.join(DEST_DIR, f), 'utf8');
  const urls = content.match(/https?:\/\/[^"'\s,]+/g) || [];
  urls.forEach(u => {
    const clean = u.split('?')[0];
    globalUrls.add(clean);
  });
});

console.log(`Indexed ${globalUrls.size} unique photo base URLs across ${files.length} destinations.`);

const pexelsKey = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const unsplashKey = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

async function searchPexels(query) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15`,
      headers: { 'Authorization': pexelsKey }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const candidates = (json.photos || []).filter(p => {
            const clean = p.src.original.split('?')[0];
            const cleanLarge = p.src.large2x.split('?')[0];
            const hasCollision = globalUrls.has(clean) || globalUrls.has(cleanLarge);
            const isLandscape = p.width > p.height;
            // Filter out people keywords
            const alt = (p.alt || '').toLowerCase();
            const hasPerson = /person|woman|man|girl|boy|portrait|model|selfie|crowd|face|people/i.test(alt);
            return !hasCollision && isLandscape && !hasPerson;
          });
          resolve(candidates);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function searchUnsplash(query) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.unsplash.com',
      path: `/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=15`,
      headers: { 'Authorization': `Client-ID ${unsplashKey}` }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const candidates = (json.results || []).filter(p => {
            const clean = p.urls.raw.split('?')[0];
            const hasCollision = globalUrls.has(clean);
            const isLandscape = p.width > p.height;
            const desc = `${p.description || ''} ${p.alt_description || ''}`.toLowerCase();
            const hasPerson = /person|woman|man|girl|boy|portrait|model|selfie|crowd|face|people/i.test(desc);
            return !hasCollision && isLandscape && !hasPerson;
          });
          resolve(candidates);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

module.exports = { searchPexels, searchUnsplash, globalUrls };

if (require.main === module) {
  const query = process.argv[2] || 'Rishikesh Ganga';
  (async () => {
    console.log(`\nSearching zero-collision photos for: "${query}"...`);
    const pexels = await searchPexels(query);
    console.log(`Found ${pexels.length} clean Pexels candidates:`);
    pexels.forEach(p => {
      console.log(`  - Pexels [${p.id}]: ${p.src.original}?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`);
      console.log(`    Alt: "${p.alt}" (${p.width}x${p.height})`);
    });

    const unsplash = await searchUnsplash(query);
    console.log(`Found ${unsplash.length} clean Unsplash candidates:`);
    unsplash.forEach(u => {
      console.log(`  - Unsplash [${u.id}]: ${u.urls.raw}&auto=format&fit=crop&w=1920&q=85`);
      console.log(`    Desc: "${u.alt_description || u.description}" (${u.width}x${u.height})`);
    });
  })();
}
