/**
 * explore.js — page logic for destinations.html (browse/filter/sort).
 * Loads ONLY the lightweight manifest — never the full destination data.
 */
import { fetchIndex } from '../data/api.js';
import { initLayout, setActiveNav } from '../components/layout.js';
import { destCardHTML } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd } from '../components/seo.js';
import { zoneOf, seasonsOf, ZONES, SEASONS } from '../data/taxonomy.js';
import { esc } from '../utils/format.js';

initLayout({ active: 'destinations' });

applySEO({
  title: 'All Destinations — IndiaExplore',
  description: 'Browse 2,355 travel destinations across all 35 states & UTs of India. Filter by type, state, budget and travel month.',
  canonicalPath: 'destinations.html',
  keywords: ['india destinations', 'places to visit in india', 'india travel by budget', 'best travel months india'],
});
injectJsonLd(breadcrumbJsonLd([
  { name: 'Home', path: 'index.html' },
  { name: 'Destinations', path: 'destinations.html' },
]));

const idx = await fetchIndex();
const SUMMARIES = idx.destinations;
const { priceTiers: PRICE_TIERS, types: DESTINATION_TYPES, states: INDIA_STATES, months: MONTHS } = idx.meta;
const typeIcon = new Map(DESTINATION_TYPES.map((t) => [t.id, t.icon]));

const CATEGORY_FILTERS = [
  { id: '', label: 'All', icon: '🗺️' },
  { id: 'hill_station', label: 'Hill Stations', icon: '🏔️' },
  { id: 'beach', label: 'Beaches', icon: '🏖️' },
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
  { id: 'wildlife', label: 'Wildlife', icon: '🐯' },
  { id: 'spiritual', label: 'Spiritual', icon: '🕌' },
  { id: 'adventure', label: 'Adventure', icon: '⛺' },
  { id: 'road_trips', label: 'Road Trips', icon: '🚗' },
  { id: 'camping', label: 'Camping', icon: '🏕️' },
  { id: 'forts', label: 'Forts', icon: '🏰' },
  { id: 'ecotourism', label: 'Ecotourism', icon: '🌳' },
];

// ─── Filter state ──────────────────────────────────────
let filters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
let sortBy = 'rating';

const grid = document.getElementById('grid');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');
const searchInput = document.getElementById('searchInput');
const stateSel = document.getElementById('stateFilter');
const sortSel = document.getElementById('sortBy');

// ─── Build static filter controls ──────────────────────
const typeWrap = document.getElementById('typeFilter');
function typeBtnClass(active) {
  return 'shrink-0 px-5 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ' +
    (active ? 'border-primary text-primary bg-orange-50/50 shadow-sm scale-102 font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50');
}
function renderTypeButtons() {
  typeWrap.innerHTML = '';
  CATEGORY_FILTERS.forEach(function (t) {
    const b = document.createElement('button');
    b.className = typeBtnClass(filters.type === t.id);
    b.textContent = t.icon + ' ' + t.label;
    b.dataset.type = t.id;
    b.addEventListener('click', function () { filters.type = t.id; apply(); });
    typeWrap.appendChild(b);
  });
}

// ── Sidebar dropdowns (tier / state / region / season / month) ──
const tierSel = document.getElementById('tierFilter');
const regionSel = document.getElementById('regionFilter');
const seasonSel = document.getElementById('seasonFilter');
const monthSel = document.getElementById('monthFilter');

function addOptions(sel, items) {
  items.forEach(function (it) {
    const o = document.createElement('option');
    o.value = it.value; o.textContent = it.label;
    sel.appendChild(o);
  });
}

addOptions(tierSel, Object.entries(PRICE_TIERS).map(function (e) {
  return { value: e[0], label: e[1].label + (e[1].range ? ' · ' + e[1].range : '') };
}));
addOptions(regionSel, ZONES.map(function (z) { return { value: z, label: z }; }));
addOptions(seasonSel, SEASONS.map(function (s) { return { value: s, label: s }; }));
addOptions(monthSel, MONTHS.map(function (m) { return { value: String(m.num), label: m.name }; }));

// State options
INDIA_STATES.forEach(function (s) {
  const o = document.createElement('option');
  o.value = s; o.textContent = s;
  stateSel.appendChild(o);
});

tierSel.addEventListener('change', function () { filters.tier = tierSel.value; apply(); });
regionSel.addEventListener('change', function () { filters.region = regionSel.value; apply(); });
seasonSel.addEventListener('change', function () { filters.season = seasonSel.value; apply(); });
monthSel.addEventListener('change', function () {
  filters.month = monthSel.value ? parseInt(monthSel.value, 10) : null;
  apply();
});

// Toggle only active state (preserves scroll position + bindings).
function syncFilterActive() {
  Array.prototype.forEach.call(typeWrap.children, function (b) {
    b.className = typeBtnClass(filters.type === (b.dataset.type || ''));
  });
}

// ─── Core: filter, sort, render ────────────────────────
const PAGE_SIZE = 60;           // cards rendered per batch (avoids 2,355-node innerHTML on load)
let shown = PAGE_SIZE;
let lastResults = [];

function renderBatch() {
  const slice = lastResults.slice(0, shown);
  grid.innerHTML = slice.map(function (d) {
    return destCardHTML(d, { variant: 'explore', typeIcon: typeIcon.get(d.type) || '' });
  }).join('');
  const moreWrap = document.getElementById('loadMoreWrap');
  if (moreWrap) moreWrap.style.display = shown < lastResults.length ? 'flex' : 'none';
  const moreCount = document.getElementById('loadMoreCount');
  if (moreCount) moreCount.textContent = Math.min(PAGE_SIZE, lastResults.length - shown);
}

function apply() {
  let results = SUMMARIES.slice();

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(function (d) {
      return d.title.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.short.toLowerCase().includes(q) ||
        d.features.some(function (f) { return f.toLowerCase().includes(q); });
    });
  }
  if (filters.type) {
    if (filters.type === 'road_trips') {
      results = results.filter(function (d) {
        return (d.type === 'adventure' || d.type === 'hill_station' || d.features.some(function (f) { return f.toLowerCase() === 'ghats'; })) && d.type !== 'spiritual';
      });
    } else if (filters.type === 'camping') {
      results = results.filter(function (d) {
        return d.features.some(function (f) { return f.toLowerCase().includes('camp') || f.toLowerCase().includes('trek'); }) || d.type === 'adventure';
      });
    } else if (filters.type === 'forts') {
      results = results.filter(function (d) {
        return d.features.some(function (f) { return f.toLowerCase().includes('fort'); });
      });
    } else if (filters.type === 'ecotourism') {
      results = results.filter(function (d) {
        return d.features.some(function (f) { return f.toLowerCase().includes('nature') || f.toLowerCase().includes('birding'); });
      });
    } else {
      results = results.filter(function (d) { return d.type === filters.type; });
    }
  }
  if (filters.state) results = results.filter(function (d) { return d.state === filters.state; });
  if (filters.region) results = results.filter(function (d) { return zoneOf(d.state) === filters.region; });
  if (filters.season) results = results.filter(function (d) { return seasonsOf(d.bestTime.months).indexOf(filters.season) >= 0; });
  if (filters.month) results = results.filter(function (d) { return d.bestTime.months.includes(filters.month); });
  // tiers[] is precomputed at build time: tiers a destination actually OFFERS
  // (a stay's price range overlaps the tier band).
  if (filters.tier) results = results.filter(function (d) { return d.tiers.includes(filters.tier); });

  if (sortBy === 'rating') results.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
  else if (sortBy === 'price_asc') results.sort(function (a, b) { return (a.minPrice || 0) - (b.minPrice || 0); });
  else if (sortBy === 'price_desc') results.sort(function (a, b) { return (b.minPrice || 0) - (a.minPrice || 0); });
  else if (sortBy === 'distance') results.sort(function (a, b) { return (a.distanceFromDelhi || 0) - (b.distanceFromDelhi || 0); });

  resultCount.textContent = results.length;
  noResults.style.display = results.length === 0 ? 'block' : 'none';
  syncMobileFilterUI(results.length);

  lastResults = results;
  shown = PAGE_SIZE;
  renderBatch();

  syncFilterActive();
  renderActiveFilterChips();
}

function renderActiveFilterChips() {
  const container = document.getElementById('activeFiltersContainer');
  const chipsWrap = document.getElementById('activeFilterChips');
  if (!container || !chipsWrap) return;

  const activeItems = [];

  if (filters.search) {
    activeItems.push({ key: 'search', label: 'Search: "' + filters.search + '"' });
  }
  if (filters.type) {
    const cat = CATEGORY_FILTERS.find((c) => c.id === filters.type);
    activeItems.push({ key: 'type', label: 'Category: ' + (cat ? cat.label : filters.type) });
  }
  if (filters.state) {
    activeItems.push({ key: 'state', label: 'State: ' + filters.state });
  }
  if (filters.region) {
    activeItems.push({ key: 'region', label: 'Region: ' + filters.region });
  }
  if (filters.tier) {
    const tier = PRICE_TIERS[filters.tier];
    activeItems.push({ key: 'tier', label: 'Price: ' + (tier ? tier.label : filters.tier) });
  }
  if (filters.season) {
    activeItems.push({ key: 'season', label: 'Season: ' + filters.season });
  }
  if (filters.month) {
    const m = MONTHS.find((x) => x.num === filters.month);
    activeItems.push({ key: 'month', label: '📅 Travel Month: ' + (m ? m.name : 'Month ' + filters.month) });
  }

  if (!activeItems.length) {
    container.classList.add('hidden');
    chipsWrap.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  chipsWrap.innerHTML = activeItems.map((item) =>
    '<span class="active-filter-chip">' +
      '<span>' + esc(item.label) + '</span>' +
      '<button type="button" data-key="' + item.key + '" aria-label="Remove filter">✕</button>' +
    '</span>'
  ).join('');

  chipsWrap.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (key === 'search') { filters.search = ''; searchInput.value = ''; }
      else if (key === 'type') { filters.type = ''; }
      else if (key === 'state') { filters.state = ''; stateSel.value = ''; }
      else if (key === 'region') { filters.region = ''; regionSel.value = ''; }
      else if (key === 'tier') { filters.tier = ''; tierSel.value = ''; }
      else if (key === 'season') { filters.season = ''; seasonSel.value = ''; }
      else if (key === 'month') { filters.month = null; monthSel.value = ''; }
      apply();
    });
  });
}

// Debounce the free-text search so we don't re-filter+re-render 2,355 rows on every keystroke.
let searchTimer = null;
function applyDebounced() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(apply, 150);
}

function resetFilters() {
  filters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
  sortBy = 'rating';
  searchInput.value = '';
  stateSel.value = '';
  sortSel.value = 'rating';
  tierSel.value = '';
  regionSel.value = '';
  seasonSel.value = '';
  monthSel.value = '';
  apply();
}

// ─── Mobile filter drawer (<lg the sidebar slides in as a sheet) ───
const sidebar = document.getElementById('filterSidebar');
const filterCountBadge = document.getElementById('filterCount');
const filterApplyCount = document.getElementById('filterApplyCount');

function setDrawer(open) {
  sidebar.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

// Count of filters that live inside the drawer (search/type/sort sit outside it).
function activeSidebarFilters() {
  return ['tier', 'state', 'region', 'season'].filter(function (k) { return filters[k]; }).length +
    (filters.month ? 1 : 0);
}

function syncMobileFilterUI(resultLen) {
  const n = activeSidebarFilters();
  if (filterCountBadge) {
    filterCountBadge.textContent = n;
    filterCountBadge.classList.toggle('hidden', n === 0);
    filterCountBadge.classList.toggle('inline-flex', n > 0);
  }
  if (filterApplyCount) filterApplyCount.textContent = resultLen;
}

document.getElementById('filterOpen').addEventListener('click', function () { setDrawer(true); });
document.getElementById('filterClose').addEventListener('click', function () { setDrawer(false); });
document.getElementById('filterApply').addEventListener('click', function () { setDrawer(false); });
sidebar.addEventListener('click', function (e) { if (e.target === sidebar) setDrawer(false); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) setDrawer(false);
});

// ─── Wire controls ─────────────────────────────────────
searchInput.addEventListener('input', function () { filters.search = searchInput.value; applyDebounced(); });
stateSel.addEventListener('change', function () { filters.state = stateSel.value; apply(); });
sortSel.addEventListener('change', function () { sortBy = sortSel.value; apply(); });
document.getElementById('resetTop').addEventListener('click', resetFilters);
document.getElementById('resetEmpty').addEventListener('click', resetFilters);
const clearAllBtn = document.getElementById('clearAllFilters');
if (clearAllBtn) clearAllBtn.addEventListener('click', resetFilters);

const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () { shown += PAGE_SIZE; renderBatch(); });

renderTypeButtons();

// ─── URL params, then first render ─────────────────────
const params = new URLSearchParams(window.location.search);
if (params.get('search')) { filters.search = params.get('search'); searchInput.value = filters.search; }
if (params.get('type')) {
  const wantType = params.get('type');
  if (CATEGORY_FILTERS.some(function (t) { return t.id === wantType; })) filters.type = wantType;
}
if (params.get('state') && INDIA_STATES.indexOf(params.get('state')) >= 0) {
  filters.state = params.get('state'); stateSel.value = filters.state;
}
if (params.get('region') && ZONES.indexOf(params.get('region')) >= 0) filters.region = params.get('region');
if (params.get('season') && SEASONS.indexOf(params.get('season')) >= 0) filters.season = params.get('season');
if (params.get('month')) {
  const mo = parseInt(params.get('month'), 10);
  if (mo >= 1 && mo <= 12) { filters.month = mo; monthSel.value = String(mo); }
}
if (params.get('maxPrice')) {
  const max = parseInt(params.get('maxPrice'), 10);
  if (!isNaN(max)) {
    const entry = Object.entries(PRICE_TIERS).find(function (e) { return e[1].min <= max && max <= e[1].max; }) ||
      Object.entries(PRICE_TIERS).sort(function (a, b) { return b[1].max - a[1].max; })[0];
    if (entry) filters.tier = entry[0];
  }
}

// Reflect URL-driven filter state in the dropdowns.
tierSel.value = filters.tier;
regionSel.value = filters.region;
seasonSel.value = filters.season;
monthSel.value = filters.month ? String(filters.month) : '';

setActiveNav(filters.type ? 'destinations.html?type=' + filters.type : 'destinations.html');

apply();

