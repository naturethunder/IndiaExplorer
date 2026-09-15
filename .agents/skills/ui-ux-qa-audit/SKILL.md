---
name: ui-ux-qa-audit
description: "Comprehensive UI/UX, Accessibility, and Design QA Audit skill for ExploreDesh. Audits all 8 HTML platform pages and 4 CSS stylesheets across 7 priority categories: Accessibility (WCAG AAA contrast, ARIA landmarks, alt attributes), Touch & Interaction (44px min touch targets), Performance (preloads, font-display, image loading), Layout & Responsive (390px, 768px, 1440px breakpoints, zero horizontal overflow), Typography & Color (WCAG contrast, light/dark theme consistency), Motion & Animation (prefers-reduced-motion), and Forms & Feedback. Run whenever checking design compliance or after making UI changes."
---

# UI/UX & Accessibility QA Audit Skill (`/ui-ux-qa-audit`)

This skill provides autonomous and manual quality assurance procedures to certify the user interface, accessibility, responsiveness, and design integrity of ExploreDesh.

## When to Run This Skill

- After making any edits to HTML templates (`index.html`, `destinations.html`, `destination.html`, `ai-finder.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`).
- After modifying core stylesheets (`css/styles.css`, `css/explore-immersive.css`, `css/destination-immersive.css`, `css/glass-immersive.css`).
- When validating Light Mode and Dark Mode theme parity.
- Before committing UI changes or preparing for production release.

---

## Automated Execution Command

Run the dedicated test suite from the repository root:

```bash
node scripts/ui_ux_qa_audit.js
```

Target benchmark: **TOTAL AUDIT ISSUES DETECTED: 0**

---

## 7 Core Audit Categories

### 1. Accessibility (a11y)
- **HTML lang attribute**: All HTML files must declare `<html lang="en">`.
- **Image alt attributes**: All `<img>` tags must have descriptive `alt` attributes. Decorative icons must include `aria-hidden="true"`.
- **Keyboard Navigation**: Interactive elements must be focusable with visible focus rings (`:focus-visible`). Skip links (`#main`) must be functional.
- **Roving Tabindex**: Tab strips (`#destNavContainer`) must support arrow key navigation and manage `aria-selected` and `tabindex`.
- **Screen Reader Support**: Modals and drawers must declare `role="dialog"` and `aria-modal="true"`.

### 2. Touch & Mobile Interaction
- **Target Sizes**: All buttons, links, pills, and interactive cards must provide a minimum touch target of `44px × 44px`.
- **Spacing**: Adequate tap separation (minimum 8px gap) to prevent accidental taps on mobile touchscreens.
- **No Zoom Disabling**: Viewport must never enforce `user-scalable=no` or `maximum-scale=1.0`.

### 3. Layout & Responsive Breakpoints
- **Breakpoints**: Validated across:
  - Mobile: `390px` (iPhone 14/15)
  - Tablet: `768px` (iPad)
  - Desktop: `1440px` (MacBook / Desktop monitor)
- **Zero Horizontal Overflow**: `overflow-x: hidden` enforced on page wrappers; no elements may leak horizontally outside the viewport.
- **Responsive Navigation**: Bottom navigation bar on mobile (`< 768px`) transitions seamlessly to sticky top glass navbar on desktop.

### 4. Typography & Color Contrast (WCAG 2.1 AAA / AA)
- **Normal Text**: Minimum contrast ratio of **4.5:1** (AA) and **7.0:1** (AAA) against card and canvas backgrounds.
- **Light Mode Standards**:
  - Deep slate primary text (`#0F172A` / `#1E293B`).
  - Royal burnt amber calligraphy kickers (`#92400E`, 7.6:1 contrast against `#FAF9F6`).
  - Liquid pearl glassmorphism surfaces (`rgba(255, 255, 255, 0.94)` with `backdrop-filter: blur(24px)`).
- **Dark Mode Standards**:
  - Obsidian slate canvas (`#080A0F` / `#0B0F19`).
  - Warm amber highlights (`#F5C542`).
  - Frosted glass cards (`rgba(14, 20, 32, 0.85)`).

### 5. Performance & Asset Delivery
- **Font Loading**: Google Fonts preloaded with `display=swap` (`Cinzel`, `Bodoni Moda`, `Playfair Display`, `Plus Jakarta Sans`, `DM Sans`).
- **CDN Preconnects**: Preconnect links for Google Fonts, Pexels, and Unsplash CDNs.
- **Cache Busting**: All stylesheet links across HTML templates must use synchronized version parameters (e.g. `?v=20260915_1`).

### 6. Motion & Animation
- **Accessibility Safeguards**: Media query `@media (prefers-reduced-motion: reduce)` must suppress infinite transforms, particle drift, and intense parallax scrolling.
- **Hardware Acceleration**: Use `transform` and `opacity` for micro-interactions (`will-change: transform`).

### 7. Forms & User Feedback
- **Input Validation**: Form inputs must specify `aria-required="true"`, `aria-invalid`, and link to error descriptions via `aria-describedby`.
- **Interactive States**: Every interactive control must provide distinct `:hover`, `:active`, `:focus-visible`, and `:disabled` states.

---

## Manual Verification in Browser

When verifying UI changes visually:
1. Open `http://localhost:8080/` in browser.
2. Toggle the theme button (`#themeToggleBtn`) to inspect both **Light Mode** and **Dark Mode**.
3. Inspect key pages:
   - `http://localhost:8080/` (Homepage)
   - `http://localhost:8080/destinations.html` (Explorer with filters)
   - `http://localhost:8080/destination.html?slug=kollur-mookambika-temple` (Detail page)
   - `http://localhost:8080/ai-finder.html` (Interactive trip finder)
4. Verify browser console has **0 errors** and **0 unhandled warnings**.
