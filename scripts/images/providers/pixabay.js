/**
 * Pixabay API provider for image search
 * Documentation: https://pixabay.com/api/docs/
 * Free Tier: 100 requests/min (5,000 requests/hour)
 */

const config = require('../config');

const PIXABAY_CONFIG = config.providers?.pixabay || {
  baseUrl: 'https://pixabay.com/api/',
  rateLimit: { requests: 100, per: 60000 },
  perPage: 20,
};

class PixabayProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = PIXABAY_CONFIG.baseUrl;
    this.rateLimit = PIXABAY_CONFIG.rateLimit;
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  async search(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Pixabay API key not configured');
    }

    await this.waitForRateLimit();

    const page = options.page || 1;
    const perPage = Math.min(options.limit || options.perPage || 20, 50);

    const url = new URL(this.baseUrl);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('image_type', 'photo');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', perPage.toString());

    if (options.orientation) {
      const ori = options.orientation === 'landscape' ? 'horizontal' :
                  options.orientation === 'portrait' ? 'vertical' : 'all';
      url.searchParams.set('orientation', ori);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'ExploreDesh/2.0 (Travel Directory; info@exploredesh.com)'
      }
    });

    this.requestCount++;
    this.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeResults(data, options);
  }

  async waitForRateLimit() {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + this.rateLimit.per;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      const waitTime = Math.max(100, this.resetTime - now);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.resetTime = Date.now() + this.rateLimit.per;
    }
  }

  normalizeResults(data, options = {}) {
    return (data.hits || []).map(hit => {
      const width = hit.imageWidth || 0;
      const height = hit.imageHeight || 0;
      const is4K = width >= 3840 || height >= 2160 || (width * height >= 8000000);
      const is2K = width >= 2048 || height >= 1440;
      const isHD = width >= 1920 || height >= 1080;

      let resolutionTier = 'Standard';
      if (is4K) resolutionTier = '4K UHD';
      else if (is2K) resolutionTier = '2K QHD';
      else if (isHD) resolutionTier = 'Full HD';

      return {
        id: hit.id.toString(),
        provider: 'pixabay',
        title: hit.tags || 'Travel Photo',
        alt: hit.tags || '',
        width,
        height,
        megapixels: ((width * height) / 1000000).toFixed(1) + ' MP',
        resolutionTier,
        is4K,
        url: hit.largeImageURL || hit.fullHDURL || hit.imageURL,
        previewUrl: hit.webformatURL || hit.previewURL,
        thumbnail: hit.previewURL,
        photographer: hit.user || 'Pixabay Contributor',
        photographerUrl: hit.user_id ? `https://pixabay.com/users/${hit.user}-${hit.user_id}/` : 'https://pixabay.com',
        license: 'Pixabay Commercial License (Free to use)',
        searchUrl: hit.pageURL || 'https://pixabay.com',
      };
    }).filter(p => p.url && p.width >= 1600 && p.height >= 900); // Strict HD Filter (Min 1600x900)
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = { PixabayProvider };
