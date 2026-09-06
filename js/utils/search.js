/**
 * search.js — High-performance, space-agnostic, typo-tolerant search and ranking.
 *
 * Supports:
 * 1. Space-less search (e.g., "tajmahal" -> "Taj Mahal", "tamilnadu" -> "Tamil Nadu", "mehtabbagh" -> "Mehtab Bagh")
 * 2. Mixed multi-word search (e.g., "tajmahal agra", "ooty tamilnadu", "brihadeeswarar thanjavur")
 * 3. Compound joined search (e.g., "ootytamilnadu", "tajmahaluttarpradesh", "agastheesvararkuzhaiyur")
 * 4. Punctuation & hyphen agnostic (e.g., "agastheesvarar-temple-kuzhaiyur", "st. mary's")
 * 5. Destination name, state, places (attractions), features, tags, and category matching
 * 6. Match-relevance scoring: exact title > slug > state > places > partial words
 */

export function cleanSearchText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeSearchWords(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Filter and sort destinations by search relevance.
 *
 * @param {Array<Object>} destinations - List of destination summary objects.
 * @param {string} query - Raw search query from input box or URL parameter.
 * @returns {Array<Object>} Ranked matching destinations.
 */
export function searchDestinations(destinations, query) {
  const rawQ = String(query || '').trim();
  if (!rawQ || !Array.isArray(destinations)) return destinations ? destinations.slice() : [];

  const qClean = cleanSearchText(rawQ);
  if (!qClean) return destinations.slice();

  const qWordsNorm = normalizeSearchWords(rawQ).split(/\s+/).filter(Boolean);
  const qWordsClean = qWordsNorm.map(cleanSearchText).filter(Boolean);

  const scoredAll = [];
  const scoredPartial = [];

  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i];
    const titleClean = cleanSearchText(d.title);
    const titleNorm = normalizeSearchWords(d.title);
    const slugClean = cleanSearchText(d.slug);
    const stateClean = cleanSearchText(d.state);
    const stateNorm = normalizeSearchWords(d.state);
    const regionClean = cleanSearchText(d.region);
    const typeClean = cleanSearchText(d.type);
    const shortClean = cleanSearchText(d.short);
    const placesClean = (d.places || []).map(cleanSearchText);
    const placesNorm = (d.places || []).map(normalizeSearchWords);
    const featuresClean = (d.features || []).map(cleanSearchText);

    // 1. Direct single-field or substring match without spaces
    const directNoSpaceMatch = qClean.length >= 2 && (
      titleClean.includes(qClean) ||
      slugClean.includes(qClean) ||
      stateClean.includes(qClean) ||
      regionClean.includes(qClean) ||
      typeClean.includes(qClean) ||
      placesClean.some(function (p) { return p.includes(qClean); })
    );

    // 2. Direct title + state combination (e.g., "ootytamilnadu", "tajmahaluttarpradesh")
    let directComboMatch = false;
    if (!directNoSpaceMatch && qClean.length >= 4) {
      if ((titleClean + stateClean).includes(qClean) || (stateClean + titleClean).includes(qClean)) {
        directComboMatch = true;
      }
    }

    // 3. Compound token coverage (e.g. "agastheesvararkuzhaiyur")
    let compoundMatch = false;
    if (!directNoSpaceMatch && !directComboMatch && qClean.length >= 6) {
      const titleTokens = titleNorm.split(' ').filter(function (w) { return w.length >= 3; });
      const hasTitleToken = titleTokens.some(function (t) { return qClean.includes(t); });
      if (hasTitleToken) {
        const allTokens = Array.from(new Set([
          ...titleTokens,
          ...stateNorm.split(' ').filter(function (w) { return w.length >= 3; }),
          ...placesNorm.flatMap(function (p) { return p.split(' '); }).filter(function (w) { return w.length >= 3; })
        ]));
        const matchedTokens = allTokens.filter(function (t) { return qClean.includes(t); });
        const covered = matchedTokens.reduce(function (acc, t) { return acc + t.length; }, 0);
        if (matchedTokens.length >= 2 && covered >= qClean.length * 0.85) {
          compoundMatch = true;
        }
      }
    }

    // 4. Word-by-word matching (each word matches either normalized or no-space in any field)
    let wordsMatchedCount = 0;
    if (qWordsClean.length > 0) {
      qWordsClean.forEach(function (wn, idx) {
        const w = qWordsNorm[idx];
        const matched = titleClean.includes(wn) ||
          titleNorm.includes(w) ||
          slugClean.includes(wn) ||
          stateClean.includes(wn) ||
          stateNorm.includes(w) ||
          regionClean.includes(wn) ||
          typeClean.includes(wn) ||
          placesClean.some(function (p) { return p.includes(wn); }) ||
          placesNorm.some(function (p) { return p.includes(w); }) ||
          featuresClean.some(function (f) { return f.includes(wn); }) ||
          shortClean.includes(wn);
        if (matched) wordsMatchedCount++;
      });
    }

    const allWordsMatch = qWordsClean.length > 0 && wordsMatchedCount === qWordsClean.length;

    if (directNoSpaceMatch || directComboMatch || compoundMatch || allWordsMatch) {
      let score = 0;

      // Exact title match gets highest priority
      if (titleClean === qClean) score += 3000;
      else if (titleClean.startsWith(qClean)) score += 1500;
      else if (titleClean.includes(qClean)) score += 800;

      // Exact slug match
      if (slugClean === qClean) score += 2500;
      else if (slugClean.startsWith(qClean)) score += 1200;
      else if (slugClean.includes(qClean)) score += 600;

      // Exact state match
      if (stateClean === qClean) score += 700;
      else if (stateClean.startsWith(qClean)) score += 350;

      // Place exact match
      if (placesClean.includes(qClean)) score += 600;
      else if (placesClean.some(function (p) { return p.startsWith(qClean); })) score += 300;
      else if (placesClean.some(function (p) { return p.includes(qClean); })) score += 180;

      // Multi-word scoring
      qWordsClean.forEach(function (wn) {
        if (!wn) return;
        if (titleClean === wn) score += 400;
        else if (titleClean.startsWith(wn)) score += 250;
        else if (titleClean.includes(wn)) score += 140;

        if (stateClean === wn) score += 200;
        else if (stateClean.includes(wn)) score += 100;

        if (placesClean.some(function (p) { return p === wn; })) score += 160;
        else if (placesClean.some(function (p) { return p.includes(wn); })) score += 90;
      });

      // Tie breaker for rating & reviews
      score += Math.min((d.rating || 0) * 2, 10);
      score += Math.min((d.reviewCount || 0) / 5000, 10);

      scoredAll.push({ d: d, score: score });
    } else if (wordsMatchedCount > 0) {
      // Partial match for fallback when words are disjoint
      let partialScore = wordsMatchedCount * 100;
      qWordsClean.forEach(function (wn) {
        if (titleClean === wn) partialScore += 1000;
        else if (titleClean.startsWith(wn)) partialScore += 500;
        else if (titleClean.includes(wn)) partialScore += 150;

        if (stateClean === wn) partialScore += 200;
        else if (stateClean.includes(wn)) partialScore += 80;

        if (placesClean.some(function (p) { return p.includes(wn); })) partialScore += 60;
      });
      partialScore += Math.min((d.rating || 0) * 2, 10);
      scoredPartial.push({ d: d, score: partialScore });
    }
  }

  if (scoredAll.length > 0) {
    scoredAll.sort(function (a, b) { return b.score - a.score; });
    return scoredAll.map(function (m) { return m.d; });
  }

  if (scoredPartial.length > 0) {
    scoredPartial.sort(function (a, b) { return b.score - a.score; });
    return scoredPartial.map(function (m) { return m.d; });
  }

  return [];
}
