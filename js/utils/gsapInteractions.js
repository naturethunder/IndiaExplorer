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
  return window.gsap && typeof window.gsap.to === 'function' ? window.gsap : null;
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

  // Mouse enter: smooth elastic scale & lift
  btn.addEventListener('mouseenter', () => {
    gsap.to(btn, {
      scale: 1.035,
      y: -2.5,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    if (svg) {
      gsap.to(svg, {
        scale: 1.15,
        rotate: 2,
        duration: 0.24,
        ease: 'back.out(2)',
        overwrite: 'auto'
      });
    }
  });

  // Mouse move: subtle magnetic cursor pull (desktop with fine pointer only)
  if (isFinePointer()) {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.12;
      gsap.to(btn, {
        x: x,
        y: y - 2.5,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });
  }

  // Mouse leave: smooth spring release back to origin
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.38,
      ease: 'power3.out',
      overwrite: 'auto'
    });
    if (svg) {
      gsap.to(svg, {
        scale: 1,
        rotate: 0,
        duration: 0.32,
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

  if (isFinePointer()) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = -((y / rect.height) - 0.5) * 10;

      gsap.to(card, {
        transformPerspective: 1000,
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.02,
        y: -6,
        duration: 0.25,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        y: 0,
        duration: 0.48,
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
