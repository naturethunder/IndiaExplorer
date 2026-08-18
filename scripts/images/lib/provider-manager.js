/**
 * Provider Manager - handles search across all providers with fallback and caching
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
    // Load API keys from environment
    loadEnv(config.paths.envPath);

    if (process.env.PEXELS_API_KEY) {
      this.providers.pexels = new PexelsProvider(process.env.PEXELS_API_KEY);
    }
    if (process.env.UNSPLASH_ACCESS_KEY) {
      this.providers.unsplash = new UnsplashProvider(process.env.UNSPLASH_ACCESS_KEY);
    }
    // Wikimedia doesn't need a key
    this.providers.wikimedia = new WikimediaProvider();

    console.log(`Initialized providers: ${Object.keys(this.providers).join(', ')}`);
  }

  /**
   * Search for replacement images
   * Priority: Wikimedia (for exact landmarks) > Pexels > Unsplash
   * @param {Object} context - { destSlug, fieldPath, name, type, state, title }
   * @returns {Promise<Array>} Ranked candidates
   */
  async search(context) {
    const { destSlug, fieldPath, name, type, state, title } = context;

    // Build search queries in priority order
    const queries = this.buildQueries(context);

    const allResults = [];
    const seenUrls = new Set();

    for (const { query, provider, priority, metadata } of queries) {
      if (!this.providers[provider]) {
        console.log(`  Skipping ${provider} (not configured)`);
        continue;
      }

      // Check cache first
      const cached = await this.cache.getProviderSearch(query, provider);
      if (cached) {
        console.log(`  Cache hit for ${provider}: "${query}"`);
        for (const r of cached.results) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allResults.push({ ...r, query, provider, priority, metadata });
          }
        }
        continue;
      }

      try {
        console.log(`  Searching ${provider}: "${query}"`);
        const results = await this.providers[provider].search(query, metadata);

        // Cache results
        await this.cache.cacheProviderSearch(query, provider, results);

        for (const r of results) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allResults.push({ ...r, query, provider, priority, metadata });
          }
        }
      } catch (err) {
        console.warn(`  ${provider} search failed for "${query}": ${err.message}`);
        if (err.message.includes('403') || err.message.includes('rate limit') || err.message.includes('429')) {
          console.warn(`  Disabling provider ${provider} due to rate limiting`);
          delete this.providers[provider];
        }
      }

      // If we already found enough candidates, avoid making additional API calls
      if (allResults.length >= 3) {
        break;
      }
    }

    // Score and rank results
    const ranked = this.rankResults(allResults, context);
    return ranked;
  }

  buildQueries(context) {
    const { name, type, state, title } = context;
    const queries = [];

    const cleanName = (name || '').replace(/[\(\),]/g, ' ').trim();
    const cleanTitle = (title || '').replace(/[\(\),]/g, ' ').trim();
    const cleanState = (state || '').trim();

    // Place & Place-photo queries
    if (type === 'place' || type === 'place-photo') {
      if (cleanName) {
        queries.push({ query: `${cleanName} India`, provider: 'wikimedia', priority: 1, metadata: { minWidth: 800 } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'unsplash', priority: 2, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} ${cleanState} India`, provider: 'pexels', priority: 3, metadata: { orientation: 'landscape', size: 'large' } });
        queries.push({ query: `${cleanName}`, provider: 'wikimedia', priority: 4, metadata: { minWidth: 800 } });
        queries.push({ query: `${cleanName} India`, provider: 'unsplash', priority: 5, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} India`, provider: 'pexels', priority: 6, metadata: { orientation: 'landscape' } });
      }
      // Fallback to destination landscape
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 7, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 8, metadata: { orientation: 'landscape' } });
    }

    // Hero / Image / Gallery queries
    if (type === 'hero' || type === 'image' || type === 'gallery') {
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'unsplash', priority: 1, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} ${cleanState} India travel`, provider: 'pexels', priority: 2, metadata: { orientation: 'landscape', size: 'large' } });
      queries.push({ query: `${cleanTitle} India`, provider: 'wikimedia', priority: 3, metadata: { minWidth: 1000 } });
      queries.push({ query: `${cleanTitle} India tourism`, provider: 'unsplash', priority: 4, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} India landscape`, provider: 'pexels', priority: 5, metadata: { orientation: 'landscape', size: 'large' } });
    }

    // Hotel queries
    if (type === 'hotel') {
      if (cleanName) {
        queries.push({ query: `${cleanName} ${cleanTitle} hotel India`, provider: 'unsplash', priority: 1, metadata: { orientation: 'landscape' } });
        queries.push({ query: `${cleanName} ${cleanTitle} hotel`, provider: 'pexels', priority: 2, metadata: { orientation: 'landscape' } });
      }
      queries.push({ query: `${cleanTitle} luxury resort hotel India`, provider: 'unsplash', priority: 3, metadata: { orientation: 'landscape' } });
      queries.push({ query: `${cleanTitle} hotel room stay India`, provider: 'pexels', priority: 4, metadata: { orientation: 'landscape' } });
    }

    return queries;
  }

  rankResults(results, context) {
    const { name, type, title } = context;
    const cleanName = (name || '').toLowerCase();
    const cleanTitle = (title || '').toLowerCase();

    return results.map(r => {
      let score = 95 - (r.priority ? (r.priority - 1) * 2 : 0);

      const searchable = `${r.title || ''} ${r.description || ''} ${r.alt || ''}`.toLowerCase();
      if (cleanName && searchable.includes(cleanName)) score += 10;
      if (cleanTitle && searchable.includes(cleanTitle)) score += 5;

      // Boost for high-res images
      if (r.width && r.height) {
        if (r.width >= 1200 && r.height >= 800) score += 5;
        else if (r.width < 400 || r.height < 300) score -= 30;
      }

      // Bonus for provider quality
      if (r.provider === 'pexels' || r.provider === 'unsplash' || r.provider === 'wikimedia') {
        score += 2;
      }

      return { ...r, confidence: Math.max(0, Math.min(100, Math.round(score))) };
    })
    .sort((a, b) => b.confidence - a.confidence);
  }
}

module.exports = { ProviderManager };