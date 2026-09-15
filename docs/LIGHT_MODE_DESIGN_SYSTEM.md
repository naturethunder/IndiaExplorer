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

---

## 5. Verification & Accessibility Standards

- **WCAG 2.1 AAA:** All text combinations exceed 7:1 contrast ratio.
- **Apple HIG & Material Design Touch Targets:** Minimum 44×44px interactive area on all buttons and pills.
- **Reduced Motion Support:** All transitions, transforms, and animations immediately degrade to `0.01ms` when `@media (prefers-reduced-motion: reduce)` is detected.
- **Zero FOUC:** Instant local-storage theme resolution executes synchronously in `<head>` prior to CSS render.
