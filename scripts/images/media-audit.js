#!/usr/bin/env node
'use strict';

/**
 * Comprehensive media structure audit
 * Validates the restored media structure against requirements
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function normalizeWikimediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // Remove query parameters
  url = url.split('?')[0];
  // Normalize thumbnail URLs to original
  url = url.replace(/\/thumb\//g, '/');
  url = url.replace(/\/[0-9]+px-.*\.jpg$/i, '.jpg');
  url = url.replace(/\/[0-9]+px-.*\.jpeg$/i, '.jpeg');
  url = url.replace(/\/[0-9]+px-.*\.png$/i, '.png');
  return url;
}

function getIdentity(url) {
  if (!url || typeof url !== 'string') return url;
  // For Wikimedia: normalize to base filename
  if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
    return normalizeWikimediaUrl(url);
  }
  // For Pexels/Unsplash/Pixabay: remove query params and size params
  if (url.includes('pexels.com') || url.includes('unsplash.com') || url.includes('pixabay.com')) {
    return url.split('?')[0];
  }
  // For other URLs: just remove query params
  return url.split('?')[0];
}

function auditDestinations() {
  const destDir = path.join(ROOT, 'data', 'destinations');
  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();

  const results = {
    totalDestinations: files.length,
    totalPlaces: 0,
    totalPhotos: 0,
    placesWithCorrectPhotoCount: 0,
    placesWithIncorrectPhotoCount: 0,
    placesWithCoverDuplicated: 0,
    placesWithInternalDuplicates: 0,
    destinationsWithGalleryDuplicates: 0,
    totalGalleryImages: 0,
    jsonErrors: 0,
    errorFiles: [],
    detailedErrors: [],
    exceptions: {
      'koncheswar-mahadev-temple': null,
      'manali': null,
      'munnar': null,
      'rajauli-wildlife-sanctuary': null
    }
  };

  for (const file of files) {
    const filePath = path.join(destDir, file);
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      results.jsonErrors++;
      results.errorFiles.push(file);
      continue;
    }

    // Check exception destinations
    const slug = doc.slug || file.replace('.json', '');
    if (results.exceptions.hasOwnProperty(slug)) {
      results.exceptions[slug] = {
        slug: doc.slug,
        title: doc.title,
        placesCount: doc.topPlaces?.length || 0,
        galleryCount: doc.gallery?.length || 0
      };
    }

    // Audit topPlaces
    if (Array.isArray(doc.topPlaces)) {
      for (const place of doc.topPlaces) {
        results.totalPlaces++;

        if (Array.isArray(place.photos)) {
          results.totalPhotos += place.photos.length;

          if (place.photos.length === 3) {
            results.placesWithCorrectPhotoCount++;
          } else {
            results.placesWithIncorrectPhotoCount++;
            results.detailedErrors.push({
              destination: slug,
              place: place.name,
              issue: `photos[] length is ${place.photos.length}, expected 3`,
              photos: place.photos
            });
          }

          // Check if cover is duplicated in photos
          const cover = place.image?.src || place.image;
          if (cover && place.photos.includes(cover)) {
            results.placesWithCoverDuplicated++;
            results.detailedErrors.push({
              destination: slug,
              place: place.name,
              issue: 'Cover image duplicated in photos[]',
              cover: cover
            });
          }

          // Check for internal duplicates (normalized)
          const identities = place.photos.map(getIdentity);
          const uniqueIdentities = new Set(identities);
          if (identities.length !== uniqueIdentities.size) {
            results.placesWithInternalDuplicates++;
            results.detailedErrors.push({
              destination: slug,
              place: place.name,
              issue: 'Internal duplicate image identities in photos[]',
              identities: identities
            });
          }
        } else {
          results.detailedErrors.push({
            destination: slug,
            place: place.name,
            issue: 'No photos[] array',
            place: place
          });
        }
      }
    }

    // Audit gallery
    if (Array.isArray(doc.gallery)) {
      results.totalGalleryImages += doc.gallery.length;
      const identities = doc.gallery.map(g => getIdentity(g.src || g));
      const uniqueIdentities = new Set(identities);
      if (identities.length !== uniqueIdentities.size) {
        results.destinationsWithGalleryDuplicates++;
        results.detailedErrors.push({
          destination: slug,
          issue: 'Duplicate image identities in gallery[]',
          identities: identities
        });
      }
    }
  }

  return results;
}

function auditBulk() {
  const bulkDir = path.join(ROOT, 'data', 'bulk');
  const files = fs.readdirSync(bulkDir).filter(f => f.endsWith('.json')).sort();

  const results = {
    totalBulkFiles: files.length,
    totalDestinations: 0,
    totalPlaces: 0,
    totalPhotos: 0,
    placesWithCorrectPhotoCount: 0,
    placesWithIncorrectPhotoCount: 0,
    placesWithCoverDuplicated: 0,
    placesWithInternalDuplicates: 0,
    jsonErrors: 0
  };

  for (const file of files) {
    const filePath = path.join(bulkDir, file);
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      results.jsonErrors++;
      continue;
    }

    if (Array.isArray(doc)) {
      for (const dest of doc) {
        results.totalDestinations++;
        if (Array.isArray(dest.places)) {
          for (const place of dest.places) {
            results.totalPlaces++;
            if (Array.isArray(place.photos)) {
              results.totalPhotos += place.photos.length;
              if (place.photos.length === 3) {
                results.placesWithCorrectPhotoCount++;
              } else {
                results.placesWithIncorrectPhotoCount++;
              }

              const cover = place.image?.src || place.image;
              if (cover && place.photos.includes(cover)) {
                results.placesWithCoverDuplicated++;
              }

              const identities = place.photos.map(getIdentity);
              const uniqueIdentities = new Set(identities);
              if (identities.length !== uniqueIdentities.size) {
                results.placesWithInternalDuplicates++;
              }
            }
          }
        }
      }
    }
  }

  return results;
}

function auditIndex() {
  const indexPath = path.join(ROOT, 'data', 'destinations', 'index.json');
  const doc = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  return {
    count: doc.count,
    destinationsLength: doc.destinations?.length || 0,
    match: doc.count === (doc.destinations?.length || 0)
  };
}

console.log('=== MEDIA STRUCTURE AUDIT ===\n');

console.log('--- AUDITING DESTINATIONS ---');
const destResults = auditDestinations();
console.log(JSON.stringify(destResults, null, 2));

console.log('\n--- AUDITING BULK FILES ---');
const bulkResults = auditBulk();
console.log(JSON.stringify(bulkResults, null, 2));

console.log('\n--- AUDITING INDEX.JSON ---');
const indexResults = auditIndex();
console.log(JSON.stringify(indexResults, null, 2));

console.log('\n=== SUMMARY ===');
console.log(`Total destinations: ${destResults.totalDestinations}`);
console.log(`Total nearby places: ${destResults.totalPlaces}`);
console.log(`Total photos[] entries: ${destResults.totalPhotos}`);
console.log(`Places with correct photo count (3): ${destResults.placesWithCorrectPhotoCount}`);
console.log(`Places with incorrect photo count: ${destResults.placesWithIncorrectPhotoCount}`);
console.log(`Places with cover duplicated in photos[]: ${destResults.placesWithCoverDuplicated}`);
console.log(`Places with internal duplicate identities: ${destResults.placesWithInternalDuplicates}`);
console.log(`Destinations with gallery duplicates: ${destResults.destinationsWithGalleryDuplicates}`);
console.log(`Total gallery images: ${destResults.totalGalleryImages}`);
console.log(`JSON parse errors: ${destResults.jsonErrors}`);
console.log(`Bulk total places: ${bulkResults.totalPlaces}`);
console.log(`Bulk places with correct count: ${bulkResults.placesWithCorrectPhotoCount}`);
console.log(`Bulk places with cover duplicated: ${bulkResults.placesWithCoverDuplicated}`);
console.log(`Bulk places with internal duplicates: ${bulkResults.placesWithInternalDuplicates}`);
console.log(`Index count matches destinations: ${indexResults.match}`);

// Save detailed errors
if (destResults.detailedErrors.length > 0) {
  fs.writeFileSync(
    path.join(ROOT, 'media-audit-errors.json'),
    JSON.stringify(destResults.detailedErrors, null, 2)
  );
  console.log('\nDetailed errors saved to media-audit-errors.json');
}

console.log('\n=== EXCEPTION DESTINATIONS ===');
console.log(JSON.stringify(destResults.exceptions, null, 2));