/**
 * scripts/find_all_semantic_issues.js
 */

'use strict';
const fs = require('fs');
const path = require('path');

const TARGET_SLUGS = [
  'chowmahalla-palace',
  'devanahalli-fort',
  'tiruvirkudi-veerataneswarar-temple',
  'sreenarayanapuram-temple',
  'holy-trinity-cathedral-palayamkottai',
  'nallur-sundara-varadharaja-perumal-temple',
  'ramrekha-mandir',
  'tiruppukkozhiyur',
  'nanjarayan-tank-bird-sanctuary',
  'lansdowne',
  'chopta',
  'munsiyari',
  'mussoorie',
  'ranikhet'
];

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');

const FOREIGN_PATTERNS = [
  /\bitaly\b/i, /\bagrigento\b/i, /\bengland\b/i, /\bbritain\b/i, /\buk\b/i,
  /\bbrazil\b/i, /\bbrasilia\b/i, /\bpara[ií]ba\b/i, /\bviamao\b/i, /\bpernambuco\b/i,
  /\bcroatia\b/i, /\bhercegovac\b/i, /\bscotland\b/i, /\bedinburgh\b/i,
  /\bnigeria\b/i, /\btaraba\b/i, /\bmambilla\b/i, /\bngel nyaki\b/i,
  /\bturkey\b/i, /\bistanbul\b/i, /\brussia\b/i, /\bderbent\b/i,
  /\bthailand\b/i, /\bsukhothai\b/i, /\bgeorgia\b/i, /\btbilisi\b/i,
  /\bmorocco\b/i, /\bmarrakesh\b/i, /\baustria\b/i, /\bswiss\b/i, /\balps\b/i,
  /\bcalifornia\b/i, /\bnicasio\b/i, /\bnepal\b/i, /\bgloucester\b/i,
  /\btrophime\b/i, /\bst\. paul's cathedral\b/i,
];

const PEOPLE_PATTERNS = [
  /\bsmiling man\b/i, /\bman with arms\b/i, /\bman seated\b/i,
  /\btwo brothers\b/i, /\bcouple walking\b/i, /\bpeople walking\b/i,
  /\bman sells\b/i, /\bman enjoys\b/i, /\bhiker enjoys\b/i,
  /\bgroup of hikers\b/i, /\bgroup of trekkers\b/i, /\bgroup trekking\b/i,
  /\bpassengers\b/i, /\bwoman\b/i, /\bgirl\b/i, /\bboy\b/i, /\bperson\b/i,
  /\bportrait\b/i, /\bselfie\b/i,
];

const VEHICLE_PATTERNS = [
  /\bold car\b/i, /\bmotorcycle\b/i, /\broyal enfield\b/i, /\bbicycle\b/i, /\bbus\b/i, /\btrain\b/i,
];

const MISMATCH_PATTERNS = [
  /\bkolkata metro\b/i, /\bapartment building\b/i,
];

const flaggedIssues = [];

for (const slug of TARGET_SLUGS) {
  const fp = path.join(destDir, `${slug}.json`);
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));

  function check(field, title, url) {
    const text = (title || '') + ' ' + (url || '');
    for (const r of FOREIGN_PATTERNS) {
      if (r.test(text)) {
        flaggedIssues.push({ slug, title: d.title, field, reason: 'FOREIGN_LOCATION', match: text.match(r)[0], text: title.slice(0, 70), url });
        return;
      }
    }
    for (const r of PEOPLE_PATTERNS) {
      if (r.test(text)) {
        flaggedIssues.push({ slug, title: d.title, field, reason: 'PEOPLE_PORTRAIT', match: text.match(r)[0], text: title.slice(0, 70), url });
        return;
      }
    }
    for (const r of VEHICLE_PATTERNS) {
      if (r.test(text)) {
        flaggedIssues.push({ slug, title: d.title, field, reason: 'VEHICLE', match: text.match(r)[0], text: title.slice(0, 70), url });
        return;
      }
    }
    for (const r of MISMATCH_PATTERNS) {
      if (r.test(text)) {
        flaggedIssues.push({ slug, title: d.title, field, reason: 'MISMATCHED_SUBJECT', match: text.match(r)[0], text: title.slice(0, 70), url });
        return;
      }
    }
  }

  // Hero
  check('heroImage', d.heroImage?.alt, d.heroImage?.src);
  // Gallery
  (d.gallery || []).forEach((g, i) => check(`gallery[${i}]`, g.title || g.alt, g.src));
  // Places
  (d.topPlaces || []).forEach((p, pi) => {
    check(`place[${pi}].image (${p.name})`, p.image?.alt, p.image?.src);
    (p.photos || []).forEach((ph, phi) => {
      const u = typeof ph === 'string' ? ph : ph?.src;
      const t = typeof ph === 'string' ? '' : (ph?.alt || ph?.title || '');
      check(`place[${pi}].photo[${phi}] (${p.name})`, t, u);
    });
  });
}

console.log(`TOTAL FLAGGED SEMANTIC ISSUES: ${flaggedIssues.length}\n`);
const bySlug = {};
for (const iss of flaggedIssues) {
  bySlug[iss.slug] = bySlug[iss.slug] || [];
  bySlug[iss.slug].push(iss);
}

for (const [slug, list] of Object.entries(bySlug)) {
  console.log(`=== ${slug} (${list.length} issues) ===`);
  list.forEach(item => {
    console.log(`  - [${item.reason}] ${item.field}: "${item.text}" (matched: ${item.match})`);
  });
  console.log('');
}
