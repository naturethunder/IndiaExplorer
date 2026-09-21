/**
 * theme.js — Universal Dark / Light Mode Engine for ExploreDesh
 * Persists choice to localStorage ('exploredesh_theme'), synchronizes document state,
 * updates theme-color meta tag, and provides accessible, animated toggle controls.
 */

const THEME_KEY = 'exploredesh_theme';

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {}
  // Default to dark mode (flagship ExploreDesh cinema aesthetic)
  return 'dark';
}

export function applyTheme(theme) {
  const current = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', current);
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(current === 'light' ? 'theme-light' : 'theme-dark');

  try {
    localStorage.setItem(THEME_KEY, current);
  } catch (_) {}

  // Update browser mobile header theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', current === 'light' ? '#F8FAFC' : '#080A0F');
  }

  // Update all toggle buttons on page
  updateToggleButtons(current);

  // Dispatch global event for interactive charts or maps
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: current } }));
  return current;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = current === 'light' ? 'dark' : 'light';
  return applyTheme(next);
}

/**
 * Generates the HTML markup for the theme toggle button.
 * Uses SVG sun and moon icons with accessible labels.
 */
export function themeToggleHTML(customClasses = '') {
  return (
    '<button type="button" class="theme-toggle-btn ' + customClasses + '" ' +
    'id="themeToggleBtn" aria-label="Toggle light and dark theme" ' +
    'title="Toggle dark / light mode" tabindex="0">' +
    '  <span class="theme-icon-slot">' +
    '    <svg class="theme-icon theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '      <circle cx="12" cy="12" r="4"/>' +
    '      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>' +
    '    </svg>' +
    '    <svg class="theme-icon theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' +
    '    </svg>' +
    '  </span>' +
    '  <span class="theme-toggle-label sr-only">Toggle theme</span>' +
    '</button>'
  );
}

function updateToggleButtons(theme) {
  const buttons = document.querySelectorAll('.theme-toggle-btn');
  buttons.forEach(btn => {
    btn.setAttribute('data-current-theme', theme);
    btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    btn.setAttribute('title', theme === 'light' ? 'Switch to Dark Mode (Currently Light)' : 'Switch to Light Mode (Currently Dark)');
    const sr = btn.querySelector('.theme-toggle-label');
    if (sr) {
      sr.textContent = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
  });
}

/**
 * Initializes all theme toggle buttons on the page.
 * Attaches click and keydown handlers.
 */
export function initThemeToggle() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  applyTheme(current);

  const buttons = document.querySelectorAll('.theme-toggle-btn');
  buttons.forEach(btn => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}
