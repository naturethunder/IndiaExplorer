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
  { key: 'home', href: 'index.html', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', label: 'Destinations' },
  { key: 'finder', href: 'ai-finder.html', label: 'Trip Planner' },
  { key: 'about', href: 'about.html', label: 'About' },
  { key: 'contact', href: 'contact.html', label: 'Contact' },
];

// Company pages (about/contact/privacy/terms) share the same pill nav.
const COMPANY_NAV_LINKS = NAV_LINKS;

function navbarHTML(active, variant) {
  const navLinks = variant === 'company' ? COMPANY_NAV_LINKS : NAV_LINKS;
  const links = navLinks.map((l) =>
    '<a href="' + l.href + '" class="nav-link' + (l.key === active ? ' active' : '') + '"' + (l.key === active ? ' aria-current="page"' : '') + '>' + l.label + '</a>'
  ).join('\n        ');
  const brand =
    '<a href="index.html" class="flex items-center gap-2.5 shrink-0" aria-label="ExploreDesh home">\n' +
    '      <span class="brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '      <span class="font-bold text-lg tracking-tight text-white site-brand-text">Explore<span class="text-primary">Desh</span></span>\n' +
    '    </a>';

  const offlineBtn =
    '<button type="button" class="nav-offline-btn" id="navOfflineBtn" aria-label="Offline Go: open ExploreDesh Go offline pocket guides and emergency SOS toolkit" title="ExploreDesh Go: Offline Guides & SOS">\n' +
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
      ['All Destinations', 'destinations.html'],
      ['Popular Sanctuaries', 'destinations.html?sort=popular'],
      ['Trip Planner', 'ai-finder.html'],
      ['Curated Stays & Retreats', 'hotels.html'],
      ['Dining & Gastronomy', 'restaurants.html'],
    ]
  },
  {
    title: 'Sanctuaries', links: [
      ['Hills & Mountains', 'destinations.html?type=hill_station'],
      ['Coastal Escapes', 'destinations.html?type=beach'],
      ['Wildlife & Nature', 'destinations.html?type=wildlife'],
      ['Adventure Trails', 'destinations.html?type=adventure'],
      ['Scenic Road Trips', 'destinations.html?type=road_trips'],
    ]
  },
  {
    title: 'Heritage', links: [
      ['Forts & Palaces', 'destinations.html?type=heritage'],
      ['Spiritual Centers', 'destinations.html?type=pilgrimage'],
      ['Offbeat Hidden Gems', 'destinations.html?sort=latest'],
      ['Seasonal Highlights', 'destinations.html?sort=trending'],
    ]
  },
  {
    title: 'Atelier & Trust', links: [
      ['About ExploreDesh', 'about.html'],
      ['Curator Contact', 'contact.html'],
      ['Privacy Charter', 'privacy.html'],
      ['Terms of Service', 'terms.html'],
    ]
  },
];



function footerColHTML(col) {
  const links = col.links.map((l) =>
    '          <li><a href="' + l[1] + '" class="footer-link">' + esc(l[0]) + '</a></li>'
  ).join('\n');
  return (
    '      <div class="col-span-1">\n' +
    '        <p class="footer-col-title">' + esc(col.title) + '</p>\n' +
    '        <ul class="footer-links-list space-y-0.5">\n' +
    links + '\n' +
    '        </ul>\n' +
    '      </div>'
  );
}

function footerHTML() {
  const cols = FOOTER_COLS.map(footerColHTML).join('\n');
  return (
    '<footer class="footer pt-16 pb-10" role="contentinfo" aria-label="Site Footer">\n' +
    '  <div class="max-w-7xl mx-auto px-6">\n' +
    '    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">\n' +
    '      <div class="md:col-span-2 lg:col-span-4 pr-0 lg:pr-6">\n' +
    '        <div class="flex items-center gap-2.5 mb-4">\n' +
    '          <span class="footer-brand-mark">' + icon('mountain', { size: 20 }) + '</span>\n' +
    '          <span class="font-bold text-xl tracking-tight footer-brand-text">Explore<span class="text-primary">Desh</span></span>\n' +
    '        \n</div>\n' +
    '        <p class="text-sm footer-muted-text leading-relaxed max-w-sm mb-5">India\'s premier luxury travel discovery atelier. Documenting 2,396 authentic sanctuaries, ancient heritage monuments, and bespoke cultural journeys across all 36 states and union territories.</p>\n' +
    '        <div class="footer-catalog-badge">\n' +
    '          <span class="footer-pulse-dot" aria-hidden="true"></span>\n' +
    '          <span>2,396 Sanctuaries · 100% Verified</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="md:col-span-2 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">\n' +
    cols + '\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="footer-divider pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs footer-muted-text">\n' +
    '      <div class="flex items-center gap-2 flex-wrap">\n' +
    '        <span>© 2026 ExploreDesh Atelier. All rights reserved.</span>\n' +
    '        <span class="hidden sm:inline opacity-40">·</span>\n' +
    '        <span class="hidden sm:inline">Definitive Heritage Archive of Bharat</span>\n' +
    '      </div>\n' +
    '      <div class="flex items-center gap-5 flex-wrap">\n' +
    '        <a href="privacy.html" class="footer-legal-link">Privacy</a>\n' +
    '        <a href="terms.html" class="footer-legal-link">Terms</a>\n' +
    '        <a href="contact.html" class="footer-legal-link">Contact</a>\n' +
    '        <span class="inline-flex items-center gap-1.5 opacity-90">\n' +
    '          <span>Made with</span>\n' +
    '          <span class="text-rose-500 inline-flex items-center" aria-label="reverence">' + icon('heart', { size: 13, fill: true }) + '</span>\n' +
    '          <span>in India</span>\n' +
    '        </span>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</footer>'
  );
}

const MOBILE_LINKS = [
  { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', icon: 'map', label: 'Explore' },
  { key: 'hills', href: 'destinations.html?type=hill_station', icon: 'mountain', label: 'Hills' },
  { key: 'heritage', href: 'destinations.html?type=heritage', icon: 'landmark', label: 'Heritage' },
  { key: 'finder', href: 'ai-finder.html', icon: 'compass', label: 'Planner' },
];

const COMPANY_MOBILE_LINKS = [
  { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
  { key: 'destinations', href: 'destinations.html', icon: 'map', label: 'Explore' },
  { key: 'hills', href: 'destinations.html?type=hill_station', icon: 'mountain', label: 'Hills' },
  { key: 'contact', href: 'contact.html', icon: 'mail', label: 'Contact' },
];

function mobileNavHTML(active, variant) {
  const links = (variant === 'company' ? COMPANY_MOBILE_LINKS : MOBILE_LINKS).map((l) =>
    '<a href="' + l.href + '" class="mobile-nav-btn' + (l.key === active ? ' active' : '') + '"' + (l.key === active ? ' aria-current="page"' : '') + '>' +
    '<span class="mobile-nav-icon">' + icon(l.icon, { size: 22 }) + '</span>' + l.label + '</a>'
  ).join('\n  ');

  const offlineMobBtn =
    '<button type="button" class="mobile-nav-btn" id="mobNavOfflineBtn" aria-label="Offline Go: open ExploreDesh Go offline pocket guides">\n' +
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
  const options = typeof opts === 'string' ? { active: opts } : (opts || {});
  // Auto-detect active page key if not explicitly provided
  let active = options.active || '';
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
  if (navEl) navEl.innerHTML = navbarHTML(active, options.variant);
  if (footEl) footEl.innerHTML = footerHTML();
  if (mobEl) mobEl.innerHTML = mobileNavHTML(active, options.variant);
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
          ((cleanHref === '/' || cleanHref === '' || cleanHref === 'index') && (currentClean === '/' || currentClean === '' || currentClean.endsWith('index') || currentClean.endsWith('index.html')));
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
    window.location.pathname.endsWith('/') ||
    window.location.pathname === '';

  if (isHomePage) {
    const homeLinks = document.querySelectorAll('a[href="index.html"], a[href="/"], a[href="/index.html"]');
    homeLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && link.getAttribute('target') !== '_blank') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.location.search || window.location.hash) {
            history.replaceState(null, '', window.location.pathname.endsWith('index.html') ? 'index.html' : './');
          }
        }
      });
    });
  }

  // Initialize universal GSAP glass hover engine across buttons, pills, cards and links
  initGlobalGlassHoverGSAP();

  // Scroll progress bar
  const prog = document.createElement('div');
  prog.id = 'scrollProgress';
  prog.style.width = '0%';
  document.body.prepend(prog);

  // Back-to-top button
  const btt = document.createElement('button');
  btt.id = 'backToTop';
  btt.type = 'button';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btt);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
        prog.style.width = pct + '%';
        btt.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
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

    if (aHref === raw || (clean && aClean === clean) || (aClean.endsWith(clean) && clean)) {
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
