/**
 * JSON-based persistent cache for image audit data
 * No external dependencies - pure Node stdlib
 * Stores: validation results, dimensions, provider searches, retries
 * Resumable across crashes via checkpoint file
 */

const fs = require('fs');
const path = require('path');

class ImageCache {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = {
      imageCache: new Map(),
      providerSearchCache: new Map(),
      perceptualIndex: new Map(),
      checkpoints: [],
      manualReview: [],
      changesLog: [],
    };
    this.dirty = false;
  }

  async init() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Load existing cache
    if (fs.existsSync(this.dbPath)) {
      try {
        const content = fs.readFileSync(this.dbPath, 'utf8');
        const loaded = JSON.parse(content);
        this.data.imageCache = new Map(Object.entries(loaded.imageCache || {}));
        this.data.providerSearchCache = new Map(Object.entries(loaded.providerSearchCache || {}));
        this.data.perceptualIndex = new Map(Object.entries(loaded.perceptualIndex || {}));
        this.data.checkpoints = loaded.checkpoints || [];
        this.data.manualReview = loaded.manualReview || [];
        this.data.changesLog = loaded.changesLog || [];
        console.log(`Loaded cache: ${this.data.imageCache.size} images, ${this.data.providerSearchCache.size} searches`);
      } catch (e) {
        console.warn('Failed to load cache, starting fresh:', e.message);
      }
    }
    return this;
  }

  // Periodic save
  async save() {
    if (!this.dirty) return;
    const toSave = {
      imageCache: Object.fromEntries(this.data.imageCache),
      providerSearchCache: Object.fromEntries(this.data.providerSearchCache),
      perceptualIndex: Object.fromEntries(this.data.perceptualIndex),
      checkpoints: this.data.checkpoints,
      manualReview: this.data.manualReview,
      changesLog: this.data.changesLog,
    };
    fs.writeFileSync(this.dbPath, JSON.stringify(toSave, null, 2));
    this.dirty = false;
  }

  // Auto-save every N operations
  markDirty() { this.dirty = true; }

  // ─── Image cache operations ─────────────────────────────────────────
  async upsertImage(record) {
    const hash = this.hashUrl(record.url);
    const entry = {
      destSlug: record.destSlug,
      fieldPath: record.fieldPath,
      url: record.url,
      urlHash: hash,
      normalizedUrl: record.normalizedUrl || record.url,
      validationStatus: record.validationStatus,
      validationLevel: record.validationLevel,
      httpStatus: record.httpStatus,
      mimeType: record.mimeType,
      width: record.width,
      height: record.height,
      fileSize: record.fileSize,
      perceptualHash: record.perceptualHash,
      provider: record.provider,
      providerImageId: record.providerImageId,
      query: record.query,
      selectedResult: record.selectedResult,
      relevanceScore: record.relevanceScore,
      retryCount: record.retryCount || 0,
      retryStatus: record.retryStatus,
      lastChecked: record.lastChecked || new Date().toISOString(),
      notes: record.notes || '',
    };
    this.data.imageCache.set(hash, entry);
    this.markDirty();
    return entry;
  }

  async getImage(urlHash) {
    return this.data.imageCache.get(urlHash) || null;
  }

  async getImageByUrl(url) {
    return this.getImage(this.hashUrl(url));
  }

  // ─── Provider search cache ──────────────────────────────────────────
  async cacheProviderSearch(query, provider, results, ttlHours = 168) {
    const hash = this.hashString(`${provider}:${query}`);
    const now = new Date();
    const expiry = new Date(now.getTime() + ttlHours * 3600000);
    this.data.providerSearchCache.set(hash, {
      queryHash: hash,
      query,
      provider,
      results,
      cachedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
    });
    this.markDirty();
  }

  async getProviderSearch(query, provider) {
    const hash = this.hashString(`${provider}:${query}`);
    const entry = this.data.providerSearchCache.get(hash);
    if (!entry) return null;
    if (new Date(entry.expiresAt) <= new Date()) {
      this.data.providerSearchCache.delete(hash);
      this.markDirty();
      return null;
    }
    return entry;
  }

  // ─── Perceptual hash index ──────────────────────────────────────────
  async addPerceptualHash(urlHash, phash, destSlug, fieldPath) {
    if (!this.data.perceptualIndex.has(urlHash)) {
      this.data.perceptualIndex.set(urlHash, []);
    }
    this.data.perceptualIndex.get(urlHash).push({ perceptualHash: phash, destSlug, fieldPath });
    this.markDirty();
  }

  async findSimilarByPhash(phash, threshold = 8) {
    const similar = [];
    for (const [urlHash, entries] of this.data.perceptualIndex) {
      for (const entry of entries) {
        if (entry.perceptualHash && this.hammingDistance(phash, entry.perceptualHash) <= threshold) {
          similar.push({ urlHash, ...entry });
        }
      }
    }
    return similar;
  }

  // ─── Checkpoints ────────────────────────────────────────────────────
  async saveCheckpoint(runId, phase, level, lastIndex, total, status = 'running', metadata = {}) {
    const now = new Date().toISOString();
    const checkpoint = {
      runId, phase, level, lastProcessedIndex: lastIndex, totalItems: total,
      startedAt: now, updatedAt: now, status, metadata,
    };
    // Remove old checkpoints for same phase/level
    this.data.checkpoints = this.data.checkpoints.filter(
      c => !(c.phase === phase && c.level === level && c.status !== 'completed')
    );
    this.data.checkpoints.push(checkpoint);
    this.markDirty();
    await this.save(); // Force save checkpoints immediately
  }

  async getLatestCheckpoint(phase, level) {
    const checkpoints = this.data.checkpoints
      .filter(c => c.phase === phase && c.level === level && c.status !== 'completed')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return checkpoints[0] || null;
  }

  // ─── Manual review ──────────────────────────────────────────────────
  async addManualReview(entry) {
    const review = {
      id: this.data.manualReview.length + 1,
      destSlug: entry.destSlug,
      fieldPath: entry.fieldPath,
      url: entry.url,
      issue: entry.issue,
      confidence: entry.confidence || null,
      suggestedUrl: entry.suggestedUrl || null,
      context: entry.context || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.data.manualReview.push(review);
    this.markDirty();
    return review.id;
  }

  async getManualReviewQueue(status = 'pending') {
    return this.data.manualReview.filter(r => r.status === status);
  }

  // ─── Changes log ─────────────────────────────────────────────────────
  async logChange(change) {
    const logEntry = {
      id: this.data.changesLog.length + 1,
      destSlug: change.destSlug,
      fieldPath: change.fieldPath,
      oldUrl: change.oldUrl,
      newUrl: change.newUrl,
      confidence: change.confidence,
      provider: change.provider,
      appliedAt: new Date().toISOString(),
      dryRun: change.dryRun ? 1 : 0,
    };
    this.data.changesLog.push(logEntry);
    this.markDirty();
    return logEntry.id;
  }

  // ─── Utility ─────────────────────────────────────────────────────────
  hashUrl(url) {
    return this.hashString(url);
  }

  hashString(str) {
    // Simple FNV-1a 32-bit hash
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return ('00000000' + hash.toString(16)).slice(-8);
  }

  hammingDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) dist++;
    }
    return dist;
  }

  // For direct DB access in reports
  get db() {
    return {
      all: (sql, params, callback) => {
        // Simplified query interface for reports
        if (sql.includes('image_cache')) {
          const rows = Array.from(this.data.imageCache.values())
            .filter(r => r.validationStatus !== 'ok' || r.validationStatus === undefined);
          callback(null, rows);
        } else if (sql.includes('changes_log')) {
          callback(null, this.data.changesLog);
        } else if (sql.includes('provider_search_cache')) {
          callback(null, Array.from(this.data.providerSearchCache.values()));
        } else {
          callback(null, []);
        }
      },
    };
  }

  async close() {
    await this.save();
  }
}

module.exports = { ImageCache };