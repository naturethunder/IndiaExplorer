#!/usr/bin/env node
/**
 * scripts/build-json-data.js
 * 
 * Modernized catalog compiler: synchronizes data/destinations/index.json and
 * data/search-index.json directly from the authoritative data/destinations/*.json store.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const syncScript = path.join(__dirname, 'bulk', 'sync-index-and-search.js');
execFileSync(process.execPath, [syncScript], { stdio: 'inherit' });

try {
  require('./build-home-manifest').build();
} catch (e) {
  // Optional downstream manifest builder
}

console.log('✓ build-json-data: Catalog synchronization complete.');
