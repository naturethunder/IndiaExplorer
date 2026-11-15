/**
 * js/pages/hotels.js
 * ============================================================
 * Hotels Discovery Page Engine for ExploreDesh
 * Interactive Leaflet Mapping, Multi-Facet Filters, & Luxury Cards
 *
 * Invariant: 100% Free, Zero Paid APIs, Zero Fabricated Data
 */

import { initLayout } from '../components/layout.js';
import { icon } from '../components/icons.js';
import { esc, inr } from '../utils/format.js';

let allHotels = [];
let filteredHotels = [];
let activeCategory = 'all';
let maxDistanceKm = 50;
let searchQuery = '';
let activeDestination = null;
let mapInstance = null;
let currentTileLayer = null;
let markersLayer = null;
let currentViewMode = 'split'; // 'list' | 'split' | 'map'

// Category Icons lookup
function getCategoryIcon(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('resort')) return icon('crown', { size: 14 });
  if (c.includes('guest')) return icon('home', { size: 14 });
  if (c.includes('hostel')) return icon('users', { size: 14 });
  if (c.includes('homestay')) return icon('heart', { size: 14 });
  return icon('bed', { size: 14 });
}

// Clean placeholder SVG card for hotels without photo
function renderCategoryPlaceholder(category) {
  const cat = esc(category || 'Hotel');
  return `
    <div class="w-full h-36 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-white/5 flex flex-col items-center justify-center gap-2 mb-3 select-none">
      <div class="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
        ${getCategoryIcon(category)}
      </div>
      <span class="text-xs font-semibold text-amber-300/80 tracking-wide uppercase">${cat}</span>
    </div>
  `;
}

// Extract slug from query param or pathname
function getRequestedSlug() {
  const params = new URLSearchParams(window.location.search);
  const qSlug = params.get('destination') || params.get('slug') || params.get('id');
  if (qSlug) return qSlug.toLowerCase().trim();

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const last = pathParts[pathParts.length - 1];
  if (pathParts.length >= 2 && pathParts[0] === 'hotels' && last && !last.endsWith('.html')) {
    return last.toLowerCase().trim();
  }
  return null;
}

// Pure OpenStreetMap Standard & Humanitarian Tiles (100% Free, Zero API Key Required)
function applyMapTiles() {
  if (!mapInstance || typeof L === 'undefined') return;
  if (currentTileLayer) {
    try {
      mapInstance.removeLayer(currentTileLayer);
    } catch (_) { }
  }

  // Primary: Official OpenStreetMap Standard Tiles
  // Note: referrerPolicy: 'origin-when-cross-origin' is required by OSM Tile Usage Policy
  // to pass legitimate origin headers and prevent volunteer server 403 blocks.
  currentTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin: true,
    referrerPolicy: 'origin-when-cross-origin',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  });

  // Resilient fallback: If standard OSM volunteer server encounters high load or rate limits,
  // automatically failover to Humanitarian OpenStreetMap Team (HOT OSM) — also 100% Free, Zero API Key.
  currentTileLayer.on('tileerror', function () {
    if (!this._hasFallenBack) {
      this._hasFallenBack = true;
      try {
        mapInstance.removeLayer(this);
      } catch (_) { }
      currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        subdomains: 'abc',
        maxZoom: 19,
        crossOrigin: true,
        referrerPolicy: 'origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noopener">Humanitarian OpenStreetMap Team</a>'
      }).addTo(mapInstance);
    }
  });

  currentTileLayer.addTo(mapInstance);
}

// Initialize Leaflet Map
function initLeafletMap(centerLat, centerLng) {
  if (typeof L === 'undefined') return;

  const mapContainer = document.getElementById('placesMap');
  if (!mapContainer) return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    currentTileLayer = null;
  }

  mapInstance = L.map('placesMap', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([centerLat, centerLng], 13);

  applyMapTiles();

  markersLayer = L.layerGroup().addTo(mapInstance);

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 250);
}

// Update Map Markers for current filtered venues
function updateMapMarkers() {
  if (!mapInstance || !markersLayer || typeof L === 'undefined') return;

  markersLayer.clearLayers();
  const bounds = [];

  filteredHotels.forEach(hotel => {
    if (hotel.latitude == null || hotel.longitude == null) return;

    const latLng = [hotel.latitude, hotel.longitude];
    bounds.push(latLng);

    const customIcon = L.divIcon({
      className: 'custom-pin-wrapper',
      html: `<div class="custom-pin-hotel" title="${esc(hotel.name)}">${icon('bed', { size: 14 })}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    const googleDirUrl = hotel.url || (hotel.latitude && hotel.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + (hotel.destination || '') + ' ' + (hotel.state || ''))}`);

    const popupHtml = `
      <div style="min-width: 200px; padding: 4px;">
        <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #F5C542; letter-spacing: 0.05em;">${esc(hotel.category)}</span>
        <h4 style="margin: 4px 0 6px; font-size: 14px; font-weight: bold;">${esc(hotel.name)}</h4>
        ${hotel.priceMin ? `<p style="font-size: 12px; font-weight: bold; color: #10B981; margin: 2px 0;">₹${inr(hotel.priceMin)}${hotel.priceMax && hotel.priceMax > hotel.priceMin ? ` – ₹${inr(hotel.priceMax)}` : ''} <span style="font-size: 10px; color: #94A3B8; font-weight: normal;">/ night</span></p>` : ''}
        ${hotel.rating ? `<p style="font-size: 11px; color: #F5C542; margin-bottom: 6px;">★ ${hotel.rating}${hotel.reviews ? ` (${inr(hotel.reviews)} reviews)` : ''}</p>` : ''}
        <p style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">${hotel.distance_km ? `${hotel.distance_km} km from destination center` : (hotel.address || '')}</p>
        <a href="${googleDirUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 11px; font-weight: bold; color: #080A0F; background: #F5C542; padding: 4px 10px; border-radius: 6px; text-decoration: none;">View on Maps ↗</a>
      </div>
    `;

    const marker = L.marker(latLng, { icon: customIcon })
      .bindPopup(popupHtml);

    markersLayer.addLayer(marker);
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

// Render venue cards
function renderCards() {
  const container = document.getElementById('venueCardList');
  const countEl = document.getElementById('resultsCount');
  if (!container) return;

  if (countEl) {
    countEl.textContent = `${filteredHotels.length} ${filteredHotels.length === 1 ? 'Stay' : 'Stays'} Available`;
  }

  if (filteredHotels.length === 0) {
    container.innerHTML = `
      <div class="place-venue-card text-center py-12">
        <div class="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
          ${icon('search', { size: 28 })}
        </div>
        <h3 class="text-lg font-bold text-white mb-1">No stays matching your criteria</h3>
        <p class="text-sm text-gray-400 mb-4">Try clearing filters or broadening search terms.</p>
        <button type="button" id="resetFiltersBtn" class="btn btn-primary text-xs px-4 py-2 font-bold">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        searchQuery = '';
        const searchInput = document.getElementById('placesSearchInput');
        if (searchInput) searchInput.value = '';
        applyFilters();
      });
    }
    return;
  }

  container.innerHTML = filteredHotels.map(h => {
    const dirUrl = h.url || (h.latitude && h.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + (h.destination || '') + ' ' + (h.state || ''))}`);

    const callBtn = h.phone ? `
      <a href="tel:${esc(h.phone)}" class="venue-btn venue-btn-call" title="Call ${esc(h.name)}">
        ${icon('phone-call', { size: 14 })}
        <span>${esc(h.phone)}</span>
      </a>
    ` : '';
    const webBtn = h.website ? `
      <a href="${esc(h.website)}" target="_blank" rel="noopener noreferrer" class="venue-btn venue-btn-call" title="Visit website">
        ${icon('globe', { size: 14 })}
        <span>Website ↗</span>
      </a>
    ` : '';

    const facilitiesHtml = (h.facilities || []).slice(0, 4).map(f => `
      <span class="venue-tag-chip">${esc(f)}</span>
    `).join('');

    const luxuryRow = (h.priceMin || h.rating || h.tier) ? `
      <div class="venue-luxury-row flex items-center justify-between gap-2 flex-wrap mb-3 text-xs">
        ${h.priceMin ? `
          <span class="venue-price-badge font-bold text-emerald-400">
            ₹${inr(h.priceMin)}${h.priceMax && h.priceMax > h.priceMin ? ` – ₹${inr(h.priceMax)}` : ''} <span class="text-[10px] text-gray-400 font-normal">/ night</span>
          </span>
        ` : '<span></span>'}
        <div class="flex items-center gap-1.5 ml-auto">
          ${h.tier ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">${esc(h.tier.replace(/_/g, ' '))}</span>` : ''}
          ${h.rating ? `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 flex items-center gap-1">★ ${h.rating}${h.reviews ? ` <span class="text-[10px] opacity-75 font-normal">(${inr(h.reviews)})</span>` : ''}</span>` : ''}
        </div>
      </div>
    ` : '';

    return `
      <article class="place-venue-card" data-id="${esc(h.id)}">
        ${renderCategoryPlaceholder(h.category)}
        <div class="venue-card-header">
          <div>
            <h3 class="venue-name">${esc(h.name)}</h3>
            <p class="text-xs text-gray-400 mt-1">${esc(h.address || `${h.destination}, ${h.state}`)}</p>
          </div>
          <span class="venue-category-badge">${esc(h.category)}</span>
        </div>

        ${luxuryRow}

        <div class="venue-meta-row">
          <span class="venue-distance">
            ${icon('map-pin', { size: 14 })}
            ${h.distance_km ? `${h.distance_km} km from center` : 'Central location'}
          </span>
          ${h.opening_hours ? `<span class="text-xs text-gray-400">${esc(h.opening_hours)}</span>` : ''}
        </div>

        ${facilitiesHtml ? `<div class="venue-tags-row">${facilitiesHtml}</div>` : ''}

        <div class="venue-actions-row">
          <div class="flex items-center gap-2 flex-wrap">
            ${callBtn}
            ${webBtn}
          </div>
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" class="venue-btn venue-btn-directions">
            <span>${h.url ? 'View on Google Maps' : 'Get Directions'}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    `;
  }).join('');

  // Add click to pan map
  container.querySelectorAll('.place-venue-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const id = card.getAttribute('data-id');
      const venue = filteredHotels.find(x => x.id === id);
      if (venue && mapInstance && venue.latitude && venue.longitude) {
        mapInstance.flyTo([venue.latitude, venue.longitude], 15, { duration: 1 });
      }
    });
  });
}

// Apply active filters
function applyFilters() {
  filteredHotels = allHotels.filter(h => {
    if (activeCategory !== 'all' && h.category.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchAddr = h.address && h.address.toLowerCase().includes(q);
      const matchFac = h.facilities && h.facilities.some(f => f.toLowerCase().includes(q));
      if (!matchName && !matchAddr && !matchFac) return false;
    }
    return true;
  });

  renderCards();
  updateMapMarkers();
}

// Render Destination Directory Picker when no single destination is requested
async function renderDirectoryView() {
  const container = document.getElementById('placesApp');
  if (!container) return;

  try {
    const res = await fetch('/data/hotels/directory-index.json');
    if (!res.ok) throw new Error('Directory index not found');
    const indexData = await res.json();
    const destinations = indexData.destinations || [];

    // Dynamically compute unique states and destination counts per state
    const stateCounts = {};
    destinations.forEach(d => {
      if (d.state) {
        stateCounts[d.state] = (stateCounts[d.state] || 0) + 1;
      }
    });

    // Sorted states by destination count descending, then alphabetical
    const sortedStates = Object.keys(stateCounts).sort((a, b) => {
      if (stateCounts[b] !== stateCounts[a]) return stateCounts[b] - stateCounts[a];
      return a.localeCompare(b);
    });

    // Alphabetical states for select dropdown
    const alphaStates = [...sortedStates].sort((a, b) => a.localeCompare(b));

    let activeState = 'all';
    let searchQuery = '';
    let activeSort = 'count-desc';

    container.innerHTML = `
      <section class="places-hero">
        <h1 class="places-hero-title">
          <span class="gold-gradient-text">Curated Stays &amp; Sanctuaries</span>
        </h1>
        <p class="places-hero-subtitle">
          Explore heritage havelis, boutique mountain retreats, luxury sanctuaries, and curated homestays across India's premier destinations.
        </p>

        <!-- Directory Controls & Filters -->
        <div class="dir-controls-container">
          <!-- Top bar: Search + State Dropdown + Sort Toggle -->
          <div class="dir-controls-bar">
            <div class="dir-search-wrap">
              <span class="dir-search-icon">${icon('search', { size: 18 })}</span>
              <input type="text" id="dirSearchInput" class="dir-search-input" placeholder="Search destination or state (e.g. Manali, Goa, Jaipur)..." aria-label="Search destinations" />
              <button type="button" id="dirClearSearch" class="dir-clear-btn" aria-label="Clear search" style="display: none;">
                ${icon('x', { size: 16 })}
              </button>
            </div>

            <div class="dir-filter-group">
              <div class="dir-select-wrap">
                <label for="dirStateSelect" class="sr-only">Filter by State</label>
                <select id="dirStateSelect" class="dir-select dir-state-select" aria-label="Filter by state">
                  <option value="all">All States (${destinations.length})</option>
                  ${alphaStates.map(st => `<option value="${esc(st)}">${esc(st)} (${stateCounts[st]})</option>`).join('')}
                </select>
              </div>

              <div class="dir-select-wrap">
                <label for="dirSortSelect" class="sr-only">Sort Destinations</label>
                <select id="dirSortSelect" class="dir-select dir-sort-select" aria-label="Sort destinations">
                  <option value="count-desc">Sort: Most Venues</option>
                  <option value="name-asc">Sort: Alphabetical A-Z</option>
                  <option value="count-asc">Sort: Least Venues</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Luxury State Pills (Horizontal scrollable track) -->
          <div class="dir-state-pills-wrap" id="dirStatePills" role="tablist" aria-label="Filter by state">
            <button type="button" class="dir-state-pill active" data-state="all" role="tab" aria-selected="true">
              <span>All States</span>
              <span class="dir-pill-badge">${destinations.length}</span>
            </button>
            ${sortedStates.map(st => `
              <button type="button" class="dir-state-pill" data-state="${esc(st)}" role="tab" aria-selected="false">
                <span>${esc(st)}</span>
                <span class="dir-pill-badge">${stateCounts[st]}</span>
              </button>
            `).join('')}
          </div>

          <!-- Live Status Counter & Reset -->
          <div class="dir-status-bar">
            <span class="dir-counter" id="dirCounter" aria-live="polite">
              Showing <strong>${destinations.length}</strong> destinations across <strong>All States</strong>
            </span>
            <button type="button" id="dirResetBtn" class="dir-reset-btn" style="display: none;">
              ${icon('refresh', { size: 14 })} Reset Filters
            </button>
          </div>
        </div>

        <!-- Destination Cards Grid -->
        <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left" id="dirGrid"></div>
      </section>
    `;

    function getFilteredList() {
      let list = destinations.filter(d => {
        if (activeState !== 'all' && d.state.toLowerCase() !== activeState.toLowerCase()) {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = d.title.toLowerCase().includes(q);
          const matchState = d.state.toLowerCase().includes(q);
          if (!matchTitle && !matchState) return false;
        }
        return true;
      });

      if (activeSort === 'name-asc') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else if (activeSort === 'count-asc') {
        list.sort((a, b) => a.count - b.count);
      } else {
        list.sort((a, b) => b.count - a.count);
      }
      return list;
    }

    function renderGrid() {
      const grid = document.getElementById('dirGrid');
      const counter = document.getElementById('dirCounter');
      const resetBtn = document.getElementById('dirResetBtn');
      const clearSearchBtn = document.getElementById('dirClearSearch');
      if (!grid) return;

      const filtered = getFilteredList();

      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }

      const isFiltered = activeState !== 'all' || searchQuery !== '' || activeSort !== 'count-desc';
      if (resetBtn) {
        resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
      }

      if (counter) {
        const stateLabel = activeState === 'all' ? 'All States' : activeState;
        if (searchQuery) {
          counter.innerHTML = `Showing <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'destination' : 'destinations'} matching "<strong>${esc(searchQuery)}</strong>" across <strong>${esc(stateLabel)}</strong>`;
        } else {
          counter.innerHTML = `Showing <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'destination' : 'destinations'} across <strong>${esc(stateLabel)}</strong>`;
        }
      }

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-16 px-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
              ${icon('search', { size: 28 })}
            </div>
            <h3 class="text-xl font-bold text-white mb-2">No destinations found</h3>
            <p class="text-sm text-gray-400 max-w-md mx-auto mb-6">
              No destinations match your criteria in ${esc(activeState === 'all' ? 'any state' : activeState)}. Try selecting another state or clearing search filters.
            </p>
            <button type="button" class="btn btn-primary text-xs px-5 py-2.5 font-bold" id="dirEmptyResetBtn">
              Reset All Filters
            </button>
          </div>
        `;
        const emptyReset = document.getElementById('dirEmptyResetBtn');
        if (emptyReset) emptyReset.addEventListener('click', resetAll);
        return;
      }

      grid.innerHTML = filtered.map(d => `
        <a href="/hotels?destination=${encodeURIComponent(d.slug)}" class="place-venue-card flex items-center justify-between group hover:border-amber-400/50">
          <div>
            <span class="text-xs uppercase tracking-wider text-amber-400/90 font-semibold">${esc(d.state)}</span>
            <h3 class="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">${esc(d.title)}</h3>
            <span class="text-xs text-gray-400 mt-1 inline-block">${d.count} Verified Stays</span>
          </div>
          <span class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:translate-x-1 transition-all">
            ${icon('chevron-right', { size: 18 })}
          </span>
        </a>
      `).join('');
    }

    function setActiveState(st) {
      activeState = st;
      const stateSelect = document.getElementById('dirStateSelect');
      if (stateSelect) stateSelect.value = activeState;

      const pills = document.querySelectorAll('.dir-state-pill');
      pills.forEach(p => {
        const isMatch = p.getAttribute('data-state').toLowerCase() === activeState.toLowerCase();
        p.classList.toggle('active', isMatch);
        p.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        if (isMatch) {
          p.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      });
      renderGrid();
    }

    function resetAll() {
      activeState = 'all';
      searchQuery = '';
      activeSort = 'count-desc';

      const searchInput = document.getElementById('dirSearchInput');
      if (searchInput) searchInput.value = '';

      const stateSelect = document.getElementById('dirStateSelect');
      if (stateSelect) stateSelect.value = 'all';

      const sortSelect = document.getElementById('dirSortSelect');
      if (sortSelect) sortSelect.value = 'count-desc';

      const pills = document.querySelectorAll('.dir-state-pill');
      pills.forEach(p => {
        const isAll = p.getAttribute('data-state') === 'all';
        p.classList.toggle('active', isAll);
        p.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });

      renderGrid();
    }

    // Event Listeners
    const searchInput = document.getElementById('dirSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderGrid();
      });
    }

    const clearSearchBtn = document.getElementById('dirClearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchQuery = '';
        renderGrid();
      });
    }

    const stateSelect = document.getElementById('dirStateSelect');
    if (stateSelect) {
      stateSelect.addEventListener('change', (e) => {
        setActiveState(e.target.value);
      });
    }

    const sortSelect = document.getElementById('dirSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderGrid();
      });
    }

    const pillsContainer = document.getElementById('dirStatePills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.dir-state-pill');
        if (!pill) return;
        const targetState = pill.getAttribute('data-state') || 'all';
        setActiveState(targetState);
      });
    }

    const resetBtn = document.getElementById('dirResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAll);
    }

    // Initial render
    renderGrid();

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-20">
        <h2 class="text-xl font-bold text-white mb-2">Unable to load stays directory</h2>
        <p class="text-sm text-gray-400">${esc(err.message)}</p>
      </div>
    `;
  }
}

// Load specific destination hotels
async function loadDestinationHotels(slug) {
  const container = document.getElementById('placesApp');
  if (!container) return;

  try {
    const res = await fetch(`/data/hotels/${encodeURIComponent(slug)}.json`);
    if (!res.ok) throw new Error(`Hotels data for ${slug} is currently being indexed.`);
    const data = await res.json();

    allHotels = data.items || [];
    filteredHotels = [...allHotels];
    activeDestination = data;

    // Get unique categories
    const categories = Array.from(new Set(allHotels.map(h => h.category).filter(Boolean)));

    // Calculate center coords with destination-level fallback
    const avgLat = allHotels.length > 0
      ? (allHotels.reduce((s, h) => s + h.latitude, 0) / allHotels.length)
      : (data.coordinates?.lat ?? data.latitude ?? 20.5937);
    const avgLng = allHotels.length > 0
      ? (allHotels.reduce((s, h) => s + h.longitude, 0) / allHotels.length)
      : (data.coordinates?.lng ?? data.longitude ?? 78.9629);

    container.innerHTML = `
      <section class="places-hero">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-semibold mb-3">
          <a href="/hotels" class="hover:underline">Stays Directory</a> &middot; <span>${esc(data.state)}</span> &middot; <a href="/destination?slug=${esc(slug)}" class="hover:underline text-amber-300">View Destination Guide ↗</a>
        </div>
        <h1 class="places-hero-title">
          <span>Stays &amp; Hotels in</span> <span class="gold-gradient-text">${esc(data.destination)}</span>
        </h1>
        <p class="places-hero-subtitle">
          Explore ${allHotels.length} verified accommodations in ${esc(data.destination)} with authentic distances, directions, and direct contact options.
        </p>
      </section>

      <!-- Discovery Toolbar -->
      <div class="places-toolbar">
        <div class="places-toolbar-inner">
          <div class="places-search-box">
            <span class="places-search-icon">${icon('search', { size: 18 })}</span>
            <input type="text" id="placesSearchInput" class="places-search-input" placeholder="Search by hotel name or amenity..." />
          </div>

          <div class="flex items-center gap-3">
            <span id="resultsCount" class="text-xs font-semibold text-gray-400 hidden sm:inline">${allHotels.length} Stays Available</span>
            <div class="view-mode-toggle" role="group" aria-label="View layout switch">
              <button type="button" class="view-mode-btn" data-mode="list">${icon('book-open', { size: 14 })} List</button>
              <button type="button" class="view-mode-btn active" data-mode="split">${icon('map', { size: 14 })} Split</button>
              <button type="button" class="view-mode-btn" data-mode="map">${icon('compass', { size: 14 })} Map</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="places-category-chips" id="categoryChips">
        <button type="button" class="chip-btn active" data-cat="all">All Stays (${allHotels.length})</button>
        ${categories.map(c => {
      const count = allHotels.filter(h => h.category === c).length;
      return `<button type="button" class="chip-btn" data-cat="${esc(c)}">${esc(c)} (${count})</button>`;
    }).join('')}
      </div>

      <!-- Workspace Area -->
      <section class="places-workspace view-split" id="placesWorkspace" aria-label="Hotels directory and interactive map">
        <div class="places-card-list" id="venueCardList"></div>
        <div class="places-map-sticky" id="mapWrapper">
          <div id="placesMap" role="region" aria-label="Interactive map showing verified stays near selected destination"></div>
        </div>
      </section>
    `;

    // Initialize Map
    initLeafletMap(avgLat, avgLng);
    renderCards();
    updateMapMarkers();

    // Event listeners
    const searchInput = document.getElementById('placesSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        applyFilters();
      });
    }

    const catChips = document.getElementById('categoryChips');
    if (catChips) {
      catChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-btn');
        if (!btn) return;
        catChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-cat') || 'all';
        applyFilters();
      });
    }

    // View Mode toggles
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        const workspace = document.getElementById('placesWorkspace');
        if (!workspace) return;

        workspace.classList.remove('view-list', 'view-split', 'view-map');
        workspace.classList.add(`view-${mode}`);
        currentViewMode = mode;

        if (mapInstance) {
          setTimeout(() => mapInstance.invalidateSize(), 200);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-20 px-4">
        <h2 class="text-2xl font-bold text-white mb-2">No hotel records found for "${esc(slug)}"</h2>
        <p class="text-sm text-gray-400 max-w-md mx-auto mb-6">${esc(err.message)}</p>
        <a href="/hotels" class="btn btn-primary text-xs px-5 py-2.5 font-bold">Back to Hotels Directory</a>
      </div>
    `;
  }
}

// Main Page Initialization
export function initHotelsPage() {
  initLayout('hotels');

  const slug = getRequestedSlug();
  if (slug) {
    loadDestinationHotels(slug);
  } else {
    renderDirectoryView();
  }
}

// Auto init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHotelsPage);
} else {
  initHotelsPage();
}

