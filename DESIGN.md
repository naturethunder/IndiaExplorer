---
name: ExploreDesh
description: Ultra-Luxury Authentic Indian Travel & Cultural Exploration Platform
colors:
  primary: "#D97706"
  primary-hover: "#B45309"
  primary-light: "#FEF3C7"
  gold-accent: "#F59E0B"
  gold-glow: "rgba(217, 119, 6, 0.25)"
  emerald: "#059669"
  emerald-deep: "#047857"
  royal-navy: "#1E1B4B"
  obsidian: "rgb(8, 10, 15)"
  bg-dark: "#0B0F19"
  surface-dark: "#111827"
  surface-dark-glass: "rgba(17, 24, 39, 0.82)"
  border-dark: "rgba(255, 255, 255, 0.08)"
  text-dark-primary: "#F8FAFC"
  text-dark-secondary: "#CBD5E1"
  text-dark-muted: "#94A3B8"
  bg-light: "#FAF8F5"
  surface-light: "#FFFFFF"
  surface-light-glass: "rgba(255, 255, 255, 0.92)"
  border-light: "rgba(15, 23, 42, 0.08)"
  text-light-primary: "#0F172A"
  text-light-secondary: "#334155"
  text-light-muted: "#64748B"
  amber-deep: "#92400E"
  amber-soft: "#FFFBEB"
  overlay-dark: "rgba(0, 0, 0, 0.35)"
typography:
  display:
    fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  calligraphy:
    fontFamily: "'Pinyon Script', cursive"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  heading:
    fontFamily: "'Playfair Display', 'Outfit', 'DM Sans', system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  base: "10px"
  card: "14px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
  card-glass:
    backgroundColor: "{colors.surface-dark-glass}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# ExploreDesh Design System

## Overview
ExploreDesh is an ultra-luxury, authentic travel intelligence platform celebrating India's rich cultural monuments, wildlife reserves, and natural geography. The visual language blends timeless Indian heritage (warm turmeric amber, temple gold, peacock emerald) with modern editorial restraint, crisp typography, and quiet elevation.

## Colors
- **Heritage Amber & Temple Gold**: The primary identity color, reflecting the warmth of brass lamps, royal sandstone, and dawn across the ghats.
  - Primary: `#D97706`
  - Primary Hover: `#B45309`
  - Subtle Highlight: `#FEF3C7` (light mode), `rgba(217, 119, 6, 0.15)` (dark mode)
  - Deep Amber Accent: `#92400E`
- **Natural Depth & Canvas**:
  - Dark Mode Ground: Obsidian night `#0B0F19` (base `rgb(8, 10, 15)`) with elevated card surfaces `#111827` and frosted glass `rgba(17, 24, 39, 0.82)`.
  - Light Mode Ground: Warm alabaster parchment `#FAF8F5` with elevated card surfaces `#FFFFFF` and frosted glass `rgba(255, 255, 255, 0.92)`.
- **Text & Hierarchy**:
  - High-contrast text meeting WCAG AAA (minimum 7:1 for headings, 4.5:1 for body).
  - Dark mode: `#F8FAFC` primary, `#CBD5E1` secondary, `#94A3B8` tertiary.
  - Light mode: `#0F172A` primary, `#334155` secondary, `#64748B` tertiary.

## Typography
- **Display & Hero**: `Playfair Display` serif luxury display headers convey majesty and permanence.
- **Calligraphy Accents**: `Pinyon Script` creates bespoke editorial flourishes on section kickers and hero badges.
- **Headlines & Subtitles**: `DM Sans` / `Outfit` / `Playfair Display` clean modern typography with tight tracking and balanced weights (600–700).
- **Body & Microcopy**: `Plus Jakarta Sans` / `DM Sans` for effortless legibility across dense itineraries, guides, and sanctuary metadata.

## Layout
- **12-Column Responsive Grid**: Max width `1400px` for wide desktop with standard `16px` (mobile), `24px` (tablet), and `32px` (desktop) gutters.
- **Fluid Vertical Rhythm**: Cohesive vertical spacing based on `8px` increments (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Touch Target Assurance**: All buttons, chips, links, and modal triggers maintain an absolute minimum `44×44px` clickable bounding box.

## Elevation & Depth
- **Restrained Elevation**: Soft, directional natural shadows mimicking ambient sunlight:
  - Low Elevation: `0 2px 6px -1px rgba(0, 0, 0, 0.08)`
  - Medium Elevation: `0 10px 25px -3px rgba(0, 0, 0, 0.14), 0 4px 10px -2px rgba(0, 0, 0, 0.05)`
  - High Elevation (Modals): `0 25px 50px -12px rgba(0, 0, 0, 0.35)`
- **No Zero-Offset Colored Glows**: Avoid chromatic halos or neon blur halos (`0 0 15px #f5c542`) that cheapen editorial authority.

## Shapes
- **Curated Radii**:
  - Interactive Filter & Corridor Chips: Full pill `9999px` for frictionless tactile feel.
  - Image Galleries & Monument Cards: `14px`–`16px` with `overflow: hidden` to frame authentic architectural photography cleanly.
  - Tooltips & Notice Badges: `6px` to `8px`.

## Components
- **Destination & Place Cards**: High-resolution 16:9 or 4:3 authentic photography with seamless dark gradient overlays for typography contrast, state badges, and verified metadata.
- **Hero & Gallery Carousel**: 5 unique HD landscape images synchronized with destination hero, complete with accessible navigation buttons and roving keyboard focus.
- **Search & Filter Drawer**: Instant live search with clear button, corridor pills, and faceted attribute filters.
- **Hospitality & Curated Stay Cards (`hotels.html`, `css/discovery-places.css`)**: Glassmorphism cards with authentic photo frames, verified property tiers (Heritage, Palace, Luxury, Boutique, Homestay), verified distance badges, price formatting, and direct map links.
- **Gastronomy & Dining Cards (`restaurants.html`, `css/discovery-places.css`)**: Warm terracotta and amber accented cards displaying regional cuisine tags, pure vegetarian / satvik dietary badges, signature dishes, and ambiance ratings.
- **Interactive Split Map View (`leaflet.css`, `js/vendor/leaflet.js`)**: Clean split-pane layout pairing listings with a self-hosted Leaflet vector map, synchronized hover pins, custom SVG map markers, and responsive full-screen map modal on mobile.
- **Destination Detail Dining & Itinerary Panels (`destination.html`, `css/destination-immersive.css`)**: Editorial narrative unboxing for local food culture, structured day-by-day travel timelines (2-day, 3-day, 5-day), and accessible FAQ accordion drawers.

## Do's and Don'ts
- **DO**: Use authentic ground-truth photography depicting the exact monument or sanctuary.
- **DO**: Ensure all interactive text maintains at least 4.5:1 contrast against any background or hover state.
- **DO**: Provide descriptive alt text and proper semantic labels for all visual assets.
- **DON'T**: Use zero-offset glowing neon box shadows or multi-color gradient text.
- **DON'T**: Use generic stock photography with tourists, selfie mobs, or foreign landmarks.
- **DON'T**: Stack unnecessary small uppercase kickers above prominent section headings when the heading stands on its own.
- **DON'T**: Add decorative pulsing status dots to non-live static badges.
