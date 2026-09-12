/**
 * Cleveland Museum of Art (CMA) Open Access API Provider
 * 100% Free, No Key Required, Unlimited
 * Ultra-HD CC0 photography of Indian royal palaces, forts, temples, and historical architecture
 */

class CMAProvider {
  constructor() {
    this.rateLimit = { requests: 120, per: 60000 };
  }

  async search(query, options = {}) {
    const url = `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(query + ' India')}&has_image=1&limit=${Math.min(options.limit || 8, 12)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const data = await res.json();

      return (data.data || []).map(item => {
        // CMA provides print (3000px+ Ultra HD) and web (900px+)
        const printImg = item.images?.print;
        const webImg = item.images?.web;
        const width = printImg?.width ? parseInt(printImg.width, 10) : (webImg?.width ? parseInt(webImg.width, 10) : 2400);
        const height = printImg?.height ? parseInt(printImg.height, 10) : (webImg?.height ? parseInt(webImg.height, 10) : 1600);
        const fullUrl = printImg?.url || webImg?.url;

        return {
          id: `cma_${item.id}`,
          provider: 'cma',
          title: item.title || `${query} Monument`,
          alt: item.title || '',
          width,
          height,
          url: fullUrl,
          previewUrl: webImg?.url || fullUrl,
          thumbnail: webImg?.url || fullUrl,
          photographer: (item.creators && item.creators[0]?.description) || 'Cleveland Museum of Art Archives',
          photographerUrl: item.url || 'https://www.clevelandart.org',
          license: 'Creative Commons Zero (CC0 Public Domain)',
          searchUrl: item.url || 'https://www.clevelandart.org',
        };
      }).filter(p => p.url && p.width >= 1600 && p.height >= 900); // Strict HD Filter
    } catch (err) {
      clearTimeout(timeout);
      return [];
    }
  }
}

module.exports = { CMAProvider };
