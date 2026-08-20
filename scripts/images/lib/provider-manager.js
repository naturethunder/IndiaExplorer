/**
 * Provider Manager - Multi-provider image search engine (Wikimedia, Pexels, Unsplash)
 * Features dynamic provider priority, 5-level search cascades, candidate scoring (0-100),
 * and intelligent caching.
 */

const config = require('../config');
const { PexelsProvider } = require('../providers/pexels');
const { UnsplashProvider } = require('../providers/unsplash');
const { WikimediaProvider } = require('../providers/wikimedia');
const { ImageCache } = require('./cache');
const { loadEnv } = require('./dotenv');
const fs = require('fs');
const path = require('path');

class ProviderManager {
  constructor(cache) {
    this.cache = cache;
    this.providers = {};
    this.initProviders();
  }

  initProviders() {
    loadEnv(config.paths.envPath);

    if (process.env.PEXELS_API_KEY) {
      this.providers.pexels = new PexelsProvider(process.env.PEXELS_API_KEY);
    }
    if (process.env.UNSPLASH_ACCESS_KEY) {
      this.providers.unsplash = new UnsplashProvider(process.env.UNSPLASH_ACCESS_KEY);
    }
    // Wikimedia doesn't require an API key
    this.providers.wikimedia = new WikimediaProvider();

    console.log(`Initialized providers: ${Object.keys(this.providers).join(', ')}`);
  }

  /**
   * Search across providers using dynamic priorities and a 5-level search cascade
   * @param {Object} context - { destSlug, fieldPath, name, type, state, title }
   * @returns {Promise<Array>} Ranked candidates with confidence scores
   */
  async search(context) {
    const { destSlug, fieldPath, name, type, state, title } = context;

    // Build intelligent queries
    const queries = this.buildQueries(context);

    const allResults = [];
    const seenUrls = new Set();
    let highestConfidence = 0;

    for (const { query, provider, priority, cascadeLevel, isFallback, metadata } of queries) {
      if (!this.providers[provider]) continue;

      // Check persistent cache first
      const cached = await this.cache.getProviderSearch(query, provider);
      let results = [];

      if (cached) {
        results = cached.results || [];
      } else {
        try {
          results = await this.providers[provider].search(query, metadata);
          await this.cache.cacheProviderSearch(query, provider, results);
        } catch (err) {
          if (err.message.includes('403') || err.message.includes('rate limit') || err.message.includes('429')) {
            console.warn(`  Provider ${provider} rate limited (${err.message}). Temporarily skipping.`);
            delete this.providers[provider];
          }
        }
      }

      for (const r of results) {
        if (r && r.url && !seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          const scored = this.scoreCandidate(r, { ...context, query, provider, priority, cascadeLevel, isFallback });
          allResults.push(scored);
          if (scored.confidence > highestConfidence) {
            highestConfidence = scored.confidence;
          }
        }
      }

      // Short circuit if we found a high-confidence exact match
      if (highestConfidence >= 95 && allResults.length >= 3) {
        break;
      }
    }

    return allResults.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Build 5-level cascade search queries based on image type and destination
   */
  buildQueries(context) {
    const { name, type, state, title } = context;
    const queries = [];

    const cleanName = (name || '').replace(/[\(\),]/g, ' ').trim();
    const cleanTitle = (title || '').replace(/[\(\),]/g, ' ').trim();
    const cleanState = (state || '').trim();

    // 1. EXACT ATTRACTIONS & LANDMARKS (topPlaces, photos)
    // Priority: Wikimedia (exact monuments/temples) -> Pexels -> Unsplash -> broader fallback
    if (type === 'place' || type === 'place-photo') {
      if (cleanName) {
        // Level 1: Name + Destination + State + India
        queries.push({ query: `${cleanName} ${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 800 } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'pexels', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'unsplash', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });

        // Level 2: Name + Destination
        queries.push({ query: `${cleanName} ${cleanTitle}`, provider: 'wikimedia', priority: 4, cascadeLevel: 2, isFallback: false, metadata: { minWidth: 800 } });
        queries.push({ query: `${cleanName} India`, provider: 'pexels', priority: 5, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName} India`, provider: 'unsplash', priority: 6, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });

        // Level 3: Exact Name
        queries.push({ query: `${cleanName}`, provider: 'wikimedia', priority: 7, cascadeLevel: 3, isFallback: false, metadata: { minWidth: 800 } });
        queries.push({ query: `${cleanName}`, provider: 'pexels', priority: 8, cascadeLevel: 3, isFallback: false, metadata: { orientation: 'landscape' } });
      }

      // Level 4: Destination + State travel fallback
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 9, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 10, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape', size: 'large' } });

      // Level 5: Destination landscape fallback
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pexels', priority: 11, cascadeLevel: 5, isFallback: true, metadata: { orientation: 'landscape', size: 'large' } });
    }

    // 2. DESTINATION HERO / COVER / GALLERY
    // Priority: Pexels exact destination -> Unsplash exact destination -> Wikimedia
    else if (type === 'hero' || type === 'image' || type === 'gallery') {
      // Level 1: Destination + State + India
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 1000 } });

      // Level 2: Destination + India
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pexels', priority: 4, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} India tourism`, provider: 'unsplash', priority: 5, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} India`, provider: 'wikimedia', priority: 6, cascadeLevel: 2, isFallback: false, metadata: { minWidth: 1000 } });
    }

    // 3. HOTELS & STAYS
    else if (type === 'hotel') {
      if (cleanName) {
        queries.push({ query: `${cleanName} ${cleanTitle} hotel India`, provider: 'unsplash', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} ${cleanTitle} hotel`, provider: 'pexels', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      }
      queries.push({ query: `${cleanTitle} luxury resort hotel India`, provider: 'unsplash', priority: 3, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} hotel room stay India`, provider: 'pexels', priority: 4, cascadeLevel: 5, isFallback: true, metadata: { orientation: 'landscape' } });
    }

    return queries;
  }

  /**
   * Candidate scoring algorithm (0-100)
   */
  scoreCandidate(result, context) {
    const { name, type, state, title, query, provider, cascadeLevel, isFallback } = context;
    const cleanName = (name || '').toLowerCase();
    const cleanTitle = (title || '').toLowerCase();
    const cleanState = (state || '').toLowerCase();

    let score = 70; // Base score

    // Cascade level influence
    if (cascadeLevel === 1) score += 15;
    else if (cascadeLevel === 2) score += 10;
    else if (cascadeLevel === 3) score += 5;
    else if (isFallback) score -= 15;

    const searchable = `${result.title || ''} ${result.description || ''} ${result.alt || ''} ${result.tags || ''} ${query || ''}`.toLowerCase();

    // Exact name match
    if (cleanName && searchable.includes(cleanName)) {
      score += 25;
    }

    // Destination match
    if (cleanTitle && searchable.includes(cleanTitle)) {
      score += 15;
    }

    // State match
    if (cleanState && searchable.includes(cleanState)) {
      score += 10;
    }

    // India match
    if (searchable.includes('india')) {
      score += 5;
    }

    // High resolution bonus
    if (result.width && result.height) {
      if (result.width >= 1200 && result.height >= 800) score += 10;
      else if (result.width < 500 || result.height < 350) score -= 30;
    } else {
      score += 5; // Standard high-res web result
    }

    // Penalties for document scans, logos, SVG, maps
    const urlLower = (result.url || '').toLowerCase();
    if (urlLower.endsWith('.svg') || urlLower.endsWith('.pdf') || urlLower.includes('icon') || urlLower.includes('logo') || urlLower.includes('map')) {
      score -= 80;
    }

    const confidence = Math.max(0, Math.min(100, Math.round(score)));

    return {
      ...result,
      confidence,
      cascadeLevel: cascadeLevel || 1,
      isFallback: !!isFallback,
      imageType: isFallback ? 'destinationFallback' : 'exact'
    };
  }
}

module.exports = { ProviderManager };