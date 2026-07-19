/**
 * taxonomy.js — canonical, derived filter taxonomy for the whole site.
 *
 * IMPORTANT: this file stores **no new destination content**. It is a set of
 * pure lookups/derivations over fields that already exist on every manifest
 * summary (`state`, `bestTime.months`). Region-zone and season are *computed*
 * from those — never hand-authored per destination — so there is exactly one
 * source of truth (this file) and nothing to keep in sync in the data layer.
 *
 * Consumed by js/pages/home.js (state-name search routing) and
 * js/pages/explore.js (Region + Season filters). Also loaded by
 * scripts/validate-filters.js (via vm) so the browser and the validator
 * agree by construction.
 */

// ── Macro travel-zone per state/UT (spec "Region" filter) ──────────────
// Single-select canonical zone. Tourism convention (not the zonal-council
// legal split): Rajasthan → North India (Golden-Triangle mental model).
export const STATE_ZONE = {
  'Andaman & Nicobar': 'South India',
  'Andhra Pradesh': 'South India',
  'Arunachal Pradesh': 'North East India',
  'Assam': 'North East India',
  'Bihar': 'East India',
  'Chandigarh': 'North India',
  'Chhattisgarh': 'Central India',
  'Daman & Diu': 'West India',
  'Delhi': 'North India',
  'Goa': 'West India',
  'Gujarat': 'West India',
  'Haryana': 'North India',
  'Himachal Pradesh': 'North India',
  'Jammu & Kashmir': 'North India',
  'Jharkhand': 'East India',
  'Karnataka': 'South India',
  'Kerala': 'South India',
  'Ladakh (UT)': 'North India',
  'Madhya Pradesh': 'Central India',
  'Maharashtra': 'West India',
  'Manipur': 'North East India',
  'Meghalaya': 'North East India',
  'Mizoram': 'North East India',
  'Nagaland': 'North East India',
  'Odisha': 'East India',
  'Puducherry': 'South India',
  'Punjab': 'North India',
  'Rajasthan': 'North India',
  'Sikkim': 'North East India',
  'Tamil Nadu': 'South India',
  'Telangana': 'South India',
  'Tripura': 'North East India',
  'Uttar Pradesh': 'North India',
  'Uttarakhand': 'North India',
  'West Bengal': 'East India',
};

// Display order for the Region filter (only zones that actually occur).
export const ZONES = ['North India', 'South India', 'East India', 'West India', 'Central India', 'North East India'];

// ── Season → month numbers (spec "Season" filter) ──────────────────────
export const SEASON_MONTHS = { Summer: [4, 5, 6], Monsoon: [7, 8, 9], Winter: [12, 1, 2] };
export const SEASONS = ['Summer', 'Monsoon', 'Winter'];

// ── Curated "best destination" per month ───────────────────────────────
// Hand-picked on India's real travel calendar (verified in-season + real
// slugs), so monthly highlights are deliberate marquee picks, not whichever
// obscure place sorts highest by rating. Used by finder.js (bestThisMonth)
// and home.js ("Best this month" section).
export const MONTH_PICKS = {
  1: 'rann-of-kutch', 2: 'goa', 3: 'hampi', 4: 'darjeeling',
  5: 'manali', 6: 'ladakh', 7: 'coorg', 8: 'srinagar',
  9: 'tawang', 10: 'udaipur', 11: 'ranthambore', 12: 'alleppey',
};

export function zoneOf(state) { return STATE_ZONE[state] || null; }

// Season labels a destination is good in, from its best-travel months.
export function seasonsOf(months) {
  const ms = months || [];
  return SEASONS.filter(function (s) {
    return SEASON_MONTHS[s].some(function (m) { return ms.indexOf(m) >= 0; });
  });
}

// ── State-name resolver (typo-tolerant) ────────────────────────────────
// Common colloquial spellings/abbreviations → canonical state label.
export const STATE_ALIASES = {
  'kashmir': 'Jammu & Kashmir', 'j&k': 'Jammu & Kashmir', 'jnk': 'Jammu & Kashmir', 'jk': 'Jammu & Kashmir',
  'ladakh': 'Ladakh (UT)', 'leh': 'Ladakh (UT)',
  'pondicherry': 'Puducherry', 'pondy': 'Puducherry',
  'andaman': 'Andaman & Nicobar', 'andamans': 'Andaman & Nicobar', 'nicobar': 'Andaman & Nicobar',
  'orissa': 'Odisha', 'uttaranchal': 'Uttarakhand', 'uttranchal': 'Uttarakhand',
  'up': 'Uttar Pradesh', 'mp': 'Madhya Pradesh', 'hp': 'Himachal Pradesh',
  'tn': 'Tamil Nadu', 'wb': 'West Bengal', 'ap': 'Andhra Pradesh',
  'ncr': 'Delhi', 'new delhi': 'Delhi',
};

// Normalise for comparison: lowercase, drop "(ut)"/punctuation, collapse spaces.
function norm(s) {
  return String(s || '').toLowerCase().replace(/\(ut\)/g, '').replace(/[^a-z& ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Classic Levenshtein edit distance (small strings — fine at this scale).
function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Resolve free text to a canonical state/UT name, or null.
 * Order: exact → alias → whole-string fuzzy (typo tolerant). Case/space
 * insensitive. `states` is the authoritative list from the manifest meta.
 */
export function resolveState(query, states) {
  const q = norm(query);
  if (!q) return null;

  // Exact (normalised) state match.
  for (let i = 0; i < states.length; i++) {
    if (norm(states[i]) === q) return states[i];
  }
  // Alias table (exact key).
  if (STATE_ALIASES[q] && states.indexOf(STATE_ALIASES[q]) >= 0) return STATE_ALIASES[q];

  // Fuzzy: nearest state within a length-scaled edit budget, must be unique.
  const budget = q.length <= 5 ? 1 : 2;
  let best = null, bestDist = Infinity, tie = false;
  states.forEach(function (s) {
    const d = editDistance(q, norm(s));
    if (d < bestDist) { bestDist = d; best = s; tie = false; }
    else if (d === bestDist) { tie = true; }
  });
  // Also test alias keys so e.g. "orisa" → "orissa" → Odisha.
  Object.keys(STATE_ALIASES).forEach(function (a) {
    const d = editDistance(q, a);
    if (d < bestDist) { bestDist = d; best = STATE_ALIASES[a]; tie = false; }
    else if (d === bestDist && STATE_ALIASES[a] !== best) { tie = true; }
  });

  if (best && bestDist <= budget && !tie && states.indexOf(best) >= 0) return best;
  return null;
}
