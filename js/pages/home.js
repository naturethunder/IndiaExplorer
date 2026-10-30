/**
 * home.js — page logic for index.html.
 * Loads ONLY the lightweight manifest (data/destinations/index.json).
 */
import { fetchIndex, fetchHomeIndex } from '../data/api.js';
import { initLayout } from '../components/layout.js';
import { heroCardHTML, miniCardHTML, trendCardHTML, destUrl, cardThumb, cardImg } from '../components/destinationCard.js?v=20261008_phase87';
import { applySEO, injectJsonLd, websiteJsonLd } from '../components/seo.js';
import { esc, inr, typeLabel } from '../utils/format.js';
import { icon } from '../components/icons.js';
import { resolveState, MONTH_PICKS, CUSTOM_TYPE_MATCHERS } from '../data/taxonomy.js';
import { searchDestinations } from '../utils/search.js';

const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ensure homepage always starts from the top on page load or refresh (prevent browser restoring mid-page scroll)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (!window.location.hash) {
  window.scrollTo(0, 0);
}

initLayout({ active: 'home' });

applySEO({
  title: "ExploreDesh — India's Hidden Destinations & Sanctuaries",
  description: "Uncover India's hidden gems, untouched valleys, and curated sanctuaries across 36 states. Authentic photography, bespoke stays, and honest travel guides.",
  canonicalPath: '/',
  keywords: ['hidden places in india', 'unexplored india', 'offbeat destinations india', 'curated sanctuaries', 'india travel catalogue', 'boutique stays india'],
  image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1920&q=85',
});

injectJsonLd(websiteJsonLd(), 'website');
// ─── Hero background & cinematic rotator ────────────────────
(function () {
  const bg = document.getElementById('heroBg');
  if (!bg) return;

  const HERO_PHOTOS = [
    { name: 'City Palace, Udaipur', src: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1920&q=85', state: 'Rajasthan' },
    { name: 'Hawa Mahal Palace, Jaipur', src: 'https://images.unsplash.com/photo-1695395550316-8995ae9d35ff?auto=format&fit=crop&w=1920&q=85', state: 'Rajasthan' },
    { name: 'Pangong Tso Lake', src: 'https://images.unsplash.com/photo-1595071211728-b6a417f1c6cf?auto=format&fit=crop&w=1920&q=85', state: 'Ladakh' },
    { name: 'Stone Chariot, Hampi', src: 'https://images.unsplash.com/photo-1651073231341-651e8b38b310?auto=format&fit=crop&w=1920&q=85', state: 'Karnataka' },
    { name: 'Alleppey Backwaters', src: 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1920&q=85', state: 'Kerala' },
    { name: 'Dal Lake at Dawn, Srinagar', src: 'https://images.pexels.com/photos/40348598/pexels-photo-40348598.jpeg?auto=compress&cs=tinysrgb&w=1920', state: 'Jammu & Kashmir' },
    { name: 'Key Gompa Monastery, Spiti', src: 'https://images.pexels.com/photos/38140328/pexels-photo-38140328.jpeg?auto=compress&cs=tinysrgb&w=1920', state: 'Himachal Pradesh' },
    { name: 'Amer Fort Palace, Jaipur', src: 'https://images.unsplash.com/photo-1705861145803-9f7ad1559bc6?auto=format&fit=crop&w=1920&q=85', state: 'Rajasthan' },
  ];

  let currentIdx = 0;
  bg.style.backgroundColor = '#0f3460';
  bg.style.transition = 'opacity 0.8s ease-in-out, background-image 0.8s ease-in-out';

  // Defer preloading of upcoming hero slides until after initial page load settles
  const preloadNextSlide = () => {
    const nextImg = new Image();
    nextImg.src = HERO_PHOTOS[1].src;
  };
  setTimeout(preloadNextSlide, 4500);

  function setHeroPhoto(i) {
    currentIdx = (i + HERO_PHOTOS.length) % HERO_PHOTOS.length;
    const photo = HERO_PHOTOS[currentIdx];
    bg.style.backgroundImage = 'url("' + photo.src + '")';

    const indicatorEl = document.getElementById('hero-photo-indicator');
    if (indicatorEl) {
      indicatorEl.innerHTML = `
        <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/85 border border-amber-400/35 backdrop-blur-md shadow-xl text-xs font-semibold text-white">
          <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" width="14" height="14" style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="inline-flex items-center gap-1.5"><span class="text-amber-400 font-bold uppercase tracking-wider text-[10px]">FEATURED:</span> <strong class="text-amber-300 font-bold">${photo.name}</strong> <span class="text-white/60">(${photo.state})</span></span>
        </div>
        <div class="flex items-center gap-1 ml-2">
          ${HERO_PHOTOS.map((_, idx) => `
            <button type="button" data-hero-idx="${idx}" class="hero-dot-btn ${idx === currentIdx ? 'active' : ''}" aria-label="Slide ${idx + 1}" ${idx === currentIdx ? 'aria-current="true"' : ''}>
              <span class="hero-dot-pill"></span>
            </button>
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
    heroSection.addEventListener('focusin', () => clearInterval(timer));
    heroSection.addEventListener('focusout', (e) => {
      if (!heroSection.contains(e.relatedTarget)) {
        startTimer();
      }
    });
  }

  setHeroPhoto(0);
  startTimer();
})();

// ─── Pre-populate grids with shimmer skeletons while index.json loads ─
// UI/UX skill §3: progressive-loading — show skeleton instead of blank space
function injectSkeletons() {
  const heroGridIds = ['hills-grid'];
  const trendId = 'trending-grid';
  const seasonId = 'season-grid';
  const miniId = 'explore-grid';
  const budgetId = 'budget-grid';
  const monthId = 'month-rail';

  const popEl = document.getElementById('popular-grid');
  if (popEl && !popEl.children.length) {
    popEl.innerHTML = '<div class="skeleton-card" style="width:324px;height:468px;border-radius:26px;"></div>';
  }

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
    budget.innerHTML = [1, 2, 3, 4, 5, 6].map(() =>
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
let isFullIndexLoaded = false;
try {
  // Ultra-fast instant initial render (~148 KB payload instead of 4 MB)
  idx = await fetchHomeIndex();
} catch (err) {
  try {
    idx = await fetchIndex();
    isFullIndexLoaded = true;
  } catch (fallbackErr) {
    console.warn('[home] manifest failed to load:', fallbackErr);
    const main = document.getElementById('main');
    if (main) main.insertAdjacentHTML('beforeend',
      '<p class="text-center py-16" style="color:rgba(255,255,255,0.6)">Couldn\'t load destinations. Please refresh the page.</p>');
    throw fallbackErr;
  }
}

let summaries = idx.destinations;
const STATES = idx.meta.states;
const MONTHS = idx.meta.months || [];
let bySlug = new Map(summaries.map((d) => [d.slug, d]));

// Count destinations in a state (for the "view all in <state>" suggestion).
function stateCount(state) {
  if (idx.meta && idx.meta.stateCounts && idx.meta.stateCounts[state] != null) {
    return idx.meta.stateCounts[state];
  }
  return summaries.reduce((n, d) => n + (d.state === state ? 1 : 0), 0);
}
function stateUrl(state) { return 'destinations.html?state=' + encodeURIComponent(state); }

function search(q) {
  return searchDestinations(summaries, q);
}

// Background promotion: load full 2,396 index only on search engagement or deferred 8s idle
function loadFullCatalog() {
  if (isFullIndexLoaded) return;
  fetchIndex().then((fullIdx) => {
    if (!fullIdx || !fullIdx.destinations) return;
    isFullIndexLoaded = true;
    summaries = fullIdx.destinations;
    bySlug = new Map(summaries.map((d) => [d.slug, d]));
    if (fullIdx.count) idx.count = fullIdx.count;
  }).catch(() => { });
}

// On-demand: start loading full catalogue when user focuses search
const searchIn = document.getElementById('searchInput');
if (searchIn) {
  searchIn.addEventListener('focus', loadFullCatalog, { once: true, passive: true });
  searchIn.addEventListener('input', loadFullCatalog, { once: true, passive: true });
}

// Secondary deferred fallback only after initial page completely settles (8 seconds)
if (!isFullIndexLoaded) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadFullCatalog, { timeout: 8000 });
  } else {
    setTimeout(loadFullCatalog, 8000);
  }
}

// ─── Hero inline stats ────────────────────────────────────
(function () {
  const el = document.getElementById('hero-stats');
  if (!el) return;
  const totalDestCount = (idx && idx.count) || (summaries ? summaries.length : 2396);
  const stats = [
    { ic: 'map-pin', raw: totalDestCount, suffix: '', label: 'Destinations' },
    { ic: 'landmark', raw: (STATES ? STATES.length : 36), suffix: '', label: 'States' },
    { ic: 'mountain', raw: 14037, suffix: '+', label: 'Places' },
    { ic: 'bed', raw: 10439, suffix: '+', label: 'Stays' },
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
    { type: 'recently_updated', ic: 'sparkles', tint: 'tint-amber', label: 'Recently Updated', countKey: 'recently_updated' },
    { type: 'hill_station', ic: 'mountain', tint: 'tint-green', label: 'Hill Stations' },
    { type: 'beach', ic: 'waves', tint: 'tint-blue', label: 'Beaches' },
    { type: 'heritage', ic: 'landmark', tint: 'tint-orange', label: 'Heritage' },
    { type: 'wildlife', ic: 'paw-print', tint: 'tint-amber', label: 'Wildlife' },
    { type: 'spiritual', ic: 'temple', tint: 'tint-rose', label: 'Spiritual' },
    { type: 'adventure', ic: 'tent', tint: 'tint-purple', label: 'Adventure' },
    { type: 'road_trips', ic: 'car', tint: 'tint-blue', label: 'Road Trips', countKey: 'road_trips' },
    { type: 'camping', ic: 'tent', tint: 'tint-slate', label: 'Camping', countKey: 'camping' },
    { type: 'forts', ic: 'gem', tint: 'tint-amber', label: 'Forts & Palaces', countKey: 'forts' },
    { type: 'ecotourism', ic: 'flower', tint: 'tint-green', label: 'Ecotourism', countKey: 'ecotourism' }
  ];
  // Live counts from the manifest — use pre-calculated counts if available from home-manifest
  const counts = (idx.meta && idx.meta.categoryCounts) ? { ...idx.meta.categoryCounts } : {};
  if (!idx.meta || !idx.meta.categoryCounts) {
    idx.destinations.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
  }
  const customCounts = (idx.meta && idx.meta.customCounts) ? { ...idx.meta.customCounts } : {};
  if (idx.meta && Array.isArray(idx.meta.updatedTimes)) {
    customCounts.recently_updated = idx.meta.updatedTimes.filter(t => CUSTOM_TYPE_MATCHERS.recently_updated({ updatedAt: t })).length;
  } else if (!idx.meta || !idx.meta.customCounts) {
    Object.keys(CUSTOM_TYPE_MATCHERS).forEach((key) => {
      customCounts[key] = idx.destinations.filter(CUSTOM_TYPE_MATCHERS[key]).length;
    });
  }

  const totalCount = idx.count || summaries.length || 2396;

  el.innerHTML = cats
    .filter((c) => {
      if (c.type === 'recently_updated') {
        const count = customCounts.recently_updated || 0;
        return count > 0;
      }
      return true;
    })
    .map((c) => {
      const n = c.countKey === 'all'
        ? totalCount
        : c.countKey === 'corridor'
          ? ((idx.meta && idx.meta.corridorCounts && idx.meta.corridorCounts[c.corridorId]) || (c.corridorId === 'northern-alpine' ? 174 : c.corridorId === 'royal-heritage' ? 252 : c.corridorId === 'coastal-ghats' ? 1294 : 117))
          : c.countKey
            ? (customCounts[c.countKey] || (counts[c.type] || 0))
            : (counts[c.type] || 0);
      const badge = c.badge
        ? '<span class="category-chip-badge badge-' + c.badge + '">' + (c.badge === 'new' ? 'New' : 'Popular') + '</span>'
        : '';
      const href = c.type === ''
        ? 'destinations.html'
        : c.type === 'recently_updated'
          ? 'destinations.html?type=recently_updated&sort=latest'
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
        'data-fallback-src="' + esc(cardImg(d)) + '" ' +
        'onerror="if(this.dataset.fallback){this.onerror=null;this.style.display=\'none\';}else{this.dataset.fallback=\'1\';this.src=this.dataset.fallbackSrc;}" />' +
        '<div class="text-left flex-1 min-w-0">' +
        '<div class="font-semibold text-gray-900 text-sm">' + esc(d.title) + '</div>' +
        '<div class="text-xs text-gray-500 truncate">' + esc(d.state) + ' · ' + esc((d.short || '').slice(0, 50)) + '...</div>' +
        '</div>' +
        '<span class="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">Explore <svg class="inline-block w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>' +
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
  input.addEventListener('focus', function () {
    loadFullCatalog();
    onInput();
  });
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
  window.addEventListener('scroll', function () {
    if (drop.style.display === 'block') close();
  }, { passive: true });
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

    const activeBtn = pillsEl.querySelector('.month-pill.is-active');
    if (activeBtn) {
      const scrollContainer = pillsEl.closest('.monthly-pills-scroll') || pillsEl.parentElement;
      if (scrollContainer) {
        requestAnimationFrame(() => {
          const containerRect = scrollContainer.getBoundingClientRect();
          const btnRect = activeBtn.getBoundingClientRect();
          const targetLeft = (btnRect.left - containerRect.left) + scrollContainer.scrollLeft - (scrollContainer.clientWidth / 2) + (btnRect.width / 2);
          scrollContainer.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        });
      }
    }
  }

  function renderMonthRail(monthNum) {
    const m = MONTHS.find((x) => x.num === monthNum);
    const monthName = m ? m.name : 'This Month';
    const isCurrent = monthNum === currentRealMonth;

    const nameEl = document.getElementById('railMonthName');
    if (nameEl) nameEl.textContent = monthName;

    const btnNameEl = document.getElementById('railMonthBtnName');
    if (btnNameEl) btnNameEl.textContent = monthName;

    const allEl = document.getElementById('railMonthAll');
    if (allEl) allEl.href = 'destinations.html?month=' + monthNum;

    // Dynamic Month Shuffling: Filter quality destinations for this month and shuffle on every refresh/selection
    const monthCandidates = summaries.filter((d) => {
      const inMonth = d.bestTime && d.bestTime.months && d.bestTime.months.includes(monthNum);
      const hasPhoto = d.heroImage && d.heroImage.src;
      return inMonth && hasPhoto;
    });

    const qualityPool = monthCandidates.filter((d) => (d.rating >= 4.4 && (d.reviewCount >= 20 || d.badge)) || d.badge);
    const pool = qualityPool.length >= 8 ? qualityPool : (monthCandidates.length >= 4 ? monthCandidates : summaries);
    const picks = shuffleArray(pool).slice(0, 10);

    railEl.style.opacity = '0.4';
    setTimeout(() => {
      railEl.innerHTML = picks.map((d) => trendCardHTML(d, { priority: false })).join('');
      railEl.scrollLeft = 0;
      railEl.style.opacity = '1';
      if (typeof updateMonthCarousel === 'function') updateMonthCarousel();
    }, 120);

  }

  const updateMonthCarousel = wireCarousel(railEl, document.getElementById('month-prev'), document.getElementById('month-next'));
  renderMonthPills();
  renderMonthRail(activeMonth);
})();


// ─── Explore India interactive map ────────────────────────
(async function () {
  const svgEl = document.getElementById('india-map');
  if (!svgEl) return;
  try {
    const { initIndiaMap } = await import('../components/indiaMap.js?v=20261023_1click');
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
  row.innerHTML = selected.map(function (d, i) { return trendCardHTML(d, { priority: i < 2 }); }).join('');
  wireCarousel(row, document.getElementById('trend-prev'), document.getElementById('trend-next'));
})();

// ─── Travel this season ───────────────────────────────────
(function () {
  const el = document.getElementById('season-grid');
  if (!el) return;
  // Season → representative months, a fitting lead destination, and label.
  const seasons = [
    { name: 'Spring Blooms', range: 'March – April', ic: 'flower', season: 'Spring', months: [3, 4], lead: ['darjeeling', 'coorg', 'kanatal'] },
    { name: 'Summer Escapes', range: 'April – June', ic: 'sun', season: 'Summer', months: [4, 5, 6], lead: ['manali', 'ladakh', 'shimla'] },
    { name: 'Monsoon Magic', range: 'July – September', ic: 'cloud-rain', season: 'Monsoon', months: [7, 8, 9], lead: ['munnar', 'coorg', 'lonavala'] },
    { name: 'Autumn Splendor', range: 'October – November', ic: 'sparkles', season: 'Autumn', months: [10, 11], lead: ['udaipur', 'ranthambore', 'varanasi'] },
    { name: 'Winter Wonderland', range: 'December – February', ic: 'snowflake', season: 'Winter', months: [12, 1, 2], lead: ['gulmarg', 'jaisalmer', 'auli'] },
  ];
  el.innerHTML = seasons.map((s) => {
    const lead = (s.lead || []).map((sl) => bySlug.get(sl)).find(Boolean) || summaries[0];
    const leadHero = lead && (typeof lead.heroImage === 'string' ? lead.heroImage : (lead.heroImage && lead.heroImage.src));
    const leadImg = lead && (typeof lead.image === 'string' ? lead.image : (lead.image && lead.image.src));
    const src = lead ? cardThumb(lead, 800) : (leadHero || leadImg || '');
    const seasonParam = encodeURIComponent(s.season || s.name.split(' ')[0]);
    return '<a href="destinations.html?season=' + seasonParam + '" class="season-card group" aria-label="' + esc(s.name) + ' (' + esc(s.range) + ')">' +
      '<img src="' + esc(src) + '" alt="' + esc(lead ? lead.title + ', ' + lead.state : s.name) + '" loading="lazy" class="season-card-img" ' +
      'onerror="this.onerror=null;this.style.display=\'none\';" />' +
      '<div class="season-card-overlay"></div>' +
      '<div class="season-card-badge" aria-hidden="true">' + icon(s.ic, { size: 16 }) + '</div>' +
      '<div class="season-card-content">' +
      '<h3 class="season-card-title">' + esc(s.name) + '</h3>' +
      '<p class="season-card-range">' + esc(s.range) + '</p>' +
      '<span class="season-explore"><span>Explore</span>' +
      icon('arrow-right', { size: 14 }) + '</span>' +
      '</div>' +
      '</a>';
  }).join('');
})();

// ─── Browse by budget ─────────────────────────────────────
(function () {
  const el = document.getElementById('budget-grid');
  if (!el) return;
  const tiers = [
    { tier: 'budget', label: 'Budget', ic: 'tent', tint: 'tint-green' },
    { tier: 'good', label: 'Mid-Range', ic: 'bed', tint: 'tint-blue' },
    { tier: 'better', label: 'Comfort', ic: 'wallet', tint: 'tint-amber' },
    { tier: 'best', label: 'Premium', ic: 'star', tint: 'tint-orange' },
    { tier: 'luxury', label: 'Luxury', ic: 'gem', tint: 'tint-rose' },
    { tier: 'extra_luxury', label: 'Ultra Luxury', ic: 'crown', tint: 'tint-purple' },
  ];
  el.innerHTML = tiers.map((t) => {
    const sub = (idx.meta && idx.meta.priceTiers && idx.meta.priceTiers[t.tier] && idx.meta.priceTiers[t.tier].range) || '';
    return '<a href="destinations.html?tier=' + t.tier + '" class="budget-card group">' +
      '<span class="w-11 h-11 rounded-full ' + t.tint + ' flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">' +
      icon(t.ic, { size: 22 }) + '</span>' +
      '<div class="font-bold text-sm text-gray-900">' + esc(t.label) + '</div>' +
      '<div class="text-xs text-gray-500 mt-1">' + esc(sub) + '</div>' +
      '</a>';
  }).join('');
})();

// ─── Hills grid (large cards - Dynamic Reshuffle on Refresh) ─
(function () {
  const el = document.getElementById('hills-grid');
  if (!el) return;

  const hillsPool = summaries.filter(function (d) {
    const isHill = d.type === 'hill_station' || d.type === 'hillstation' ||
      (d.category && /hill/i.test(d.category)) ||
      (Array.isArray(d.types) && d.types.some(t => /hill/i.test(t)));
    const hasPhoto = d.heroImage && d.heroImage.src;
    // Exclude major non-hill plains or heritage cities that happen to have hills nearby
    const excluded = ['mysore', 'tirupati', 'madurai', 'varanasi', 'delhi', 'agra', 'jaipur', 'jodhpur', 'patna', 'gaya'];
    return isHill && hasPhoto && !excluded.includes(d.slug);
  });

  const selectedHills = shuffleArray(hillsPool.length >= 10 ? hillsPool : summaries.filter(d => d.type.includes('hill'))).slice(0, 10);
  el.innerHTML = selectedHills.map(function (d) { return heroCardHTML(d, { priority: false }); }).join('');
  wireCarousel(el, document.getElementById('hills-prev'), document.getElementById('hills-next'));
})();

// ─── Popular 3D Fan-Out / Coverflow Showcase (Figma 'Dekho Apna Desh' design) ─
(function () {
  const el = document.getElementById('popular-grid');
  if (!el) return;

  const popularPool = summaries.filter(function (d) {
    const isPopular = d.badge === 'Popular' || d.badge === 'Featured' || d.rating >= 4.6;
    const hasPhoto = d.heroImage && d.heroImage.src;
    return isPopular && hasPhoto;
  });

  const selectedPopular = shuffleArray(popularPool.length >= 10 ? popularPool : summaries).slice(0, 10);

  // Render cards matching the Figma coverflow design
  el.innerHTML = selectedPopular.map(function (d, i) {
    const rawImage = cardImg(d);
    const image = cardThumb(d, 640) || rawImage;
    const altText = (d.heroImage && d.heroImage.alt) || d.title;
    let badgeLabel = d.badge || 'Must Visit';
    if (!badgeLabel || /popular/i.test(badgeLabel)) badgeLabel = 'Must Visit';

    return (
      '<div class="popular-3d-card" data-no-gsap data-index="' + i + '" data-slug="' + esc(d.slug) + '" role="group" aria-label="' + esc(d.title) + ', ' + esc(d.state) + '" tabindex="0">' +
      '<img src="' + esc(image) + '" alt="' + esc(altText) + '" class="popular-3d-img" ' + (i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" data-fallback-src="' + esc(rawImage) + '" onerror="if(this.dataset.fallback){this.onerror=null;}else{this.dataset.fallback=\'1\';this.src=this.dataset.fallbackSrc;}" />' +
      '<div class="popular-3d-scrim" aria-hidden="true"></div>' +
      '<div class="popular-3d-dim" aria-hidden="true"></div>' +
      '<div class="popular-3d-badge">' +
      '<svg class="icon star-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" aria-hidden="true">' +
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' +
      '</svg>' +
      '<span>' + esc(badgeLabel) + '</span>' +
      '</div>' +
      '<div class="popular-3d-content">' +
      '<span class="popular-3d-state" style="color:#E5C07B !important;">' + esc(d.state) + '</span>' +
      '<h3 class="popular-3d-title" style="color:#FFFFFF !important; text-shadow:0 2px 14px rgba(0,0,0,0.85);">' + esc(d.title) + '</h3>' +
      '<p class="popular-3d-desc" style="color:rgba(255,255,255,0.92) !important; text-shadow:0 1px 8px rgba(0,0,0,0.7);">' + esc(d.short || '') + '</p>' +
      '<div class="popular-3d-actions">' +
      '<a href="' + destUrl(d.slug) + '" class="popular-3d-explore" aria-label="Explore ' + esc(d.title) + '">' +
      '<span>Explore</span>' +
      '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>' +
      '</svg>' +
      '</a>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }).join('');

  // Render bottom elongated pill pagination dots
  const dotsEl = document.getElementById('popular-dots');
  if (dotsEl) {
    dotsEl.innerHTML = selectedPopular.map(function (_, i) {
      return '<button type="button" class="popular-3d-dot' + (i === 0 ? ' is-active' : '') + '" data-index="' + i + '" aria-label="Go to destination ' + (i + 1) + ' of ' + selectedPopular.length + '"></button>';
    }).join('');
  }

  const cards = Array.from(el.querySelectorAll('.popular-3d-card'));
  const dots = dotsEl ? Array.from(dotsEl.querySelectorAll('.popular-3d-dot')) : [];
  let currentIndex = 0;

  function updateShowcase(immediate) {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    const isSmallScreen = window.innerWidth < 1024;
    const total = cards.length;

    cards.forEach(function (card, i) {
      let diff = i - currentIndex;
      while (diff > total / 2) diff -= total;
      while (diff < -total / 2) diff += total;

      const absDiff = Math.abs(diff);
      const sign = diff >= 0 ? 1 : -1;
      let x = 0;
      let y = 0;
      let z = 0;
      let scale = 1;
      let rotateY = 0;
      let rotateZ = 0;
      let opacity = 1;
      let zIndex = 10;
      let pointerEvents = 'auto';

      if (diff === 0) {
        x = 0;
        y = 0;
        z = isMobile ? 120 : (isTablet ? 90 : 40);
        scale = 1.0;
        rotateY = 0;
        rotateZ = 0;
        opacity = 1;
        zIndex = 50;
        card.classList.add('is-active');
      } else if (absDiff === 1) {
        const spacing = isMobile ? 115 : (isTablet ? 170 : 205);
        x = sign * spacing;
        y = isMobile ? 6 : 8;
        z = isMobile ? -120 : (isTablet ? -80 : -30);
        scale = isMobile ? 0.84 : 0.88;
        rotateY = -sign * (isMobile ? 12 : 16);
        rotateZ = sign * (isMobile ? 2.5 : 3.5);
        opacity = isMobile ? 0.60 : 0.90;
        zIndex = isSmallScreen ? 10 : 20;
        card.classList.remove('is-active');
      } else if (absDiff === 2) {
        const spacing = isMobile ? 220 : (isTablet ? 310 : 385);
        x = sign * spacing;
        y = isMobile ? 14 : 20;
        z = isMobile ? -220 : (isTablet ? -160 : -70);
        scale = isMobile ? 0.70 : 0.77;
        rotateY = -sign * (isMobile ? 18 : 25);
        rotateZ = sign * (isMobile ? 5 : 7);
        opacity = isMobile ? 0 : (isTablet ? 0.45 : 0.72);
        zIndex = isSmallScreen ? 5 : 14;
        pointerEvents = isMobile ? 'none' : 'auto';
        card.classList.remove('is-active');
      } else if (absDiff === 3) {
        const spacing = isTablet ? 430 : 540;
        x = sign * spacing;
        y = 32;
        z = isSmallScreen ? -320 : -140;
        scale = 0.67;
        rotateY = -sign * 32;
        rotateZ = sign * 10;
        opacity = isSmallScreen ? 0 : 0.52;
        zIndex = 8;
        pointerEvents = isSmallScreen ? 'none' : 'auto';
        card.classList.remove('is-active');
      } else if (absDiff === 4) {
        x = sign * 670;
        y = 42;
        z = -220;
        scale = 0.58;
        rotateY = -sign * 36;
        rotateZ = sign * 12;
        opacity = isSmallScreen ? 0 : 0.35;
        zIndex = 4;
        pointerEvents = isSmallScreen ? 'none' : 'auto';
        card.classList.remove('is-active');
      } else {
        x = sign * 780;
        y = 50;
        z = -300;
        scale = 0.50;
        rotateY = -sign * 38;
        rotateZ = sign * 14;
        opacity = 0;
        zIndex = 1;
        pointerEvents = 'none';
        card.classList.remove('is-active');
      }

      card.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(' + z + 'px) scale(' + scale + ') rotateY(' + rotateY + 'deg) rotateZ(' + rotateZ + 'deg)';
      card.style.opacity = opacity;
      card.style.zIndex = zIndex;
      card.style.pointerEvents = pointerEvents;
    });

    dots.forEach(function (dot, dIdx) {
      dot.classList.toggle('is-active', dIdx === currentIndex);
    });
  }

  // Initial layout immediate
  updateShowcase(true);

  // Card click: clicking side card brings it to center; active card allows link click
  cards.forEach(function (card, idx) {
    card.addEventListener('click', function (e) {
      if (idx !== currentIndex) {
        e.preventDefault();
        currentIndex = idx;
        updateShowcase();
      }
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (idx !== currentIndex) {
          e.preventDefault();
          currentIndex = idx;
          updateShowcase();
        }
      }
    });
  });

  // Navigation button handlers
  const prevBtn = document.getElementById('popular-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateShowcase();
    });
  }

  const nextBtn = document.getElementById('popular-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      currentIndex = (currentIndex + 1) % cards.length;
      updateShowcase();
    });
  }

  // Dots navigation
  dots.forEach(function (dot, idx) {
    dot.addEventListener('click', function () {
      currentIndex = idx;
      updateShowcase();
    });
  });

  // Keyboard navigation when container focused
  el.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateShowcase();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % cards.length;
      updateShowcase();
    }
  });

  // Touch Swipe on showcase wrap
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  const wrap = document.getElementById('popular-showcase-wrap') || el;

  wrap.addEventListener('touchstart', function (e) {
    if (!e.touches || !e.touches[0]) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  wrap.addEventListener('touchend', function (e) {
    if (!isSwiping || !e.changedTouches || !e.changedTouches[0]) return;
    isSwiping = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        currentIndex = (currentIndex + 1) % cards.length;
      } else {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      }
      updateShowcase();
    }
  }, { passive: true });

  // Responsive resize update
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      updateShowcase(true);
    }, 150);
  });

  // GSAP ScrollTrigger intro: gentle fade-in (no transform to avoid coverflow transform conflicts)
  if (window.ScrollTrigger && window.gsap && typeof window.gsap.fromTo === 'function') {
    window.ScrollTrigger.create({
      trigger: '#popular-showcase-section',
      start: 'top 85%',
      once: true,
      onEnter: function () {
        // First call updateShowcase to set correct transforms, THEN fade in
        updateShowcase(true);
        window.gsap.fromTo(cards, {
          opacity: 0
        }, {
          opacity: function (i, el) {
            // Active card: 1, neighbor ±1: 0.85, neighbor ±2: 0.55, etc.
            // Let updateShowcase handle opacity via inline style — just fade in from 0
            return parseFloat(el.style.opacity) || 1;
          },
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'opacity'
        });
      }
    });
  }
})();

// ─── Explore grid (small cards - Dynamic Reshuffle on Refresh) ─
(function () {
  const el = document.getElementById('explore-grid');
  if (!el) return;

  const explorePool = summaries.filter(function (d) { return d.heroImage && d.heroImage.src; });
  const selectedExplore = shuffleArray(explorePool).slice(0, 12);
  el.innerHTML = selectedExplore.map(function (d) { return miniCardHTML(d, { priority: false }); }).join('');
  wireCarousel(el, document.getElementById('explore-prev'), document.getElementById('explore-next'));
})();

// Grids above are populated synchronously right after the index fetch resolves;
// let ScrollTrigger recompute trigger positions now that real card heights exist
// (skeletons had different heights while loading).
if (window.ScrollTrigger) window.ScrollTrigger.refresh();

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
  return update;
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
  const heroTL = window.gsap.timeline({ delay: 0.05, defaults: { ease: 'power2.out' } });

  if (document.querySelector('.hero-luxury-eyebrow')) {
    heroTL.from('.hero-luxury-eyebrow', { opacity: 0, y: -14, duration: 0.5 });
  } else if (document.querySelector('.hero-eyebrow-pill')) {
    heroTL.from('.hero-eyebrow-pill', { opacity: 0, y: -12, duration: 0.45 });
  }

  if (document.querySelector('.hero-home-title')) {
    heroTL.from('.hero-home-title', {
      opacity: 0,
      y: 24,
      duration: 0.6
    }, '-=0.25');
  }

  if (document.querySelector('.hero-home p')) {
    heroTL.from('.hero-home p', {
      opacity: 0,
      y: 16,
      duration: 0.5
    }, '-=0.35');
  }

  if (document.querySelector('.hero-search-seg')) {
    heroTL.from('.hero-search-seg', {
      y: 12,
      duration: 0.45
    }, '-=0.2');
  }

  if (document.querySelector('#popular-searches')) {
    heroTL.from('#popular-searches', {
      opacity: 0,
      y: 12,
      duration: 0.45
    }, '-=0.25');
  }

  if (document.querySelector('#hero-stats')) {
    heroTL.from('#hero-stats', {
      opacity: 0,
      y: 14,
      duration: 0.5
    }, '-=0.25');
  }

  if (document.querySelector('#hero-photo-indicator')) {
    heroTL.from('#hero-photo-indicator', {
      opacity: 0,
      y: 10,
      duration: 0.45
    }, '-=0.25');
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

  // 3. Hero Depth Parallax on Scroll (Hardware accelerated, 1:1 scrub, no inertia lag)
  if (window.ScrollTrigger && document.getElementById('heroBg')) {
    window.gsap.to('#heroBg', {
      yPercent: 18,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: '.hero-home',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

  // 4. ScrollTrigger Staggered Section Entrances
  if (window.ScrollTrigger) {
    // Category strip chips
    const catStrip = document.getElementById('category-strip');
    if (catStrip && catStrip.children.length) {
      window.gsap.fromTo(catStrip.children, {
        opacity: 0,
        y: 18,
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.025,
        duration: 0.45,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: catStrip,
          start: 'top 92%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    }

    // Grid sections staggered reveal (animating visible cards only, clearProps on complete)
    const gridSelectors = [
      '#trending-grid',
      '#month-rail',
      '#season-grid',
      '#budget-grid',
      '#hills-grid',
      '#explore-grid',
    ];

    gridSelectors.forEach((selector) => {
      const container = document.querySelector(selector);
      if (!container || !container.children.length) return;

      const items = Array.from(container.children).slice(0, 6);
      window.gsap.fromTo(items, {
        opacity: 0,
        y: 22,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.48,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: container,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });

    // Interactive Map reveal
    const mapInner = document.querySelector('.discover-map-inner');
    if (mapInner) {
      window.gsap.from(mapInner, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: mapInner,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    }

    // Section Titles and headers reveal
    document.querySelectorAll('.section-title').forEach((titleEl) => {
      if (titleEl.closest('.reveal')) return;
      window.gsap.from(titleEl, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: titleEl,
          start: 'top 92%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });

    // 3D Magnetic Cursor Tilt for Home Glass Cards (isolated GPU layer on hover)
    if (!window.matchMedia('(hover: none) or (pointer: coarse)').matches) {
      function initTilt(selector) {
        document.querySelectorAll(selector).forEach((card) => {
          if (card.dataset.tiltInitted) return;
          card.dataset.tiltInitted = '1';

          let bounds = null;
          window.gsap.set(card, { transformPerspective: 1000 });
          const rxTo = window.gsap.quickTo(card, 'rotateX', { duration: 0.25, ease: 'power1.out' });
          const ryTo = window.gsap.quickTo(card, 'rotateY', { duration: 0.25, ease: 'power1.out' });

          card.addEventListener('mouseenter', () => {
            card.style.willChange = 'transform';
            bounds = card.getBoundingClientRect();
          });

          card.addEventListener('mousemove', (e) => {
            if (!bounds) bounds = card.getBoundingClientRect();
            const mouseX = e.clientX - bounds.left;
            const mouseY = e.clientY - bounds.top;
            const xPct = (mouseX / bounds.width - 0.5) * 2;
            const yPct = (mouseY / bounds.height - 0.5) * 2;
            ryTo(xPct * 3.5);
            rxTo(-yPct * 3.5);
          });

          card.addEventListener('mouseleave', () => {
            bounds = null;
            rxTo(0);
            ryTo(0);
            card.style.willChange = '';
          });
        });
      }
      initTilt('.trend-card, .hero-hill-card, .mini-card');
      window.__initCardTilt = initTilt;
    }

    // Debounced refresh once images settle
    setTimeout(() => {
      window.ScrollTrigger.refresh();
    }, 300);
  }

  // ─── FAQ Accordion Accessibility & Interactive Handler ──────────
  function initFaqAccordion() {
    const triggers = document.querySelectorAll('.faq-trigger');
    triggers.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const targetId = btn.getAttribute('aria-controls');
        const content = document.getElementById(targetId);
        if (!content || !item) return;

        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        // Toggle state
        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          content.classList.add('hidden');
          item.classList.remove('is-open');
        } else {
          btn.setAttribute('aria-expanded', 'true');
          content.classList.remove('hidden');
          item.classList.add('is-open');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
  } else {
    initFaqAccordion();
  }

})();
