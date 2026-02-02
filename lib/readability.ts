/**
 * Zero-dependency Flesch-Kincaid readability scoring.
 *
 * Flesch Reading Ease formula:
 *   206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
 *
 * Score ranges (0-100, higher = easier to read):
 *   90-100  5th grade   Very easy
 *   80-89   6th grade   Easy
 *   70-79   7th grade   Fairly easy
 *   60-69   8th-9th     Standard
 *   50-59   10th-12th   Fairly difficult
 *   30-49   College     Difficult
 *   0-29    Graduate    Very difficult
 */

const SENTENCE_DELIMITERS = /[.!?]+/g;
const WORD_PATTERN = /[a-zA-Z]+/g;

/**
 * Count syllables in a single English word using a heuristic approach.
 * Not perfect, but close enough for readability scoring.
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return 1;

  // Common suffixes that don't add syllables
  let processed = w;
  if (processed.endsWith("e") && !processed.endsWith("le")) {
    processed = processed.slice(0, -1);
  }

  // Count vowel groups
  const vowelGroups = processed.match(/[aeiouy]+/gi);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for common patterns
  if (w.endsWith("le") && w.length > 2 && !/[aeiouy]/.test(w[w.length - 3])) {
    count++;
  }
  if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded")) {
    count = Math.max(1, count - 1);
  }
  if (w.endsWith("es") && !w.endsWith("ses") && !w.endsWith("zes")) {
    count = Math.max(1, count - 1);
  }

  return Math.max(1, count);
}

function countWords(text: string): number {
  const matches = text.match(WORD_PATTERN);
  return matches ? matches.length : 0;
}

function countSentences(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").trim();
  const sentences = stripped
    .split(SENTENCE_DELIMITERS)
    .filter((s) => s.trim().length > 0);
  return Math.max(1, sentences.length);
}

function countTotalSyllables(text: string): number {
  const words = text.match(WORD_PATTERN) || [];
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
}

/**
 * Calculate Flesch Reading Ease score and related metrics.
 * Returns a score from 0-100 (clamped), where higher = easier.
 */
export function calculateReadability(text: string): ReadabilityMetrics {
  // Strip HTML tags for analysis
  const plainText = text.replace(/<[^>]*>/g, " ");

  const wordCount = countWords(plainText);
  const sentenceCount = countSentences(plainText);
  const syllableCount = countTotalSyllables(plainText);

  if (wordCount === 0 || sentenceCount === 0) {
    return {
      fleschReadingEase: 0,
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
    };
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  const rawScore =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Clamp to 0-100
  const fleschReadingEase = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  return {
    fleschReadingEase,
    wordCount,
    sentenceCount,
    syllableCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

/**
 * Calculate keyword density as a percentage.
 * Counts exact keyword phrase occurrences (case-insensitive).
 */
export function calculateKeywordDensity(
  text: string,
  keyword: string
): number {
  const plainText = text.replace(/<[^>]*>/g, " ").toLowerCase();
  const kw = keyword.toLowerCase().trim();
  const totalWords = countWords(plainText);

  if (totalWords === 0 || !kw) return 0;

  // Count keyword occurrences (the keyword may be multi-word)
  const kwWords = kw.split(/\s+/).length;
  const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const matches = plainText.match(regex);
  const occurrences = matches ? matches.length : 0;

  // Density = (keyword occurrences * words_in_keyword / total_words) * 100
  return Math.round(((occurrences * kwWords) / totalWords) * 1000) / 10;
}
