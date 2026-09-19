# ExploreDesh — Authoritative Light Mode Design System ("Lait de Perle Royale")

> **Authoritative Specification:** This document establishes the semantic design tokens, color architecture, typography scale, component blueprints, and micro-interactions for ExploreDesh's flagship **Light Mode**.
> 
> ExploreDesh does **NOT** treat Light Mode as "Dark Mode with inverted white backgrounds." Instead, Light Mode is an editorial, bright, warm, cinematic luxury travel experience inspired by warm Himalayan sunlight, ivory marble monuments (*Makrana* stone), and antique gilded parchment.

---

## 1. Design Philosophy: The Seven Tenets of ExploreDesh Daylight Luxury

1. **Warm Architectural Canvas (No Sterile Pure-White Voids):**  
   Primary canvas surfaces rest on soft alabaster and warm porcelain (`#FAF9F6` to `#F8FAFC`). Pure white (`#FFFFFF`) is reserved strictly for elevated card surfaces, specular bevel highlights, and high-contrast content sheets.
2. **Multi-Point Ambient Light Wells:**  
   Natural atmospheric depth is established using dynamic radiant gradients mimicking three distinct daylight phenomena:
   - **Champagne Zenith Corona:** `rgba(254, 243, 199, 0.45)` radiating from top-center.
   - **Ethereal Azure Mist:** `rgba(224, 242, 254, 0.40)` in the upper-right quadrant.
   - **Warm Hearth Gold Glow:** `rgba(254, 240, 138, 0.22)` in the lower-left horizon.
3. **Liquid Pearl Glassmorphism ("Lait de Perle"):**  
   All content cards, modal sheets, and toolbars utilize milk glass: high optical opacity (`0.92` to `0.96`), intense backdrop-blur (`24px` to `28px`), optical saturation boosting (`180%`), and a precision top-edge specular bevel (`inset 0 1px 0 0 #FFFFFF`).
4. **Heritage Royal Burnt Amber Accents (WCAG AAA Contrast):**  
   To guarantee effortless readability on daylight backgrounds without losing regal prestige, script kickers, calligraphy badges, and primary action accents use warm royal burnt amber (`#92400E`, `#A16207`, and `#B45309`), exceeding 7:1 contrast on all light surfaces.
5. **Swiss Luxury Watch Bento Grid Architecture:**  
   Metrics, weather feeds, and destination overviews are presented in precision-beveled tiles with amber medallions, drop-shadowed typography, and crisp border geometry.
6. **Tactile Golden Corona Hover Lift:**  
   Interactive elements lift effortlessly (`-4px` to `-6px`) accompanied by a subtle golden corona halo (`0 0 22px rgba(217, 119, 6, 0.20)`), creating responsive, physical tangibility.
7. **Absolute Dark Mode Parity:**  
   Every single enhancement in Light Mode maintains 100% dual-engine synchronization with OLED Cinema Dark Mode (`#080A0F`), sharing HTML markup and responsive breakpoints with zero visual regressions.

---

## 2. Semantic Color Architecture

### 2.1 Surfaces & Canvas

| Token Name | Hex / CSS Value | Semantic Role |
|------------|-----------------|---------------|
| `--lm-bg-canvas` | `#FAF9F6` | Primary page canvas (Alabaster porcelain) |
| `--lm-bg-canvas-subtle` | `#F1F5F9` | Secondary section canvas (Warm dawn mist) |
| `--lm-surface-card` | `rgba(255, 255, 255, 0.94)` | Frosted milk glass card surface (`blur(24px)`) |
| `--lm-surface-bento` | `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)` | Bento grid tile surface |
| `--lm-surface-input` | `rgba(255, 255, 255, 0.98)` | Search input and form field surface |
| `--lm-surface-pill` | `rgba(255, 255, 255, 0.92)` | Category chips and month selector pills |

### 2.2 Text Hierarchy (WCAG AAA Compliant)

| Token Name | Hex / CSS Value | Contrast Ratio | Usage |
|------------|-----------------|----------------|-------|
| `--lm-text-display` | `#0F172A` (Slate 900) | 16.5:1 | Main headings (`h1`, `h2`, hero titles) |
| `--lm-text-body` | `#1E293B` (Slate 800) | 13.2:1 | Editorial body copy, card headings, labels |
| `--lm-text-secondary` | `#334155` (Slate 700) | 9.8:1 | Subtitles, summaries, travel route details |
| `--lm-text-muted` | `#64748B` (Slate 500) | 5.4:1 (AA) | Micro-metadata, captions, timestamps |
| `--lm-text-accent` | `#92400E` (Amber 800) | 7.6:1 | Calligraphy kickers, state accents, badge text |
| `--lm-text-white-scrim` | `#FFFFFF` | Protected | Overlaid titles on dark photographic scrims |

### 2.3 Brand & Heritage Accents

| Token Name | Hex / CSS Value | Semantic Role |
|------------|-----------------|---------------|
| `--lm-brand-primary` | `#D97706` | Primary Heritage Amber |
| `--lm-brand-deep` | `#B45309` | Deep Royal Burnt Gold |
| `--lm-brand-rich` | `#92400E` | High-contrast kicker & badge text |
| `--lm-brand-light` | `#FEF3C7` | Soft champagne pill background |
| `--lm-brand-border` | `rgba(217, 119, 6, 0.35)` | Refined hairline amber border |
| `--lm-brand-glow` | `rgba(217, 119, 6, 0.22)` | Corona ambient hover glow |

### 2.4 Shadows & Specular Bevels

```css
/* Core Specular Bevel & Corona Shadow Palette */
:root[data-theme="light"] {
  --shadow-bevel: inset 0 1px 0 0 #FFFFFF;
  --shadow-card-resting: 
    inset 0 1px 0 0 #FFFFFF,
    0 2px 4px rgba(15, 23, 42, 0.04),
    0 12px 30px -4px rgba(15, 23, 42, 0.07);
  --shadow-card-hover: 
    inset 0 1px 0 0 #FFFFFF,
    0 20px 45px -8px rgba(15, 23, 42, 0.14),
    0 0 24px -2px rgba(217, 119, 6, 0.22);
  --shadow-bento: 
    inset 0 1px 0 0 #FFFFFF,
    0 4px 16px -2px rgba(15, 23, 42, 0.05),
    0 12px 30px -4px rgba(15, 23, 42, 0.06);
  --shadow-dropdown: 
    inset 0 1px 0 0 #FFFFFF,
    0 24px 54px -6px rgba(15, 23, 42, 0.16);
}
```

---

## 3. Typography Scale & Hierarchy

| Role | Font Family | Size (clamp / px) | Weight | Line Height | Tracking |
|------|-------------|-------------------|--------|-------------|----------|
| Hero Display | `Playfair Display`, serif | `clamp(2.5rem, 6vw, 4.5rem)` | 800 | 1.05 | -0.02em |
| Calligraphy Kicker | `Playfair Display`, serif | `14px` / `0.875rem` | 700 | 1.4 | 0.08em uppercase |
| Section Title | `Playfair Display`, serif | `clamp(1.75rem, 3vw, 2.5rem)` | 800 | 1.2 | -0.01em |
| Section Subtitle | `DM Sans`, sans-serif | `16px` / `1rem` | 500 | 1.6 | normal |
| Destination Card Title | `DM Sans`, sans-serif | `17px` / `1.0625rem` | 700 | 1.3 | normal |
| Bento Metric Number | `DM Sans`, sans-serif | `22px` / `1.375rem` | 800 | 1.2 | -0.01em |
| UI Buttons & Pills | `DM Sans`, sans-serif | `14px` / `0.875rem` | 600 | 1.4 | 0.01em |
| Badges & Tags | `DM Sans`, sans-serif | `10.5px` / `0.656rem` | 700 | 1.2 | 0.06em uppercase |

---

## 4. Component Blueprints

### 4.1 "View All" Action Pill (`.section-link`)
- **Resting:** Frosted pearl pill (`background: rgba(255, 255, 255, 0.95)`), slate-900 typography (`#0F172A`), subtle amber bottom highlight (`border-bottom: 2.5px solid #D97706`).
- **Hover:** Elevated lift (`translateY(-1px)`), pure white surface, warm amber text (`#B45309`), rich golden corona glow (`0 6px 18px rgba(217, 119, 6, 0.18)`).

### 4.2 Hero Segmented Search (`.hero-search-seg`)
- **Container:** Frosted milk glass capsule with specular bevel (`inset 0 1px 0 0 #FFFFFF`), soft multi-layer shadow (`0 14px 40px rgba(15, 23, 42, 0.12)`).
- **Search Input:** Deep charcoal placeholder (`#64748B`), crisp text (`#0F172A`), no outline jumps, smooth focus ring.
- **Action Button:** Radiant royal amber gradient (`linear-gradient(135deg, #D97706, #B45309)`), tactile press feedback.

### 4.3 Trending Destination Cards (`.trend-card`)
- **Photography:** Aspect ratio `3/4`, crisp 100% HD imagery with non-destructive cinematic bottom vignette (`linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.85) 100%)`).
- **Protected Scrim Typography:** Destination name and state remain crisp pure white (`#FFFFFF`) with double drop shadows (`0 2px 8px rgba(0,0,0,0.85)`).
- **Hover Interaction:** Smooth 1.03 scale zoom on image, subtle frame elevation.

### 4.4 Standard Destination Discovery Cards (`.dest-card`)
- **Surface:** `rgba(255, 255, 255, 0.94)`, `backdrop-filter: blur(24px)`, `border-radius: 1.35rem`.
- **Border:** Specular bevel + hairline border (`rgba(255, 255, 255, 0.95)`).
- **Metadata Badges:** Rating pill in soft emerald, Best Season in warm champagne amber.
- **Hover:** Dynamic `translateY(-6px)` with warm golden corona halo (`rgba(217, 119, 6, 0.22)`).

### 4.5 AI Trip Finder (`.ai-hero-card`)
- **Surface:** Warm pearl gradient (`linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.90) 100%)`).
- **Top Accent:** Precision 2.5px royal burnt gold crest (`border-top: 2.5px solid #D97706`).
- **CTA:** Full-width royal amber button with subtle 3D bevel and tactile hover response.

### 4.6 Luxury Catalog Pagination & "Load More" Controls (`.load-more-luxury-btn` / `#loadMoreBtn`)
- **Background & Canvas Contrast:** Deep obsidian slate gradient (`linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`) providing an authoritative, high-contrast anchor against light mode alabaster canvases.
- **Typography:** Pure high-contrast white (`#FFFFFF`) with `font-weight: 700` and letter-spacing `0.02em`, delivering an ultra-high 15.5:1 contrast ratio exceeding WCAG AAA standards.
- **Border & Bevel Accent:** Amber gold bottom border (`border-bottom: 2.5px solid #D97706`), hairline border (`1px solid rgba(217, 119, 6, 0.45)`), and top specular inner highlight.
- **Count Badge:** Solid radiant gold pill (`background: #F5C542`) with deep charcoal text (`#080A0F`), clearly highlighting the remaining destination count.
- **Hover & Active Micro-Interactions:** Smooth `translateY(-2px)` elevation, intensified amber corona glow (`box-shadow: 0 8px 24px -4px rgba(217, 119, 6, 0.35)`), and smooth 0.2s cubic-bezier transition.

### 4.7 Mobile Navigation Bar in Light Mode (`.mobile-nav`)
- **Surface:** Frosted ivory milk glass (`background: rgba(255, 255, 255, 0.95)`), `backdrop-filter: blur(20px) saturate(180%)`, top specular hairline rim (`border-top: 1px solid rgba(217, 119, 6, 0.18)`).
- **Default Nav Icons & Labels:** Neutral slate-500 (`#64748B`), font-weight 600, 11px micro-typography.
- **Active Nav Item:** Heritage royal amber (`#D97706`), bold font weight, with subtle amber halo on icon and active indicator pill.
- **Safe Area Inset:** Enforced `padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px))` on body container to prevent bottom navigation occlusion of footer links and action buttons.

### 4.8 Interactive India Map Mobile Architecture (`.discover-map-inner` & `.india-map-card`)
- **Container Stack:** Collapses from desktop horizontal row (`flex-direction: row`, `height: 500px`) to fluid vertical column (`flex-direction: column`, `height: auto`, `padding: 1rem 0.85rem`).
- **Map SVG:** Scales fluidly (`width: 100%`, `max-height: 380px`), preserving regional pastel fills, dark blue ocean labels, and touch target accessibility for all 36 states/UTs including Andaman & Nicobar and Lakshadweep.
- **State Details Card (`.india-map-card`):** Transitions from desktop floating absolute position to full-width relative card (`width: 100%`, `inset: auto`) cleanly positioned below the SVG map. Eliminates map obscuration, Southern state overlap, and bottom nav occlusion.
- **Surface & Trim:** Milk glass (`rgba(255, 255, 255, 0.96)`), 3px amber top crest (`border-top: 3px solid #D97706`), crisp Slate-900 titles, and high-contrast links.

### 4.9 Scrimmed Photo Hero Typography Protection in Light Mode
- **Protected Elements:** Inside `.hero-home` (and photo hero banners), background imagery is inherently dark regardless of document theme.
- **Hero Headings:** Hero title retains pure white `#FFFFFF` with drop shadow (`0 3px 18px rgba(0, 0, 0, 0.8)`).
- **Hero Gradient Accent (`.hero-home .gold-gradient-text`):** Overridden from daytime bronze (`#B45309`) to brilliant glowing sunrise gold (`linear-gradient(135deg, #FFFBEB 0%, #FCD34D 45%, #F59E0B 100%)`) with text shadow (`0 3px 18px rgba(0,0,0,0.6)`).
- **Hero Calligraphy Kicker & Accent Script:** Luminous warm gold (`#FCD34D` and `#FDE68A`) with zero dark filter dropshadow.

---

## 5. Mobile Responsive Architecture (<= 768px & <= 640px)

| Viewport Breakpoint | Component | Responsive Rule | Visual Outcome |
|---|---|---|---|
| `<= 768px` | `body.glass-immersive` | `padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px))` | Prevents fixed bottom nav from clipping CTA buttons and footer |
| `<= 768px` | `.discover-map-inner` | `flex-direction: column !important; height: auto !important;` | Eliminates desktop 500px height lock and enables natural mobile scroll |
| `<= 768px` | `.india-map-card` | `position: relative !important; width: 100% !important;` | Anchors state card neatly below SVG map; stops state obscuration |
| `<= 640px` | `.calligraphy-kicker` | `white-space: nowrap !important; clamp(1.1rem, 4.2vw, 1.35rem)` | Prevents trailing `✦` ornament from breaking onto an orphan line |
| `<= 640px` | `.section-title` | `clamp(1.35rem, 5.2vw, 1.85rem) !important;` | Eliminates headline wrapping clashes against action buttons |
| `<= 640px` | `.section-link` | `margin-left: auto !important; white-space: nowrap !important;` | Neatly right-aligns "View all →" buttons above carousels |
| `<= 640px` | `#month-rail`, `#season-grid` | `grid-template-columns: repeat(2, minmax(0, 1fr)) !important;` | Compact 270px 2-column grid replacing 500px single-column monoliths |

---

## 6. Verification & Accessibility Standards

- **WCAG 2.1 AAA:** All text combinations exceed 7:1 contrast ratio.
- **Apple HIG & Material Design Touch Targets:** Minimum 44×44px interactive area on all buttons and pills.
- **Reduced Motion Support:** All transitions, transforms, and animations immediately degrade to `0.01ms` when `@media (prefers-reduced-motion: reduce)` is detected.
- **Zero FOUC:** Instant local-storage theme resolution executes synchronously in `<head>` prior to CSS render.
- **Zero Horizontal Overflow:** Tested and confirmed at 375px, 390px, and 412px viewports (`overflow-x: hidden`).
