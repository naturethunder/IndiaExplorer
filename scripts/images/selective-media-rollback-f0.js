#!/usr/bin/env node
'use strict';

/**
 * Selectively removes the one raw-identical nearby-place cover URL prepended
 * to photos[] after f0d889f8. It does not replace images or touch UI/SEO code.
 *
 * Usage:
 *   node scripts/images/selective-media-rollback-f0.js --scope destinations --start 0 --count 400 --apply
 *   node scripts/images/selective-media-rollback-f0.js --scope bulk --start 0 --count 35 --apply
 *
 * Omit --apply for a read-only preview. The operation is idempotent: records
 * already restored to three photos are skipped.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);

function valueAfter(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback;
}

const scope = valueAfter('--scope', 'destinations');
const start = Number.parseInt(valueAfter('--start', '0'), 10);
const count = Number.parseInt(valueAfter('--count', String(Number.MAX_SAFE_INTEGER)), 10);
const apply = args.includes('--apply');

if (!['destinations', 'bulk'].includes(scope)) {
  throw new Error('Invalid --scope. Expected destinations or bulk.');
}
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1) {
  throw new Error('--start must be >= 0 and --count must be >= 1.');
}

const directory = path.join(ROOT, 'data', scope);
const files = fs.readdirSync(directory)
  .filter((file) => file.endsWith('.json') && (scope !== 'destinations' || file !== 'index.json'))
  .sort();
const selected = files.slice(start, start + count);
const pendingWrites = [];

const summary = {
  baseline: 'f0d889f8',
  mode: apply ? 'apply' : 'preview',
  scope,
  start,
  requestedCount: count,
  selectedFiles: selected.length,
  changedFiles: 0,
  changedRecords: 0,
  placesChecked: 0,
  coverEntriesRemoved: 0,
  alreadyRestoredPlaces: 0,
  outOfScopePlaces: 0,
  errors: [],
};

function coverSource(place) {
  if (typeof place.image === 'string') return place.image;
  if (place.image && typeof place.image.src === 'string') return place.image.src;
  return '';
}

function restorePlaces(places, context, strict) {
  let changed = false;
  for (let index = 0; index < places.length; index += 1) {
    const place = places[index];
    const label = context + ' :: ' + (place.name || 'place[' + index + ']');
    summary.placesChecked += 1;

    if (!Array.isArray(place.photos)) {
      if (strict) summary.errors.push(label + ' has no photos[] array');
      else summary.outOfScopePlaces += 1;
      continue;
    }

    if (place.photos.length === 3) {
      summary.alreadyRestoredPlaces += 1;
      continue;
    }

    const cover = coverSource(place);
    if (place.photos.length !== 4) {
      if (strict) {
        summary.errors.push(label + ' has ' + place.photos.length + ' photos; expected 4 before restoration');
      } else {
        summary.outOfScopePlaces += 1;
      }
      continue;
    }
    if (!cover) {
      if (strict) summary.errors.push(label + ' has no cover image');
      else summary.outOfScopePlaces += 1;
      continue;
    }
    if (place.photos[0] !== cover) {
      if (strict) summary.errors.push(label + ' photos[0] is not the raw-identical cover URL');
      else summary.outOfScopePlaces += 1;
      continue;
    }

    place.photos = place.photos.slice(1);
    summary.coverEntriesRemoved += 1;
    changed = true;
  }
  return changed;
}

for (const file of selected) {
  const filePath = path.join(directory, file);
  const document = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fileChanged = false;

  if (scope === 'destinations') {
    fileChanged = restorePlaces(Array.isArray(document.topPlaces) ? document.topPlaces : [], file, true);
    if (fileChanged) summary.changedRecords += 1;
  } else {
    if (!Array.isArray(document)) {
      summary.errors.push(file + ' is not a bulk destination array');
      continue;
    }
    for (const destination of document) {
      const destinationChanged = restorePlaces(
        Array.isArray(destination.places) ? destination.places : [],
        file + ' :: ' + (destination.id || destination.name || 'unknown destination'),
        false
      );
      if (destinationChanged) {
        fileChanged = true;
        summary.changedRecords += 1;
      }
    }
  }

  if (fileChanged) {
    summary.changedFiles += 1;
    pendingWrites.push({ filePath, document });
  }
}

if (summary.errors.length > 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

if (apply) {
  for (const item of pendingWrites) {
    fs.writeFileSync(item.filePath, JSON.stringify(item.document, null, 2) + '\n', 'utf8');
  }
}

console.log(JSON.stringify(summary, null, 2));
