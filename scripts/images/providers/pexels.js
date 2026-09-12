/**
 * Pexels API provider for image search
 */

const config = require('../config');
const { ImageCache } = require('../lib/cache');

const PEXELS_CONFIG = config.providers.pexels;

class PexelsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = PEXELS_CONFIG.baseUrl;
    this.searchEndpoint = PEXELS_CONFIG.searchEndpoint;
    this.rateLimit = PEXELS_CONFIG.rateLimit;
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  async search(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Pexels API key not configured');
    }

    // Rate limiting
    await this.waitForRateLimit();

    const page = options.page || 1;
    const perPage = options.perPage || PEXELS_CONFIG.perPage;

    const url = new URL(`${this.baseUrl}${this.searchEndpoint}`);
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', perPage.toString());
    if (options.orientation) url.searchParams.set('orientation', options.orientation);
    if (options.size) url.searchParams.set('size', options.size);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': this.apiKey },
    });

    this.requestCount++;
    this.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data);
  }

  async waitForRateLimit() {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + this.rateLimit.per;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      throw new Error(`Pexels rate limit reached (${this.rateLimit.requests}/hr)`);
    }
  }

  normalizeResults(data) {
    return (data.photos || []).map(photo => {
      const width = photo.width || 0;
      const height = photo.height || 0;
      const url = photo.src?.original || photo.src?.large2x || photo.src?.large;

      return {
        id: photo.id.toString(),
        url,
        thumbnail: photo.src?.medium || photo.src?.small,
        width,
        height,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        alt: photo.alt || '',
        provider: 'pexels',
        searchUrl: photo.url,
      };
    }).filter(p => p.url && p.width >= 1600 && p.height >= 900); // Strict HD Filter (Min 1600x900)
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = { PexelsProvider };