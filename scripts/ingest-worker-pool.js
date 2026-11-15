#!/usr/bin/env node
/**
 * scripts/ingest-worker-pool.js
 * ============================================================
 * High-Throughput Multi-Worker Ingestion Pool for ExploreDesh
 * Concurrently processes remaining Indian destinations across
 * distributed Overpass mirrors with auto-retry and continuous
 * master directory index updating.
 *
 * Invariant: 100% Free, Zero Paid APIs, Zero Fabricated Data.
 * Missing values strictly remain null.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { ingestDestination, rebuildDirectoryIndexes } = require('./ingest-hotels-restaurants.js');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const HOTELS_DIR = path.join(ROOT, 'data', 'hotels');
const RESTRO_DIR = path.join(ROOT, 'data', 'restaurants');

async function main() {
  const args = process.argv.slice(2);
  const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const recheckZero = args.includes('--recheck-zero');

  const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.replace('--concurrency=', ''), 10) : 5;
  const LIMIT = limitArg ? parseInt(limitArg.replace('--limit=', ''), 10) : Infinity;

  const idxPath = path.join(DEST_DIR, 'index.json');
  if (!fs.existsSync(idxPath)) {
    console.error('Master destinations index not found:', idxPath);
    process.exit(1);
  }

  const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  const allDestinations = idx.destinations || [];

  function isFullyIngested(slug) {
    const hotelFile = path.join(HOTELS_DIR, `${slug}.json`);
    const restroFile = path.join(RESTRO_DIR, `${slug}.json`);
    if (!fs.existsSync(hotelFile) || !fs.existsSync(restroFile)) return false;
    if (recheckZero) {
      try {
        const h = JSON.parse(fs.readFileSync(hotelFile, 'utf8'));
        const r = JSON.parse(fs.readFileSync(restroFile, 'utf8'));
        if (h.overpass_verified || r.overpass_verified || h.count > 0 || r.count > 0) return true;
        return false;
      } catch (_) {
        return false;
      }
    }
    return true;
  }

  // Queue of un-ingested or zero-count destinations sorted by popularity
  const queue = allDestinations
    .filter(d => !isFullyIngested(d.slug))
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, LIMIT);

  const totalToProcess = queue.length;
  const alreadyDone = allDestinations.length - totalToProcess;

  console.log('================================================================');
  console.log('🚀 EXPLOREDESH MULTI-WORKER INGESTION POOL');
  console.log(`Total Destinations in Catalog: ${allDestinations.length}`);
  console.log(`Already Ingested:             ${alreadyDone}`);
  console.log(`Remaining to Ingest:          ${totalToProcess}`);
  console.log(`Worker Concurrency:           ${CONCURRENCY} parallel workers`);
  console.log('================================================================\n');

  if (totalToProcess === 0) {
    console.log('🎉 All destinations are already ingested!');
    rebuildDirectoryIndexes();
    return;
  }

  let completedCount = 0;
  let successCount = 0;
  let failCount = 0;
  let nextQueueIndex = 0;
  const retryQueue = [];

  async function worker(workerId) {
    while (true) {
      let dest = null;
      if (nextQueueIndex < queue.length) {
        dest = queue[nextQueueIndex++];
      } else if (retryQueue.length > 0) {
        dest = retryQueue.shift();
      } else {
        break; // All work complete
      }

      const slug = dest.slug;
      const hotelFile = path.join(HOTELS_DIR, `${slug}.json`);
      const restroFile = path.join(RESTRO_DIR, `${slug}.json`);

      if (isFullyIngested(slug)) {
        completedCount++;
        continue;
      }

      let attempts = 0;
      let success = false;
      while (attempts < 2 && !success) {
        attempts++;
        try {
          const res = await ingestDestination(slug);
          if (res) {
            success = true;
            successCount++;
            completedCount++;
            const pct = (((alreadyDone + completedCount) / allDestinations.length) * 100).toFixed(1);
            console.log(`[W${workerId}][${alreadyDone + completedCount}/${allDestinations.length} (${pct}%)] ✓ ${dest.title} (${dest.state}): ${res.hotelCount} hotels, ${res.restaurantCount} restros`);
          }
        } catch (err) {
          if (attempts >= 2) {
            failCount++;
            completedCount++;
            console.error(`[W${workerId}][Fail] ❌ ${slug} failed after ${attempts} attempts: ${err.message}`);
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      // Re-index every 25 completed destinations
      if (completedCount % 25 === 0) {
        rebuildDirectoryIndexes();
      }

      // Polite pause between queries on this worker
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // Launch workers in parallel
  const workers = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  // Final directory reindex
  rebuildDirectoryIndexes();

  console.log('\n================================================================');
  console.log(`🏁 INGESTION POOL COMPLETE`);
  console.log(`Successfully Processed: ${successCount}`);
  console.log(`Failed:                 ${failCount}`);
  console.log(`Total on Disk:          ${alreadyDone + successCount} / ${allDestinations.length}`);
  console.log('================================================================\n');
}

main().catch(console.error);

