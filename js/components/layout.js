/**
 * layout.js — shared site chrome: navbar, footer, mobile bottom-nav.
 * Every page mounts these once via initLayout() so the markup lives in
 * exactly one place.
 *
 * Page markup contract:
 *   <div id="siteNav"></div>        (top of <body>)
 *   <div id="siteFooter"></div>     (before mobile nav; omit on pages without footer)
 *   <div id="siteMobileNav"></div>  (end of <body>)
 */

import { icon } from './icons.js';
import { esc } from '../utils/format.js';

// Pill nav: Home / Destinations / AI Trip Finder / About / Contact.
// "Plan My Trip" is the standout gradient CTA on the right.
const NAV_LINKS = [
  { key: 'home', href: 'index.html', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', label: 'Destinations' },
  { key: 'finder', href: 'ai-finder.html', label: 'AI Trip Finder' },
  { key: 'about', href: 'about.html', label: 'About' },
  { key: 'contact', href: 'contact.html', label: 'Contact' },
];

// Company pages (about/contact/privacy/terms) share the same pill nav.
const COMPANY_NAV_LINKS = NAV_LINKS;

function navbarHTML(active, variant) {
  const navLinks = variant === 'company' ? COMPANY_NAV_LINKS : NAV_LINKS;
  const links = navLinks.map((l) =>
    '<a href="' + l.href + '" class="nav-link' + (l.key === active ? ' active' : '') + '">' + l.label + '</a>'
  ).join('\n        ');
  const brand =
    '<a href="index.html" class="flex items-center gap-2.5 shrink-0" aria-label="IndiaExplore home">\n' +
    '      <span class="brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '      <span class="font-bold text-lg tracking-tight text-gray-900">India<span class="text-primary">Explore</span></span>\n' +
    '    </a>';
  return (
    '<nav class="nav-glass fixed top-0 left-0 right-0 z-50 h-16" aria-label="Main navigation">\n' +
    '  <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">\n' +
    '    ' + brand + '\n' +
    '    <div class="hidden md:flex nav-menu items-center gap-1">\n        ' + links + '\n    </div>\n' +
    '    <div class="w-[140px] shrink-0 hidden md:flex"></div>\n' +
    '  </div>\n' +
    '</nav>'
  );
}

function socialBtn(name, label, href) {
  // No real profiles yet: same-page '#' placeholder, no target=_blank (which
  // would open a duplicate tab of the current page).
  return '<a href="' + href + '" class="footer-social" aria-label="' + label + '">' +
    icon(name, { size: 18 }) + '</a>';
}

// Column link groups. Every href routes to a page/param that actually resolves —
// features without a dedicated page point at the nearest real listing.
const FOOTER_COLS = [
  { title: 'Explore', links: [
    ['Destinations', 'destinations.html'],
    ['States', 'destinations.html'],
    ['Places', 'destinations.html'],
    ['Hotels', 'destinations.html'],
    ['Travel Guides', 'ai-finder.html'],
  ] },
  { title: 'Categories', links: [
    ['Mountains', 'destinations.html?type=hill_station'],
    ['Beaches', 'destinations.html?type=beach'],
    ['Heritage', 'destinations.html?type=heritage'],
    ['Wildlife', 'destinations.html?type=wildlife'],
    ['Adventure', 'destinations.html?type=adventure'],
    ['Road Trips', 'destinations.html?type=adventure'],
  ] },
  { title: 'Resources', links: [
    ['Itineraries', 'ai-finder.html'],
    ['Weekend Getaways', 'destinations.html?maxPrice=10000'],
    ['Weather Guide', 'destinations.html?month=' + (new Date().getMonth() + 1)],
    ['Packing List', 'ai-finder.html'],
    ['Budget Planner', 'ai-finder.html'],
  ] },
  { title: 'Company', links: [
    ['About', 'about.html'],
    ['Contact', 'contact.html'],
    ['Privacy', 'privacy.html'],
    ['Terms', 'terms.html'],
    ['Disclaimer', 'terms.html'],
  ] },
];



function footerColHTML(col) {
  const links = col.links.map((l) =>
    '          <a href="' + l[1] + '" class="footer-link block">' + esc(l[0]) + '</a>'
  ).join('\n');
  return (
    '      <div>\n' +
    '        <p class="text-white font-semibold text-sm mb-4 uppercase tracking-wider">' + esc(col.title) + '</p>\n' +
    '        <div class="space-y-2">\n' +
    links + '\n' +
    '        </div>\n' +
    '      </div>'
  );
}

function footerHTML() {
  const cols = FOOTER_COLS.map(footerColHTML).join('\n');
  return (
    '<footer class="footer pt-14 pb-8">\n' +
    '  <div class="max-w-7xl mx-auto px-4">\n' +
    '    <div class="grid grid-cols-2 md:grid-cols-6 gap-10 mb-10">\n' +
    '      <div class="col-span-2">\n' +
    '        <div class="flex items-center gap-2.5 mb-4">\n' +
    '          <span class="brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '          <span class="font-bold text-lg text-white">India<span class="text-primary">Explore</span></span>\n' +
    '        </div>\n' +
    '        <p class="text-sm text-gray-400 leading-relaxed max-w-xs mb-5">India\'s most thoughtful travel discovery platform. Find your perfect destination, compare prices honestly.</p>\n' +
    '        <div class="flex items-center gap-2">\n' +
    '          ' + socialBtn('facebook', 'IndiaExplore on Facebook', '#') + '\n' +
    '          ' + socialBtn('instagram', 'IndiaExplore on Instagram', '#') + '\n' +
    '          ' + socialBtn('twitter', 'IndiaExplore on X', '#') + '\n' +
    '          ' + socialBtn('youtube', 'IndiaExplore on YouTube', '#') + '\n' +
    '        </div>\n' +
    '      </div>\n' +
    cols + '\n' +
    '    </div>\n' +
    '    <div class="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">\n' +
    '      <p class="text-gray-500 text-sm">© 2026 IndiaExplore. All rights reserved.</p>\n' +
    '      <p class="text-gray-600 text-xs inline-flex items-center gap-1.5">Made with ' +
        '<span class="text-primary" aria-hidden="true">' + icon('heart', { size: 14, fill: true }) + '</span> in India</p>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>'
  );
}

const MOBILE_LINKS = [
  { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', icon: 'map', label: 'Explore' },
  { key: 'finder', href: 'ai-finder.html', icon: 'sparkles', label: 'AI Finder' },
  { key: 'beaches', href: 'destinations.html?type=beach', icon: 'waves', label: 'Beaches' },
];

const COMPANY_MOBILE_LINKS = [
  { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', icon: 'map', label: 'Explore' },
  { key: 'hills', href: 'destinations.html?type=hill_station', icon: 'mountain', label: 'Hills' },
  { key: 'contact', href: 'contact.html', icon: 'mail', label: 'Contact' },
];

function mobileNavHTML(active, variant) {
  const links = (variant === 'company' ? COMPANY_MOBILE_LINKS : MOBILE_LINKS).map((l) =>
    '<a href="' + l.href + '" class="mobile-nav-btn' + (l.key === active ? ' active' : '') + '">' +
    '<span class="mobile-nav-icon">' + icon(l.icon, { size: 22 }) + '</span>' + l.label + '</a>'
  ).join('\n  ');
  return '<nav class="mobile-nav md:hidden" aria-label="Mobile navigation">\n  ' + links + '\n</nav>';
}

/**
 * Mount navbar / footer / mobile-nav into the page's placeholder divs.
 * opts.active   — nav key to highlight ('home' | 'destinations' | 'finder' | 'hills' |
 *                 'beaches' | 'heritage' | 'contact' | '')
 * opts.variant  — 'company' for about/contact/privacy/terms chrome; default site chrome
 * opts.footer   — render footer (default: true if #siteFooter exists)
 */
export function initLayout(opts = {}) {
  const active = opts.active || '';
  const navEl = document.getElementById('siteNav');
  const footEl = document.getElementById('siteFooter');
  const mobEl = document.getElementById('siteMobileNav');
  if (navEl) navEl.innerHTML = navbarHTML(active, opts.variant);
  if (footEl) footEl.innerHTML = footerHTML();
  if (mobEl) mobEl.innerHTML = mobileNavHTML(active, opts.variant);
}

/** Re-highlight a navbar link by exact href (used by destinations.html for ?type= tabs). */
export function setActiveNav(href) {
  const links = document.querySelectorAll('nav .nav-link');
  let matched = null;
  links.forEach(function (a) {
    a.classList.remove('active');
    if (a.getAttribute('href') === href) matched = a;
  });
  if (!matched) {
    links.forEach(function (a) { if (a.getAttribute('href') === 'destinations.html') matched = a; });
  }
  if (matched) matched.classList.add('active');
}
