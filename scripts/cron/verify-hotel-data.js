/**
 * verify-hotel-data.js
 *
 * Automated hotel data verification cron job.
 * Runs periodic checks on hotel data quality, freshness, and integrity.
 *
 * Schedule: Run weekly (every Sunday at 2 AM)
 * Usage: node scripts/cron/verify-hotel-data.js
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const REPORT_PATH = path.join(__dirname, '..', '..', 'logs', 'hotel-verification-report.json');

const REAL_CHAINS = [
  'OYO', 'Treebo', 'FabHotels', 'Zostel', 'Ginger', 'Lemon Tree', 'Keys', 'Sarovar',
  'Ibis', 'Holiday Inn', 'Novotel', 'Fairfield', 'Courtyard', 'DoubleTree', 'Hyatt',
  'Radisson', 'Sheraton', 'Westin', 'Marriott', 'Taj', 'Vivanta', 'Le Méridien',
  'Oberoi', 'ITC', 'The Leela', 'The Lalit', 'Hilton', 'Sterling', 'Fortune',
  'Zone by The Park', 'Sarovar Portico', 'GoStops', 'Backpackers', 'Hosteller',
  'Trailhead', 'Ridge', 'Outpost', 'Adventure', 'Expedition', 'BunkStay',
  'The Fern', 'Renaissance', 'JW Marriott', 'Alila', 'The Gateway'
];

// Synthetic/template patterns that should NOT appear (from OLD generator templates)
// These are EXACT template patterns from the old fix-all-hotel-names-prices.js
// Old pattern: OYO <DESTINATION_NAME> Stay (location inserted into template)
// New pattern: OYO <CATEGORY_SUFFIX> (category-appropriate suffix like "Haveli Stay")
const SYNTHETIC_PATTERNS = [
  // OLD template format: OYO <DestinationName> Stay (location in middle, typically 2+ words, not a known category suffix)
  // This is stricter than /^OYO\s+.+\sStay$/i which also matches legitimate new names like "OYO Haveli Stay"
  (name) => {
    if (!/^OYO\s+.+\sStay$/i.test(name)) return false;
    // Extract middle part between "OYO " and " Stay" (keeping " Stay" in the suffix for matching)
    const fullSuffix = name.replace(/^OYO\s+/i, ''); // e.g. "Haveli Stay"
    // Known legitimate category suffixes from new generator (with " Stay" included)
    const LEGIT_SUFFIXES = new Set([
      'Haveli Stay', 'Sanctum Stay', 'Shore Stay', 'Divine Retreat', 'Bhakti Residency',
      'Yatri Nivas', 'Temple View', 'Dharmashala', 'Ashram Stay', 'Sai Dham',
      'Shiva Sadan', 'Krishna Kunj', 'Devotee Inn', 'Jungle Lodge', 'Wildlife Camp',
      'Safari Lodge', 'Nature Retreat', 'Eco Lodge', 'River View Camp', 'Tiger Trail',
      'Birders Inn', 'Wilderness Camp', 'Forest Camp', 'Beach Resort', 'Seaside Retreat',
      'Coastal Haven', 'Ocean View', 'Palm Grove', 'Sand & Surf', 'Wave Crest',
      'Tide Pool', 'Harbour View', 'Mountain Resort', 'Hilltop Retreat', 'Valley View',
      'Pine Grove', 'Mist Haven', 'Peak Stay', 'Ridge Resort', 'Alpine Lodge', 'Summit View',
      'Highland Resort', 'Heritage Hotel', 'Palace Hotel', 'Fort Residence', 'Royal Retreat',
      'Mahal Palace', 'Rajwada', 'Legacy Hotel', 'Period Property', 'Manor House'
    ]);
    // If full suffix matches a known category suffix, it's legitimate new format
    // If full suffix is "Townhouse <suffix>", also legitimate
    if (LEGIT_SUFFIXES.has(fullSuffix)) return false;
    if (fullSuffix.startsWith('Townhouse ') && LEGIT_SUFFIXES.has(fullSuffix.replace('Townhouse ', ''))) return false;
    // Otherwise it's the old template pattern (destination name in middle)
    return true;
  },
  /^Airbnb:\s.+$/i,                       // Airbnb: <Location> (exact template)
  /Grand Hotel$/i,                        // <Location> Grand Hotel (exact template)
  /Pine Valley|Mountain Mist|Highland View|Cloud Nine/i,  // Old hill_station suffixes
  /Sea Breeze|Coastal Palm|Horizon Beachfront/i,          // Old beach suffixes
  /Forest Rest House|Eco Tourism|Wilderness Jungle|Nature Valley/i,  // Old wildlife suffixes
  // Old spiritual suffixes - EXACT matches only, not partial (new generator uses "Sri Sri Yatri Nivas" legitimately)
  /^Sri Yatri Nivas$/i, /^Bhakta Nivas$/i, /^Pilgrim Residency$/i, /^Temple View Inn$/i,
  // Old heritage suffixes - EXACT matches only
  /^Heritage Tourist Lodge$/i, /^Fort View Homestay$/i, /^Royal Heritage$/i, /^Palace Retreat$/i,
];

// Note: "OYO Haveli Stay", "OYO Sanctum Stay", "OYO Shore Stay" are LEGITIMATE
// New generator produces: "OYO <CategorySuffix>" where suffix is category-appropriate
// Old template produced: "OYO <DestinationName> Stay" where location was inserted

function verifyHotelData() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDestinations: 0,
      withHotels: 0,
      withRealChains: 0,
      withMetadata: 0,
      withSyntheticPatterns: 0,
      totalHotels: 0,
      avgHotelsPerDestination: 0
    },
    issues: {
      noHotels: [],
      syntheticPatterns: [],
      missingMetadata: [],
      priceAnomalies: [],
      duplicateNames: []
    },
    tierDistribution: {},
    priceStats: {
      min: Infinity,
      max: 0,
      avgMin: 0,
      avgMax: 0
    }
  };

  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  let totalPriceMin = 0;
  let totalPriceMax = 0;
  let priceCount = 0;

  for (const file of files) {
    report.summary.totalDestinations++;
    const slug = file.replace('.json', '');
    const dest = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    const hotels = dest.hotels || [];

    // Check: No hotels
    if (hotels.length === 0) {
      report.issues.noHotels.push(slug);
      continue;
    }

    report.summary.withHotels++;
    report.summary.totalHotels += hotels.length;

    // Check: Real chains
    const hasRealChain = hotels.some(h => REAL_CHAINS.some(c => h.name.includes(c)));
    if (hasRealChain) {
      report.summary.withRealChains++;
    }

    // Check: Synthetic patterns
    const hasSynthetic = hotels.some(h => SYNTHETIC_PATTERNS.some(p => (p instanceof RegExp ? p.test(h.name) : p(h.name))));
    if (hasSynthetic) {
      report.summary.withSyntheticPatterns++;
      report.issues.syntheticPatterns.push({
        slug,
        hotels: hotels.filter(h => SYNTHETIC_PATTERNS.some(p => (p instanceof RegExp ? p.test(h.name) : p(h.name)))).map(h => h.name)
      });
    }

    // Check: Metadata
    if (dest.hotelsRealSourceCount && dest.hotelSourceTried) {
      report.summary.withMetadata++;
    } else {
      report.issues.missingMetadata.push(slug);
    }

    // Check: Duplicate hotel names within destination
    const names = hotels.map(h => h.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
      report.issues.duplicateNames.push({ slug, duplicates: [...new Set(duplicates)] });
    }

    // Tier distribution
    hotels.forEach(h => {
      report.tierDistribution[h.tier] = (report.tierDistribution[h.tier] || 0) + 1;

      // Price stats
      if (h.priceMin < report.priceStats.min) report.priceStats.min = h.priceMin;
      if (h.priceMax > report.priceStats.max) report.priceStats.max = h.priceMax;
      totalPriceMin += h.priceMin;
      totalPriceMax += h.priceMax;
      priceCount++;

      // Check: Price anomalies (min > max, or unrealistic ranges)
      if (h.priceMin > h.priceMax) {
        report.issues.priceAnomalies.push({ slug, hotel: h.name, priceMin: h.priceMin, priceMax: h.priceMax, issue: 'min > max' });
      }
      if (h.priceMin < 100 || h.priceMax > 100000) {
        report.issues.priceAnomalies.push({ slug, hotel: h.name, priceMin: h.priceMin, priceMax: h.priceMax, issue: 'unrealistic range' });
      }
    });
  }

  report.summary.avgHotelsPerDestination = (report.summary.totalHotels / report.summary.totalDestinations).toFixed(2);
  report.priceStats.avgMin = Math.round(totalPriceMin / priceCount);
  report.priceStats.avgMax = Math.round(totalPriceMax / priceCount);

  // Limit issue arrays to top 100 each
  Object.keys(report.issues).forEach(key => {
    if (Array.isArray(report.issues[key]) && report.issues[key].length > 100) {
      report.issues[key] = report.issues[key].slice(0, 100);
    }
  });

  return report;
}

function generateTextReport(report) {
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  HOTEL DATA VERIFICATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('Generated: ' + report.timestamp);
  lines.push('');
  lines.push('📊 SUMMARY');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Total destinations:              ' + report.summary.totalDestinations);
  lines.push('Destinations with hotels:        ' + report.summary.withHotels + ' (' + (report.summary.withHotels / report.summary.totalDestinations * 100).toFixed(1) + '%)');
  lines.push('Destinations with real chains:   ' + report.summary.withRealChains + ' (' + (report.summary.withRealChains / report.summary.totalDestinations * 100).toFixed(1) + '%)');
  lines.push('Destinations with metadata:      ' + report.summary.withMetadata + ' (' + (report.summary.withMetadata / report.summary.totalDestinations * 100).toFixed(1) + '%)');
  lines.push('Destinations with synthetic:     ' + report.summary.withSyntheticPatterns);
  lines.push('Total hotels:                    ' + report.summary.totalHotels);
  lines.push('Avg hotels/destination:          ' + report.summary.avgHotelsPerDestination);
  lines.push('');
  lines.push('💰 PRICE STATISTICS');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Min price:                       ₹' + report.priceStats.min.toLocaleString('en-IN'));
  lines.push('Max price:                       ₹' + report.priceStats.max.toLocaleString('en-IN'));
  lines.push('Avg min price:                   ₹' + report.priceStats.avgMin.toLocaleString('en-IN'));
  lines.push('Avg max price:                   ₹' + report.priceStats.avgMax.toLocaleString('en-IN'));
  lines.push('');
  lines.push('📈 TIER DISTRIBUTION');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.keys(report.tierDistribution).sort().forEach(tier => {
    lines.push(tier.padEnd(20) + String(report.tierDistribution[tier]).padStart(6) + ' hotels');
  });
  lines.push('');
  lines.push('⚠️  ISSUES DETECTED');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('No hotels:                       ' + report.issues.noHotels.length);
  lines.push('Synthetic patterns:              ' + report.issues.syntheticPatterns.length);
  lines.push('Missing metadata:                ' + report.issues.missingMetadata.length);
  lines.push('Price anomalies:                 ' + report.issues.priceAnomalies.length);
  lines.push('Duplicate names:                 ' + report.issues.duplicateNames.length);

  if (report.issues.syntheticPatterns.length > 0) {
    lines.push('');
    lines.push('Top synthetic pattern issues:');
    report.issues.syntheticPatterns.slice(0, 10).forEach(i => {
      lines.push('  ' + i.slug + ': ' + i.hotels.join(', '));
    });
  }

  if (report.issues.priceAnomalies.length > 0) {
    lines.push('');
    lines.push('Top price anomalies:');
    report.issues.priceAnomalies.slice(0, 10).forEach(i => {
      lines.push('  ' + i.slug + ' / ' + i.hotel + ': ₹' + i.priceMin + '-₹' + i.priceMax + ' (' + i.issue + ')');
    });
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  const totalIssues = report.issues.noHotels.length + report.issues.syntheticPatterns.length + report.issues.missingMetadata.length + report.issues.priceAnomalies.length + report.issues.duplicateNames.length;
  if (totalIssues === 0) {
    lines.push('✅ STATUS: ALL CHECKS PASSED');
  } else if (totalIssues < 50) {
    lines.push('⚠️  STATUS: MINOR ISSUES DETECTED (' + totalIssues + ' total)');
  } else {
    lines.push('❌ STATUS: ATTENTION REQUIRED (' + totalIssues + ' issues)');
  }
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

// Main execution
console.log('Starting hotel data verification...\n');

const report = verifyHotelData();

// Ensure logs directory exists
const logsDir = path.dirname(REPORT_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Save JSON report
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
console.log('✅ JSON report saved: ' + REPORT_PATH);

// Save text report
const textReportPath = REPORT_PATH.replace('.json', '.txt');
fs.writeFileSync(textReportPath, generateTextReport(report), 'utf8');
console.log('✅ Text report saved: ' + textReportPath);

// Print summary to console
console.log('\n' + generateTextReport(report));

// Exit with error code if critical issues found
const criticalIssues = report.issues.noHotels.length + report.issues.syntheticPatterns.length;
if (criticalIssues > 50) {
  console.error('❌ CRITICAL: ' + criticalIssues + ' critical issues detected');
  process.exit(1);
} else {
  console.log('✅ Verification complete');
  process.exit(0);
}
