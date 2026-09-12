/**
 * Provider Manager - Multi-provider image search engine (Wikimedia, Pexels, Unsplash)
 * Features dynamic provider priority, 5-level search cascades, candidate scoring (0-100),
 * and intelligent caching.
 */

const config = require('../config');
const { PexelsProvider } = require('../providers/pexels');
const { UnsplashProvider } = require('../providers/unsplash');
const { WikimediaProvider } = require('../providers/wikimedia');
const { PixabayProvider } = require('../providers/pixabay');
const { FlickrProvider } = require('../providers/flickr');
const { MetProvider } = require('../providers/met');
const { AICProvider } = require('../providers/aic');
const { CMAProvider } = require('../providers/cma');
const { VAProvider } = require('../providers/va');
const { NASAProvider } = require('../providers/nasa');
const { ImageCache } = require('./cache');
const { loadEnv } = require('./dotenv');
const fs = require('fs');
const path = require('path');

class ProviderManager {
  constructor(cache) {
    this.cache = cache || {
      getProviderSearch: async () => null,
      cacheProviderSearch: async () => {},
    };
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
    if (process.env.PIXABAY_API_KEY) {
      this.providers.pixabay = new PixabayProvider(process.env.PIXABAY_API_KEY);
    }
    // High-limit & Unlimited Free Providers (No key required)
    this.providers.wikimedia = new WikimediaProvider();
    this.providers.flickr = new FlickrProvider();
    this.providers.met = new MetProvider();
    this.providers.aic = new AICProvider();
    this.providers.cma = new CMAProvider();
    this.providers.va = new VAProvider();
    this.providers.nasa = new NASAProvider();

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
    // Priority: Authentic ground truth (Wikimedia, Flickr) + Ultra HD (Pexels, Unsplash, Museum CC0), then Pixabay
    if (type === 'place' || type === 'place-photo') {
      if (cleanName) {
        // Level 1: Name + Destination + State + India
        queries.push({ query: `${cleanName} ${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 1200 } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'pexels', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'unsplash', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName}`, provider: 'flickr', priority: 4, cascadeLevel: 1, isFallback: false });
        queries.push({ query: `${cleanName} ${cleanTitle}`, provider: 'pixabay', priority: 5, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });

        // Level 2: Name + Destination & Heritage archives
        queries.push({ query: `${cleanName} ${cleanTitle}`, provider: 'wikimedia', priority: 6, cascadeLevel: 2, isFallback: false, metadata: { minWidth: 1200 } });
        queries.push({ query: `${cleanName} India`, provider: 'pexels', priority: 7, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName} India`, provider: 'unsplash', priority: 8, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} India`, provider: 'cma', priority: 9, cascadeLevel: 2, isFallback: false });
        queries.push({ query: `${cleanName} India`, provider: 'aic', priority: 10, cascadeLevel: 2, isFallback: false });
        queries.push({ query: `${cleanName} India`, provider: 'met', priority: 11, cascadeLevel: 2, isFallback: false });
        queries.push({ query: `${cleanName} India`, provider: 'va', priority: 12, cascadeLevel: 2, isFallback: false });
        queries.push({ query: `${cleanName}`, provider: 'pixabay', priority: 13, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });

        // Level 3: Exact Name
        queries.push({ query: `${cleanName}`, provider: 'wikimedia', priority: 14, cascadeLevel: 3, isFallback: false, metadata: { minWidth: 1200 } });
        queries.push({ query: `${cleanName}`, provider: 'pexels', priority: 15, cascadeLevel: 3, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName}`, provider: 'flickr', priority: 16, cascadeLevel: 3, isFallback: false });
        queries.push({ query: `${cleanName}`, provider: 'cma', priority: 17, cascadeLevel: 3, isFallback: false });
      }

      // Level 4: Destination + State travel fallback
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 18, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 19, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'wikimedia', priority: 20, cascadeLevel: 4, isFallback: true, metadata: { minWidth: 1200 } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pixabay', priority: 21, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });

      // Level 5: Destination landscape fallback
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pexels', priority: 22, cascadeLevel: 5, isFallback: true, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'nasa', priority: 23, cascadeLevel: 5, isFallback: true });
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pixabay', priority: 24, cascadeLevel: 5, isFallback: true, metadata: { orientation: 'landscape' } });
    }

    // 2. DESTINATION HERO / COVER / GALLERY
    else if (type === 'hero' || type === 'image' || type === 'gallery') {
      // Level 1: Destination + State + India (HD landscape priority)
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 1600 } });
      queries.push({ query: `${cleanTitle}`, provider: 'flickr', priority: 4, cascadeLevel: 1, isFallback: false });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pixabay', priority: 5, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });

      // Level 2: Destination + India
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pexels', priority: 6, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} India tourism`, provider: 'unsplash', priority: 7, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} India`, provider: 'wikimedia', priority: 8, cascadeLevel: 2, isFallback: false, metadata: { minWidth: 1600 } });
      queries.push({ query: `${cleanTitle} India`, provider: 'cma', priority: 9, cascadeLevel: 2, isFallback: false });
      queries.push({ query: `${cleanTitle} India`, provider: 'met', priority: 10, cascadeLevel: 2, isFallback: false });
      queries.push({ query: `${cleanTitle} India`, provider: 'nasa', priority: 11, cascadeLevel: 2, isFallback: false });
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pixabay', priority: 12, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });
    }

    // 3. HOTELS & STAYS
    else if (type === 'hotel') {
      if (cleanName) {
        queries.push({ query: `${cleanName} ${cleanTitle} hotel India`, provider: 'pexels', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} ${cleanTitle} hotel India`, provider: 'unsplash', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} ${cleanTitle} hotel India`, provider: 'pixabay', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      }
      queries.push({ query: `${cleanTitle} luxury resort hotel India`, provider: 'pexels', priority: 4, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} luxury resort hotel India`, provider: 'unsplash', priority: 5, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} luxury resort hotel India`, provider: 'pixabay', priority: 6, cascadeLevel: 4, isFallback: true, metadata: { orientation: 'landscape' } });
    }
    // 4. GENERAL FALLBACK (Heritage, Nature, Spiritual, or unclassified)
    else {
      if (cleanName) {
        queries.push({ query: `${cleanName} ${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 1200 } });
        queries.push({ query: `${cleanName} India`, provider: 'pexels', priority: 2, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName} India`, provider: 'unsplash', priority: 3, cascadeLevel: 2, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName}`, provider: 'flickr', priority: 4, cascadeLevel: 3, isFallback: false });
        queries.push({ query: `${cleanName} ${cleanTitle}`, provider: 'pixabay', priority: 5, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      } else {
        queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 1, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 2, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanTitle} ${cleanState} India`, provider: 'wikimedia', priority: 3, cascadeLevel: 1, isFallback: false, metadata: { minWidth: 1600 } });
        queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pixabay', priority: 4, cascadeLevel: 1, isFallback: false, metadata: { orientation: 'landscape' } });
      }
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