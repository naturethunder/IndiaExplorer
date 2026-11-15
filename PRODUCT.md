# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Discerning Travelers & Heritage Explorers**: Indian and international travelers seeking deep, authentic, off-the-beaten-path journeys across India rather than crowded tourist traps.
2. **Weekend & Long-Weekend Roadtrippers**: Travelers planning regional driving getaways from major metros (NCR, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad).
3. **Avid Photographers, Trekkers & Nature Seekers**: Visitors looking for pristine high-altitude passes, wildlife sanctuaries, untouched beaches, and ancient temple architecture with verified, authentic imagery.

## Product Purpose

ExploreDesh is India's premier hyper-curated, authentic travel exploration platform. It provides an exhaustive, ground-truth verified index of 2,396 destinations spanning all 28 states and 8 union territories, delivering rich cultural context, seasonal timing, logistical routes, and true-to-life photography without generic stock or tourist crowds.

## Positioning

Unlike mass travel aggregators that prioritize sponsored hotel listings and commercial tours, ExploreDesh delivers:
- **100% Indian Geographic Authenticity**: Absolute zero foreign stock guarantee; zero cross-state photo misattributions.
- **Architectural & Natural Ground Truth**: Pristine monument and scenery photography free of tourist selfie mobs, electric transmission towers, or billboard clutter.
- **Exhaustive Zero-Collision Catalog**: 67,900+ unique, high-definition verified photo assets across 2,396 destinations with zero duplicate URLs repository-wide.
- **Deep Cultural & Regional Corridors**: Curated multi-state travel corridors (Northern Alpine, Royal Heritage, Coastal & Ghats, Seven Sisters).

## Operating Context

- Mobile and desktop responsive web application accessed by travelers on high-speed fiber as well as intermittent 4G/5G mobile networks in transit.
- Lightweight, zero-dependency vanilla JS architecture ensuring sub-second load times, instant client-side filtering, and offline-capable search across all 2,396 destinations.
- Pre-rendered static SEO redirect stubs for all 2,396 destinations ensuring instant search indexing, canonical integrity, and smooth client-side hydration.

## Capabilities and Constraints

- **Live Multi-Facet Discovery**: Instant filtering by state, union territory, corridor, terrain type, best season, and free-text queries across 2,396 destination records.
- **Curated Stays & Sanctuaries Discovery (`/hotels`)**: Dedicated lodging portal filtering verified heritage havelis, luxury resorts, boutique homestays, and pilgrim yatri nivas with interactive self-hosted Leaflet mapping.
- **Gastronomic & Regional Dining Discovery (`/restaurants`)**: Dedicated culinary portal celebrating regional thalis, heritage cafes, street food lanes, coastal seafood, and pure vegetarian / satvik dining.
- **Destination Detail Architectural Enrichment**: Dedicated Dining & Gastronomy tab, curated 2/3/5-day itineraries, verified FAQ accordions with Schema.org `FAQPage` JSON-LD injection, and static fallback social preview cards.
- **Interactive India Map**: Dynamic SVG geographic corridor visualizer with interactive state routing.
- **Smart AI Trip Finder**: Natural language recommendation engine matching traveler mood, duration, budget, and terrain to optimal destinations.
- **Strict Invariants**:
  - Exactly 5 unique HD gallery images per destination (`heroImage.src === gallery[0].src`).
  - Exactly 3 unique photos per nearby place card.
  - Zero Pixabay session links; zero placeholder CDNs; zero rate-limited direct hotlinks.
  - Full WCAG AAA color contrast compliance in both Dark and Light themes.
  - Absolute canonical URLs across all 2,457 indexed routes.

## Brand Commitments

- **Tone & Voice**: Editorial, evocative, sophisticated, reverent towards India's profound civilizational heritage and natural splendor.
- **Visual Aesthetic**: Ultra-luxury glassmorphism, warm heritage gold/amber accents, deep obsidian and warm alabaster themes, crisp typography, and uncluttered architectural photography.
- **Integrity**: Every landmark photo must represent the actual physical structure or sanctuary it names.

## Evidence on Hand

- 2,396 individual destination JSON files in `data/destinations/` with coordinates, descriptions, highlights, and verified image arrays.
- Master indexed catalog `data/destinations/index.json`.
- 6 valid XML sitemaps indexing 2,457 URLs and 11,980 high-resolution images.
- Comprehensive quad-pillar automated audit suite (`scripts/audit_all.js`, `scripts/ui_ux_qa_audit.js`, `scripts/seo_audit.js`, `scripts/seo_regression_guard.js`, `scripts/final-repository-audit.js`, `scripts/security_audit.js`) certifying 100/100 production readiness.

## Product Principles

1. **Authenticity Over Novelty**: Ground-truth photography and factual regional information always trump generic stock glamour.
2. **Speed & Grace**: Fast client-side interactions, zero layout shifts (CLS = 0), and immediate feedback for all searches and filters.
3. **Quiet Luxury Craft**: Subtle, refined lighting and elevation rather than loud neon glows, vibrating badges, or decorative fluff.
4. **Universal Accessibility**: Every interactive element meets 44×44px touch targets, full keyboard accessibility, and strict WCAG contrast standards.

## Accessibility & Inclusion

- Adherence to WCAG 2.1 AA / AAA standards across both dark and light modes.
- Meaningful descriptive alt text for all photography; full SVG icon labeling; keyboard-traversable roving tabindexes for interactive carousels and filter chips.

