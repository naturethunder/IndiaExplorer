const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

// Categorize all destinations by type and popularity
const typeCounts = {};
let syntheticCount = 0;
const majorTourists = [];

const famousKeywords = [
  'shimla', 'manali', 'nainital', 'mussoorie', 'rishikesh', 'haridwar',
  'alleppey', 'alappuzha', 'wayanad', 'munnar', 'varkala', 'kovalam',
  'gokarna', 'coorg', 'hampi', 'mysore', 'chikmagalur', 'ooty', 'kodaikanal',
  'pondicherry', 'puducherry', 'mahabaleshwar', 'lonavala', 'panchgani',
  'mount-abu', 'pushkar', 'jaisalmer', 'udaipur', 'jaipur', 'jodhpur',
  'khajuraho', 'varanasi', 'darjeeling', 'gangtok', 'shillong', 'cherrapunji',
  'kaziranga', 'andaman', 'havelock', 'dharamshala', 'dalhousie', 'spiti'
];

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const t = d.type || 'other';
  typeCounts[t] = (typeCounts[t] || 0) + 1;

  const hotels = d.hotels || [];
  const isSynthetic = hotels.some(h => /^OYO\s.+Stay$/i.test(h.name) || /^(Marriott|Fortune Park|Sterling|Radisson)\s.+$/i.test(h.name));
  if (isSynthetic) syntheticCount++;

  const slug = d.slug || f.replace('.json', '');
  if (famousKeywords.some(kw => slug.includes(kw))) {
    majorTourists.push({
      slug,
      title: d.title,
      state: d.state,
      isSynthetic,
      hotelCount: hotels.length
    });
  }
}

console.log(`Total destination files: ${files.length}`);
console.log(`Synthetic files: ${syntheticCount}`);
console.log('Types distribution:', JSON.stringify(typeCounts, null, 2));
console.log(`Famous tourist destinations identified: ${majorTourists.length}`);
console.log('Sample famous destinations needing real hotel curation:');
console.log(majorTourists.filter(m => m.isSynthetic).slice(0, 20));
