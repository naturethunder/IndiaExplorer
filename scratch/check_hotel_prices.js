const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

console.log(`Total destination files: ${files.length}`);

let withHotels = 0;
let tried = 0;
let suspiciousHighPriceLodge = [];
let priceTierMismatches = [];
let allHotelsCount = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  if (data.hotelSourceTried) tried++;
  if (!Array.isArray(data.hotels) || data.hotels.length === 0) continue;
  withHotels++;

  for (const h of data.hotels) {
    allHotelsCount++;
    const nameLower = (h.name || '').toLowerCase();
    const isLodgeDormHostel = /lodge|dhaba|dormitory|dorm|homestay|cottage|ashram|yatri|bhavan|bhawan|pg\b|camp\b/i.test(h.name || '');
    const isResortPalace = /resort|palace|taj|oberoi|marriott|leela|hyatt|radisson|hilton|itc|novotel|jw\b/i.test(h.name || '');

    // Check if a lodge/dorm/ashram is priced at luxury rates (> ₹5000/night)
    if (isLodgeDormHostel && !/jungle\s*lodges|safari\s*lodge|river\s*lodge|wilderness\s*lodge|ecolodge/i.test(h.name || '') && h.priceMin >= 5000) {
      suspiciousHighPriceLodge.push({
        file,
        name: h.name,
        tier: h.tier,
        priceMin: h.priceMin,
        priceMax: h.priceMax
      });
    }

    // Check if luxury/palace/5-star is priced at < ₹1500/night
    if (isResortPalace && h.priceMax <= 1500) {
      priceTierMismatches.push({
        file,
        name: h.name,
        tier: h.tier,
        priceMin: h.priceMin,
        priceMax: h.priceMax
      });
    }

    // Check if priceMin > priceMax
    if (h.priceMin > h.priceMax) {
      console.log(`Inverted price: ${file} - ${h.name} (${h.priceMin} > ${h.priceMax})`);
    }
  }
}

console.log(`Files with hotels: ${withHotels}`);
console.log(`Files with hotelSourceTried: ${tried}`);
console.log(`Total hotels: ${allHotelsCount}`);
console.log(`Suspicious high price lodges (>5k): ${suspiciousHighPriceLodge.length}`);
console.log(`Suspicious low price luxury (<1.5k): ${priceTierMismatches.length}`);

console.log('\n--- Sample Suspicious High Price Lodges ---');
console.log(suspiciousHighPriceLodge.slice(0, 15));

console.log('\n--- Sample Suspicious Low Price Luxury ---');
console.log(priceTierMismatches.slice(0, 15));
