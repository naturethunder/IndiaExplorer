/**
 * validate-filters.js — cross-validation for the search/filter system.
 *
 * Enforces the audit spec's hard rule: every filter OPTION must return ≥1
 * destination (no empty/broken filters), and state-name search must resolve
 * to the correct listing. Pure Node stdlib; loads the browser taxonomy via vm
 * so the validator and the site share one source of truth.
 *
 *   node scripts/validate-filters.js     # exits non-zero on any failure
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/destinations/index.json'), 'utf8'));
const D = idx.destinations;
const STATES = idx.meta.states;

// Load the ES-module taxonomy by stripping `export ` and running it in a sandbox.
const tSrc = fs.readFileSync(path.join(ROOT, 'js/data/taxonomy.js'), 'utf8').replace(/export\s+/g, '');
const tax = {};
vm.runInNewContext(tSrc + '\n;Object.assign(__x,{STATE_ZONE,ZONES,SEASON_MONTHS,SEASONS,zoneOf,seasonsOf,resolveState});', { __x: tax });

let fails = 0;
function check(label, ok, detail) {
  if (!ok) { fails++; console.log('  ✗ ' + label + (detail ? ' — ' + detail : '')); }
}

// ── Every filter option returns ≥1 destination ────────────────────────
console.log('Filter options (must each yield ≥1 destination):');
idx.meta.types.forEach(function (t) {
  check('type=' + t.id, D.some(function (d) { return d.type === t.id; }));
});
Object.keys(idx.meta.priceTiers).forEach(function (tier) {
  check('tier=' + tier, D.some(function (d) { return (d.tiers || []).indexOf(tier) >= 0; }));
});
STATES.forEach(function (s) {
  check('state=' + s, D.some(function (d) { return d.state === s; }));
});
idx.meta.months.forEach(function (m) {
  check('month=' + m.name, D.some(function (d) { return d.bestTime.months.indexOf(m.num) >= 0; }));
});
tax.ZONES.forEach(function (z) {
  check('region=' + z, D.some(function (d) { return tax.zoneOf(d.state) === z; }));
});
tax.SEASONS.forEach(function (s) {
  check('season=' + s, D.some(function (d) { return tax.seasonsOf(d.bestTime.months).indexOf(s) >= 0; }));
});

// ── Every state maps to a known zone (no destination falls out of Region) ─
console.log('State → zone coverage:');
STATES.forEach(function (s) {
  check('zone(' + s + ')', !!tax.zoneOf(s), 'unmapped state — add it to STATE_ZONE');
});

// ── State-name search resolves correctly (spec headline) ──────────────
console.log('State-name search routing:');
[
  ['Goa', 'Goa'], ['goa', 'Goa'], ['  GOA ', 'Goa'],
  ['Uttarakhand', 'Uttarakhand'], ['uttrakhand', 'Uttarakhand'], ['uttaranchal', 'Uttarakhand'],
  ['Rajasthan', 'Rajasthan'], ['kerala', 'Kerala'], ['kashmir', 'Jammu & Kashmir'],
  ['pondicherry', 'Puducherry'], ['orissa', 'Odisha'], ['tamilnadu', 'Tamil Nadu'],
].forEach(function (pair) {
  const got = tax.resolveState(pair[0], STATES);
  check('resolveState("' + pair[0] + '")', got === pair[1], 'got ' + got + ', want ' + pair[1]);
});
// Must NOT mis-resolve a real destination name to a state.
[['manali'], ['munnar'], ['hampi']].forEach(function (p) {
  const got = tax.resolveState(p[0], STATES);
  check('resolveState("' + p[0] + '") is not a state', got === null, 'got ' + got);
});

console.log('\n' + (fails ? '❌ ' + fails + ' failure(s)' : '✅ all filter/search checks passed') +
  ' · ' + D.length + ' destinations · ' + STATES.length + ' states');
process.exit(fails ? 1 : 0);
