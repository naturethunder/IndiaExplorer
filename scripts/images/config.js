/**
 * Image Pipeline Configuration
 * Central configuration for audit, repair, and verification
 */

module.exports = {
  // Paths
  paths: {
    destDir: 'data/destinations',
    indexPath: 'data/destinations/index.json',
    cacheDb: 'data/image-cache.sqlite',
    reportsDir: 'reports',
    envPath: '.env.local',
  },

  // Provider APIs
  providers: {
    pexels: {
      baseUrl: 'https://api.pexels.com/v1',
      searchEndpoint: '/search',
      rateLimit: { requests: 200, per: 3600000 }, // 200/hour
      maxPages: 3,
      perPage: 20,
    },
    unsplash: {
      baseUrl: 'https://api.unsplash.com',
      searchEndpoint: '/search/photos',
      rateLimit: { requests: 50, per: 3600000 }, // 50/hour
      maxPages: 3,
      perPage: 20,
    },
    wikimedia: {
      baseUrl: 'https://commons.wikimedia.org/w/api.php',
      rateLimit: { requests: 100, per: 60000 }, // 100/min
      maxResults: 10,
    },
  },

  // Audit levels
  audit: {
    // Level 1: Cheap checks
    level1: {
      enabled: true,
      checkMissingUrl: true,
      checkMalformedUrl: true,
      checkDuplicateUrl: true,
      checkInvalidLocalPath: true,
      checkPlaceholderPatterns: true,
      placeholderPatterns: [
        'picsum.photos',
        'via.placeholder',
        'placeholder',
        'dummyimage',
        'placehold.co',
        'loremflickr',
      ],
    },

    // Level 2: HTTP validation
    level2: {
      enabled: true,
      timeout: 10000,
      followRedirects: true,
      maxRedirects: 5,
      validateMime: true,
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxConcurrency: 20,
      retry: {
        attempts: 3,
        backoff: 1000,
        backoffMultiplier: 2,
        retryOn: [408, 429, 500, 502, 503, 504],
      },
    },

    // Level 3: Image quality
    level3: {
      enabled: false, // Only for suspicious images
      minWidth: 400,
      minHeight: 300,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      checkPerceptualHash: true,
      hashThreshold: 8, // Hamming distance for perceptual duplicate
      downloadTimeout: 30000,
    },

    // Level 4: Provider search
    level4: {
      enabled: false, // Only for images needing replacement
      confidenceThreshold: 90,
      autoApplyThreshold: 95,
      manualReviewThreshold: 70,
    },
  },

  // Processing
  processing: {
    batchSize: 100,
    concurrency: 10,
    checkpointInterval: 50,
    resumeFromCheckpoint: true,
  },

  // Output
  output: {
    summaryJson: 'image-audit-summary.json',
    problemsCsv: 'image-problems.csv',
    duplicatesCsv: 'image-duplicates.csv',
    manualReviewCsv: 'image-manual-review.csv',
    changesCsv: 'image-changes.csv',
    htmlReport: 'image-audit.html',
  },

  // Destination filtering
  filters: {
    state: null,
    destination: null,
    limit: null,
    types: null,
  },
};