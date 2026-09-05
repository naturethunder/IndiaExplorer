const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');

const majorCities = [
  'amritsar', 'agra', 'varanasi', 'pune', 'bengaluru', 'bangalore', 'chennai',
  'mumbai', 'kolkata', 'kochi', 'cochin', 'thanjavur', 'madurai', 'tirupati',
  'ujjain', 'puri', 'dwarka', 'somnath', 'bhubaneswar', 'lucknow', 'ahmedabad',
  'chandigarh', 'mysore', 'mysuru', 'coimbatore', 'mangalore', 'kanpur', 'nagpur',
  'patna', 'indore', 'bhopal', 'vadodara', 'surat', 'rajkot', 'gwalior', 'jabalpur'
];

const found = [];
const missing = [];

for (const c of majorCities) {
  if (fs.existsSync(path.join(DIR, `${c}.json`))) {
    found.push(c);
  } else {
    missing.push(c);
  }
}

console.log('Found major city destinations:', found);
console.log('Missing major city destinations:', missing);
