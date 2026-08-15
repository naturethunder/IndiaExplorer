/**
 * gsap-animations.js — Reusable GSAP + ScrollTrigger animation utilities.
 *
 * Strategy: progressive enhancement.
 *   1. The page renders with CSS `.reveal` (opacity:0 / translateY) as a fallback.
 *   2. This module loads GSAP lazily (dynamic import) so it never blocks paint.
 *   3. On success it adds `.gsap-managed` to animated elements (removes CSS transition
 *      so GSAP has full control) and runs ScrollTrigger-based animations.
 *   4. If GSAP fails to load, or the user prefers reduced motion, `.in-view` is
 *      applied to all `.reveal` elements instantly — no content is ever hidden.
 *
 * Sources (ui-ux-pro-max §7 Animation rules applied):
 *   - duration-timing   : 300–450ms for scroll reveals
 *   - easing            : power2.out for entering, back.out for springy cards
 *   - stagger-sequence  : 0.06s per grid child (≤8 visible at a time)
 *   - transform-perf    : only opacity + transform (no layout props)
 *   - reduced-motion    : all functions no-op via the PRM guard
 *   - no-blocking-anim  : lazy dynamic import — never blocks user input
 *   - parallax-subtle   : yPercent delta kept at 8 (well within 5–15 guideline)
 */

const PRM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Immediately reveal all .reveal elements (fallback path). */
function showAllInstantly() {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
}

/**
 * loadScript — injects a <script> tag and resolves when it loads.
 * Used for UMD vendor files that write to window globals.
 * @param {string} src  Relative URL (resolved from the current page location).
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Avoid double-loading if a prior call already added the tag.
    if (document.querySelector(`script[data-gsap-src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.dataset.gsapSrc = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error('Script load failed: ' + src));
    document.head.appendChild(el);
  });
}

/**
 * Boot GSAP from the local vendor bundle.
 * The vendor files are UMD bundles — they write to window.gsap / window.ScrollTrigger
 * when injected as classic scripts.  Dynamic ES import() would give them a module
 * scope where the UMD "self" fallback creates an orphaned object, not window.gsap.
 *
 * Returns { gsap, ScrollTrigger } or null on failure.
 */
async function loadGSAP() {
  try {
    // Resolve paths relative to this module's directory (js/utils/ → js/vendor/).
    const base = new URL('.', import.meta.url).href;
    await loadScript(new URL('../vendor/gsap.min.js', base).href);
    await loadScript(new URL('../vendor/ScrollTrigger.min.js', base).href);

    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) throw new Error('GSAP globals not found after script load');

    gsap.registerPlugin(ScrollTrigger);
    console.debug('[gsap-animations] GSAP v' + gsap.version + ' + ScrollTrigger ready');
    return { gsap, ScrollTrigger };
  } catch (err) {
    console.warn('[gsap-animations] Failed to load GSAP — falling back to CSS reveals:', err);
    return null;
  }
}


// ─── Animation recipes ────────────────────────────────────────────────────────

/**
 * revealFadeUp — subtle fade + slight upward drift for section headings / text.
 *
 * Intensity: Subtle  |  Duration: 350ms  |  Easing: power1.out
 * Source: ui-ux-pro-max gsap domain — Scroll Reveal / Subtle tier
 *
 * @param {Element|string} target  DOM element or CSS selector.
 * @param {object} [opts]          Override defaults.
 */
export function revealFadeUp(target, opts = {}) {
  if (PRM) return;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  _withGSAP(({ gsap, ScrollTrigger }) => {
    if (el.classList.contains('gsap-managed')) return; // prevent double-animation
    el.classList.add('gsap-managed');
    gsap.from(el, {
      opacity: 0,
      y: opts.y ?? 16,
      duration: opts.duration ?? 0.35,
      ease: opts.ease ?? 'power1.out',
      scrollTrigger: {
        trigger: el,
        start: opts.start ?? 'top 90%',
        // play once; never reverse so back-scrolling doesn't re-hide content
        toggleActions: 'play none none none',
        ...opts.scrollTrigger,
      },
    });
  });
}

/**
 * revealStaggerChildren — spring-in stagger for card/grid children.
 *
 * Intensity: Standard  |  Duration: 400ms  |  Easing: back.out(1.4)
 * Source: ui-ux-pro-max gsap domain — Stagger List / Standard tier
 *
 * @param {Element|string} container  Parent element whose children are animated.
 * @param {object} [opts]             Override defaults.
 */
export function revealStaggerChildren(container, opts = {}) {
  if (PRM) return;
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el || !el.children.length) return;

  _withGSAP(({ gsap }) => {
    // Limit to first 8 visible children per the "don't stagger >8" guideline
    const children = Array.from(el.children).slice(0, opts.maxChildren ?? 8);
    if (children[0] && children[0].classList.contains('gsap-managed')) return; // prevent double-animation
    children.forEach((c) => c.classList.add('gsap-managed'));

    gsap.from(children, {
      opacity: 0,
      scale: opts.scale ?? 0.94,
      y: opts.y ?? 20,
      duration: opts.duration ?? 0.4,
      ease: opts.ease ?? 'back.out(1.4)',
      stagger: {
        each: opts.each ?? 0.06,
        from: opts.from ?? 'start',
        grid: opts.grid ?? 'auto',
      },
      scrollTrigger: {
        trigger: el,
        start: opts.start ?? 'top 85%',
        toggleActions: 'play none none none',
        ...opts.scrollTrigger,
      },
    });
  });
}

/**
 * revealParallaxBg — subtle vertical parallax on a background decorative layer.
 *
 * Intensity: Subtle  |  Scrub: true  |  yPercent: 8
 * Source: ui-ux-pro-max gsap domain — Parallax Scroll / Subtle tier
 *
 * @param {Element|string} layer    The background element to parallax.
 * @param {Element|string} section  The scroll trigger container.
 * @param {object} [opts]           Override defaults.
 */
export function revealParallaxBg(layer, section, opts = {}) {
  if (PRM) return;
  const layerEl = typeof layer === 'string' ? document.querySelector(layer) : layer;
  const sectionEl = typeof section === 'string' ? document.querySelector(section) : section;
  if (!layerEl || !sectionEl) return;

  _withGSAP(({ gsap, ScrollTrigger }) => {
    // will-change is set only during scroll; freed when trigger leaves viewport
    ScrollTrigger.create({
      trigger: sectionEl,
      onEnter: () => { layerEl.style.willChange = 'transform'; },
      onLeave: () => { layerEl.style.willChange = 'auto'; },
      onEnterBack: () => { layerEl.style.willChange = 'transform'; },
      onLeaveBack: () => { layerEl.style.willChange = 'auto'; },
    });

    gsap.to(layerEl, {
      yPercent: opts.yPercent ?? 8,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top bottom',
        end: 'bottom top',
        scrub: opts.scrub ?? true,
        ...opts.scrollTrigger,
      },
    });
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Singleton promise — GSAP is loaded once regardless of how many callers boot it. */
let _gsapPromise = null;

function _getGSAP() {
  if (!_gsapPromise) {
    _gsapPromise = loadGSAP().then((libs) => {
      if (!libs) showAllInstantly();
      return libs;
    });
  }
  return _gsapPromise;
}

/**
 * Run `fn({ gsap, ScrollTrigger })` once GSAP has loaded.
 * If GSAP fails, the fallback (showAllInstantly) runs and `fn` is never called.
 */
function _withGSAP(fn) {
  _getGSAP().then((libs) => { if (libs) fn(libs); });
}

// ─── Init (auto-called on import) ─────────────────────────────────────────────

/**
 * Kick off the lazy GSAP load immediately when this module is imported.
 * If reduced-motion is active, reveal everything instantly and skip GSAP.
 */
(function init() {
  if (PRM) {
    showAllInstantly();
    return;
  }
  // Pre-warm the GSAP singleton — this starts the network fetch early so
  // animations are ready by the time the page finishes painting.
  _getGSAP();
})();
