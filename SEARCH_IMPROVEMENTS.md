# Search Engine Architecture & Enhancements

**Date:** 2026-09-06  
**Milestone:** Phase 28 — Universal Space-Agnostic, Multi-Word, and Relevance-Ranked Search Engine Overhaul

## Problem Solved

Users searching for destinations, states, or attraction places with space-less names (e.g. `tajmahal`, `tamilnadu`, `ootytamilnadu`, `mehtabbagh`), concatenated terms (`tajmahalagra`, `agastheesvararkuzhaiyur`), or mixed spacing (`ooty tamilnadu`, `tajmahal agra`, `brihadeeswarar tamilnadu`) encountered zero or inaccurate results. Furthermore, default alphabetical or rating sorts previously displaced the most relevant match (such as ranking *Taj Mahal Palace* ahead of the world-famous *Taj Mahal*).

## Key Architectural Enhancements

### 1. Centralized Search Module (`js/utils/search.js`)
All search functionality across ExploreDesh is powered by a high-performance, pure-vanilla ES6 engine:

- **`cleanSearchText(str)`**:
  - Normalizes Unicode accents/diacritics (`normalize('NFD')` + `replace(/[\u0300-\u036f]/g, '')`).
  - Converts to lowercase and removes all non-alphanumeric characters (`[^a-z0-9]`).
  - Enables flawless space-agnostic matching (`tajmahal` == `Taj Mahal`, `tamilnadu` == `Tamil Nadu`).

- **`normalizeSearchWords(str)`**:
  - Cleans non-alphanumerics into single spaces for word-boundary and multi-token analysis.

- **`searchDestinations(destinations, query)`**:
  - Multi-tier matching engine that scans:
    - Destination Title
    - Destination Slug
    - State & Region
    - Category / Type
    - All 14,013 Attraction Places
    - Feature tags and short overview descriptions.

### 2. Matching Capabilities

| Feature | Query Examples | Result / Match |
|---|---|---|
| **Space-less Destination** | `tajmahal` | **Taj Mahal** (Rank #1 in Uttar Pradesh) |
| **Space-less State** | `tamilnadu`, `uttarpradesh` | Resolves state & returns all destinations in state |
| **Space-less Attraction/Place** | `mehtabbagh`, `agrafort` | **Taj Mahal** (Uttar Pradesh) |
| **Concatenated Compound** | `ootytamilnadu`, `hampikarnataka`, `tajmahalagra` | **Ooty** (Tamil Nadu), **Hampi** (Karnataka), **Taj Mahal** |
| **Mixed Spacing Multi-Word** | `ooty tamilnadu`, `tajmahal agra` | **Ooty**, **Taj Mahal** |
| **Slug & Hyphen Insensitive** | `agastheesvarar-temple-kuzhaiyur`, `agastheesvararkuzhaiyur` | **Agastheesvarar Temple, Kuzhaiyur** |
| **Fallback Partial Match** | `tajmahal tamilnadu` | Displays **Taj Mahal** + top **Tamil Nadu** destinations |

### 3. Tiered Relevance Scoring Engine

To prevent secondary matches from eclipsing exact query intents:
1. **Exact Title Match**: `+3000` (e.g. `tajmahal` directly matches "Taj Mahal")
2. **Title Starts With**: `+1500`
3. **Exact Slug Match**: `+2500`
4. **Exact State Match**: `+700`
5. **Exact Attraction Place**: `+600`
6. **Multi-Word Tokens**: `+400` for title, `+200` for state, `+160` for place
7. **Quality Tie-Breakers**: Small additive bonuses for `rating` and `reviewCount` ensure top-rated, well-reviewed landmarks float to the top among equals.

### 4. Integration Points

1. **`js/pages/home.js`**:
   - Hero search input and combobox autocomplete call `searchDestinations(summaries, q)`.
   - Pressing Enter or clicking search navigates directly to the #1 relevance-ranked destination.
   - `resolveState()` routes state queries directly to `destinations.html?state=...`.

2. **`js/pages/explore.js`**:
   - Filter pipeline uses `searchDestinations(results, filters.search)`.
   - Preserves search relevance order by default, preventing `sortBy === 'rating'` from overriding search relevance.
   - Handles space-less state parameters in URL (`?state=tamilnadu` $\rightarrow$ `Tamil Nadu`).

3. **`js/data/taxonomy.js`**:
   - `resolveState()` includes instant space-stripped lookup across all 36 states and UTs.

4. **`js/pages/finder.js`**:
   - AI Trip Finder parser utilizes `cleanSearchText` and `normalizeSearchWords` for destination and attraction matching.

## Automated & Browser Test Results

All tests verified live via browser subagent on `http://localhost:8080`:

| Test Query | Target Location | Outcome |
|---|---|---|
| `tajmahal` | `destinations.html` & `index.html` | "Taj Mahal" (Uttar Pradesh) appears as #1 result |
| `tamilnadu` | `destinations.html` & `index.html` | 60 Tamil Nadu destinations & state banner displayed |
| `ooty tamilnadu` | `destinations.html` | "Ooty" top result |
| `ootytamilnadu` | `destinations.html` | "Ooty" top result |
| `agastheesvararkuzhaiyur`| `destinations.html` | "Agastheesvarar Temple, Kuzhaiyur" matched |
| `mehtabbagh` | `destinations.html` | "Taj Mahal" matched via attraction |
| `tajmahal tamilnadu` | `destinations.html` | Both Taj Mahal and Tamil Nadu destinations rendered |