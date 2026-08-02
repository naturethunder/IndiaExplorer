/**
 * indiaMap.js — interactive "Explore India" choropleth.
 * Renders the generated INDIA_MAP outlines as an inline SVG. States that have
 * destinations in the dataset are interactive (hover highlight + state destinations popover card);
 * clicking a state or destination navigates directly to the destination or state listing.
 * Keyboard + screen-reader accessible.
 *
 * Usage:
 *   initIndiaMap({
 *     svgEl,                   // DOM target
 *     countByState,            // Map<stateName, number>
 *     destsByState,            // Map<stateName, summary[]>
 *     stateUrl,                // (state) => href for the state listing
 *   });
 */
import { INDIA_MAP } from '../../data/india-map.js';
import { esc } from '../utils/format.js';

export function initIndiaMap(opts) {
  const { svgEl, countByState, destsByState, stateUrl } = opts;
  if (!svgEl) return;

  const has = (name) => (countByState && countByState.get(name) || 0) > 0;

  // ── render the SVG ──────────────────────────────────────
  const paths = INDIA_MAP.states.map((st) => {
    const active = has(st.name);
    const cls = 'india-state' + (active ? '' : ' is-empty');
    const attrs = active
      ? ' tabindex="0" role="button" aria-label="' + esc(st.name) + ', ' + (countByState.get(st.name)) + ' destinations"'
      : ' aria-hidden="true"';
    return '<path class="' + cls + '" d="' + st.path + '" data-state="' + esc(st.name) + '"' + attrs + '></path>';
  }).join('');

  svgEl.setAttribute('viewBox', INDIA_MAP.viewBox);
  svgEl.setAttribute('role', 'group');
  svgEl.setAttribute('aria-label', 'Map of India — select a state to see top destinations');
  svgEl.innerHTML = paths;

  const host = svgEl.parentElement;

  // ── State Popover Card (showing top destinations on state hover) ──────
  let card = host.querySelector('.india-map-card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'india-map-card';
    host.appendChild(card);
  }

  function getCategoryIcon(type) {
    switch (type) {
      case 'hill_station': return '🏔️';
      case 'beach': return '🏖️';
      case 'heritage': return '🏰';
      case 'wildlife': return '🐅';
      case 'spiritual': return '🛕';
      case 'adventure': return '🧗';
      default: return '📍';
    }
  }

  function updateMapCard(stateName) {
    const list = destsByState && destsByState.get(stateName) ? destsByState.get(stateName) : [];
    const topDests = list.slice(0, 5);

    let html = '<h4 class="map-card-title">' + esc(stateName) + '</h4>';
    if (topDests.length > 0) {
      html += '<ul class="map-card-list">' +
        topDests.map((d) =>
          '<li><a href="destination.html?slug=' + encodeURIComponent(d.slug) + '">' +
          '<span class="map-card-icon">' + getCategoryIcon(d.type) + '</span>' +
          '<span class="truncate">' + esc(d.title) + '</span>' +
          '</a></li>'
        ).join('') +
        '</ul>';
    } else {
      const count = (countByState && countByState.get(stateName)) || 0;
      html += '<p class="text-xs text-gray-500 mb-3">' + count + ' destinations available</p>';
    }

    const href = stateUrl ? stateUrl(stateName) : 'destinations.html?state=' + encodeURIComponent(stateName);
    html += '<a href="' + href + '" class="map-card-all">View all destinations &rarr;</a>';

    card.innerHTML = html;
  }

  function activateState(name) {
    const allPaths = svgEl.querySelectorAll('.india-state');
    allPaths.forEach((p) => {
      const isTarget = p.getAttribute('data-state') === name;
      p.classList.toggle('is-active', isTarget);
    });
    updateMapCard(name);
  }

  // Initial state: Rajasthan if present, else first active state
  const initialState = has('Rajasthan') ? 'Rajasthan' : (INDIA_MAP.states.find((s) => has(s.name))?.name || '');
  if (initialState) {
    activateState(initialState);
  }

  // ── Hover & Mouse Events ────────────────────────────────
  svgEl.addEventListener('mousemove', (e) => {
    const p = e.target.closest('.india-state');
    if (!p || p.classList.contains('is-empty')) return;
    const name = p.getAttribute('data-state');
    activateState(name);
  });

  function go(state) {
    if (!has(state)) return;
    window.location.href = stateUrl ? stateUrl(state) : 'destinations.html?state=' + encodeURIComponent(state);
  }

  svgEl.addEventListener('click', (e) => {
    const p = e.target.closest('.india-state');
    if (p && !p.classList.contains('is-empty')) go(p.getAttribute('data-state'));
  });

  svgEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const p = e.target.closest('.india-state');
    if (p && !p.classList.contains('is-empty')) { e.preventDefault(); go(p.getAttribute('data-state')); }
  });
}
