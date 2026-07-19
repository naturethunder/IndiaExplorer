/**
 * indiaMap.js — interactive "Explore India" choropleth.
 * Renders the generated INDIA_MAP outlines as an inline SVG. States that have
 * destinations in the dataset are interactive (hover highlight + click); states
 * with none are dimmed and inert. Clicking a state navigates to its filtered
 * destinations listing. Keyboard + screen-reader accessible.
 *
 * Usage:
 *   initIndiaMap({
 *     svgEl,                   // DOM target
 *     countByState,            // Map<stateName, number>
 *     stateUrl,                // (state) => href for the state listing
 *   });
 */
import { INDIA_MAP } from '../../data/india-map.js';
import { esc } from '../utils/format.js';

export function initIndiaMap(opts) {
  const { svgEl, countByState, stateUrl } = opts;
  if (!svgEl) return;

  const has = (name) => (countByState.get(name) || 0) > 0;

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
  // role="group", NOT "img" — img makes children presentational and hides the
  // focusable state "buttons" from the accessibility tree (ghost tab stops).
  svgEl.setAttribute('role', 'group');
  svgEl.setAttribute('aria-label', 'Map of India — select a state to see top destinations');
  svgEl.innerHTML = paths;

  // ── interaction: hover highlights (CSS) + name tooltip, click navigates ─
  // Reuse an existing tip so repeated init calls don't stack duplicates.
  const host = svgEl.parentElement;
  let tip = host.querySelector('.india-map-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'india-map-tip';
    tip.setAttribute('aria-hidden', 'true');
    host.appendChild(tip);
  }

  svgEl.addEventListener('mousemove', (e) => {
    const p = e.target.closest('.india-state');
    if (!p || p.classList.contains('is-empty')) { tip.style.display = 'none'; return; }
    const name = p.getAttribute('data-state');
    const n = countByState.get(name) || 0;
    tip.textContent = name + ' · ' + n + (n === 1 ? ' destination' : ' destinations');
    tip.style.display = 'block';
    const box = host.getBoundingClientRect();
    // clamp inside the card so long names don't spill into the next column
    const x = Math.min(e.clientX - box.left + 12, box.width - tip.offsetWidth - 8);
    const y = Math.max(e.clientY - box.top - 30, 0);
    tip.style.left = Math.max(x, 0) + 'px';
    tip.style.top = y + 'px';
  });
  svgEl.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

  function go(state) {
    if (!has(state)) return;
    window.location.href = stateUrl(state);
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
