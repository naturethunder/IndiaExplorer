const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

function extractCleanLocation(dest) {
  let title = (dest.title || '').trim();
  
  if (title.includes(',')) {
    const parts = title.split(',').map(s => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last.length <= 25 && !/temple|fort|falls|sanctuary|park|church|lake/i.test(last)) {
      return last;
    }
  }

  let clean = title
    .replace(/\b(temple|mandir|kovil|devasthanam|deula|shrine|matha|mutt|ashram|cathedral|church|mosque|dargah|gurdwara)\b/gi, '')
    .replace(/\b(wildlife sanctuary|bird sanctuary|national park|sanctuary|tiger reserve|zoo|safari|forest reserve)\b/gi, '')
    .replace(/\b(waterfalls?|falls|water fall|cascade)\b/gi, '')
    .replace(/\b(fort|palace|mahal|haveli|monument|caves?|ruins?|gate|tomb|stepwell)\b/gi, '')
    .replace(/\b(beach|lake|dam|reservoir|river|island|valley|hills?|peak|viewpoint)\b/gi, '')
    .replace(/[,()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length >= 3 && clean.length <= 25) {
    return clean;
  }

  // If longer than 25 chars, take the first word or first 2 words
  const words = clean.split(' ').filter(Boolean);
  if (words.length > 0) {
    if (words.length >= 2 && (words[0] + ' ' + words[1]).length <= 25) {
      return words[0] + ' ' + words[1];
    }
    if (words[0].length >= 3) {
      return words[0];
    }
  }

  return dest.region || dest.state || 'Local';
}

const testTitles = [
  "Tiruppaatrurai Adhimooleswarar Temple",
  "Tirukkollikkadu Agneeswarar Temple",
  "Therazhundur Vedapureeswarar Temple",
  "Abaya Hastha Swayambu Sri Lakshmi Narasimha Swamy Temple, Agaram Village, Hosur",
  "Sri Varadharaja Perumal Kovil",
  "Gangaikondan Spotted Deer Sanctuary",
  "Kiliyur Falls",
  "Padmanabhapuram Palace"
];

for (const t of testTitles) {
  console.log(`"${t}" -> "${extractCleanLocation({ title: t, state: 'Tamil Nadu' })}"`);
}
