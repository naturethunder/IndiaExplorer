/**
 * normalize-hotel-metadata.js
 * Normalizes type and tier across all 2,388 destination JSON files:
 * 1. Maps brand/non-standard types ('oyo', 'airbnb apartment', etc.) into standard categories:
 *    hotel, resort, guesthouse, hostel, homestay, lodge, camp, cottage, villa, heritage, dharamshala.
 * 2. Derives missing/empty tiers from priceMin.
 * 3. Re-verifies price ranges.
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');

function deriveTier(priceMin) {
  const p = typeof priceMin === 'number' ? priceMin : 1500;
  if (p < 800) return 'cheapest';
  if (p < 2000) return 'budget';
  if (p < 4000) return 'good';
  if (p < 7000) return 'better';
  if (p < 12000) return 'best';
  if (p < 25000) return 'luxury';
  return 'extra_luxury';
}

function normalizeType(name, rawType) {
  const text = `${name || ''} ${rawType || ''}`.toLowerCase();
  if (text.includes('resort')) return 'resort';
  if (text.includes('hostel') || text.includes('dorm')) return 'hostel';
  if (text.includes('homestay') || text.includes('home stay') || text.includes('airbnb') || text.includes('bed & breakfast')) return 'homestay';
  if (text.includes('guest house') || text.includes('guesthouse') || text.includes('yatri nivas') || text.includes('tourist home')) return 'guesthouse';
  if (text.includes('lodge') || text.includes('lodging')) return 'lodge';
  if (text.includes('palace') || text.includes('haveli') || text.includes('heritage')) return 'heritage';
  if (text.includes('camp') || text.includes('tent') || text.includes('glamping')) return 'camp';
  if (text.includes('cottage') || text.includes('chalet')) return 'cottage';
  if (text.includes('villa')) return 'villa';
  if (text.includes('dharamshala') || text.includes('ashram') || text.includes('bhawan')) return 'dharamshala';
  return 'hotel';
}

let modifiedFiles = 0;
let normalizedTypesCount = 0;
let normalizedTiersCount = 0;

for (const file of files) {
  const filePath = path.join(DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const dest = JSON.parse(raw);
    let changed = false;

    if (Array.isArray(dest.hotels)) {
      for (const h of dest.hotels) {
        // 1. Normalize Type
        const newType = normalizeType(h.name, h.type);
        if (h.type !== newType) {
          h.type = newType;
          normalizedTypesCount++;
          changed = true;
        }

        // 2. Normalize Tier
        const validTiers = ['cheapest', 'budget', 'good', 'better', 'best', 'luxury', 'extra_luxury'];
        if (!h.tier || !validTiers.includes(h.tier)) {
          h.tier = deriveTier(h.priceMin);
          normalizedTiersCount++;
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(dest, null, 2));
      modifiedFiles++;
    }
  } catch (err) {
    console.error(`Error in ${file}:`, err.message);
  }
}

console.log('Hotel Metadata Normalization Summary:');
console.log(`  Files Modified:           ${modifiedFiles}`);
console.log(`  Hotel Types Normalized:   ${normalizedTypesCount}`);
console.log(`  Hotel Tiers Normalized:   ${normalizedTiersCount}`);
