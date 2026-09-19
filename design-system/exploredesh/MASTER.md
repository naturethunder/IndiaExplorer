# ExploreDesh Design System — Master File

> **LOGIC:** When building or updating a specific page or component, follow the dual-engine rules below.
> ExploreDesh operates on a synchronized **Dual-Engine Luxury Architecture**:
> 1. **OLED Cinema Dark Mode:** Royal Obsidian & Heritage Gold luxury glassmorphism.
> 2. **Liquid Pearl Glass Light Mode ("Lait de Perle"):** Editorial daylight luxury with radiant ambient light wells, specular top bevels, and Swiss luxury watch bento grid cards.

---

**Project:** ExploreDesh  
**Last Updated:** 2026-09-19 (rev-12)  
**Category:** Luxury Travel & Cultural Discovery  

---

## Dual-Engine Color Palettes

### 1. Liquid Pearl Glass Light Mode ("Lait de Perle")

| Role | Hex / Value | CSS Token | Notes |
|------|-------------|-----------|-------|
| Canvas Background | `#FAF9F6` | `--color-background` | Soft warm alabaster porcelain |
| Card Surface | `rgba(255, 255, 255, 0.92)` | `--color-card-bg` | Frosted milk glass (`blur(24px) saturate(180%)`) |
| Top Specular Bevel | `inset 0 1px 0 0 #FFFFFF` | `--shadow-specular` | Optical 3D lens highlight |
| Hairline Glass Border | `rgba(255, 255, 255, 0.95)` | `--color-border-glass` | Crisp bevel edge |
| Primary Text | `#0F172A` / `#1C1917` | `--color-text-main` | Deep editorial slate / warm ink (7:1+ AAA) |
| Secondary Text | `#334155` / `#475569` | `--color-text-muted` | Balanced slate |
| Muted Labels | `#64748B` | `--color-text-subtle` | Crisp micro-copy |
| Primary Accent / Gold | `#D97706` / `#B45309` | `--color-accent` | Warm royal amber / burnt gold |
| Gold Corona Glow | `rgba(217, 119, 6, 0.20)` | `--shadow-corona` | Soft amber ambient hover halo |

### 2. OLED Cinema Dark Mode (Royal Obsidian)

| Role | Hex / Value | CSS Token | Notes |
|------|-------------|-----------|-------|
| Canvas Background | `#080A0F` / `#07090E` | `--color-background-dark` | Deep obsidian void |
| Card Surface | `rgba(15, 23, 42, 0.75)` | `--color-card-dark` | Smoked obsidian glass (`blur(20px)`) |
| Primary Text | `#FFFFFF` | `--color-text-dark` | Pure crisp white |
| Secondary Text | `rgba(255, 255, 255, 0.75)` | `--color-text-muted-dark` | Ethereal white |
| Gold Gradient | `#FFF3C4` → `#E5C07B` → `#B38628` | `--gradient-gold` | Heritage royal gold |
| Active Border | `rgba(245, 197, 66, 0.45)` | `--border-gold` | Luminous gold hairline |
| Underline Glow | `2.5px solid #F5C542` | `--underline-gold` | Ambient gold hover underline |

---

## Typography

- **Display & Section Titles:** `Playfair Display`, `Bodoni Moda`, Georgia, serif
- **Body & UI Controls:** `Inter`, `Jost`, -apple-system, sans-serif
- **Calligraphy Eyebrows:** `Pinyon Script`, `Alex Brush`, cursive
- **Scale:**
  - Hero Title: `clamp(2.5rem, 5vw, 4.25rem)` (Font-Weight 800)
  - Section Headings: `clamp(1.75rem, 2.8vw, 2.5rem)` (Font-Weight 800)
  - Bento Card Metrics: `clamp(1.25rem, 1.8vw, 1.75rem)` (Font-Weight 800)
  - Body Text: `16px` / `1rem` (Line-height `1.65` to `1.75`)
  - Micro Badges & Tags: `11px` / `0.6875rem` (Letter-spacing `0.05em` to `0.08em` uppercase)

---

## Ambient Light Wells Architecture (Light Mode)

Instead of flat, sterile grey backgrounds, Light Mode utilizes dynamic multi-point ambient light wells:
```css
.explore-immersive-overlay,
.dest-immersive-bg {
  background:
    radial-gradient(circle 1000px at 50% -120px, rgba(254, 243, 199, 0.45), transparent 72%),
    radial-gradient(circle 850px at 88% 12%, rgba(224, 242, 254, 0.40), transparent 60%),
    radial-gradient(circle 900px at 12% 55%, rgba(254, 240, 138, 0.20), transparent 60%),
    linear-gradient(180deg,
      rgba(250, 249, 246, 0.84) 0%,
      rgba(248, 250, 252, 0.92) 35%,
      rgba(241, 245, 249, 0.98) 100%) !important;
}
```

---

## Component Specifications

### 1. Liquid Pearl Glass Cards (`.card`, `.glass-card`, `.dest-card`)
```css
/* Light Mode */
html[data-theme="light"] .card,
html[data-theme="light"] .glass-card,
html[data-theme="light"] .dest-card {
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    inset 0 1px 0 0 #FFFFFF,
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 10px 28px -4px rgba(15, 23, 42, 0.07) !important;
  border-radius: 1.25rem !important;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease !important;
}

html[data-theme="light"] .card:hover,
html[data-theme="light"] .glass-card:hover,
html[data-theme="light"] .dest-card:hover {
  transform: translateY(-5px) !important;
  border-color: rgba(217, 119, 6, 0.45) !important;
  box-shadow:
    inset 0 1px 0 0 #FFFFFF,
    0 18px 40px -6px rgba(15, 23, 42, 0.12),
    0 0 22px -2px rgba(217, 119, 6, 0.20) !important;
}
```

### 2. Swiss Luxury Watch Bento Grid (`.info-card`, `#liveWeather`)
```css
/* Precision-beveled tiles with amber medallion */
html[data-theme="light"] .info-card,
html[data-theme="light"] #liveWeather {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.90) 100%) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow:
    inset 0 1px 0 0 #FFFFFF,
    0 4px 16px -2px rgba(15, 23, 42, 0.05),
    0 12px 30px -4px rgba(15, 23, 42, 0.06) !important;
  border-radius: 1.25rem !important;
}

html[data-theme="light"] .info-card svg {
  color: #D97706 !important;
  filter: drop-shadow(0 2px 6px rgba(217, 119, 6, 0.25)) !important;
}
```

### 3. Universal Button Interactions
```css
/* Universal Gold Underline */
button:hover, .btn:hover, .tab-btn:hover {
  border-bottom: 2.5px solid #F5C542 !important;
  box-shadow: 0 4px 16px -2px rgba(245, 197, 66, 0.45), inset 0 -2px 8px rgba(245, 197, 66, 0.25) !important;
}
```

### 4. Mobile Navigation Bar in Light Mode (`.mobile-nav`)
```css
/* Frosted pearl milk glass with amber active indicator */
html[data-theme="light"] body.glass-immersive .mobile-nav {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border-top: 1px solid rgba(217, 119, 6, 0.18) !important;
}

html[data-theme="light"] body.glass-immersive .mobile-nav a {
  color: #64748B !important;
}

html[data-theme="light"] body.glass-immersive .mobile-nav a.active {
  color: #D97706 !important;
  font-weight: 700 !important;
}
```

---

## Invariant Design Rules

1. **Zero Emoji Icons:** All icons must be scalable SVG (Heroicons / Lucide).
2. **Accessible Contrast:** Text must maintain at least 4.5:1 (AA) and preferably 7:1+ (AAA) on all surfaces.
3. **Protected Media Captions:** Slide titles and captions overlaid on dark scenic photographs must ALWAYS remain `#FFFFFF` with drop shadows regardless of theme toggle.
4. **Touch Target Size:** Interactive elements must measure at least 44×44px.
5. **Reduced Motion:** All transitions and transforms must be disabled when `@media (prefers-reduced-motion: reduce)` is active.
6. **Mobile Responsive Architecture (<= 768px & <= 640px):** 
   - Interactive India Map must collapse to fluid vertical column with state details card anchored underneath (zero map or island obscuration).
   - Calligraphy kickers must enforce `white-space: nowrap !important;` with responsive font clamp to prevent orphan trailing `✦` ornament stars.
   - Section link buttons ("View all →") must right-align on mobile with frosted milk glass styling in Light Mode.
   - Fixed mobile navigation must be paired with `padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px))` on body container.
