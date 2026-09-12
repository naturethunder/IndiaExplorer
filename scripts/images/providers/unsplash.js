/**
 * Unsplash API provider for image search
 */

const config = require('../config');

const UNSPLASH_CONFIG = config.providers.unsplash;

class UnsplashProvider {
  constructor(accessKey) {
    this.accessKey = accessKey;
    this.baseUrl = UNSPLASH_CONFIG.baseUrl;
    this.searchEndpoint = UNSPLASH_CONFIG.searchEndpoint;
    this.rateLimit = UNSPLASH_CONFIG.rateLimit;
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  async search(query, options = {}) {
    if (!this.accessKey) {
      throw new Error('Unsplash access key not configured');
    }

    await this.waitForRateLimit();

    const page = options.page || 1;
    const perPage = options.perPage || UNSPLASH_CONFIG.perPage;

    const url = new URL(`${this.baseUrl}${this.searchEndpoint}`);
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', perPage.toString());
    if (options.orientation) url.searchParams.set('orientation', options.orientation);
    if (options.contentFilter) url.searchParams.set('content_filter', options.contentFilter);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Client-ID ${this.accessKey}` },
    });

    this.requestCount++;
    this.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
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
      throw new Error(`Unsplash rate limit reached (${this.rateLimit.requests}/hr)`);
    }
  }

  normalizeResults(data) {
    return (data.results || []).map(photo => {
      const width = photo.width || 0;
      const height = photo.height || 0;
      // Guarantee high-definition URL (full or raw with 2400w)
      const url = photo.urls?.raw ? `${photo.urls.raw}&auto=format&fit=crop&w=2400&q=85` : (photo.urls?.full || photo.urls?.regular);

      return {
        id: photo.id,
        url,
        thumbnail: photo.urls?.thumb || photo.urls?.small,
        width,
        height,
        photographer: photo.user?.name,
        photographerUrl: photo.user?.links?.html,
        alt: photo.alt_description || photo.description || '',
        provider: 'unsplash',
        searchUrl: photo.links?.html,
      };
    }).filter(p => p.url && p.width >= 1600 && p.height >= 900); // Strict HD Filter (Min 1600x900)
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = { UnsplashProvider };