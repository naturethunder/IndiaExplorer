const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');

const topDestinations = [
  'munnar', 'manali', 'goa', 'jaipur', 'udaipur', 'varanasi', 'agra', 'delhi',
  'ooty', 'shimla', 'rishikesh', 'darjeeling', 'coorg', 'jaisalmer', 'kaziranga',
  'wayanad', 'varkala', 'hampi', 'gokarna', 'leh', 'ladakh', 'alappuzha', 'alleppey',
  'kodaikanal', 'pondicherry', 'puducherry', 'mahabaleshwar', 'mount-abu',
  'chikmagalur', 'havelock-island', 'amritsar', 'khajuraho', 'pushkar',
  'ranthambore-national-park', 'jim-corbett-national-park', 'nainital', 'mussoorie',
  'gangtok', 'shillong', 'cherrapunji'
];

const results = [];

for (const slug of topDestinations) {
  const file = slug + '.json';
  if (!fs.existsSync(path.join(DIR, file))) {
    results.push({ slug, status: 'FILE_NOT_FOUND' });
    continue;
  }
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const hotels = d.hotels || [];
  const names = hotels.map(h => `${h.name} (${h.priceMin}-${h.priceMax})`);
  const isSynthetic = hotels.some(h => /^OYO\s.+Stay$/i.test(h.name) || /^(Marriott|Fortune Park|Sterling|Radisson)\s.+$/i.test(h.name));
  
  results.push({
    slug,
    title: d.title,
    count: hotels.length,
    isSynthetic,
    sample: names.slice(0, 4)
  });
}

console.log(JSON.stringify(results, null, 2));
