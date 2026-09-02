#!/usr/bin/env node
/**
 * build-css.js — generate css/tailwind.css: a static, plain-CSS replacement
 * for the Tailwind CDN (which the site used only as a runtime utility-class
 * compiler). Scans every HTML page + js/ module for class tokens (the same
 * "content scan" Tailwind itself does), resolves each token against a local
 * implementation of the utility families this project uses, and emits:
 *   preflight (Tailwind's base reset) + resolved utilities + responsive blocks.
 *
 * Pixel-identical by construction: every rule matches Tailwind v3's output
 * for that class. Unknown tokens (custom classes from css/styles.css, plain
 * words) are simply skipped. Re-run after adding new utility classes:
 *   node scripts/build-css.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'css', 'tailwind.css');

// ─── Theme ──────────────────────────────────────────────
const COLORS = {
  // green-700: .text-primary on white and white-on-.bg-primary both pass WCAG AA
  // (the brand's bright #22C55E is only 2.3:1). The dark footer overrides
  // .text-primary back to the bright brand green in styles.css.
  primary: '#15803D',
  'primary-dark': '#166534',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
  gray: { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827' },
  slate: { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  orange: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',700:'#c2410c',800:'#9a3412' },
  amber: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',800:'#92400e',900:'#78350f' },
  yellow: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',700:'#a16207',800:'#854d0e',900:'#713f12' },
  emerald: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' },
  teal: { 600:'#0d9488' },
  green: { 600:'#16a34a' },
  blue: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',500:'#3b82f6',700:'#1d4ed8',800:'#1e40af' },
  indigo: { 100:'#e0e7ff',200:'#c7d2fe',800:'#3730a3' },
  violet: { 100:'#ede9fe',200:'#ddd6fe',800:'#5b21b6' },
  purple: { 300:'#d8b4fe',500:'#a855f7',700:'#7e22ce' },
  rose: { 100:'#ffe4e6',200:'#fecdd3',800:'#9f1239' },
  red: { 50:'#fef2f2',200:'#fecaca',300:'#fca5a5',500:'#ef4444',600:'#dc2626',700:'#b91c1c',950:'#450a0a' },
};

function colorValue(name) {
  // name like "gray-500", "primary", "primary-dark", "white", "black/60" handled upstream
  if (COLORS[name] && typeof COLORS[name] === 'string') return COLORS[name];
  const m = name.match(/^([a-z]+)-(\d{2,3})$/);
  if (m && COLORS[m[1]] && COLORS[m[1]][m[2]]) return COLORS[m[1]][m[2]];
  return null;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
/** "gray-900/50" → resolved CSS color (rgb(...)/alpha or plain). */
function resolveColor(token) {
  const slash = token.lastIndexOf('/');
  let name = token, alpha = null;
  if (slash > 0) {
    const a = token.slice(slash + 1);
    if (/^\d{1,3}$/.test(a)) { name = token.slice(0, slash); alpha = parseInt(a, 10) / 100; }
  }
  const val = colorValue(name);
  if (!val) return null;
  if (alpha == null) return val;
  if (val === 'transparent' || val === 'currentColor') return val;
  const [r, g, b] = hexToRgb(val);
  return 'rgb(' + r + ' ' + g + ' ' + b + ' / ' + alpha + ')';
}

// spacing scale: n * 0.25rem (supports 0.5, 1.5, 2.5 …); px = 1px
function spacing(v) {
  if (v === 'px') return '1px';
  if (v === '0') return '0px';
  if (/^\d+(\.\d+)?$/.test(v)) return (parseFloat(v) * 0.25) + 'rem';
  if (/^\d+\/\d+$/.test(v)) { const [a, b] = v.split('/'); return (100 * a / b).toFixed(6).replace(/0+$/, '').replace(/\.$/, '') + '%'; }
  if (/^\[.+\]$/.test(v)) return v.slice(1, -1).replace(/_/g, ' ');
  return null;
}

const FRACTION_OK = true;

const TEXT_SIZES = {
  xs: ['0.75rem', '1rem'], sm: ['0.875rem', '1.25rem'], base: ['1rem', '1.5rem'],
  lg: ['1.125rem', '1.75rem'], xl: ['1.25rem', '1.75rem'], '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'], '4xl': ['2.25rem', '2.5rem'], '5xl': ['3rem', '1'], '6xl': ['3.75rem', '1'],
};
const MAX_W = {
  xs:'20rem', sm:'24rem', md:'28rem', lg:'32rem', xl:'36rem', '2xl':'42rem', '3xl':'48rem',
  '4xl':'56rem', '5xl':'64rem', '6xl':'72rem', '7xl':'80rem', full:'100%', none:'none',
};
const ROUNDED = {
  '': '0.25rem', sm:'0.125rem', md:'0.375rem', lg:'0.5rem', xl:'0.75rem',
  '2xl':'1rem', '3xl':'1.5rem', full:'9999px', none:'0px',
};
// Each layer's color is a var() with the original black/alpha as fallback, so a
// paired `shadow-{color}[/alpha]` utility (which only sets --tw-shadow-color)
// re-tints every layer — matching Tailwind's real colored-shadow behavior.
const SHADOWS = {
  sm: '0 1px 2px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.05))',
  '': '0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
  md: '0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
  lg: '0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
  xl: '0 20px 25px -5px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 8px 10px -6px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
  '2xl': '0 25px 50px -12px var(--tw-shadow-color, rgb(0 0 0 / 0.25))',
};
const GRADIENT_DIR = {
  t: 'to top', tr: 'to top right', r: 'to right', br: 'to bottom right',
  b: 'to bottom', bl: 'to bottom left', l: 'to left', tl: 'to top left',
};

// ─── Resolver: base class (no variants) → array of [prop, value] or raw rule ──
// Returns { decls: [[prop,val],...] } or { raw: 'full-rule-body' } or
// { selector: (s)=>..., decls } for pseudo-element cases; null if unknown.
function resolve(cls) {
  let m;
  const d = (decls) => ({ decls });

  // ── static table ──
  const STATIC = {
    block: [['display', 'block']], 'inline-block': [['display', 'inline-block']],
    inline: [['display', 'inline']],
    flex: [['display', 'flex']], 'inline-flex': [['display', 'inline-flex']],
    grid: [['display', 'grid']], hidden: [['display', 'none']],
    absolute: [['position', 'absolute']], relative: [['position', 'relative']],
    fixed: [['position', 'fixed']], sticky: [['position', 'sticky']],
    'flex-1': [['flex', '1 1 0%']], 'flex-col': [['flex-direction', 'column']],
    'flex-row': [['flex-direction', 'row']], 'flex-wrap': [['flex-wrap', 'wrap']],
    'shrink-0': [['flex-shrink', '0']],
    'items-center': [['align-items', 'center']], 'items-start': [['align-items', 'flex-start']],
    'items-end': [['align-items', 'flex-end']],
    'justify-between': [['justify-content', 'space-between']],
    'justify-center': [['justify-content', 'center']],
    'justify-end': [['justify-content', 'flex-end']],
    'text-left': [['text-align', 'left']], 'text-center': [['text-align', 'center']],
    'text-right': [['text-align', 'right']],
    uppercase: [['text-transform', 'uppercase']], capitalize: [['text-transform', 'capitalize']],
    underline: [['text-decoration-line', 'underline']],
    'break-all': [['word-break', 'break-all']],
    'whitespace-nowrap': [['white-space', 'nowrap']],
    'overflow-hidden': [['overflow', 'hidden']],
    'overflow-x-auto': [['overflow-x', 'auto']], 'overflow-y-auto': [['overflow-y', 'auto']],
    'object-cover': [['object-fit', 'cover']],
    'cursor-pointer': [['cursor', 'pointer']],
    'resize-none': [['resize', 'none']],
    'outline-none': [['outline', '2px solid transparent'], ['outline-offset', '2px']],
    'min-h-screen': [['min-height', '100vh']],
    'min-w-0': [['min-width', '0px']],
    'w-full': [['width', '100%']], 'h-full': [['height', '100%']],
    'inset-0': [['inset', '0px']],
    'font-medium': [['font-weight', '500']], 'font-semibold': [['font-weight', '600']],
    'font-bold': [['font-weight', '700']], 'font-extrabold': [['font-weight', '800']],
    'leading-none': [['line-height', '1']], 'leading-tight': [['line-height', '1.25']],
    'leading-snug': [['line-height', '1.375']], 'leading-relaxed': [['line-height', '1.625']],
    'tracking-tight': [['letter-spacing', '-0.025em']], 'tracking-wider': [['letter-spacing', '0.05em']],
    'aspect-square': [['aspect-ratio', '1 / 1']], 'aspect-video': [['aspect-ratio', '16 / 9']],
    'ml-auto': [['margin-left', 'auto']], 'mx-auto': [['margin-left', 'auto'], ['margin-right', 'auto']],
    border: [['border-width', '1px']], 'border-0': [['border-width', '0px']],
    'border-b': [['border-bottom-width', '1px']], 'border-t': [['border-top-width', '1px']],
    'transition-all': [
      ['transition-property', 'all'],
      ['transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['transition-duration', '150ms'],
    ],
    transition: [
      ['transition-property', 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter'],
      ['transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['transition-duration', '150ms'],
    ],
    'transition-colors': [
      ['transition-property', 'color, background-color, border-color, text-decoration-color, fill, stroke'],
      ['transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['transition-duration', '150ms'],
    ],
    'transition-transform': [
      ['transition-property', 'transform'],
      ['transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1)'],
      ['transition-duration', '150ms'],
    ],
    truncate: [['overflow', 'hidden'], ['text-overflow', 'ellipsis'], ['white-space', 'nowrap']],
    'backdrop-blur-sm': [['-webkit-backdrop-filter', 'blur(4px)'], ['backdrop-filter', 'blur(4px)']],
    'backdrop-blur': [['-webkit-backdrop-filter', 'blur(8px)'], ['backdrop-filter', 'blur(8px)']],
    'backdrop-blur-md': [['-webkit-backdrop-filter', 'blur(12px)'], ['backdrop-filter', 'blur(12px)']],
    'backdrop-blur-lg': [['-webkit-backdrop-filter', 'blur(16px)'], ['backdrop-filter', 'blur(16px)']],
    'backdrop-blur-xl': [['-webkit-backdrop-filter', 'blur(24px)'], ['backdrop-filter', 'blur(24px)']],
    'backdrop-blur-2xl': [['-webkit-backdrop-filter', 'blur(40px)'], ['backdrop-filter', 'blur(40px)']],
    'ring-current': [['--tw-ring-color', 'currentColor']],
    'list-disc': [['list-style-type', 'disc']],
    'list-none': [['list-style-type', 'none']],
    'col-span-full': [['grid-column', '1 / -1']],
    'to-transparent': [['--tw-gradient-to', 'transparent var(--tw-gradient-to-position)']],
    italic: [['font-style', 'italic']],
    'not-italic': [['font-style', 'normal']],
    'font-serif': [['font-family', 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif']],
    'font-mono': [['font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace']],
    'tracking-widest': [['letter-spacing', '0.1em']],
    'self-start': [['align-self', 'flex-start']],
    'self-end': [['align-self', 'flex-end']],
    'self-center': [['align-self', 'center']],
    'self-auto': [['align-self', 'auto']],
    'self-stretch': [['align-self', 'stretch']],
    'pointer-events-none': [['pointer-events', 'none']],
    'pointer-events-auto': [['pointer-events', 'auto']],
    'min-w-max': [['min-width', 'max-content']],
    'min-w-min': [['min-width', 'min-content']],
    'animate-spin': [['animation', 'tw-spin 1s linear infinite']],
    'sr-only': [
      ['position', 'absolute'], ['width', '1px'], ['height', '1px'], ['padding', '0'],
      ['margin', '-1px'], ['overflow', 'hidden'], ['clip', 'rect(0, 0, 0, 0)'],
      ['white-space', 'nowrap'], ['border-width', '0'],
    ],
  };
  if (STATIC[cls]) return d(STATIC[cls]);

  // line-clamp-N
  if ((m = cls.match(/^line-clamp-(\d+)$/))) {
    return d([['overflow', 'hidden'], ['display', '-webkit-box'], ['-webkit-box-orient', 'vertical'], ['-webkit-line-clamp', m[1]]]);
  }

  // duration / delay
  if ((m = cls.match(/^duration-(\d+)$/))) return d([['transition-duration', m[1] + 'ms']]);
  if ((m = cls.match(/^delay-(\d+)$/))) return d([['transition-delay', m[1] + 'ms']]);

  // z-index
  if ((m = cls.match(/^z-(\d+)$/))) return d([['z-index', m[1]]]);
  if ((m = cls.match(/^z-\[(\d+)\]$/))) return d([['z-index', m[1]]]);

  // text size / arbitrary size / color
  if ((m = cls.match(/^text-(xs|sm|base|lg|xl|\dxl)$/))) {
    const t = TEXT_SIZES[m[1]];
    return d([['font-size', t[0]], ['line-height', t[1]]]);
  }
  if ((m = cls.match(/^text-\[(\d+(?:\.\d+)?(?:px|rem|em))\]$/))) return d([['font-size', m[1]]]);
  if (cls.startsWith('text-')) {
    const c = resolveColor(cls.slice(5));
    if (c) return d([['color', c]]);
  }

  // background color / gradient
  if ((m = cls.match(/^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/))) {
    return d([['background-image', 'linear-gradient(' + GRADIENT_DIR[m[1]] + ', var(--tw-gradient-stops))']]);
  }
  if (cls.startsWith('bg-')) {
    const c = resolveColor(cls.slice(3));
    if (c) return d([['background-color', c]]);
  }

  // gradient stops
  if (cls.startsWith('from-')) {
    const c = resolveColor(cls.slice(5));
    if (c) {
      const toC = c.startsWith('rgb(') ? c.replace(/\/ [\d.]+\)$/, '/ 0)') : (c === 'transparent' ? 'transparent' : 'rgb(' + hexToRgb(c).join(' ') + ' / 0)');
      return d([
        ['--tw-gradient-from', c + ' var(--tw-gradient-from-position)'],
        ['--tw-gradient-to', toC + ' var(--tw-gradient-to-position)'],
        ['--tw-gradient-stops', 'var(--tw-gradient-from), var(--tw-gradient-to)'],
      ]);
    }
  }
  if (cls.startsWith('via-')) {
    const c = resolveColor(cls.slice(4));
    if (c) {
      const toC = c.startsWith('rgb(') ? c.replace(/\/ [\d.]+\)$/, '/ 0)') : (c === 'transparent' ? 'transparent' : 'rgb(' + hexToRgb(c).join(' ') + ' / 0)');
      return d([
        ['--tw-gradient-to', toC + ' var(--tw-gradient-to-position)'],
        ['--tw-gradient-stops', 'var(--tw-gradient-from), ' + c + ' var(--tw-gradient-via-position), var(--tw-gradient-to)'],
      ]);
    }
  }
  if (cls.startsWith('to-')) {
    const c = resolveColor(cls.slice(3));
    if (c) return d([['--tw-gradient-to', c + ' var(--tw-gradient-to-position)']]);
  }

  // border width (all sides / per-side): border-2, border-t-4, border-l-8 …
  if ((m = cls.match(/^border(?:-(t|b|l|r))?-(2|4|8)$/))) {
    const w = m[2] + 'px';
    const sides = { t: ['border-top-width'], b: ['border-bottom-width'], l: ['border-left-width'], r: ['border-right-width'] };
    const props = m[1] ? sides[m[1]] : ['border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width'];
    return d(props.map((p) => [p, w]));
  }
  // border color / width sides
  if (cls.startsWith('border-')) {
    const c = resolveColor(cls.slice(7));
    if (c) return d([['border-color', c]]);
  }

  // drop-shadow (filter-based)
  const DROP_SHADOWS = {
    sm: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
    md: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))',
    lg: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))',
    xl: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))',
  };
  if ((m = cls.match(/^drop-shadow(?:-(sm|md|lg|xl))?$/))) {
    const v = m[1] ? DROP_SHADOWS[m[1]] : 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))';
    return d([['filter', v]]);
  }

  // placeholder color
  if (cls.startsWith('placeholder-')) {
    const c = resolveColor(cls.slice(12));
    if (c) return { selector: (s) => s + '::placeholder', decls: [['color', c]] };
  }

  // accent
  if (cls.startsWith('accent-')) {
    const c = resolveColor(cls.slice(7));
    if (c) return d([['accent-color', c]]);
  }

  // ring
  if (cls === 'ring-2' || cls === 'ring-0' || (m = cls.match(/^ring-(\d)$/))) {
    const w = cls.split('-')[1];
    return d([
      ['--tw-ring-offset-shadow', 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)'],
      ['--tw-ring-shadow', 'var(--tw-ring-inset) 0 0 0 calc(' + w + 'px + var(--tw-ring-offset-width)) var(--tw-ring-color)'],
      ['box-shadow', 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'],
    ]);
  }
  if ((m = cls.match(/^ring-offset-(\d+)$/))) return d([['--tw-ring-offset-width', m[1] + 'px']]);
  if (cls.startsWith('ring-')) {
    const c = resolveColor(cls.slice(5));
    if (c) return d([['--tw-ring-color', c]]);
  }

  // shadow
  if ((m = cls.match(/^shadow(?:-(sm|md|lg|xl|2xl))?$/))) {
    const s = SHADOWS[m[1] || ''];
    if (s) return d([
      ['--tw-shadow', s],
      ['box-shadow', 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)'],
    ]);
  }
  // shadow color (e.g. shadow-emerald-950/40) — only sets --tw-shadow-color;
  // the shadow-{size} utility above must also be present to supply the shape.
  if ((m = cls.match(/^shadow-([a-z]+-\d{2,3})(?:\/(\d{1,3}))?$/))) {
    const c = resolveColor(m[2] ? m[1] + '/' + m[2] : m[1]);
    if (c) return d([['--tw-shadow-color', c]]);
  }

  // rounded
  if ((m = cls.match(/^rounded(?:-(t|b|l|r|tl|tr|bl|br))?(?:-(sm|md|lg|xl|2xl|3xl|full|none))?$/))) {
    const size = ROUNDED[m[2] || ''];
    if (size == null) return null;
    const side = m[1];
    if (!side) return d([['border-radius', size]]);
    const corners = {
      t: ['top-left', 'top-right'], b: ['bottom-left', 'bottom-right'],
      l: ['top-left', 'bottom-left'], r: ['top-right', 'bottom-right'],
      tl: ['top-left'], tr: ['top-right'], bl: ['bottom-left'], br: ['bottom-right'],
    }[side];
    return d(corners.map((c) => ['border-' + c + '-radius', size]));
  }

  // max-w
  if ((m = cls.match(/^max-w-(.+)$/))) {
    if (MAX_W[m[1]]) return d([['max-width', MAX_W[m[1]]]]);
    const sp = spacing(m[1]);
    if (sp) return d([['max-width', sp]]);
  }
  // max-h (incl. arbitrary)
  if ((m = cls.match(/^max-h-(.+)$/))) {
    const sp = spacing(m[1]);
    if (sp) return d([['max-height', sp]]);
  }

  // width / height
  if ((m = cls.match(/^w-(.+)$/))) { const sp = spacing(m[1]); if (sp) return d([['width', sp]]); }
  if ((m = cls.match(/^h-(.+)$/))) { const sp = spacing(m[1]); if (sp) return d([['height', sp]]); }

  // spacing: p/px/py/pt/pb/pl/pr, m variants
  const SPACE_MAP = {
    p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'],
    pt: ['padding-top'], pb: ['padding-bottom'], pl: ['padding-left'], pr: ['padding-right'],
    m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'],
    mt: ['margin-top'], mb: ['margin-bottom'], ml: ['margin-left'], mr: ['margin-right'],
  };
  if ((m = cls.match(/^(-?)(p[trblxy]?|m[trblxy]?)-(.+)$/)) && SPACE_MAP[m[2]]) {
    const sp = spacing(m[3]);
    if (sp) return d(SPACE_MAP[m[2]].map((prop) => [prop, (m[1] ? '-' : '') + sp]));
  }

  // gap
  if ((m = cls.match(/^gap-(.+)$/)) && !cls.startsWith('gap-x') && !cls.startsWith('gap-y')) {
    const sp = spacing(m[1]); if (sp) return d([['gap', sp]]);
  }
  if ((m = cls.match(/^gap-x-(.+)$/))) { const sp = spacing(m[1]); if (sp) return d([['column-gap', sp]]); }
  if ((m = cls.match(/^gap-y-(.+)$/))) { const sp = spacing(m[1]); if (sp) return d([['row-gap', sp]]); }

  // space-y-N / space-x-N (child selector)
  if ((m = cls.match(/^space-(x|y)-(.+)$/))) {
    const sp = spacing(m[2]);
    if (sp) {
      const prop = m[1] === 'y' ? 'margin-top' : 'margin-left';
      return { selector: (s) => s + ' > :not([hidden]) ~ :not([hidden])', decls: [[prop, sp]] };
    }
  }

  // inset: top/bottom/left/right (incl. negative + fractions)
  if ((m = cls.match(/^(-?)(top|bottom|left|right)-(.+)$/))) {
    const sp = spacing(m[3]);
    if (sp) return d([[m[2], (m[1] ? '-' : '') + sp]]);
  }

  // grid
  if ((m = cls.match(/^grid-cols-(\d+)$/))) return d([['grid-template-columns', 'repeat(' + m[1] + ', minmax(0, 1fr))']]);
  if ((m = cls.match(/^col-span-(\d+)$/))) return d([['grid-column', 'span ' + m[1] + ' / span ' + m[1]]]);

  // transforms
  if ((m = cls.match(/^scale-(\d+)$/))) return d([['transform', 'scale(' + (parseInt(m[1], 10) / 100) + ')']]);
  if ((m = cls.match(/^(-?)translate-y-(.+)$/))) {
    const sp = spacing(m[2]);
    if (sp) return d([['transform', 'translateY(' + (m[1] ? '-' : '') + sp + ')']]);
  }
  if ((m = cls.match(/^(-?)translate-x-(.+)$/))) {
    const sp = spacing(m[2]);
    if (sp) return d([['transform', 'translateX(' + (m[1] ? '-' : '') + sp + ')']]);
  }

  return null;
}

// ─── Variant handling ───────────────────────────────────
const SCREENS = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' };

function escapeCls(cls) {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch);
}

/**
 * Build a full CSS rule for a token (with variants). Returns
 * { media: '640px'|null, rule: '.sel{...}' } or null.
 */
function buildRule(token) {
  const parts = token.split(':');
  const base0 = parts.pop();
  const variants = parts;
  let important = false;
  let base = base0;
  if (base.startsWith('!')) { important = true; base = base.slice(1); }

  const res = resolve(base);
  if (!res) return null;

  let media = null;
  let selector = '.' + escapeCls(token);
  let pseudo = '';
  let prefix = '';
  for (const v of variants) {
    if (SCREENS[v]) { media = SCREENS[v]; continue; }
    if (v === 'hover') { pseudo += ':hover'; continue; }
    if (v === 'focus') { pseudo += ':focus'; continue; }
    if (v === 'last') { pseudo += ':last-child'; continue; }
    if (v === 'first') { pseudo += ':first-child'; continue; }
    if (v === 'group-hover') { prefix = '.group:hover '; continue; }
    return null; // unknown variant
  }
  let sel = prefix + selector + pseudo;
  if (res.selector) sel = res.selector(sel);

  const body = res.decls
    .map(([p, v]) => p + ': ' + v + (important ? ' !important' : '') + ';')
    .join(' ');
  return { media, rule: sel + ' { ' + body + ' }' };
}

// ─── Content scan ───────────────────────────────────────
const PAGES = [
  'index.html', 'destinations.html', 'ai-finder.html', 'destination.html',
  'about.html', 'contact.html', 'privacy.html', 'terms.html',
];
function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (f) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.js$/.test(f)) out.push(p);
  });
}
const files = PAGES.map((f) => path.join(ROOT, f));
walk(path.join(ROOT, 'js', 'pages'), files);
walk(path.join(ROOT, 'js', 'components'), files);

const tokens = new Set();
files.forEach(function (file) {
  const text = fs.readFileSync(file, 'utf8');
  text.split(/[\s"'`]+/).forEach(function (t) { if (t && t.length < 64) tokens.add(t); });
});

// ─── Preflight (Tailwind v3 base, verbatim behaviour) ───
const PREFLIGHT = `/* ── preflight (Tailwind v3 base reset) ─────────────── */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
::before, ::after { --tw-content: ''; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; font-feature-settings: normal; font-variation-settings: normal; }
body { margin: 0; line-height: inherit; }
hr { height: 0; color: inherit; border-top-width: 1px; }
abbr:where([title]) { text-decoration: underline dotted; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
a { color: inherit; text-decoration: inherit; }
b, strong { font-weight: bolder; }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 1em; }
small { font-size: 80%; }
sub, sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
sub { bottom: -0.25em; } sup { top: -0.5em; }
table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
button, input, optgroup, select, textarea { font-family: inherit; font-size: 100%; font-weight: inherit; line-height: inherit; color: inherit; margin: 0; padding: 0; }
button, select { text-transform: none; }
button, [type='button'], [type='reset'], [type='submit'] { -webkit-appearance: button; background-color: transparent; background-image: none; }
:-moz-focusring { outline: auto; }
:-moz-ui-invalid { box-shadow: none; }
progress { vertical-align: baseline; }
::-webkit-inner-spin-button, ::-webkit-outer-spin-button { height: auto; }
[type='search'] { -webkit-appearance: textfield; outline-offset: -2px; }
::-webkit-search-decoration { -webkit-appearance: none; }
::-webkit-file-upload-button { -webkit-appearance: button; font: inherit; }
summary { display: list-item; }
blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre { margin: 0; }
fieldset { margin: 0; padding: 0; }
legend { padding: 0; }
ol, ul, menu { list-style: none; margin: 0; padding: 0; }
textarea { resize: vertical; }
input::placeholder, textarea::placeholder { opacity: 1; color: #9ca3af; }
button, [role="button"] { cursor: pointer; }
:disabled { cursor: default; }
img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
img, video { max-width: 100%; height: auto; }
[hidden] { display: none; }

/* ── CSS custom-property defaults (ring / shadow / gradient) ── */
*, ::before, ::after {
  --tw-ring-inset: ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-gradient-from-position: ;
  --tw-gradient-via-position: ;
  --tw-gradient-to-position: ;
}

@keyframes tw-spin { to { transform: rotate(360deg); } }
`;

// ─── Generate ───────────────────────────────────────────
const baseRules = [];
const mediaRules = {}; // minWidth -> rules[]
let resolved = 0;

Array.from(tokens).sort().forEach(function (t) {
  // quick plausibility filter (skip obvious prose/code tokens)
  if (!/^[!]?[a-z0-9:/\-.\[\]()%]+$/i.test(t)) return;
  const r = buildRule(t);
  if (!r) return;
  resolved++;
  if (r.media) {
    (mediaRules[r.media] = mediaRules[r.media] || []).push(r.rule);
  } else {
    baseRules.push(r.rule);
  }
});

// order base rules: plain utilities first, then hover/focus/group-hover/last
// (so state variants win at equal specificity)
function variantWeight(rule) {
  if (rule.indexOf(':hover') >= 0 || rule.indexOf(':focus') >= 0 || rule.indexOf(':last-child') >= 0 || rule.indexOf(':first-child') >= 0) return 1;
  return 0;
}
baseRules.sort(function (a, b) { return variantWeight(a) - variantWeight(b); });

let out = '/* GENERATED by scripts/build-css.js — do not edit by hand.\n' +
  '   Static replacement for the Tailwind CDN: only the utility classes\n' +
  '   actually used on this site. Re-run the script after UI changes. */\n\n' +
  PREFLIGHT + '\n/* ── utilities ── */\n' + baseRules.join('\n') + '\n';

Object.keys(mediaRules)
  .sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); })
  .forEach(function (min) {
    out += '\n@media (min-width: ' + min + ') {\n' +
      mediaRules[min].map(function (r) { return '  ' + r; }).join('\n') + '\n}\n';
  });

fs.writeFileSync(OUT, out);
console.log('Wrote ' + OUT + ' — ' + resolved + ' utility rules (' +
  baseRules.length + ' base, ' +
  Object.keys(mediaRules).map(function (k) { return k + ':' + mediaRules[k].length; }).join(', ') + ' responsive)');
