/**
 * gsapInteractions.js — Ultra-Luxury Glass Hover & Magnetic Spring Physics Engine
 * ExploreDesh — Discover Incredible India
 *
 * Provides high-performance GSAP hover micro-animations, dynamic magnetic cursor pull,
 * click spring physics, and 3D perspective card tilt across both Dark and Light themes.
 *
 * Targets:
 *  - Buttons: .btn, .btn-primary, .btn-outline, .btn-ghost, .btn-gradient, button, input[type="button"], input[type="submit"]
 *  - Navigation: .nav-link, .nav-cta-pill, .theme-toggle-btn, .nav-offline-btn, .brand-mark, .mobile-nav-btn
 *  - Category / Filter Pills: .category-pill-btn, .category-chip, .filter-chip, .quick-tag-btn, .dest-quick-pill, .month-pill, .dest-filter-btn, .sort-btn
 *  - Cards: .dest-card-link, .destination-card, .explore-card, .trend-card, .hero-hill-card, .place-card, .stay-card, .mini-card, .bento-tile
 *  - Action Triggers: .section-link, .footer-link, .state-link, .load-more-luxury-btn, .carousel-btn, .hero-car-btn, .cheat-sos-btn, footer a, summary
 */

const animatedButtons = new WeakSet();
const animatedCards = new WeakSet();

// Safe feature detection
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isFinePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function getGSAP() {
  if (typeof window === 'undefined') return null;
  const g = window.gsap && typeof window.gsap.to === 'function' ? window.gsap : null;
  if (g && !window.__gsap240HzConfigured) {
    window.__gsap240HzConfigured = true;
    try {
      // Synchronize GSAP ticker with 120Hz/144Hz/240Hz ProMotion & gaming refresh rates
      g.ticker.lagSmoothing(1000, 16);
      if (typeof g.config === 'function') {
        g.config({ force3D: true, autoSleep: 60 });
      }
    } catch (_) { }
  }
  return g;
}

/**
 * Attaches ultra-luxury magnetic spring hover & click physics to a button or pill
 */
export function attachButtonGSAP(btn) {
  if (!btn || animatedButtons.has(btn)) return;
  if (btn.classList.contains('popular-3d-arrow') ||
      btn.classList.contains('carousel-arrow') ||
      btn.classList.contains('discover-arrow') ||
      btn.classList.contains('section-carousel-arrow') ||
      btn.hasAttribute('data-no-gsap')) return;
  animatedButtons.add(btn);

  btn.setAttribute('data-glass-interactive', 'true');

  const gsap = getGSAP();
  if (!gsap || prefersReducedMotion()) return;

  const svg = btn.querySelector('svg');
  let btnRect = null;

  // Mouse enter: smooth elastic scale & lift
  btn.addEventListener('mouseenter', () => {
    btnRect = btn.getBoundingClientRect();
    gsap.to(btn, {
      scale: 1.035,
      y: -2.5,
      duration: 0.18,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    if (svg) {
      gsap.to(svg, {
        scale: 1.15,
        rotate: 2,
        duration: 0.18,
        ease: 'back.out(2)',
        overwrite: 'auto'
      });
    }
  });

  // Mouse move: subtle magnetic cursor pull (desktop with fine pointer only)
  // gsap.quickTo() reuses a single tween with cached bounds for zero layout thrashing at 240Hz
  if (isFinePointer()) {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.12, ease: "power2.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.12, ease: "power2.out" });
    btn.addEventListener('mousemove', (e) => {
      if (!btnRect) btnRect = btn.getBoundingClientRect();
      xTo((e.clientX - btnRect.left - btnRect.width / 2) * 0.12);
      yTo((e.clientY - btnRect.top - btnRect.height / 2) * 0.12 - 2.5);
    }, { passive: true });
  }

  // Mouse leave: smooth spring release back to origin
  btn.addEventListener('mouseleave', () => {
    btnRect = null;
    gsap.to(btn, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.28,
      ease: 'power3.out',
      overwrite: 'auto'
    });
    if (svg) {
      gsap.to(svg, {
        scale: 1,
        rotate: 0,
        duration: 0.22,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    }
  });

  // Mouse down: tactile physical compression
  btn.addEventListener('mousedown', () => {
    gsap.to(btn, {
      scale: 0.95,
      y: 0,
      duration: 0.1,
      ease: 'power2.in',
      overwrite: 'auto'
    });
  });

  // Mouse up: snap back to hover state
  btn.addEventListener('mouseup', () => {
    gsap.to(btn, {
      scale: 1.035,
      y: -2.5,
      duration: 0.22,
      ease: 'back.out(2)',
      overwrite: 'auto'
    });
  });
}

/**
 * Attaches 3D perspective magnetic tilt to destination cards, stay cards, place cards
 */
export function attachCardGSAP(card) {
  if (!card || animatedCards.has(card)) return;
  if (card.classList.contains('popular-3d-card') || card.closest('.popular-3d-stage') || card.hasAttribute('data-no-gsap')) return;
  animatedCards.add(card);

  card.setAttribute('data-card-interactive', 'true');

  const gsap = getGSAP();
  if (!gsap || prefersReducedMotion()) return;

  // gsap.quickTo() for rotateX/rotateY — reuses single tween with cached bounds for zero layout thrashing at 240Hz
  if (isFinePointer()) {
    gsap.set(card, { transformPerspective: 1000, force3D: true });
    const rxTo = gsap.quickTo(card, "rotateX", { duration: 0.14, ease: "power2.out" });
    const ryTo = gsap.quickTo(card, "rotateY", { duration: 0.14, ease: "power2.out" });
    let cardRect = null;

    card.addEventListener('mouseenter', () => {
      cardRect = card.getBoundingClientRect();
      gsap.to(card, { scale: 1.02, y: -6, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
    });

    card.addEventListener('mousemove', (e) => {
      if (!cardRect) cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      ryTo(((x / cardRect.width) - 0.5) * 10);
      rxTo(-((y / cardRect.height) - 0.5) * 10);
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      cardRect = null;
      rxTo(0);
      ryTo(0);
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.32,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  }
}

const BUTTON_SELECTORS = [
  '.btn',
  '.btn-primary',
  '.btn-outline',
  '.btn-ghost',
  '.btn-gradient',
  'button:not(.swatch):not(.popular-3d-arrow):not(.carousel-arrow):not(.discover-arrow):not(.section-carousel-arrow):not([data-no-gsap])',
  'input[type="button"]',
  'input[type="submit"]',
  '.nav-link',
  '.nav-cta-pill',
  '.theme-toggle-btn',
  '.nav-offline-btn',
  '.brand-mark',
  '.mobile-nav-btn',
  '.category-pill-btn',
  '.category-chip',
  '.filter-chip',
  '.quick-tag-btn',
  '.dest-quick-pill',
  '.month-pill',
  '.dest-filter-btn',
  '.sort-btn',
  '.section-link',
  '.footer-link',
  '.state-link',
  '.load-more-luxury-btn',
  '.carousel-btn',
  '.hero-car-btn',
  '.cheat-sos-btn',
  '.state-accordion-summary',
  '.accordion-trigger',
  'summary'
].join(',');

const CARD_SELECTORS = [
  '.dest-card-link',
  '.destination-card',
  '.explore-card',
  '.trend-card',
  '.hero-hill-card',
  '.place-card',
  '.stay-card',
  '.mini-card',
  '.bento-tile',
  '.bento-stat-card'
].join(',');

/**
 * Scans a subtree and attaches GSAP micro-interactions to matching buttons and cards
 */
export function scanAndAttachGSAP(root = document) {
  if (!root || !root.querySelectorAll) return;

  try {
    const buttons = root.querySelectorAll(BUTTON_SELECTORS);
    for (let i = 0; i < buttons.length; i++) {
      attachButtonGSAP(buttons[i]);
    }
  } catch (err) {
    // Graceful selector ignore if any pseudo fails
  }

  try {
    const cards = root.querySelectorAll(CARD_SELECTORS);
    for (let i = 0; i < cards.length; i++) {
      attachCardGSAP(cards[i]);
    }
  } catch (err) {
    // Graceful selector ignore
  }
}

let mutationObserver = null;

/**
 * Initializes global GSAP interactive hover engine across current and dynamic DOM
 */
export function initGlobalGlassHoverGSAP() {
  scanAndAttachGSAP(document);

  // Re-scan when GSAP finishes loading asynchronously if deferred
  if (!window.gsap) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.gsap) {
        clearInterval(interval);
        scanAndAttachGSAP(document);
      } else if (attempts > 30) {
        clearInterval(interval);
      }
    }, 100);
  }

  // Observe dynamically inserted elements (infinite scroll cards, filter tabs, modal buttons)
  if (!mutationObserver && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeType === 1) { // ELEMENT_NODE
              scanAndAttachGSAP(node);
            }
          }
        }
      }
    });

    mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

// Expose globally for page scripts
if (typeof window !== 'undefined') {
  window.initGlobalGlassHoverGSAP = initGlobalGlassHoverGSAP;
  window.scanAndAttachGSAP = scanAndAttachGSAP;
}
