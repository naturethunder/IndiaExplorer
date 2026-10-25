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
import { themeToggleHTML, initThemeToggle } from '../utils/theme.js';
import { openOfflineHub, initOfflineHub } from './offlineHub.js';
import { initGlobalGlassHoverGSAP } from '../utils/gsapInteractions.js';

// Pill nav: Home / Destinations / Trip Planner / About / Contact.
const NAV_LINKS = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'destinations', href: '/destinations', label: 'Destinations' },
  { key: 'finder', href: '/ai-finder', label: 'Trip Planner' },
  { key: 'about', href: '/about', label: 'About' },
  { key: 'contact', href: '/contact', label: 'Contact' },
];

// Company pages (about/contact/privacy/terms) share the same pill nav.
const COMPANY_NAV_LINKS = NAV_LINKS;

function navbarHTML(active, variant) {
  const navLinks = variant === 'company' ? COMPANY_NAV_LINKS : NAV_LINKS;
  const links = navLinks.map((l) =>
    '<a href="' + l.href + '" class="nav-link' + (l.key === active ? ' active' : '') + '"' + (l.key === active ? ' aria-current="page"' : '') + '>' + l.label + '</a>'
  ).join('\n        ');
  const brand =
    '<a href="/" class="flex items-center gap-2.5 shrink-0" aria-label="ExploreDesh home">\n' +
    '      <span class="brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '      <span class="font-bold text-lg tracking-tight text-white site-brand-text">Explore<span class="text-primary">Desh</span></span>\n' +
    '    </a>';

  const offlineBtn =
    '<button type="button" class="nav-offline-btn" id="navOfflineBtn" aria-label="Open ExploreDesh Go offline pocket guides and emergency SOS toolkit" title="ExploreDesh Go: Offline Guides & SOS">\n' +
    '  <span class="nav-offline-icon">' + icon('wifi-off', { size: 15 }) + '</span>\n' +
    '  <span class="nav-offline-label hidden xl:inline">Offline Go</span>\n' +
    '  <span class="nav-offline-count-badge" style="display:none">0</span>\n' +
    '</button>';

  return (
    '<nav class="nav-glass fixed top-0 left-0 right-0 z-50 h-16" aria-label="Main navigation"><div class="nav-luxury-top-rule"></div>' +
    '  <div class="max-w-screen-2xl mx-auto px-6 h-full flex items-center justify-between gap-4">' +
    '    ' + brand +
    '    <div class="hidden md:flex nav-menu items-center">' + links + '</div>' +
    '    <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">' +
    '      ' + offlineBtn +
    '      ' + themeToggleHTML() +
    '    </div>' +
    '  </div>' +
    '</nav>'
  );
}

// Column link groups. Every href routes to a page/param that actually resolves —
// features without a dedicated page point at the nearest real listing.
const FOOTER_COLS = [
  {
    title: 'Explore', links: [
      ['Destinations', '/destinations'],
      ['States', '/destinations'],
      ['Places', '/destinations'],
      ['Hotels', '/destinations'],
      ['Travel Guides', '/ai-finder'],
    ]
  },
  {
    title: 'Categories', links: [
      ['Mountains', '/destinations?type=hill_station'],
      ['Beaches', '/destinations?type=beach'],
      ['Heritage', '/destinations?type=heritage'],
      ['Wildlife', '/destinations?type=wildlife'],
      ['Adventure', '/destinations?type=adventure'],
      ['Road Trips', '/destinations?type=road_trips'],
    ]
  },
  {
    title: 'Resources', links: [
      ['Itineraries', '/ai-finder'],
      ['Weekend Getaways', '/destinations?sort=distance'],
      ['Weather Guide', '/destinations?month=' + (new Date().getMonth() + 1)],
      ['Packing List', '/ai-finder'],
      ['Budget Planner', '/ai-finder'],
    ]
  },
  {
    title: 'Company', links: [
      ['About', '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
      ['Disclaimer', '/terms'],
    ]
  },
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
    '  <div class="max-w-screen-2xl mx-auto px-6">\n' +
    '    <div class="grid grid-cols-2 md:grid-cols-6 gap-10 mb-10">\n' +
    '      <div class="col-span-2">\n' +
    '        <div class="flex items-center gap-2.5 mb-4">\n' +
    '          <span class="brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '          <span class="font-bold text-lg text-white">Explore<span class="text-primary">Desh</span></span>\n' +
    '        </div>\n' +
    '        <p class="text-sm text-gray-400 leading-relaxed max-w-xs mb-3">India\'s premier luxury travel discovery atelier. Curated sanctuaries, heritage monuments, and boutique escapes across 36 states and union territories.</p>\n' +
    '        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-amber-300 font-medium">\n' +
    '          <span>✨ Complete Catalogue of Bharat</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    cols + '\n' +
    '    </div>\n' +
    '    <div class="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">\n' +
    '      <p class="text-gray-400 text-sm">© 2026 ExploreDesh. All rights reserved.</p>\n' +
    '      <p class="text-gray-400 text-xs inline-flex items-center gap-1.5">Made with ' +
    '<span class="text-primary" aria-hidden="true">' + icon('heart', { size: 14, fill: true }) + '</span> in India</p>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>'
  );
}

const MOBILE_LINKS = [
  { key: 'home', href: '/', icon: 'home', label: 'Home' },
  { key: 'destinations', href: '/destinations', icon: 'map', label: 'Explore' },
  { key: 'finder', href: '/ai-finder', icon: 'compass', label: 'Planner' },
  { key: 'beaches', href: '/destinations?type=beach', icon: 'waves', label: 'Beaches' },
];

const COMPANY_MOBILE_LINKS = [
  { key: 'home', href: '/', icon: 'home', label: 'Home' },
  { key: 'destinations', href: '/destinations', icon: 'map', label: 'Explore' },
  { key: 'hills', href: '/destinations?type=hill_station', icon: 'mountain', label: 'Hills' },
  { key: 'contact', href: '/contact', icon: 'mail', label: 'Contact' },
];

function mobileNavHTML(active, variant) {
  const links = (variant === 'company' ? COMPANY_MOBILE_LINKS : MOBILE_LINKS).map((l) =>
    '<a href="' + l.href + '" class="mobile-nav-btn' + (l.key === active ? ' active' : '') + '"' + (l.key === active ? ' aria-current="page"' : '') + '>' +
    '<span class="mobile-nav-icon">' + icon(l.icon, { size: 22 }) + '</span>' + l.label + '</a>'
  ).join('\n  ');

  const offlineMobBtn =
    '<button type="button" class="mobile-nav-btn" id="mobNavOfflineBtn" aria-label="Open ExploreDesh Go offline pocket guides">\n' +
    '  <span class="mobile-nav-icon relative">' + icon('wifi-off', { size: 22 }) +
    '    <span class="nav-offline-count-badge" style="display:none">0</span>\n' +
    '  </span>Offline Go\n' +
    '</button>';

  return '<nav class="mobile-nav md:hidden" aria-label="Mobile navigation">\n  ' + links + '\n  ' + offlineMobBtn + '\n</nav>';
}

/**
 * Mount navbar / footer / mobile-nav into the page's placeholder divs.
 * opts.active   — nav key to highlight ('home' | 'destinations' | 'finder' | 'hills' |
 *                 'beaches' | 'heritage' | 'contact' | '')
 * opts.variant  — 'company' for about/contact/privacy/terms chrome; default site chrome
 * opts.footer   — render footer (default: true if #siteFooter exists)
 */
export function initLayout(opts = {}) {
  // Auto-detect active page key if not explicitly provided
  let active = opts.active || '';
  if (!active) {
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html') || path === '') {
      active = 'home';
    } else if (path.includes('destination')) {
      active = 'destinations';
    } else if (path.includes('finder')) {
      active = 'finder';
    } else if (path.includes('about')) {
      active = 'about';
    } else if (path.includes('contact')) {
      active = 'contact';
    }
  }

  const navEl = document.getElementById('siteNav');
  const footEl = document.getElementById('siteFooter');
  const mobEl = document.getElementById('siteMobileNav');
  if (navEl) navEl.innerHTML = navbarHTML(active, opts.variant);
  if (footEl) footEl.innerHTML = footerHTML();
  if (mobEl) mobEl.innerHTML = mobileNavHTML(active, opts.variant);
  initThemeToggle();
  initOfflineHub();

  // Attach offline hub modal triggers
  const navOfflineBtn = document.getElementById('navOfflineBtn');
  if (navOfflineBtn) {
    navOfflineBtn.addEventListener('click', () => openOfflineHub('saved'));
  }
  const mobOfflineBtn = document.getElementById('mobNavOfflineBtn');
  if (mobOfflineBtn) {
    mobOfflineBtn.addEventListener('click', () => openOfflineHub('saved'));
  }

  // Instant visual highlight feedback on click for all navbar buttons & links
  const allNavLinks = document.querySelectorAll('.nav-glass .nav-link, .mobile-nav .mobile-nav-btn');
  allNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href) {
        setActiveNav(href);
        const cleanHref = href.split('?')[0].replace(/\.html$/, '');
        const currentClean = window.location.pathname.split('?')[0].replace(/\.html$/, '');
        const isSamePage = cleanHref === currentClean ||
          (cleanHref.includes('destination') && currentClean.includes('destination')) ||
          ((cleanHref === '/' || cleanHref === '') && (currentClean === '/' || currentClean === '' || currentClean.endsWith('index')));
        if (isSamePage && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && link.getAttribute('target') !== '_blank') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  });

  // Smooth scroll to top when Home link or Brand logo is clicked while already on the home page
  const isHomePage = active === 'home' ||
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname === '';

  if (isHomePage) {
    const homeLinks = document.querySelectorAll('a[href="/"], a[href="index.html"], a[href="/index.html"]');
    homeLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && link.getAttribute('target') !== '_blank') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.location.search || window.location.hash) {
            history.replaceState(null, '', window.location.pathname.endsWith('index.html') ? 'index.html' : '/');
          }
        }
      });
    });
  }

  // Initialize universal GSAP glass hover engine across buttons, pills, cards and links
  initGlobalGlassHoverGSAP();
}

/** Re-highlight a navbar link by exact href or normalized path (used by destinations.html for ?type= tabs). */
export function setActiveNav(href) {
  const links = document.querySelectorAll('nav .nav-link, .mobile-nav-btn');
  if (!links.length) return;

  const raw = (href || '').trim();
  const clean = raw.split('?')[0].replace(/\.html$/, '');

  // 1. Remove active and aria-current from all links first
  links.forEach(function (a) {
    a.classList.remove('active');
    a.removeAttribute('aria-current');
  });

  // 2. Mark ALL matching links (both desktop .nav-link AND mobile .mobile-nav-btn)
  let matchedCount = 0;
  links.forEach(function (a) {
    const aHref = (a.getAttribute('href') || '').trim();
    const aClean = aHref.split('?')[0].replace(/\.html$/, '');

    if (aHref === raw || (clean && aClean === clean)) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      matchedCount++;
    }
  });

  // 3. Fallback: If on destinations or destination guide, match all links containing 'destination'
  if (matchedCount === 0 && (clean.includes('destination') || window.location.pathname.includes('destination'))) {
    links.forEach(function (a) {
      const aHref = (a.getAttribute('href') || '').trim();
      if (aHref.includes('destination')) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
        matchedCount++;
      }
    });
  }
}
