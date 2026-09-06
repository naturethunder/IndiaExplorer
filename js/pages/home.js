/**
 * home.js — page logic for index.html.
 * Loads ONLY the lightweight manifest (data/destinations/index.json).
 */
import { fetchIndex } from '../data/api.js';
import { initLayout } from '../components/layout.js?v=20260906-1';
import { heroCardHTML, miniCardHTML, trendCardHTML, destUrl, cardThumb } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, websiteJsonLd } from '../components/seo.js';
import { esc, inr, typeLabel } from '../utils/format.js';
import { icon } from '../components/icons.js';
import { resolveState, MONTH_PICKS, CUSTOM_TYPE_MATCHERS } from '../data/taxonomy.js';
import { searchDestinations } from '../utils/search.js';

const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initLayout({ active: 'home' });

applySEO({
  title: 'ExploreDesh — Discover Incredible India | Travel Guides & Hotels',
  description: "Discover India's most beautiful destinations. Search hotels by budget, explore top places to visit, and plan your perfect India trip with ExploreDesh.",
  canonicalPath: '/',
  keywords: ['india travel', 'india destinations', 'hill stations', 'beaches in india', 'india trip planner', 'hotels in india'],
  image: 'https://images.pexels.com/photos/35655143/pexels-photo-35655143.jpeg?auto=compress&cs=tinysrgb&w=1280',
});

injectJsonLd(websiteJsonLd(), 'website');
// ─── Hero background & cinematic rotator ────────────────────
(function () {
  const bg = document.getElementById('heroBg');
  if (!bg) return;

  const HERO_PHOTOS = [
    { name: 'Varanasi Ganga Ghats', src: 'https://images.pexels.com/photos/35655143/pexels-photo-35655143.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Uttar Pradesh' },
    { name: 'Hawa Mahal, Jaipur', src: 'https://images.pexels.com/photos/34086724/pexels-photo-34086724.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Rajasthan' },
    { name: 'Rishikesh Ganga Aarti', src: 'https://images.pexels.com/photos/18887232/pexels-photo-18887232.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Uttarakhand' },
    { name: 'Baga Beach, Goa', src: 'https://images.pexels.com/photos/28355681/pexels-photo-28355681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Goa' },
    { name: 'Manali Valley', src: 'https://images.pexels.com/photos/994194/pexels-photo-994194.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Himachal Pradesh' },
    { name: 'City Palace, Udaipur', src: 'https://images.pexels.com/photos/33658452/pexels-photo-33658452.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Rajasthan' },
    { name: 'Vittala Temple, Hampi', src: 'https://images.pexels.com/photos/38297408/pexels-photo-38297408.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Karnataka' },
    { name: 'Kanchenjunga from Darjeeling', src: 'https://images.pexels.com/photos/38426620/pexels-photo-38426620.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'West Bengal' },
    { name: 'Key Monastery, Spiti', src: 'https://images.pexels.com/photos/31307365/pexels-photo-31307365.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Himachal Pradesh' },
    { name: 'Jaisalmer Fort', src: 'https://images.pexels.com/photos/35130760/pexels-photo-35130760.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', state: 'Rajasthan' },
  ];

  let currentIdx = 0;
  bg.style.backgroundColor = '#0f3460';
  bg.style.transition = 'opacity 0.8s ease-in-out, background-image 0.8s ease-in-out';

  // Preload images
  HERO_PHOTOS.slice(0, 2).forEach(p => { const img = new Image(); img.src = p.src; });

  function setHeroPhoto(i) {
    currentIdx = (i + HERO_PHOTOS.length) % HERO_PHOTOS.length;
    const photo = HERO_PHOTOS[currentIdx];
    bg.style.backgroundImage = 'url("' + photo.src + '")';

    const indicatorEl = document.getElementById('hero-photo-indicator');
    if (indicatorEl) {
      indicatorEl.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-amber-400/30 backdrop-blur-md shadow-lg text-xs font-semibold text-white">
          <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" width="14" height="14" style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="inline-flex items-center gap-1">${icon('map-pin', { size: 14 })} Featured: <strong class="text-amber-300 font-bold">${photo.name}</strong> (${photo.state})</span>
        </div>
        <div class="flex items-center gap-1.5 ml-1">
          ${HERO_PHOTOS.map((_, idx) => `
            <button type="button" data-hero-idx="${idx}" class="h-2 rounded-full transition-all duration-300 ${idx === currentIdx ? 'bg-amber-400 w-6 shadow-sm shadow-amber-400' : 'bg-white/40 hover:bg-white/80 w-2'}" aria-label="Slide ${idx + 1}" ${idx === currentIdx ? 'aria-current="true"' : ''}></button>
          `).join('')}
        </div>
      `;

      indicatorEl.querySelectorAll('[data-hero-idx]').forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-hero-idx'), 10);
          setHeroPhoto(idx);
          resetTimer();
        };
      });
    }
  }

  let timer = null;
  function startTimer() {
    if (prefersReducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => setHeroPhoto(currentIdx + 1), 7000);
  }
  function resetTimer() { startTimer(); }

  const heroSection = bg.closest('.hero-home') || bg.parentElement;
  if (heroSection) {
    heroSection.addEventListener('mouseenter', () => clearInterval(timer));
    heroSection.addEventListener('mouseleave', startTimer);
  }

  setHeroPhoto(0);
  startTimer();
})();

// ─── Pre-populate grids with shimmer skeletons while index.json loads ─
// UI/UX skill §3: progressive-loading — show skeleton instead of blank space
function injectSkeletons() {
  const heroGridIds = ['hills-grid', 'popular-grid'];
  const trendId = 'trending-grid';
  const seasonId = 'season-grid';
  const miniId = 'explore-grid';
  const budgetId = 'budget-grid';
  const monthId = 'month-rail';

  heroGridIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.children.length) {
      el.innerHTML = [1, 2, 3, 4].map(() =>
        '<div class="skeleton-card skeleton-hero"></div>').join('');
    }
  });
  const trend = document.getElementById(trendId);
  if (trend && !trend.children.length) {
    trend.innerHTML = [1, 2, 3, 4, 5, 6].map(() =>
      '<div class="skeleton-card skeleton-trend"></div>').join('');
  }
  const season = document.getElementById(seasonId);
  if (season && !season.children.length) {
    season.innerHTML = [1, 2, 3, 4].map(() =>
      '<div class="skeleton-card skeleton-season"></div>').join('');
  }
  const mini = document.getElementById(miniId);
  if (mini && !mini.children.length) {
    mini.innerHTML = [1, 2, 3, 4, 5, 6].map(() =>
      '<div class="skeleton-card skeleton-mini"></div>').join('');
  }
  const budget = document.getElementById(budgetId);
  if (budget && !budget.children.length) {
    budget.innerHTML = [1, 2, 3, 4, 5].map(() =>
      '<div class="skeleton-card skeleton-budget"></div>').join('');
  }
  const month = document.getElementById(monthId);
  if (month && !month.children.length) {
    month.innerHTML = [1, 2, 3, 4].map(() =>
      '<div class="skeleton-card skeleton-trend"></div>').join('');
  }
}
injectSkeletons();

let idx;
try {
  idx = await fetchIndex();
} catch (err) {
  // Chrome (navbar/footer) already mounted; show a minimal failure note
  // instead of a silently empty page.
  console.warn('[home] manifest failed to load:', err);
  const main = document.getElementById('main');
  if (main) main.insertAdjacentHTML('beforeend',
    '<p class="text-center py-16" style="color:rgba(255,255,255,0.6)">Couldn\'t load destinations. Please refresh the page.</p>');
  throw err;
}
const summaries = idx.destinations;
const STATES = idx.meta.states;
const MONTHS = idx.meta.months || [];
const bySlug = new Map(summaries.map((d) => [d.slug, d]));

// Count destinations in a state (for the "view all in <state>" suggestion).
function stateCount(state) { return summaries.reduce((n, d) => n + (d.state === state ? 1 : 0), 0); }
function stateUrl(state) { return 'destinations.html?state=' + encodeURIComponent(state); }

function search(q) {
  return searchDestinations(summaries, q);
}

// ─── Hero inline stats ────────────────────────────────────
(function () {
  const el = document.getElementById('hero-stats');
  if (!el) return;
  const totalDestCount = (idx && idx.count) || (summaries ? summaries.length : 2392);
  const stats = [
    { ic: 'map-pin', raw: totalDestCount, suffix: '+', label: 'Destinations' },
    { ic: 'landmark', raw: (STATES ? STATES.length : 36), suffix: '', label: 'States' },
    { ic: 'mountain', raw: 14013, suffix: '+', label: 'Places' },
    { ic: 'bed', raw: 17567, suffix: '+', label: 'Stays' },
  ];
  el.innerHTML = stats.map((s) =>
    '<span class="hero-stat">' +
    '<span class="hero-stat-icon">' + icon(s.ic, { size: 22 }) + '</span>' +
    '<span class="hero-stat-body"><strong class="stat-count-num" data-target="' + s.raw + '" data-suffix="' + s.suffix + '">' + inr(s.raw) + s.suffix + '</strong><span class="hero-stat-label">' + esc(s.label) + '</span></span>' +
    '</span>'
  ).join('');
})();

// ─── Popular searches chips ───────────────────────────────
(function () {
  const el = document.getElementById('popular-searches');
  if (!el) return;
  const picks = ['Manali', 'Goa', 'Kerala', 'Ladakh', 'Rajasthan', 'Darjeeling'];
  el.insertAdjacentHTML('beforeend', picks.map((p) => {
    const state = STATES.find((s) => s.toLowerCase() === p.toLowerCase());
    const destination = summaries.find((d) => d.title.toLowerCase() === p.toLowerCase());
    const href = state ? stateUrl(state) : destination ? destUrl(destination.slug) : 'destinations.html?search=' + encodeURIComponent(p);
    return '<a href="' + href + '" class="popular-chip">' + esc(p) + '</a>';
  }).join(''));
})();


// ─── Category chips ───────────────────────────────────────
(function () {
  const el = document.getElementById('category-strip');
  if (!el) return;
  const cats = [
    { type: '', ic: 'compass', tint: 'tint-teal', label: 'All Destinations', countKey: 'all' },
    { type: 'hill_station', ic: 'mountain', tint: 'tint-green', label: 'Hill Stations', badge: 'popular' },
    { type: 'beach', ic: 'waves', tint: 'tint-blue', label: 'Beaches', badge: 'popular' },
    { type: 'heritage', ic: 'landmark', tint: 'tint-orange', label: 'Heritage', badge: 'popular' },
    { type: 'wildlife', ic: 'paw-print', tint: 'tint-amber', label: 'Wildlife' },
    { type: 'spiritual', ic: 'temple', tint: 'tint-rose', label: 'Spiritual', badge: 'popular' },
    { type: 'adventure', ic: 'tent', tint: 'tint-purple', label: 'Adventure' },
    { type: 'road_trips', ic: 'car', tint: 'tint-blue', label: 'Road Trips', badge: 'new', countKey: 'road_trips' },
    { type: 'camping', ic: 'tent', tint: 'tint-slate', label: 'Camping', badge: 'new', countKey: 'camping' },
    { type: 'forts', ic: 'gem', tint: 'tint-amber', label: 'Forts & Palaces', countKey: 'forts' },
    { type: 'ecotourism', ic: 'flower', tint: 'tint-green', label: 'Ecotourism', countKey: 'ecotourism' }
  ];
  // Live counts from the manifest — pseudo-categories (road_trips/camping/
  // forts/ecotourism) use the same CUSTOM_TYPE_MATCHERS predicate explore.js
  // filters on, so the chip count always matches what clicking through yields.
  const counts = {};
  idx.destinations.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
  const customCounts = {};
  Object.keys(CUSTOM_TYPE_MATCHERS).forEach((key) => {
    customCounts[key] = idx.destinations.filter(CUSTOM_TYPE_MATCHERS[key]).length;
  });

  const totalCount = idx.count || summaries.length || 2390;

  el.innerHTML = cats.map((c) => {
    const n = c.countKey === 'all' ? totalCount : c.countKey ? (customCounts[c.countKey] || (counts[c.type] || 0)) : (counts[c.type] || 0);
    const badge = c.badge
      ? '<span class="category-chip-badge badge-' + c.badge + '">' + (c.badge === 'new' ? 'New' : 'Popular') + '</span>'
      : '';
    const href = c.type === ''
      ? 'destinations.html'
      : 'destinations.html?type=' + encodeURIComponent(c.type);
    return '<a href="' + href + '" class="category-chip">' +
      '<span class="category-chip-icon ' + c.tint + '">' + icon(c.ic, { size: 24 }) + badge + '</span>' +
      '<span class="category-chip-label">' + esc(c.label) + '</span>' +
      '<span class="category-chip-count">' + inr(n) + ' places</span>' +
      '</a>';
  }).join('');
})();


// ─── Search + autocomplete (combobox pattern) ─────────────
(function () {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const drop = document.getElementById('autocomplete');
  if (!input || !btn || !drop) return;

  // ARIA combobox wiring + polite result announcements for screen readers.
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'autocomplete');
  input.setAttribute('aria-autocomplete', 'list');
  drop.setAttribute('role', 'listbox');
  const live = document.createElement('span');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  drop.parentElement.appendChild(live);

  let activeIdx = -1; // keyboard-highlighted option
  let searchTimer = null; // input debounce timer

  function close() {
    if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
    drop.style.display = 'none';
    drop.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIdx = -1;
  }

  function options() { return Array.from(drop.querySelectorAll('a')); }

  function setActive(i) {
    const opts = options();
    if (!opts.length) return;
    activeIdx = (i + opts.length) % opts.length;
    opts.forEach((a, j) => {
      const active = j === activeIdx;
      a.classList.toggle('is-active', active);
      a.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) {
        input.setAttribute('aria-activedescendant', a.id);
      }
    });
    opts[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function render(results) {
    const q = input.value.trim();
    const state = resolveState(q, STATES);
    let head = '';
    let optId = 0;
    // Typing a state name (even partial/misspelled) surfaces its whole listing first.
    if (state) {
      head = '<a href="' + stateUrl(state) + '" id="ac-opt-' + (optId++) + '" class="autocomplete-item font-semibold" role="option">' +
        '<span class="autocomplete-img flex items-center justify-center bg-emerald-50 text-primary">' + icon('map-pin', { size: 18 }) + '</span>' +
        '<div class="text-left flex-1 min-w-0">' +
        '<div class="font-bold text-gray-900 text-sm">All destinations in ' + esc(state) + '</div>' +
        '<div class="text-xs text-gray-500">' + stateCount(state) + ' places · view listing</div>' +
        '</div><span class="text-xs text-primary shrink-0">→</span></a>';
    }
    if (!results.length && !head) { close(); live.textContent = q ? 'No results' : ''; return; }
    let items = head + results.slice(0, 7).map(function (d) {
      const thumb = cardThumb(d);
      const currentId = optId++;
      return '<a href="' + destUrl(d.slug) + '" id="ac-opt-' + currentId + '" class="autocomplete-item" role="option">' +
        '<img src="' + esc(thumb) + '" alt="" class="autocomplete-img" loading="lazy" ' +
        'onerror="this.onerror=null;this.style.display=\'none\';" />' +
        '<div class="text-left flex-1 min-w-0">' +
        '<div class="font-semibold text-gray-900 text-sm">' + esc(d.title) + '</div>' +
        '<div class="text-xs text-gray-500 truncate">' + esc(d.state) + ' · ' + esc((d.short || '').slice(0, 50)) + '...</div>' +
        '</div>' +
        '<span class="text-xs text-gray-500 shrink-0">Stay starts from ₹' + inr(d.minPrice || 0) + '</span>' +
        '</a>';
    }).join('');
    items += '<a href="destinations.html" id="ac-opt-' + (optId++) + '" role="option" class="autocomplete-item justify-center text-sm font-semibold text-primary hover:bg-emerald-50 transition-colors">View all destinations →</a>';
    drop.innerHTML = items;
    drop.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');
    activeIdx = -1;
    const n = results.length + (head ? 1 : 0);
    live.textContent = n + (n === 1 ? ' result' : ' results');
  }

  function onInput() {
    const q = input.value.trim();
    if (q.length < 1) { close(); return; }
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      render(search(q));
    }, 150);
  }
  function goToFirst() {
    const q = input.value.trim();
    const errorEl = document.getElementById('searchError');

    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }

    if (!q) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a destination, state, or theme to search.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // A state name routes straight to that state's listing (spec: "Goa" → all Goa).
    const state = resolveState(q, STATES);
    if (state) {
      window.location.href = stateUrl(state);
      return;
    }
    const match = search(q);
    if (match.length > 0) {
      window.location.href = destUrl(match[0].slug);
    } else {
      window.location.href = 'destinations.html?search=' + encodeURIComponent(q);
    }
  }

  input.addEventListener('input', onInput);
  input.addEventListener('focus', onInput);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      const opts = options();
      if (activeIdx >= 0 && opts[activeIdx]) window.location.href = opts[activeIdx].href;
      else goToFirst();
    } else if (e.key === 'Escape') close();
  });
  btn.addEventListener('click', goToFirst);
  document.addEventListener('click', function (e) {
    if (!drop.contains(e.target) && e.target !== input && e.target !== btn) close();
  });
})();

// ─── Best this month — interactive monthly highlight section ──────
(function () {
  const railEl = document.getElementById('month-rail');
  const pillsEl = document.getElementById('monthPills');
  if (!railEl) return;

  const currentRealMonth = new Date().getMonth() + 1;
  let activeMonth = currentRealMonth;

  function renderMonthPills() {
    if (!pillsEl) return;
    pillsEl.innerHTML = MONTHS.map((m) => {
      const isActive = m.num === activeMonth;
      const isCurrent = m.num === currentRealMonth;
      const badge = isCurrent ? '<span class="pill-current-badge ml-1.5"><span class="sr-only">Current month: </span>NOW</span>' : '';
      return '<button type="button" class="month-pill ' + (isActive ? 'is-active' : '') + '" data-month="' + m.num + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
        '<span>' + esc(m.name) + '</span>' + badge +
        '</button>';
    }).join('');

    pillsEl.querySelectorAll('.month-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = parseInt(btn.dataset.month, 10);
        if (selected && selected !== activeMonth) {
          activeMonth = selected;
          renderMonthRail(activeMonth);
          renderMonthPills();
        }
      });
    });
  }

  function renderMonthRail(monthNum) {
    const m = MONTHS.find((x) => x.num === monthNum);
    const monthName = m ? m.name : 'This Month';
    const isCurrent = monthNum === currentRealMonth;

    const nameEl = document.getElementById('railMonthName');
    if (nameEl) nameEl.textContent = monthName;

    const btnNameEl = document.getElementById('railMonthBtnName');
    if (btnNameEl) btnNameEl.textContent = monthName;

    const subEl = document.getElementById('railMonthSub');
    if (subEl) {
      subEl.textContent = isCurrent
        ? 'Top recommended places to travel right now'
        : 'Top recommended places to travel in ' + monthName;
    }

    const allEl = document.getElementById('railMonthAll');
    if (allEl) allEl.href = 'destinations.html?month=' + monthNum;

    const featuredSlug = MONTH_PICKS[monthNum];
    const featured = featuredSlug ? bySlug.get(featuredSlug) : null;
    const rest = summaries
      .filter((d) => d.bestTime.months.includes(monthNum) && (!featured || d.slug !== featured.slug))
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, featured ? 3 : 4);

    const picks = (featured ? [featured].concat(rest) : rest).slice(0, 4);

    railEl.style.opacity = '0.4';
    setTimeout(() => {
      railEl.innerHTML = picks.map((d) => trendCardHTML(d)).join('');
      railEl.style.opacity = '1';
    }, 120);

  }

  renderMonthPills();
  renderMonthRail(activeMonth);
})();


// ─── Explore India interactive map ────────────────────────
(async function () {
  const svgEl = document.getElementById('india-map');
  if (!svgEl) return;
  try {
    const { initIndiaMap } = await import('../components/indiaMap.js');
    const countByState = new Map();
    const destsByState = new Map();
    summaries.forEach((d) => {
      countByState.set(d.state, (countByState.get(d.state) || 0) + 1);
      if (!destsByState.has(d.state)) destsByState.set(d.state, []);
      destsByState.get(d.state).push(d);
    });
    destsByState.forEach((list) => {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0));
    });
    initIndiaMap({ svgEl, countByState, destsByState, stateUrl });
  } catch (err) {
    // Map is progressive enhancement; hide its column cleanly if it fails.
    console.warn('[india-map] failed to init:', err);
    const wrap = svgEl.closest('.discover-map');
    if (wrap) wrap.style.display = 'none';
  }
})();

// ─── Dynamic Reshuffling Utility ─────────────────────────
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Trending carousel (Dynamic Reshuffle on Refresh) ─────
(function () {
  const row = document.getElementById('trending-grid');
  if (!row) return;

  // Pick from high-rated/popular destinations with verified hero images
  const pool = summaries.filter(function (d) {
    const hasPhoto = d.heroImage && d.heroImage.src;
    const isQuality = (d.rating >= 4.5 && (d.reviewCount >= 50 || d.badge)) || d.badge === 'Popular' || d.badge === 'Trending';
    return hasPhoto && isQuality;
  });

  const selected = shuffleArray(pool.length >= 10 ? pool : summaries.filter(d => d.heroImage && d.heroImage.src)).slice(0, 10);
  row.innerHTML = selected.map(function (d) { return trendCardHTML(d); }).join('');
  wireCarousel(row, document.getElementById('trend-prev'), document.getElementById('trend-next'));
})();

// ─── Travel this season ───────────────────────────────────
(function () {
  const el = document.getElementById('season-grid');
  if (!el) return;
  // Season → representative months, a fitting lead destination, and label.
  const seasons = [
    { name: 'Summer Escapes', range: 'March – June', ic: 'sun', months: [4, 5, 6], lead: ['goa', 'manali', 'ladakh'] },
    { name: 'Monsoon Magic', range: 'July – September', ic: 'cloud-rain', months: [7, 8, 9], lead: ['munnar', 'coorg', 'goa'] },
    { name: 'Winter Wonderland', range: 'October – February', ic: 'snowflake', months: [12, 1, 2], lead: ['manali', 'jaisalmer', 'udaipur'] },
    { name: 'Spring Blooms', range: 'February – March', ic: 'flower', months: [3, 4], lead: ['darjeeling', 'coorg', 'kanatal'] },
  ];
  el.innerHTML = seasons.map((s) => {
    const lead = s.lead.map((sl) => bySlug.get(sl)).find(Boolean) || summaries[0];
    const src = (lead && (lead.heroImage && lead.heroImage.src || lead.image && lead.image.src)) || '';
    const primaryMonth = s.months[0];
    return '<a href="destinations.html?month=' + primaryMonth + '" class="season-card group">' +
      '<img src="' + esc(src) + '" alt="' + esc(lead ? lead.title + ', ' + lead.state : s.name) + '" loading="lazy" ' +
      'onerror="this.onerror=null;this.style.display=\'none\';" />' +
      '<div class="season-card-overlay"></div>' +
      '<div class="absolute inset-0 p-5 flex flex-col justify-end">' +
      '<p class="text-white font-bold text-lg leading-tight">' + esc(s.name) + '</p>' +
      '<p class="text-white/80 text-sm mb-2">' + esc(s.range) + '</p>' +
      '<span class="season-explore">Explore ' +
      icon('arrow-right', { size: 15 }) + '</span>' +
      '</div>' +
      '</a>';
  }).join('');
})();

// ─── Browse by budget ─────────────────────────────────────
(function () {
  const el = document.getElementById('budget-grid');
  if (!el) return;
  const tiers = [
    { ic: 'tent', tint: 'tint-green', label: 'Budget', sub: 'under ₹2k', max: 2000 },
    { ic: 'bed', tint: 'tint-blue', label: 'Mid-Range', sub: '₹2k–5k', max: 5000 },
    { ic: 'wallet', tint: 'tint-amber', label: 'Premium', sub: '₹5k–12k', max: 12000 },
    { ic: 'gem', tint: 'tint-rose', label: 'Luxury', sub: '₹12k–25k', max: 25000 },
    { ic: 'crown', tint: 'tint-purple', label: 'Ultra Luxury', sub: '₹25k+', max: 30000 },
  ];
  el.innerHTML = tiers.map((t) =>
    '<a href="destinations.html?maxPrice=' + t.max + '" class="budget-card group">' +
    '<span class="w-11 h-11 rounded-full ' + t.tint + ' flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">' +
    icon(t.ic, { size: 22 }) + '</span>' +
    '<div class="font-bold text-sm text-gray-900">' + esc(t.label) + '</div>' +
    '<div class="text-xs text-gray-500 mt-1">' + esc(t.sub) + '</div>' +
    '</a>'
  ).join('');
})();

// ─── Hills grid (large cards - Dynamic Reshuffle on Refresh) ─
(function () {
  const el = document.getElementById('hills-grid');
  if (!el) return;

  const hillsPool = summaries.filter(function (d) {
    const isHill = d.type === 'hill_station' || d.type === 'hillstation' ||
      (d.features && d.features.some(f => /hill|mountain|valley|peak/i.test(f)));
    const hasPhoto = d.heroImage && d.heroImage.src;
    return isHill && hasPhoto;
  });

  const selectedHills = shuffleArray(hillsPool.length >= 4 ? hillsPool : summaries.filter(d => d.type.includes('hill'))).slice(0, 4);
  el.innerHTML = selectedHills.map(function (d) { return heroCardHTML(d); }).join('');
})();

// ─── Popular grid (large cards - Dynamic Reshuffle on Refresh) ─
(function () {
  const el = document.getElementById('popular-grid');
  if (!el) return;

  const popularPool = summaries.filter(function (d) {
    const isPopular = d.badge === 'Popular' || d.badge === 'Featured' || d.rating >= 4.6;
    const hasPhoto = d.heroImage && d.heroImage.src;
    return isPopular && hasPhoto;
  });

  const selectedPopular = shuffleArray(popularPool.length >= 4 ? popularPool : summaries).slice(0, 4);
  el.innerHTML = selectedPopular.map(function (d) { return heroCardHTML(d); }).join('');
})();

// ─── Explore grid (small cards - Dynamic Reshuffle on Refresh) ─
(function () {
  const el = document.getElementById('explore-grid');
  if (!el) return;

  const explorePool = summaries.filter(function (d) { return d.heroImage && d.heroImage.src; });
  const selectedExplore = shuffleArray(explorePool).slice(0, 6);
  el.innerHTML = selectedExplore.map(function (d) { return miniCardHTML(d); }).join('');
})();

// Grids above are populated synchronously right after the index fetch resolves;
// let ScrollTrigger recompute trigger positions now that real card heights exist
// (skeletons had different heights while loading).
if (window.ScrollTrigger) window.ScrollTrigger.refresh();

// ─── Hero social-proof avatars (local inline SVG — no external fetch) ─────
(function () {
  const el = document.getElementById('heroAvatars');
  if (!el) return;
  // Brand-consistent gradient avatars with a person glyph. Zero network calls
  // (Strict Real Photos Policy: no picsum / stock placeholders).
  const grads = [['#34d399', '#0ea5e9'], ['#f59e0b', '#ef4444'], ['#8b5cf6', '#ec4899'], ['#10b981', '#6366f1']];
  el.innerHTML = grads.map(function (g, i) {
    return '<svg class="avatar-cluster-img" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">' +
      '<defs><linearGradient id="av' + i + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="48" height="48" rx="24" fill="url(#av' + i + ')"/>' +
      '<circle cx="24" cy="19" r="7.5" fill="rgba(255,255,255,0.92)"/>' +
      '<path d="M11 41c1.5-8 7-12 13-12s11.5 4 13 12" fill="rgba(255,255,255,0.92)"/>' +
      '</svg>';
  }).join('');
})();

// ─── Snap-scroll carousel wiring (arrows + disabled state) ─
function wireCarousel(row, prevBtn, nextBtn) {
  if (!row || !prevBtn || !nextBtn) return;
  function pageWidth() {
    const first = row.firstElementChild;
    const cardW = first ? first.getBoundingClientRect().width : row.clientWidth * 0.8;
    return Math.max(cardW * 2, cardW + 24);
  }
  function update() {
    const maxScroll = row.scrollWidth - row.clientWidth - 2;
    prevBtn.disabled = row.scrollLeft <= 2;
    nextBtn.disabled = row.scrollLeft >= maxScroll;
  }
  prevBtn.addEventListener('click', () => row.scrollBy({ left: -pageWidth(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => row.scrollBy({ left: pageWidth(), behavior: 'smooth' }));
  row.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ─── Scroll-reveal (fade-up with 50ms stagger) ────────────
(function () {
  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!els.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    let i = 0;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => el.classList.add('in-view'), (i++) * 50);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();

// ─── GSAP & ScrollTrigger Animations Suite ─────────────────────────
(function initHomeGSAP() {
  if (!window.gsap) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  // 1. Hero Intro Sequence (Page Load Timeline)
  const heroTL = window.gsap.timeline({ delay: 0.1 });

  if (document.querySelector('.hero-home h1')) {
    heroTL.from('.hero-home h1', {
      opacity: 0,
      y: 35,
      duration: 0.85,
      ease: 'power3.out'
    });
  }

  if (document.querySelector('.hero-home p')) {
    heroTL.from('.hero-home p', {
      opacity: 0,
      y: 20,
      duration: 0.65,
      ease: 'power2.out'
    }, '-=0.55');
  }

  if (document.querySelector('.hero-search-seg')) {
    heroTL.from('.hero-search-seg', {
      opacity: 0,
      scale: 0.95,
      y: 20,
      duration: 0.7,
      ease: 'back.out(1.4)'
    }, '-=0.45');
  }

  if (document.querySelectorAll('#popular-searches .popular-chip').length) {
    heroTL.from('#popular-searches .popular-chip', {
      opacity: 0,
      y: 12,
      stagger: 0.04,
      duration: 0.45,
      ease: 'power2.out'
    }, '-=0.35');
  }

  if (document.querySelectorAll('.hero-stat').length) {
    heroTL.from('.hero-stat', {
      opacity: 0,
      y: 18,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.25');
  }

  if (document.querySelector('.ai-hero-card')) {
    heroTL.from('.ai-hero-card', {
      opacity: 0,
      x: 30,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.7');
  }

  // 2. Dynamic Numeric Stat Counters
  document.querySelectorAll('.stat-count-num').forEach((el) => {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const counterObj = { val: 0 };
    window.gsap.to(counterObj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 95%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        el.textContent = inr(Math.floor(counterObj.val)) + suffix;
      },
    });
  });

  // 3. Hero Depth Parallax on Scroll
  if (window.ScrollTrigger && document.getElementById('heroBg')) {
    window.gsap.to('#heroBg', {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-home',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  }

  // 4. Ambient Background Subtle Parallax
  if (window.ScrollTrigger && document.querySelector('.explore-immersive-bg')) {
    window.gsap.to('.explore-immersive-bg', {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
      },
    });
  }

  // 5. ScrollTrigger Staggered Section Entrances
  if (window.ScrollTrigger) {
    // Category strip chips
    const catStrip = document.getElementById('category-strip');
    if (catStrip) {
      window.gsap.fromTo(catStrip.children, {
        opacity: 0,
        y: 25,
        scale: 0.92
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.035,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: catStrip,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Grid sections staggered reveal
    const gridSelectors = [
      '#trending-grid',
      '#month-rail',
      '#season-grid',
      '#popular-grid',
      '#budget-grid',
      '#hills-grid',
      '#explore-grid',
    ];

    gridSelectors.forEach((selector) => {
      const container = document.querySelector(selector);
      if (!container) return;

      window.gsap.fromTo(container.children, {
        opacity: 0,
        y: 32,
        scale: 0.96
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Interactive Map reveal
    const mapInner = document.querySelector('.discover-map-inner');
    if (mapInner) {
      window.gsap.from(mapInner, {
        opacity: 0,
        scale: 0.96,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: mapInner,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Section Titles and headers reveal
    document.querySelectorAll('.section-title').forEach((titleEl) => {
      window.gsap.from(titleEl, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: titleEl,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
      });
    });
  }
})();
