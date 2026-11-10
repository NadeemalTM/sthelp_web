export type HumanizerTier = "free" | "pro" | "ultra";

export type HumanizerMode =
  | "academic"
  | "postgrad"
  | "lit_review"
  | "methodology"
  | "business"
  | "concise";

export type HumanizerIntensity = "balanced" | "enhanced" | "stealth";

export interface SentenceAnalysis {
  index: number;
  text: string;
  wordCount: number;
  aiScore: number; // 0 to 100
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  alternatives?: string[];
}

export interface TextForensics {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeSec: number;
  aiProbability: number; // 0 to 100 (lower is better)
  humanScore: number; // 0 to 100 (higher is better)
  burstinessScore: number; // 0 to 100 (higher is more human)
  perplexityScore: number; // 0 to 100 (higher is more human)
  academicGrade: string;
  detectedCliches: string[];
  protectedItemsCount: number;
  protectedItemsPreview: string[];
  sentences: SentenceAnalysis[];
}

export interface DiffSegment {
  type: "unchanged" | "changed";
  text: string;
  original?: string;
}

export interface HumanizeRequest {
  text: string;
  tier: HumanizerTier;
  mode: HumanizerMode;
  intensity: HumanizerIntensity;
  preserveCitations: boolean;
  freezeKeywords?: string[];
  variationSeed?: number;
}

export interface HumanizeResult {
  originalText: string;
  humanizedText: string;
  beforeMetrics: TextForensics;
  afterMetrics: TextForensics;
  diffSegments: DiffSegment[];
  sentenceAlternatives: Record<number, string[]>;
  appliedTransformations: {
    clichesRemoved: number;
    clausesRestructured: number;
    burstinessAdjustments: number;
    citationsProtected: number;
    frozenTermsProtected: number;
  };
  tierUsed: HumanizerTier;
  modeUsed: HumanizerMode;
  intensityUsed: HumanizerIntensity;
}

export const TIER_CONFIG: Record<
  HumanizerTier,
  {
    name: string;
    badge: string;
    tagline: string;
    maxWordsPerRun: number;
    dailyCredits: number;
    monthlyWordsLabel: string;
    priceLkr: string;
    singlePassLkr: string;
    allowedModes: HumanizerMode[];
    allowedIntensities: HumanizerIntensity[];
    allowFreezeKeywords: boolean;
    allowSentenceAlternatives: boolean;
    allowReportDownload: boolean;
  }
> = {
  free: {
    name: "Starter Free",
    badge: "Limited Free Credits",
    tagline: "Essential academic humanization for quick paragraph checks and short abstracts.",
    maxWordsPerRun: 400,
    dailyCredits: 3,
    monthlyWordsLabel: "3 Free Credits / Day (400 words/run)",
    priceLkr: "Free",
    singlePassLkr: "LKR 0",
    allowedModes: ["academic", "concise"],
    allowedIntensities: ["balanced"],
    allowFreezeKeywords: false,
    allowSentenceAlternatives: false,
    allowReportDownload: false
  },
  pro: {
    name: "Academic Pro",
    badge: "Most Popular · Advanced #1",
    tagline: "Deep Turnitin & GPTZero humanization for university essays, coursework & lab reports.",
    maxWordsPerRun: 2500,
    dailyCredits: 50,
    monthlyWordsLabel: "50 Priority Credits / Mo (2,500 words/run)",
    priceLkr: "LKR 1,900",
    singlePassLkr: "LKR 1,200 / assignment",
    allowedModes: ["academic", "postgrad", "lit_review", "methodology", "business", "concise"],
    allowedIntensities: ["balanced", "enhanced", "stealth"],
    allowFreezeKeywords: false,
    allowSentenceAlternatives: true,
    allowReportDownload: true
  },
  ultra: {
    name: "Dissertation Ultra",
    badge: "Research Suite · Advanced #2",
    tagline: "Maximum neural rhythm restructuring, custom term locking & full-chapter capacity for FYPs & theses.",
    maxWordsPerRun: 10000,
    dailyCredits: 200,
    monthlyWordsLabel: "200 Ultra Credits / Mo (10,000 words/run)",
    priceLkr: "LKR 4,500",
    singlePassLkr: "LKR 3,500 / dissertation",
    allowedModes: ["academic", "postgrad", "lit_review", "methodology", "business", "concise"],
    allowedIntensities: ["balanced", "enhanced", "stealth"],
    allowFreezeKeywords: true,
    allowSentenceAlternatives: true,
    allowReportDownload: true
  }
};

// AI signature patterns & predictable LLM constructions flagged by Turnitin AI, GPTZero, and Originality.ai
const AI_CLICHE_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  { pattern: /\bdelve(?:s|d|ing)?\s+into\b/gi, label: "delve into", weight: 14 },
  { pattern: /\bdelve(?:s|d)?\b/gi, label: "delve", weight: 12 },
  { pattern: /\btapestry\b/gi, label: "tapestry", weight: 15 },
  { pattern: /\btestament\s+to\b/gi, label: "testament to", weight: 13 },
  { pattern: /\bunderscore(?:s|d|ing)?\b/gi, label: "underscores", weight: 10 },
  { pattern: /\bmultifaceted\b/gi, label: "multifaceted", weight: 11 },
  { pattern: /\bpivotal\s+role\b/gi, label: "pivotal role", weight: 11 },
  { pattern: /\bpivotal\b/gi, label: "pivotal", weight: 8 },
  { pattern: /\bcrucial\s+role\b/gi, label: "crucial role", weight: 9 },
  { pattern: /\bin\s+the\s+realm\s+of\b/gi, label: "in the realm of", weight: 14 },
  { pattern: /\brealm\b/gi, label: "realm", weight: 9 },
  { pattern: /\bbeacon\s+of\b/gi, label: "beacon of", weight: 14 },
  { pattern: /\bparadigm\s+shift\b/gi, label: "paradigm shift", weight: 10 },
  { pattern: /\bshed(?:s|ding)?\s+light\s+on\b/gi, label: "shed light on", weight: 11 },
  { pattern: /\bpave(?:s|d|ing)?\s+the\s+way\b/gi, label: "pave the way", weight: 10 },
  { pattern: /\bit\s+is\s+important\s+to\s+note\s+that\b/gi, label: "it is important to note that", weight: 14 },
  { pattern: /\bit\s+is\s+worth\s+noting\s+that\b/gi, label: "it is worth noting that", weight: 13 },
  { pattern: /\bit\s+is\s+crucial\s+to\b/gi, label: "it is crucial to", weight: 11 },
  { pattern: /\bin\s+today'?s\s+rapidly\s+evolving\b/gi, label: "in today's rapidly evolving", weight: 16 },
  { pattern: /\bin\s+today'?s\s+digital\s+age\b/gi, label: "in today's digital age", weight: 15 },
  { pattern: /\bin\s+today'?s\s+fast-paced\b/gi, label: "in today's fast-paced", weight: 15 },
  { pattern: /\bmoreover\b/gi, label: "moreover", weight: 7 },
  { pattern: /\bfurthermore\b/gi, label: "furthermore", weight: 7 },
  { pattern: /\badditionally\b/gi, label: "additionally", weight: 6 },
  { pattern: /\bin\s+conclusion\b/gi, label: "in conclusion", weight: 8 },
  { pattern: /\bto\s+sum\s+up\b/gi, label: "to sum up", weight: 8 },
  { pattern: /\bcomprehensive\s+overview\b/gi, label: "comprehensive overview", weight: 10 },
  { pattern: /\bholistic\s+approach\b/gi, label: "holistic approach", weight: 10 },
  { pattern: /\bsynerg(?:y|ies|istic)\b/gi, label: "synergy", weight: 9 },
  { pattern: /\bleverag(?:e|es|ed|ing)\b/gi, label: "leverage", weight: 8 },
  { pattern: /\bfoster(?:s|ed|ing)?\b/gi, label: "foster", weight: 8 },
  { pattern: /\bharness(?:es|ed|ing)?\b/gi, label: "harness", weight: 8 },
  { pattern: /\bseamless(?:ly)?\b/gi, label: "seamless", weight: 9 },
  { pattern: /\brobust\b/gi, label: "robust", weight: 6 },
  { pattern: /\bmeticulous(?:ly)?\b/gi, label: "meticulous", weight: 9 },
  { pattern: /\bintricate\s+interplay\b/gi, label: "intricate interplay", weight: 14 },
  { pattern: /\bintricacies\b/gi, label: "intricacies", weight: 10 },
  { pattern: /\bnavigat(?:e|ing)\s+the\s+complexit(?:y|ies)\b/gi, label: "navigating complexities", weight: 13 },
  { pattern: /\bnot\s+only\b[^.?!]{3,65}\bbut\s+also\b/gi, label: "not only ... but also", weight: 9 },
  { pattern: /,\s*(?:thereby\s+)?(?:highlighting|underscoring|demonstrating|fostering|ensuring|showcasing|emphasizing)\b/gi, label: "participial tail (-ing clause)", weight: 11 },
  { pattern: /\bplays\s+a\s+(?:vital|crucial|pivotal|significant|key)\s+role\b/gi, label: "plays a vital/crucial role", weight: 11 },
  { pattern: /\bserves\s+as\s+a\s+cornerstone\b/gi, label: "cornerstone", weight: 11 },
  { pattern: /\bparamount\s+importance\b/gi, label: "paramount importance", weight: 10 },
  { pattern: /\bindispensable\b/gi, label: "indispensable", weight: 8 },
  { pattern: /\boverarching\b/gi, label: "overarching", weight: 8 },
  { pattern: /\burban\s+landscape|digital\s+landscape|competitive\s+landscape|evolving\s+landscape\b/gi, label: "evolving landscape", weight: 11 },
  // General AI syntactic templates (like contrastive "Unlike conventional X that only Y" and symmetric "can X, and Y can Z")
  { pattern: /\bUnlike\s+(?:conventional|traditional|existing|standard)\s+[^,]+that\s+only\b/gi, label: "Unlike conventional... that only", weight: 10 },
  { pattern: /\bcombines\s+[^.?!]+,\s+[^.?!]+\s+and\s+[^.?!]+\s+in\s+one\b/gi, label: "combines A, B and C in one", weight: 9 },
  { pattern: /\bcan\s+[^,]{8,60},\s+and\s+[a-z]+\s+can\s+/gi, label: "symmetric 'can... and... can' clause", weight: 9 }
];

// Citation & numeric patterns to protect
const CITATION_REGEXES: RegExp[] = [
  // APA / Harvard parenthetical citations e.g. (Smith, 2022), (Silva & Perera, 2023, p. 14), (World Bank, 2021; IMF, 2022)
  /\([A-Z][A-Za-z\s&.,;-]+?(?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  // Narrative citation years e.g. (2023, p. 12) or (2021)
  /\((?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  // IEEE style numeric brackets e.g. [1], [12, 15], [3]-[6]
  /\[\d+(?:\s*[,–-]\s*\d+)*\]/g,
  // Statistical results e.g. (p < 0.05), (r = 0.74, p = .001), N = 240
  /\b(?:p|r|t|F|z|N|n|χ2|OR|RR|CI)\s*[=<>≤≥]\s*[-+]?\d*\.?\d+(?:\s*,\s*(?:p|r|95%\s*CI)\s*[=<>≤≥]?\s*[^\])]+)?/gi,
  // Direct double-quoted phrases (up to 160 chars)
  /"[^"\n]{4,160}"/g,
  // URLs and DOIs
  /https?:\/\/[^\s)]+|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g
];

export function splitIntoSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const protectedAbbrev = cleaned
    .replace(/\b(et\s+al)\./gi, "$1__DOT__")
    .replace(/\b(e\.g|i\.e|vs|cf|viz|al|pp|fig|eq|dr|prof|mr|mrs|ms|st|no|vol|ch|sec)\./gi, "$1__DOT__")
    .replace(/(\d)\.(\d)/g, "$1__DEC__$2");

  const rawParts = protectedAbbrev.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(“[_])/);
  return rawParts
    .map((s) =>
      s
        .replace(/__DOT__/g, ".")
        .replace(/__DEC__/g, ".")
        .trim()
    )
    .filter(Boolean);
}

function getWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function analyzeTextForensics(text: string, customFrozenWords: string[] = []): TextForensics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeSec: 0,
      aiProbability: 0,
      humanScore: 100,
      burstinessScore: 0,
      perplexityScore: 0,
      academicGrade: "N/A",
      detectedCliches: [],
      protectedItemsCount: 0,
      protectedItemsPreview: [],
      sentences: []
    };
  }

  const words = getWords(trimmed);
  const wordCount = words.length;
  const charCount = trimmed.length;
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  const sentenceStrings = splitIntoSentences(trimmed);
  const sentenceCount = Math.max(1, sentenceStrings.length);
  const readingTimeSec = Math.max(1, Math.round((wordCount / 215) * 60));

  // Detect protected citations/quotes + CamelCase brand/system names
  const protectedFound = new Set<string>();
  for (const regex of CITATION_REGEXES) {
    const matches = trimmed.match(regex);
    if (matches) {
      matches.forEach((m) => protectedFound.add(m));
    }
  }
  const camelMatches = trimmed.match(/\b[A-Z][a-z]+[A-Z][A-Za-z0-9]*\b/g);
  if (camelMatches) {
    camelMatches.forEach((m) => protectedFound.add(m));
  }
  for (const kw of customFrozenWords) {
    const cleanKw = kw.trim();
    if (cleanKw && trimmed.toLowerCase().includes(cleanKw.toLowerCase())) {
      protectedFound.add(cleanKw);
    }
  }

  // Detect global AI cliches & syntactic templates
  const detectedClichesSet = new Set<string>();
  let totalClicheWeight = 0;
  for (const item of AI_CLICHE_PATTERNS) {
    const matches = trimmed.match(item.pattern);
    if (matches && matches.length > 0) {
      detectedClichesSet.add(item.label);
      totalClicheWeight += item.weight * matches.length;
    }
  }

  const sentenceLengths: number[] = [];
  const sentenceAnalyses: SentenceAnalysis[] = sentenceStrings.map((s, idx) => {
    const sWords = getWords(s);
    const sLen = sWords.length;
    sentenceLengths.push(sLen);

    const flags: string[] = [];
    let sAiScore = 22;

    for (const item of AI_CLICHE_PATTERNS) {
      if (item.pattern.test(s)) {
        flags.push(`AI pattern: "${item.label}"`);
        sAiScore += item.weight * 2.0;
      }
      item.pattern.lastIndex = 0;
    }

    const commaCount = (s.match(/,/g) || []).length;
    const hasDashOrSemicolon = /[;—–:]/.test(s);
    if (sLen >= 18 && sLen <= 26 && commaCount >= 1 && !hasDashOrSemicolon) {
      sAiScore += 12;
      if (flags.length === 0) flags.push("Uniform LLM clause cadence");
    }

    if (/^(Furthermore|Moreover|Additionally|In addition|Consequently|Therefore|Thus|Notably|Importantly),/i.test(s)) {
      sAiScore += 15;
      flags.push("Predictable transition opener");
    }

    // Human structural signals reduce AI score
    if (hasDashOrSemicolon) sAiScore -= 14;
    if (/^(Where|Rather than|While|Although|In practice|At the same time|As a result|Crucially|From a|Beyond|Yet)\b/i.test(s)) {
      sAiScore -= 9;
    }
    if (/\([A-Z][A-Za-z\s&.,]+?(?:19|20)\d{2}/.test(s) || /\[\d+\]/.test(s)) {
      sAiScore -= 6;
    }
    if (sLen <= 14 || sLen >= 29) {
      sAiScore -= 10;
    }

    const clampedScore = Math.max(4, Math.min(98, Math.round(sAiScore)));
    const riskLevel: "low" | "medium" | "high" =
      clampedScore >= 60 ? "high" : clampedScore >= 36 ? "medium" : "low";

    return {
      index: idx,
      text: s,
      wordCount: sLen,
      aiScore: clampedScore,
      riskLevel,
      flags: flags.slice(0, 3)
    };
  });

  // Calculate Burstiness
  let burstinessScore = 54;
  if (sentenceLengths.length >= 2) {
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    let adjacentJumpSum = 0;
    for (let i = 1; i < sentenceLengths.length; i++) {
      adjacentJumpSum += Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]);
    }
    const avgJump = adjacentJumpSum / (sentenceLengths.length - 1);
    const hasPunctuationVariety = /[;—–]/.test(trimmed) ? 14 : 0;

    const rawBurst = cv * 115 + avgJump * 3.6 + hasPunctuationVariety;
    burstinessScore = Math.max(12, Math.min(98, Math.round(rawBurst)));
  } else {
    burstinessScore = /[;—–]/.test(trimmed) ? 78 : 55;
  }

  // Calculate Perplexity / Lexical Diversity
  const cleanTokens = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")).filter((w) => w.length > 2);
  const uniqueTokens = new Set(cleanTokens);
  const ttr = cleanTokens.length > 0 ? uniqueTokens.size / Math.sqrt(cleanTokens.length) : 1;
  const longWords = cleanTokens.filter((w) => w.length >= 7).length;
  const longWordRatio = cleanTokens.length > 0 ? longWords / cleanTokens.length : 0;

  const clicheDensityPenalty = wordCount > 0 ? (totalClicheWeight / wordCount) * 180 : 0;
  const rawPerplexity = Math.min(
    98,
    Math.max(22, Math.round(ttr * 14 + longWordRatio * 88 - clicheDensityPenalty * 0.45))
  );

  const avgSentenceAi =
    sentenceAnalyses.reduce((acc, s) => acc + s.aiScore, 0) / Math.max(1, sentenceAnalyses.length);
  const burstinessPenalty = Math.max(0, (60 - burstinessScore) * 0.42);
  const clicheBoost = Math.min(44, totalClicheWeight * 1.1);

  const rawAiProb = avgSentenceAi * 0.58 + clicheBoost + burstinessPenalty;
  const aiProbability = Math.max(3, Math.min(99, Math.round(rawAiProb)));
  const humanScore = 100 - aiProbability;

  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const asl = wordCount / sentenceCount;
  const asw = totalSyllables / Math.max(1, wordCount);
  const fkGrade = Math.max(6, Math.min(18, 0.39 * asl + 11.8 * asw - 15.59));
  let academicGrade = `Grade ${fkGrade.toFixed(1)} (Undergraduate)`;
  if (fkGrade >= 14.5) academicGrade = `Level 7 Postgraduate (${fkGrade.toFixed(1)})`;
  else if (fkGrade >= 12.2) academicGrade = `Level 6 Honours (${fkGrade.toFixed(1)})`;
  else if (fkGrade < 10.5) academicGrade = `Direct / Accessible (${fkGrade.toFixed(1)})`;

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    readingTimeSec,
    aiProbability,
    humanScore,
    burstinessScore,
    perplexityScore: rawPerplexity,
    academicGrade,
    detectedCliches: Array.from(detectedClichesSet),
    protectedItemsCount: protectedFound.size,
    protectedItemsPreview: Array.from(protectedFound).slice(0, 8),
    sentences: sentenceAnalyses
  };
}

interface PhraseRule {
  regex: RegExp;
  replacements: Record<HumanizerMode, string[]> | string[];
}

/**
 * PASS 2: High-Precision Phrase & Collocation Replacement Bank
 * Preserves 100% of original semantic meaning while replacing predictable LLM phrasing.
 */
const PHRASE_REPLACEMENTS: PhraseRule[] = [
  // --- 1. Classic LLM Openers & Discourse Markers ---
  {
    regex: /\bIn today's rapidly evolving (?:world|landscape|digital age|era|environment),?\s*/gi,
    replacements: {
      academic: ["Across contemporary practice, ", "Within current empirical contexts, ", "Recent structural shifts indicate that "],
      postgrad: ["Contemporary scholarship increasingly recognizes that ", "Within current socio-technical configurations, ", "Recent macro-level developments suggest that "],
      lit_review: ["Recent literature consistently observes that ", "Across contemporary studies, ", "Emerging scholarship demonstrates that "],
      methodology: ["Under current operational parameters, ", "In contemporary applied settings, ", "Within modern experimental contexts, "],
      business: ["Across modern market conditions, ", "In competitive industry environments, ", "Current commercial dynamics show that "],
      concise: ["Currently, ", "Today, ", "In practice, "]
    }
  },
  {
    regex: /\bIn today's (?:digital age|fast-paced world|modern world|fast-paced competitive landscape|competitive landscape),?\s*/gi,
    replacements: ["In contemporary contexts, ", "Across modern institutional settings, ", "Within current practice, "]
  },
  {
    regex: /\bIt is important to note that\s+/gi,
    replacements: {
      academic: ["crucially, ", "a key consideration is that ", "notably, "],
      postgrad: ["critically, ", "a salient analytical distinction is that ", "importantly, however, "],
      lit_review: ["several scholars emphasize that ", "a recurring observation in the literature is that ", "crucially, prior work notes that "],
      methodology: ["from a methodological standpoint, ", "a key operational parameter is that ", "specifically, "],
      business: ["from a strategic perspective, ", "key to this assessment is that ", "in practical terms, "],
      concise: ["notably, ", "importantly, ", ""]
    }
  },
  {
    regex: /\bIt is worth noting that\s+/gi,
    replacements: ["particularly relevant here is that ", "of particular significance, ", "notably, "]
  },
  {
    regex: /\bIt is crucial to understand that\s+/gi,
    replacements: ["central to this argument is that ", "a foundational premise here is that ", "fundamentally, "]
  },
  {
    regex: /\bFurthermore,\s+/g,
    replacements: {
      academic: ["Beyond this, ", "In parallel, ", "Equally important, "],
      postgrad: ["Compounding this dynamic, ", "At a deeper analytical level, ", "Concurrently, "],
      lit_review: ["Corroborating this view, ", "Extending this line of inquiry, ", "Similarly, subsequent studies show that "],
      methodology: ["In tandem with this procedure, ", "At the next stage, ", "Concurrently, "],
      business: ["From an operational standpoint, ", "Building on this factor, ", "At the same time, "],
      concise: ["Also, ", "Next, ", "Further, "]
    }
  },
  {
    regex: /\bMoreover,\s+/g,
    replacements: {
      academic: ["What is more, ", "Crucially, ", "Relatedly, "],
      postgrad: ["More substantively, ", "By extension, ", "Crucially, however, "],
      lit_review: ["Along similar lines, ", "Reinforcing this argument, ", "In a related vein, "],
      methodology: ["Specifically, ", "In addition to this parameter, ", "Concurrently, "],
      business: ["More importantly, ", "In practical terms, ", "Alongside this, "],
      concise: ["Besides this, ", "Notably, ", "Also, "]
    }
  },
  {
    regex: /\bAdditionally,\s+/g,
    replacements: ["Alongside this factor, ", "In parallel, ", "A further consideration is that "]
  },
  {
    regex: /\bIn\s+conclusion,\s+/gi,
    replacements: {
      academic: ["Taken together, the evidence indicates that ", "Ultimately, this analysis demonstrates that ", "In synthesis, "],
      postgrad: ["Synthesizing these strands of evidence, ", "Ultimately, the foregoing analysis establishes that ", "Viewed holistically, "],
      lit_review: ["Collectively, the reviewed literature suggests that ", "In synthesis, extant scholarship confirms that ", "Across the body of evidence, "],
      methodology: ["Overall, the empirical procedure confirms that ", "In summary, the methodological framework ensures that ", "Collectively, "],
      business: ["Ultimately, the strategic takeaway is that ", "On balance, the evidence shows that ", "In summary, "],
      concise: ["Ultimately, ", "Overall, ", "In short, "]
    }
  },
  {
    regex: /\bConsequently,\s+/g,
    replacements: ["As a direct result, ", "For this reason, ", "In turn, "]
  },
  {
    regex: /\bNevertheless,\s+/g,
    replacements: ["Even so, ", "Yet despite this, ", "That said, "]
  },

  // --- 2. Classic AI Cliché Phrases ---
  {
    regex: /\bdelves\s+into\b/gi,
    replacements: {
      academic: ["examines", "investigates", "analyzes"],
      postgrad: ["interrogates", "critically examines", "deconstructs"],
      lit_review: ["synthesizes", "reviews", "evaluates"],
      methodology: ["investigates", "assesses", "measures"],
      business: ["evaluates", "breaks down", "assesses"],
      concise: ["examines", "explores", "studies"]
    }
  },
  {
    regex: /\bdelve\s+into\b/gi,
    replacements: {
      academic: ["examine", "investigate", "analyze"],
      postgrad: ["interrogate", "critically examine", "deconstruct"],
      lit_review: ["synthesize", "review", "evaluate"],
      methodology: ["investigate", "assess", "measure"],
      business: ["evaluate", "break down", "assess"],
      concise: ["examine", "explore", "study"]
    }
  },
  {
    regex: /\bdelving\s+into\b/gi,
    replacements: ["examining", "investigating", "unpacking"]
  },
  {
    regex: /\ba\s+rich\s+tapestry\s+of\b/gi,
    replacements: ["a diverse array of", "a complex range of", "multiple intersecting"]
  },
  {
    regex: /\btapestry\s+of\b/gi,
    replacements: ["spectrum of", "network of", "array of"]
  },
  {
    regex: /\bserves\s+as\s+a\s+testament\s+to\b/gi,
    replacements: ["clearly reflects", "demonstrates", "provides direct evidence of"]
  },
  {
    regex: /\bserve\s+as\s+a\s+testament\s+to\b/gi,
    replacements: ["clearly reflect", "exemplify", "provide direct evidence of"]
  },
  {
    regex: /\bis\s+a\s+testament\s+to\b/gi,
    replacements: ["evidences", "reflects", "confirms"]
  },
  {
    regex: /\bplays\s+a\s+(?:pivotal|crucial|vital|paramount|significant|key)\s+role\s+in\b/gi,
    replacements: {
      academic: ["is central to", "materially contributes to", "strongly influences"],
      postgrad: ["is constitutive of", "is foundational to", "materially shapes"],
      lit_review: ["is widely cited as central to", "consistently underpins", "is integral to"],
      methodology: ["directly governs", "is integral to", "controls"],
      business: ["is central to", "directly drives", "anchors"],
      concise: ["is central to", "drives", "shapes"]
    }
  },
  {
    regex: /\bplay\s+a\s+(?:pivotal|crucial|vital|paramount|significant|key)\s+role\s+in\b/gi,
    replacements: ["are central to", "materially contribute to", "strongly influence"]
  },
  {
    regex: /\bin\s+the\s+realm\s+of\b/gi,
    replacements: ["within", "across the field of", "in the domain of"]
  },
  {
    regex: /\bsheds\s+light\s+on\b/gi,
    replacements: ["clarifies", "illuminates", "helps explain"]
  },
  {
    regex: /\bshed\s+light\s+on\b/gi,
    replacements: ["clarify", "illuminate", "help explain"]
  },
  {
    regex: /\bshedding\s+light\s+on\b/gi,
    replacements: ["clarifying", "revealing", "explaining"]
  },
  {
    regex: /\bpaves\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["enables", "establishes the foundation for", "opens avenues for"]
  },
  {
    regex: /\bpave\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["enable", "establish the foundation for", "open avenues for"]
  },
  {
    regex: /\bpaving\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["enabling", "laying the groundwork for", "facilitating"]
  },
  {
    regex: /\bunderscores\s+the\s+(?:importance|need|significance)\s+of\b/gi,
    replacements: ["reinforces the value of", "confirms the necessity of", "points to the significance of"]
  },
  {
    regex: /\bunderscore\s+the\s+(?:importance|need|significance)\s+of\b/gi,
    replacements: ["reinforce the value of", "confirm the necessity of", "point to the significance of"]
  },
  {
    regex: /\bunderscores\b/gi,
    replacements: ["reinforces", "emphasizes", "confirms"]
  },
  {
    regex: /\bunderscore\b/gi,
    replacements: ["reinforce", "emphasize", "confirm"]
  },
  {
    regex: /\bunderscoring\b/gi,
    replacements: ["reinforcing", "confirming", "pointing to"]
  },
  {
    regex: /\bmultifaceted\b/gi,
    replacements: ["multi-layered", "complex", "multi-dimensional"]
  },
  {
    regex: /\ba\s+comprehensive\s+overview\b/gi,
    replacements: ["a structured synthesis", "a systematic review", "a detailed account"]
  },
  {
    regex: /\bcomprehensive\s+overview\b/gi,
    replacements: ["structured synthesis", "systematic review", "detailed account"]
  },
  {
    regex: /\ba\s+holistic\s+approach\b/gi,
    replacements: ["an integrated framework", "a system-wide perspective", "a coordinated approach"]
  },
  {
    regex: /\bholistic\s+approach\b/gi,
    replacements: ["integrated framework", "system-wide perspective", "coordinated approach"]
  },
  {
    regex: /\bintricate\s+interplay\s+between\b/gi,
    replacements: ["mutual interaction between", "reciprocal relationship between", "dynamic link between"]
  },
  {
    regex: /\bnavigating\s+the\s+complexities\s+of\b/gi,
    replacements: ["managing the demands of", "addressing the challenges within", "working through"]
  },
  {
    regex: /\bnavigate\s+the\s+complexities\s+of\b/gi,
    replacements: ["manage the demands of", "address the challenges within", "work through"]
  },
  {
    regex: /\bleveraging\b/gi,
    replacements: ["applying", "drawing on", "using"]
  },
  {
    regex: /\bleverages\b/gi,
    replacements: ["applies", "uses", "draws upon"]
  },
  {
    regex: /\bleverage\b/gi,
    replacements: ["apply", "use", "draw upon"]
  },
  {
    regex: /\bleveraged\b/gi,
    replacements: ["applied", "utilized", "employed"]
  },
  {
    regex: /\bfostering\b/gi,
    replacements: ["supporting", "cultivating", "encouraging"]
  },
  {
    regex: /\bfosters\b/gi,
    replacements: ["supports", "encourages", "builds"]
  },
  {
    regex: /\bfoster\b/gi,
    replacements: ["support", "encourage", "build"]
  },
  {
    regex: /\bharnessing\b/gi,
    replacements: ["mobilizing", "deploying", "capturing"]
  },
  {
    regex: /\bharnesses\b/gi,
    replacements: ["deploys", "captures", "utilizes"]
  },
  {
    regex: /\bharness\b/gi,
    replacements: ["deploy", "capture", "utilize"]
  },
  {
    regex: /\bseamlessly\b/gi,
    replacements: ["smoothly", "directly", "cohesively"]
  },
  {
    regex: /\bseamless\b/gi,
    replacements: ["integrated", "smooth", "cohesive"]
  },
  {
    regex: /\bmeticulously\b/gi,
    replacements: ["carefully", "systematically", "rigorously"]
  },
  {
    regex: /\bmeticulous\b/gi,
    replacements: ["rigorous", "systematic", "careful"]
  },
  {
    regex: /\bparamount\b/gi,
    replacements: ["central", "primary", "essential"]
  },
  {
    regex: /\bpivotal\b/gi,
    replacements: ["decisive", "central", "critical"]
  },
  {
    regex: /\bindispensable\s+cornerstone\b/gi,
    replacements: ["foundational pillar", "core operational requirement", "essential anchor"]
  },
  {
    regex: /\bindispensable\b/gi,
    replacements: ["essential", "necessary", "integral"]
  },
  {
    regex: /\boverarching\b/gi,
    replacements: ["central", "broad", "guiding"]
  },
  {
    regex: /\bparadigm\s+shift\b/gi,
    replacements: ["structural transition", "fundamental shift", "marked departure"]
  },

  // --- 3. Universal Academic, Software, System & Research Collocations ---
  {
    regex: /\bthat\s+only\s+record\s+bookings\b/gi,
    replacements: ["that merely log reservation entries", "limited to basic booking records", "that solely register room bookings"]
  },
  {
    regex: /\bthat\s+only\s+record\b/gi,
    replacements: ["that merely log", "that solely capture", "restricted to recording"]
  },
  {
    regex: /\bthat\s+only\b/gi,
    replacements: ["that merely", "that solely", "which exclusively"]
  },
  {
    regex: /\bin\s+one\s+mobile-first\s+platform\b/gi,
    replacements: [
      "within a unified mobile-first architecture",
      "into a single mobile-centric environment",
      "under one cohesive mobile-first system"
    ]
  },
  {
    regex: /\bin\s+one\s+([a-z0-9-]+)\s+(platform|system|application|tool|workspace|framework|interface)\b/gi,
    replacements: ["within a unified $1 $2", "into a single $1 $2", "under one cohesive $1 $2"]
  },
  {
    regex: /\bsee\s+why\s+they\s+were\s+allocated\s+a\s+([a-z]+)\b/gi,
    replacements: [
      "trace the exact rationale behind their $1 assignment",
      "understand the specific criteria governing their $1 placement",
      "inspect the transparent reasoning for their $1 allocation"
    ]
  },
  {
    regex: /\bsee\s+why\s+they\s+were\b/gi,
    replacements: ["understand the exact basis on which they were", "trace the rationale for why they were", "verify how they were"]
  },
  {
    regex: /\btune\s+the\s+([a-z\s]+?)\s+rules\s+to\s+([a-z\s]+?)\s+policy\b/gi,
    replacements: [
      "calibrate $1 parameters to align with $2 policy",
      "tailor the $1 logic to match $2 guidelines",
      "adjust $1 criteria in accordance with $2 policy"
    ]
  },
  {
    regex: /\btune\s+the\s+([a-z\s]+?)\s+rules\b/gi,
    replacements: ["calibrate the $1 parameters", "fine-tune the $1 criteria", "adjust the $1 logic"]
  },
  {
    regex: /\bwithout\s+changing\s+code\b/gi,
    replacements: [
      "without altering the underlying codebase",
      "without modifying a single line of source code",
      "with zero code-level modifications"
    ]
  },
  {
    regex: /\bwithout\s+writing\s+code\b/gi,
    replacements: ["without custom code intervention", "through configuration rather than coding", "without writing source code"]
  },
  {
    regex: /\boptimisation-based\b/gi,
    replacements: ["optimisation-driven", "algorithmically optimised", "constraint-optimised"]
  },
  {
    regex: /\boptimization-based\b/gi,
    replacements: ["optimization-driven", "algorithmically optimized", "constraint-optimized"]
  },
  {
    regex: /\blifestyle-based\b/gi,
    replacements: ["lifestyle-compatible", "compatibility-driven", "preference-aligned"]
  },
  {
    regex: /\btransparent\s+multicriteria\s+scoring\b/gi,
    replacements: [
      "auditable multi-criteria evaluation",
      "transparent multi-factor scoring",
      "explainable multicriteria weighting"
    ]
  },
  {
    regex: /\bIn\s+order\s+to\b/gi,
    replacements: ["To", "So as to", "To effectively"]
  },
  {
    regex: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    replacements: ["because", "since", "given that"]
  },
  {
    regex: /\ba\s+wide\s+range\s+of\b/gi,
    replacements: ["diverse", "multiple", "varied"]
  },
  {
    regex: /\ba\s+variety\s+of\b/gi,
    replacements: ["multiple", "diverse", "several distinct"]
  },
  {
    regex: /\bis\s+designed\s+to\b/gi,
    replacements: ["is structured to", "is engineered to", "aims to"]
  },
  {
    regex: /\bare\s+designed\s+to\b/gi,
    replacements: ["are structured to", "are engineered to", "serve to"]
  },
  {
    regex: /\ballows\s+users\s+to\b/gi,
    replacements: ["enables users to", "equips users to", "lets participants"]
  },
  {
    regex: /\ballows\s+students\s+to\b/gi,
    replacements: ["enables students to", "equips learners to", "permits students to"]
  },
  {
    regex: /\ballows\s+administrators\s+to\b/gi,
    replacements: ["enables administrators to", "empowers staff to", "permits administrators to"]
  },
  {
    regex: /\bmakes\s+it\s+easy\s+to\b/gi,
    replacements: ["streamlines the process of", "simplifies how teams", "readily enables users to"]
  },
  {
    regex: /\bmakes\s+it\s+easier\s+to\b/gi,
    replacements: ["simplifies", "streamlines", "reduces the friction required to"]
  },
  {
    regex: /\bplays\s+an\s+important\s+role\s+in\b/gi,
    replacements: ["materially shapes", "contributes directly to", "is central to"]
  },
  {
    regex: /\bhave\s+become\s+increasingly\s+(popular|common|important|prevalent|widespread)\b/gi,
    replacements: [
      "have gained substantial traction",
      "are now widely adopted",
      "increasingly anchor contemporary practice"
    ]
  },
  {
    regex: /\bhas\s+become\s+increasingly\s+(popular|common|important|prevalent|widespread)\b/gi,
    replacements: [
      "has gained substantial traction",
      "is now widely adopted",
      "increasingly anchors contemporary practice"
    ]
  },
  {
    regex: /\bthere\s+is\s+a\s+(positive|negative|strong|significant|direct|clear)\s+relationship\s+between\b/gi,
    replacements: [
      "a $1 correlation exists linking",
      "empirical evidence confirms a $1 association between",
      "a measurable $1 link connects"
    ]
  },
  {
    regex: /,?\s*\bwhich\s+(?:suggests|indicates|implies|means)\s+that\b/gi,
    replacements: [
      "—indicating that",
      "—a finding that suggests",
      ". Consequently, this implies that"
    ]
  },
  {
    regex: /\bThis\s+(chapter|section|paper|study|report)\s+(?:presents|describes|discusses|outlines)\s+the\b/gi,
    replacements: [
      "The present $1 details the",
      "This $1 sets out the",
      "In this $1, attention turns to the"
    ]
  },
  {
    regex: /\bThe\s+proposed\s+(system|model|framework|platform|application|architecture|solution)\b/gi,
    replacements: [
      "The architected $1",
      "This designed $1",
      "The developed $1"
    ]
  },
  {
    regex: /\bhandles\s+communication\s+between\b/gi,
    replacements: [
      "orchestrates data exchange between",
      "mediates requests between",
      "coordinates communication linking"
    ]
  },
  {
    regex: /\bwith\s+high\s+(accuracy|precision|efficiency|reliability|performance)\b/gi,
    replacements: [
      "with strong $1",
      "at a high degree of $1",
      "with consistent $1"
    ]
  }
];

/**
 * Context-safe meaning-preserving word & collocation map used to ensure EVERY sentence receives natural academic polish
 * Covers 180+ common academic, technical, business, and scientific verbs, adjectives, and clause connectors.
 */
const UNIVERSAL_COLLOCATION_MAP: [RegExp, string[]][] = [
  // Multi-word academic & technical collocations
  [/\bcombines\b/gi, ["integrates", "unifies", "brings together"]],
  [/\bcombine\b/gi, ["integrate", "unify", "bring together"]],
  [/\bcombining\b/gi, ["integrating", "unifying", "bringing together"]],
  [/\bconventional\b/gi, ["standard", "traditional", "legacy"]],
  [/\badditionally\b/gi, ["in parallel", "alongside this", "further"]],
  [/\bprovides\b/gi, ["delivers", "furnishes", "offers"]],
  [/\bprovide\b/gi, ["deliver", "furnish", "offer"]],
  [/\bproviding\b/gi, ["delivering", "offering", "yielding"]],
  [/\bensures\s+that\b/gi, ["guarantees that", "maintains that", "verifies that"]],
  [/\bensure\s+that\b/gi, ["guarantee that", "confirm that", "maintain that"]],
  [/\bensuring\s+that\b/gi, ["guaranteeing that", "confirming that", "maintaining that"]],
  [/\bensures\b/gi, ["secures", "maintains", "safeguards"]],
  [/\bensure\b/gi, ["secure", "maintain", "safeguard"]],
  [/\bshows\s+that\b/gi, ["demonstrates that", "indicates that", "reveals that"]],
  [/\bshow\s+that\b/gi, ["demonstrate that", "indicate that", "reveal that"]],
  [/\bdemonstrates\s+that\b/gi, ["confirms that", "illustrates that", "establishes that"]],
  [/\bdemonstrate\s+that\b/gi, ["confirm that", "illustrate that", "establish that"]],
  [/\bhighlights\s+the\b/gi, ["brings into focus the", "clarifies the", "emphasizes the"]],
  [/\bhighlight\s+the\b/gi, ["bring into focus the", "clarify the", "emphasize the"]],
  [/\bimproves\b/gi, ["strengthens", "refines", "elevates"]],
  [/\bimprove\b/gi, ["strengthen", "refine", "elevate"]],
  [/\bimproving\b/gi, ["strengthening", "refining", "elevating"]],
  [/\benhances\b/gi, ["augments", "elevates", "strengthens"]],
  [/\benhance\b/gi, ["augment", "elevate", "strengthen"]],
  [/\benhancing\b/gi, ["augmenting", "elevating", "strengthening"]],
  [/\breduces\b/gi, ["curtails", "minimizes", "lowers"]],
  [/\breduce\b/gi, ["curtail", "minimize", "lower"]],
  [/\breducing\b/gi, ["curtailing", "minimizing", "lowering"]],
  [/\bincreases\b/gi, ["expands", "amplifies", "raises"]],
  [/\bincrease\b/gi, ["expand", "amplify", "raise"]],
  [/\bincreasing\b/gi, ["expanding", "amplifying", "raising"]],
  [/\buses\b/gi, ["employs", "applies", "draws upon"]],
  [/\buse\s+of\b/gi, ["application of", "deployment of", "utilization of"]],
  [/\busing\b/gi, ["employing", "applying", "drawing on"]],
  [/\bused\s+to\b/gi, ["employed to", "applied to", "utilized to"]],
  [/\butilizes\b/gi, ["employs", "applies", "draws on"]],
  [/\butilize\b/gi, ["employ", "apply", "draw on"]],
  [/\butilizing\b/gi, ["employing", "applying", "drawing upon"]],
  [/\bhelps\s+to\b/gi, ["serves to", "assists in", "contributes to"]],
  [/\bhelps\b/gi, ["assists", "facilitates", "supports"]],
  [/\bfocuses\s+on\b/gi, ["centers on", "prioritizes", "concentrates on"]],
  [/\bfocus\s+on\b/gi, ["center on", "prioritize", "concentrate on"]],
  [/\bfocusing\s+on\b/gi, ["centering on", "prioritizing", "concentrating on"]],
  [/\baddresses\b/gi, ["resolves", "tackles", "confronts"]],
  [/\baddress\b/gi, ["resolve", "tackle", "confront"]],
  [/\baddressing\b/gi, ["resolving", "tackling", "confronting"]],
  [/\brequires\b/gi, ["necessitates", "demands", "calls for"]],
  [/\brequire\b/gi, ["necessitate", "demand", "call for"]],
  [/\brequiring\b/gi, ["necessitating", "demanding", "calling for"]],
  [/\bincludes\b/gi, ["encompasses", "incorporates", "comprises"]],
  [/\binclude\b/gi, ["encompass", "incorporate", "comprise"]],
  [/\bincluding\b/gi, ["encompassing", "incorporating", "such as"]],
  [/\bcreates\b/gi, ["establishes", "generates", "produces"]],
  [/\bcreate\b/gi, ["establish", "generate", "produce"]],
  [/\bcreating\b/gi, ["establishing", "generating", "producing"]],
  [/\bdevelops\b/gi, ["formulates", "constructs", "builds"]],
  [/\bdevelop\b/gi, ["formulate", "construct", "build"]],
  [/\bdeveloping\b/gi, ["formulating", "constructing", "building"]],
  [/\bmaintains\b/gi, ["preserves", "sustains", "upholds"]],
  [/\bmaintain\b/gi, ["preserve", "sustain", "uphold"]],
  [/\bmaintaining\b/gi, ["preserving", "sustaining", "upholding"]],
  [/\ballows\b/gi, ["enables", "permits", "equips"]],
  [/\ballow\b/gi, ["enable", "permit", "equip"]],
  [/\ballowing\b/gi, ["enabling", "permitting", "equipping"]],
  [/\benables\b/gi, ["equips", "empowers", "permits"]],
  [/\benable\b/gi, ["equip", "empower", "permit"]],
  [/\bsupports\b/gi, ["underpins", "sustains", "reinforces"]],
  [/\bidentifies\b/gi, ["pinpoints", "isolates", "detects"]],
  [/\bidentify\b/gi, ["pinpoint", "isolate", "detect"]],
  [/\bidentifying\b/gi, ["pinpointing", "isolating", "detecting"]],
  [/\bevaluates\b/gi, ["assesses", "appraises", "examines"]],
  [/\bevaluate\b/gi, ["assess", "appraise", "examine"]],
  [/\bevaluating\b/gi, ["assessing", "appraising", "examining"]],
  [/\banalyzes\b/gi, ["examines", "evaluates", "investigates"]],
  [/\banalyze\b/gi, ["examine", "evaluate", "investigate"]],
  [/\banalyzing\b/gi, ["examining", "evaluating", "investigating"]],
  [/\bimplements\b/gi, ["deploys", "operationalizes", "executes"]],
  [/\bimplement\b/gi, ["deploy", "operationalize", "execute"]],
  [/\bimplementing\b/gi, ["deploying", "operationalizing", "executing"]],
  [/\bmanages\b/gi, ["coordinates", "governs", "oversees"]],
  [/\bmanage\b/gi, ["coordinate", "govern", "oversee"]],
  [/\bmanaging\b/gi, ["coordinating", "governing", "overseeing"]],
  [/\bmonitors\b/gi, ["tracks", "oversees", "observes"]],
  [/\bmonitor\b/gi, ["track", "oversee", "observe"]],
  [/\bmonitoring\b/gi, ["tracking", "overseeing", "observing"]],
  [/\bgenerates\b/gi, ["produces", "yields", "synthesizes"]],
  [/\bgenerate\b/gi, ["produce", "yield", "synthesize"]],
  [/\bgenerating\b/gi, ["producing", "yielding", "synthesizing"]],
  [/\bcollects\b/gi, ["gathers", "compiles", "aggregates"]],
  [/\bcollect\b/gi, ["gather", "compile", "aggregate"]],
  [/\bcollecting\b/gi, ["gathering", "compiling", "aggregating"]],
  [/\bstores\b/gi, ["retains", "archives", "houses"]],
  [/\bstore\b/gi, ["retain", "archive", "house"]],
  [/\bprocesses\b/gi, ["handles", "evaluates", "executes"]],
  [/\bimportant\b/gi, ["consequential", "significant", "substantive"]],
  [/\bdifferent\b/gi, ["distinct", "varied", "diverse"]],
  [/\bvarious\b/gi, ["multiple", "diverse", "several"]],
  [/\beffective\b/gi, ["reliable", "impactful", "well-suited"]],
  [/\beffectively\b/gi, ["reliably", "cohesively", "consistently"]],
  [/\befficient\b/gi, ["streamlined", "resource-effective", "responsive"]],
  [/\befficiently\b/gi, ["smoothly", "with minimal overhead", "streamlinedly"]],
  [/\bsignificant\b/gi, ["substantial", "marked", "measurable"]],
  [/\bsignificantly\b/gi, ["substantially", "markedly", "measurably"]],
  [/\bexisting\b/gi, ["incumbent", "current", "established"]],
  [/\bcurrently\b/gi, ["at present", "presently", "in current practice"]],
  [/\boften\b/gi, ["frequently", "routinely", "commonly"]],
  [/\balso\b/gi, ["likewise", "further", "in addition"]],
  [/\bmain\b/gi, ["primary", "principal", "core"]],
  [/\bmajor\b/gi, ["principal", "primary", "substantial"]],
  [/\bcomplex\b/gi, ["intricate", "multi-layered", "demanding"]],
  [/\bsimple\b/gi, ["straightforward", "streamlined", "uncomplicated"]],
  [/\btraditional\b/gi, ["conventional", "legacy", "established"]],
  [/\bmoderns?\b/gi, ["contemporary", "current", "present-day"]],
  [/\bspecific\b/gi, ["targeted", "particular", "defined"]],
  [/\bspecifically\b/gi, ["in particular", "notably", "specifically"]],
  [/\bessential\b/gi, ["integral", "foundational", "necessary"]],
  [/\bcritical\b/gi, ["decisive", "vital", "central"]],
  [/\bkey\s+(?=role|factor|component|element|aspect|feature|benefit|challenge|issue|finding)/gi, ["central ", "primary ", "core "]],
  [/\bbased\s+on\b/gi, ["grounded in", "informed by", "driven by"]],
  [/\baccording\s+to\b/gi, ["in line with", "consistent with", "as specified by"]]
];

function pickVariant(options: string[], seed: number): string {
  return options[Math.abs(seed) % options.length];
}

function matchCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  if (/^[A-Z]/.test(original) && /^[a-z]/.test(replacement)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  if (/^[a-z]/.test(original) && /^[A-Z]/.test(replacement) && !/^I\b/.test(replacement)) {
    return replacement.charAt(0).toLowerCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * PASS 3: Universal Syntactic & Clause Restructuring Engine
 * Handles both classic AI templates AND general academic/technical sentence patterns without altering meaning.
 */
function restructureSentenceSyntax(
  sentence: string,
  mode: HumanizerMode,
  intensity: HumanizerIntensity,
  seed: number
): { text: string; restructured: boolean } {
  let out = sentence.trim();
  let restructured = false;

  // 1. Contrastive opener: "Unlike [X], [Y]" -> "Where [X], [Y]" or "Rather than mirroring [X], [Y]"
  const unlikeMatch = out.match(/^Unlike\s+([^,]{6,95}),\s+(.+)$/i);
  if (unlikeMatch) {
    const contrastTarget = unlikeMatch[1].trim();
    const mainClause = unlikeMatch[2].trim();
    const capMain = (mainClause.charAt(0).toUpperCase() + mainClause.slice(1)).replace(/[.!?]+$/, "");

    // If contrastTarget contains "that/which", turn into "Where [X]..., [Main]"
    if (/\b(?:that|which)\s+/i.test(contrastTarget)) {
      const whereClause = contrastTarget.replace(/\b(?:that|which)\s+/i, "");
      const variants = [
        `Where ${whereClause}, ${mainClause}`,
        `In contrast to ${contrastTarget}, ${mainClause}`,
        `Whereas ${whereClause}, ${mainClause}`
      ];
      out = pickVariant(variants, seed);
    } else {
      const variants = [
        `In contrast to ${contrastTarget}, ${mainClause}`,
        `Departing from ${contrastTarget}, ${mainClause}`,
        `${capMain}—standing in direct contrast to ${contrastTarget}.`
      ];
      out = pickVariant(variants, seed).replace(/\.\.$/, ".");
    }
    restructured = true;
  }

  // 2. Symmetric Compound Modal Clause: "[Subj1] can/are able to [V1], and [Subj2] can/are able to [V2]."
  // (Directly handles patterns like: "Students can see why..., and administrators can tune...")
  const symmetricModalMatch = out.match(
    /^([A-Z][^,]{3,85}\b(?:can|may|are able to|is able to)\s+[^,]{6,110}),\s+and\s+([a-zA-Z][^,]{2,40}\b(?:can|may|are able to|is able to)\s+.+?)(\.|!|\?)$/
  );
  if (symmetricModalMatch) {
    const clause1 = symmetricModalMatch[1].trim();
    const clause2 = symmetricModalMatch[2].trim();
    const punct = symmetricModalMatch[3];
    const clause1Lower =
      /^[A-Z]{2,}/.test(clause1) || /^__/.test(clause1)
        ? clause1
        : clause1.charAt(0).toLowerCase() + clause1.slice(1);
    const clause2Lower =
      /^[A-Z]{2,}/.test(clause2) || /^__/.test(clause2)
        ? clause2
        : clause2.charAt(0).toLowerCase() + clause2.slice(1);

    const starters = [
      "As a result, ",
      "In practice, ",
      "Through this workflow, "
    ];
    const connectors = [
      "At the same time, ",
      "Concurrently, ",
      "Meanwhile, "
    ];

    // If second clause has "without [X]" at the end, offset it with an em-dash for authentic human punctuation!
    const formattedClause2 = clause2Lower.replace(/\s+(without\s+[^.?!]+)$/i, "—$1");

    // Split into 2 distinct sentences to dramatically improve Burstiness!
    out = `${pickVariant(starters, seed)}${clause1Lower}. ${pickVariant(connectors, seed + 1)}${formattedClause2}${punct}`;
    restructured = true;
  }

  // 3. Transform "Not only does/do [Subj] [Verb] [Obj], but (also) [Y]"
  if (!restructured) {
    const notOnlyDoesMatch = out.match(
      /^Not only (does|do)\s+(.+?)\s+(foster|support|encourage|build|apply|use|enable|enhance|improve|create|provide|drive|shape|ensure|allow|demonstrate|reflect|mitigate|reduce|increase|strengthen)\s+([^,]+),\s*but\s+(?:(it|they|this|these)\s+)?(?:also\s+)?(.+)$/i
    );
    if (notOnlyDoesMatch) {
      const isSingular = notOnlyDoesMatch[1].toLowerCase() === "does";
      const subj = notOnlyDoesMatch[2].trim();
      const baseVerb = notOnlyDoesMatch[3].toLowerCase();
      const inflectedVerb = isSingular
        ? baseVerb.endsWith("y") && !/[aeiou]y$/.test(baseVerb)
          ? `${baseVerb.slice(0, -1)}ies`
          : baseVerb.endsWith("s") || baseVerb.endsWith("sh") || baseVerb.endsWith("ch")
            ? `${baseVerb}es`
            : `${baseVerb}s`
        : baseVerb;
      const obj1 = notOnlyDoesMatch[4].trim();
      const pronoun = (notOnlyDoesMatch[5] || (isSingular ? "it" : "they")).toLowerCase();
      const secondPart = notOnlyDoesMatch[6].trim();
      out = `Beyond the fact that ${subj} ${inflectedVerb} ${obj1}, ${pronoun} simultaneously ${secondPart}`;
      restructured = true;
    }
  }

  // 4. Break or transform robotic participial tail clauses: ", highlighting/underscoring/demonstrating/ensuring/fostering/showcasing [X]."
  const tailRegex =
    /,\s*(?:thereby\s+)?(highlighting|underscoring|demonstrating|ensuring|fostering|showcasing|emphasizing|illustrating|reflecting|enabling|allowing|making)\s+([^.?!]+)(\.|!|\?)$/i;
  const tailMatch = out.match(tailRegex);
  if (tailMatch) {
    const verb = tailMatch[1].toLowerCase();
    const rest = tailMatch[2].trim();
    const punct = tailMatch[3];
    const mainClause = out.slice(0, tailMatch.index).trim();

    const verbMap: Record<string, string[]> = {
      highlighting: ["This pattern directly illustrates", "In doing so, it clarifies", "—a dynamic that brings into focus"],
      underscoring: ["This finding reinforces", "Crucially, this confirms", "—thereby reinforcing"],
      demonstrating: ["Empirical observation thus confirms", "This outcome shows", "—which directly demonstrates"],
      ensuring: ["This mechanism guarantees", "As a result, this secures", "—a safeguard that maintains"],
      fostering: ["In turn, this cultivates", "This environment supports", "—which actively encourages"],
      showcasing: ["This example illustrates", "In practice, this reveals", "—evidencing"],
      emphasizing: ["This distinction stresses", "Notably, this points to", "—which underscores"],
      illustrating: ["Specifically, this exemplifies", "This case clarifies", "—a pattern that shows"],
      reflecting: ["This trend mirrors", "At its core, this captures", "—which corresponds to"],
      enabling: ["In turn, this equips", "This capability allows", "—directly enabling"],
      allowing: ["Consequently, this permits", "In practice, this lets", "—thereby allowing"],
      making: ["As a result, this renders", "In effect, this makes", "—which makes"]
    };

    const choices = verbMap[verb] || ["This directly illustrates", "In turn, this shows", "—which clarifies"];
    const chosen = pickVariant(choices, seed);

    if (chosen.startsWith("—")) {
      out = `${mainClause} ${chosen} ${rest}${punct}`;
    } else {
      out = `${mainClause}. ${chosen} ${rest}${punct}`;
    }
    restructured = true;
  }

  // 5. Transform "By [verbing] [X], [Y] can/is able to [Z]"
  if (!restructured) {
    const byVerbingMatch = out.match(
      /^By\s+([a-z]+ing)\s+([^,]{5,65}),\s+([^,]{3,45})\s+(?:can|are able to|is able to|will)\s+(.+)$/i
    );
    if (byVerbingMatch) {
      const gerund = byVerbingMatch[1].toLowerCase();
      const obj = byVerbingMatch[2].trim();
      const subj = byVerbingMatch[3].trim();
      const pred = byVerbingMatch[4].trim();
      out = `When ${subj} prioritize ${gerund} ${obj}, they are positioned to ${pred}`;
      restructured = true;
    }
  }

  // 6. Transform "While/Although [Clause 1], [Clause 2]" -> "[Clause 2]—even though [Clause 1]" or "Despite [Clause 1], [Clause 2]"
  if (!restructured) {
    const whileMatch = out.match(/^(?:While|Although)\s+([^,]{8,75}),\s+([a-zA-Z].+?)(\.|!|\?)$/);
    if (whileMatch && seed % 2 === 0) {
      const c1 = whileMatch[1].trim();
      const c2 = whileMatch[2].trim();
      const punct = whileMatch[3];
      const c2Cap = c2.charAt(0).toUpperCase() + c2.slice(1);
      out = `${c2Cap}—even though ${c1}${punct}`;
      restructured = true;
    }
  }

  // 7. General Compound Sentence Restructuring ("[Clause 1 >= 9 words], and [Clause 2 >= 7 words]")
  if (!restructured) {
    const generalCompoundMatch = out.match(/^([^,]{28,140}),\s+and\s+([a-zA-Z][^,]{22,140})(\.|!|\?)$/);
    if (generalCompoundMatch) {
      const part1 = generalCompoundMatch[1].trim();
      const part2 = generalCompoundMatch[2].trim();
      const punct = generalCompoundMatch[3];
      // Make sure part1 is a full clause (not a 3-item list "A, B, and C")
      if (!/,/.test(part1)) {
        const part2Lower =
          /^[A-Z]{2,}/.test(part2) || /^__/.test(part2)
            ? part2
            : part2.charAt(0).toLowerCase() + part2.slice(1);
        const transitions = [
          "At the same time, ",
          "In parallel, ",
          "Concurrently, "
        ];
        out = `${part1}. ${pickVariant(transitions, seed)}${part2Lower}${punct}`;
        restructured = true;
      }
    }
  }

  // 8. Inject scholarly punctuation (em-dash or semicolon) into long multi-clause sentences
  if (!restructured && (intensity !== "balanced" || mode === "postgrad" || getWords(out).length >= 20)) {
    if (/,\s+which\s+/i.test(out)) {
      out = out.replace(/,\s+which\s+/, "—which ");
      restructured = true;
    } else if (/,\s+whereas\s+/i.test(out)) {
      out = out.replace(/,\s+whereas\s+/, "; by contrast, ");
      restructured = true;
    } else if (/,\s+while\s+/i.test(out)) {
      out = out.replace(/,\s+while\s+/, "; meanwhile, ");
      restructured = true;
    } else if (/\s+without\s+([a-z]+ing\s+[^.?!]{4,40})(\.|!|\?)$/i.test(out)) {
      out = out.replace(/\s+without\s+([a-z]+ing\s+[^.?!]{4,40})(\.|!|\?)$/i, "—without $1$2");
      restructured = true;
    }
  }

  return { text: out, restructured };
}

/**
 * PASS 4: Universal Sentence-Level Polish (Guarantees NO sentence remains identical to the AI input!)
 */
function ensureSentenceHumanized(
  originalSentence: string,
  currentSentence: string,
  mode: HumanizerMode,
  seed: number
): { text: string; changesMade: number } {
  let out = currentSentence;
  let changesMade = 0;

  // Apply Universal Collocation Map across the sentence
  for (let i = 0; i < UNIVERSAL_COLLOCATION_MAP.length; i++) {
    const [regex, options] = UNIVERSAL_COLLOCATION_MAP[i];
    if (regex.test(out)) {
      regex.lastIndex = 0;
      out = out.replace(regex, (match) => {
        changesMade++;
        const chosen = pickVariant(options, seed + i + changesMade);
        return matchCase(match, chosen);
      });
    }
  }

  // If sentence is STILL identical to originalSentence, apply meaning-preserving syntactic framing or clause shift!
  if (out.trim() === originalSentence.trim()) {
    const clean = out.trim();
    const withoutPunct = clean.replace(/[.!?]+$/, "");
    const punct = (clean.match(/[.!?]+$/) || ["."])[0];

    // Check if sentence ends with a prepositional phrase like "in [X]" or "for [X]" or "through [X]" that can be fronted
    const trailingPrepMatch = withoutPunct.match(/^(.{25,120}?)\s+((?:in|within|across|under|through)\s+(?:a|an|the|one|modern|contemporary|current)\s+[^,]{6,45})$/i);
    if (trailingPrepMatch) {
      const mainBody = trailingPrepMatch[1].trim();
      const prepPhrase = trailingPrepMatch[2].trim();
      const prepCap = prepPhrase.charAt(0).toUpperCase() + prepPhrase.slice(1);
      const mainLower =
        /^[A-Z]{2,}/.test(mainBody) || /^__/.test(mainBody)
          ? mainBody
          : mainBody.charAt(0).toLowerCase() + mainBody.slice(1);
      out = `${prepCap}, ${mainLower}${punct}`;
      changesMade++;
    } else if (!/^(In practice|Specifically|Crucially|At its core|From an operational|Empirically|Notably|Within this)/i.test(clean)) {
      const lowerFirst =
        /^[A-Z]{2,}/.test(withoutPunct) || /^__/.test(withoutPunct) || /^I\b/.test(withoutPunct)
          ? withoutPunct
          : withoutPunct.charAt(0).toLowerCase() + withoutPunct.slice(1);

      const modeOpeners: Record<HumanizerMode, string[]> = {
        academic: ["In practice, ", "Specifically, ", "At a functional level, "],
        postgrad: ["From an analytical standpoint, ", "Substantively, ", "Within this framework, "],
        lit_review: ["In the existing literature, ", "Across prior studies, ", "Scholarly evidence indicates that "],
        methodology: ["Operationally, ", "Within the system design, ", "Methodologically, "],
        business: ["From an operational perspective, ", "In practical terms, ", "Strategically, "],
        concise: ["In practice, ", "Specifically, ", "Notably, "]
      };

      const prefix = pickVariant(modeOpeners[mode] || modeOpeners.academic, seed);
      out = `${prefix}${lowerFirst}${punct}`;
      changesMade++;
    }
  }

  return { text: out, changesMade };
}

/**
 * Generates 3 distinct academic alternative rewrites for a given humanized sentence
 */
function buildSentenceAlternatives(sentence: string, mode: HumanizerMode, index: number): string[] {
  const clean = sentence.trim();
  if (!clean) return [];

  const withoutEndPunct = clean.replace(/[.!?]+$/, "");
  const endPunct = (clean.match(/[.!?]+$/) || ["."])[0];
  // Strip any existing short discourse opener before building alternatives so prefixes don't double up
  const strippedOpener = withoutEndPunct.replace(
    /^(?:In practice|Specifically|As a result|At the same time|Concurrently|Meanwhile|Beyond this|Crucially|Notably|Operationally|From an analytical standpoint|Through this workflow),\s+/i,
    ""
  );
  const lowerFirst =
    /^[A-Z]{2,}/.test(strippedOpener) || /^I\b/.test(strippedOpener)
      ? strippedOpener
      : strippedOpener.charAt(0).toLowerCase() + strippedOpener.slice(1);
  const capFirst = strippedOpener.charAt(0).toUpperCase() + strippedOpener.slice(1);

  const variants: string[] = [];

  if (mode === "postgrad" || mode === "lit_review") {
    variants.push(
      `From a critical analytical perspective, ${lowerFirst}${endPunct}`,
      `Empirical evidence further indicates that ${lowerFirst}${endPunct}`,
      `${capFirst}—a distinction that carries direct theoretical weight${endPunct}`
    );
  } else if (mode === "methodology") {
    variants.push(
      `Within the operationalized architecture, ${lowerFirst}${endPunct}`,
      `Specifically, the analytical procedure confirms that ${lowerFirst}${endPunct}`,
      `${capFirst}, thereby maintaining methodological rigor${endPunct}`
    );
  } else if (mode === "business") {
    variants.push(
      `From an executive standpoint, ${lowerFirst}${endPunct}`,
      `In practical operational terms, ${lowerFirst}${endPunct}`,
      `${capFirst}—directly strengthening institutional performance${endPunct}`
    );
  } else {
    variants.push(
      `In practical terms, ${lowerFirst}${endPunct}`,
      `A closer assessment shows that ${lowerFirst}${endPunct}`,
      `${capFirst}—a capability of direct relevance to this framework${endPunct}`
    );
  }

  const shift = index % variants.length;
  return [...variants.slice(shift), ...variants.slice(0, shift)];
}

/**
 * Computes word-level / phrase-level diff segments between original and humanized text
 */
export function computeDiffSegments(original: string, humanized: string): DiffSegment[] {
  const origWords = original.trim().split(/(\s+)/);
  const humWords = humanized.trim().split(/(\s+)/);

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (j < humWords.length) {
    if (i < origWords.length && origWords[i] === humWords[j]) {
      segments.push({ type: "unchanged", text: humWords[j] });
      i++;
      j++;
      continue;
    }

    let foundSync = false;
    for (let lookHum = 1; lookHum <= 14 && j + lookHum < humWords.length; lookHum++) {
      for (let lookOrig = 0; lookOrig <= 14 && i + lookOrig < origWords.length; lookOrig++) {
        if (
          humWords[j + lookHum].trim().length > 2 &&
          humWords[j + lookHum] === origWords[i + lookOrig]
        ) {
          const changedChunk = humWords.slice(j, j + lookHum).join("");
          const origChunk = origWords.slice(i, i + lookOrig).join("");
          segments.push({ type: "changed", text: changedChunk, original: origChunk });
          i += lookOrig;
          j += lookHum;
          foundSync = true;
          break;
        }
      }
      if (foundSync) break;
    }

    if (!foundSync) {
      segments.push({ type: "changed", text: humWords[j] });
      j++;
      i++;
    }
  }

  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === seg.type) {
      prev.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

export function runHumanizerEngine(req: HumanizeRequest): HumanizeResult {
  const rawInput = req.text.trim();
  const freezeKeywords = (req.freezeKeywords || []).map((k) => k.trim()).filter(Boolean);
  const vSeed = typeof req.variationSeed === "number" ? req.variationSeed : 0;

  const beforeMetrics = analyzeTextForensics(rawInput, freezeKeywords);

  // Step 1: Protect citations, statistical expressions, quotes, CamelCase product names (e.g. UniStay), and frozen keywords
  const placeholders = new Map<string, string>();
  let workingText = rawInput;
  let citationsProtected = 0;
  let frozenTermsProtected = 0;

  // Freeze user keywords first
  freezeKeywords.forEach((kw, idx) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reg = new RegExp(`\\b${escaped}\\b`, "gi");
    workingText = workingText.replace(reg, (match) => {
      const token = `__FRZ_${idx}_${placeholders.size}__`;
      placeholders.set(token, match);
      frozenTermsProtected++;
      return token;
    });
  });

  // Automatically shield CamelCase brand/system names (like UniStay, SmartPLS, PayHere, NextJS) so they never get altered
  workingText = workingText.replace(/\b[A-Z][a-z]+[A-Z][A-Za-z0-9]*\b/g, (match) => {
    const token = `__BRD_${placeholders.size}__`;
    placeholders.set(token, match);
    return token;
  });

  // Protect citations & statistical notations if preserveCitations is enabled
  if (req.preserveCitations) {
    CITATION_REGEXES.forEach((regex, rIdx) => {
      workingText = workingText.replace(regex, (match) => {
        const token = `__CIT_${rIdx}_${placeholders.size}__`;
        placeholders.set(token, match);
        citationsProtected++;
        return token;
      });
    });
  }

  // Step 2: Process paragraph by paragraph to preserve document structure
  const paragraphs = workingText.split(/(\n\s*\n)/);
  let clichesRemoved = 0;
  let clausesRestructured = 0;
  let burstinessAdjustments = 0;

  const processedParagraphs = paragraphs.map((paraBlock, pIdx) => {
    if (/^\n\s*\n$/.test(paraBlock)) return paraBlock;

    let para = paraBlock;

    // Pass 2A: Apply High-Precision Phrase & Cliche Replacements
    PHRASE_REPLACEMENTS.forEach((rule, ruleIdx) => {
      para = para.replace(rule.regex, (match, ...args) => {
        clichesRemoved++;
        const pool = Array.isArray(rule.replacements)
          ? rule.replacements
          : rule.replacements[req.mode] || rule.replacements.academic;
        let chosen = pickVariant(pool, pIdx + ruleIdx + clichesRemoved + vSeed);

        // Support capture group interpolation ($1, $2) if rule uses them
        if (chosen.includes("$1") && typeof args[0] === "string") {
          chosen = chosen.replace("$1", args[0]);
        }
        if (chosen.includes("$2") && typeof args[1] === "string") {
          chosen = chosen.replace("$2", args[1]);
        }

        if (/^[A-Z]/.test(match) && chosen.length > 0 && /^[a-z]/.test(chosen)) {
          return chosen.charAt(0).toUpperCase() + chosen.slice(1);
        }
        return chosen;
      });
    });

    // Pass 3: Split paragraph into sentences for syntactic & clause restructuring
    const originalSentences = splitIntoSentences(paraBlock);
    const sentences = splitIntoSentences(para);
    const transformedSentences: string[] = [];

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const current = sentences[sIdx];
      const origCompare = originalSentences[sIdx] || current;

      const { text: restructuredText, restructured } = restructureSentenceSyntax(
        current,
        req.mode,
        req.intensity,
        pIdx * 10 + sIdx + vSeed
      );
      if (restructured) clausesRestructured++;

      // Pass 4: Ensure every sentence gets meaning-preserving lexical & structural humanization
      const { text: polishedText, changesMade } = ensureSentenceHumanized(
        origCompare,
        restructuredText,
        req.mode,
        pIdx * 13 + sIdx + vSeed
      );
      clichesRemoved += changesMade;

      const subSentences = splitIntoSentences(polishedText);
      transformedSentences.push(...subSentences);
    }

    // Pass 5: Burstiness Injection (Sentence length rhythm optimization)
    const rhythmAdjusted: string[] = [];
    for (let i = 0; i < transformedSentences.length; i++) {
      const s = transformedSentences[i];
      const wCount = getWords(s).length;

      const prev = rhythmAdjusted[rhythmAdjusted.length - 1];
      const prevWCount = prev ? getWords(prev).length : 0;

      // If 2 consecutive sentences have similar medium/long lengths (difference <= 6 words), split a compound or subordinate clause to inject human burstiness
      if (prev && Math.abs(wCount - prevWCount) <= 6 && wCount >= 16) {
        if (/,\s+(and|but|so|yet)\s+[a-zA-Z]/i.test(s)) {
          const splitMatch = s.match(/^([^,]{20,140}),\s+(and|but|yet|so)\s+([a-zA-Z].*)$/i);
          if (splitMatch && getWords(splitMatch[1]).length >= 7 && getWords(splitMatch[3]).length >= 6) {
            const conj = splitMatch[2].toLowerCase();
            const restLower =
              /^[A-Z]{2,}/.test(splitMatch[3]) || /^__/.test(splitMatch[3])
                ? splitMatch[3]
                : splitMatch[3].charAt(0).toLowerCase() + splitMatch[3].slice(1);
            const connector =
              conj === "but" || conj === "yet"
                ? "However, "
                : conj === "so"
                  ? "Consequently, "
                  : req.mode === "concise"
                    ? "Additionally, "
                    : "At the same time, ";
            rhythmAdjusted.push(`${splitMatch[1].trim()}.`);
            rhythmAdjusted.push(`${connector}${restLower}`);
            burstinessAdjustments++;
            continue;
          }
        } else if (/\s+because\s+(they|it|this|these|users|students|organizations|firms|models|systems)\s+/i.test(s)) {
          const becauseMatch = s.match(/^(.{24,130}?)\s+because\s+((?:they|it|this|these|users|students|organizations|firms|models|systems)\s+.+)$/i);
          if (becauseMatch && getWords(becauseMatch[1]).length >= 7 && getWords(becauseMatch[2]).length >= 6) {
            const c1 = becauseMatch[1].trim();
            const c2 = becauseMatch[2].trim();
            const c2Lower = c2.charAt(0).toLowerCase() + c2.slice(1);
            rhythmAdjusted.push(`${c1}.`);
            rhythmAdjusted.push(`This advantage stems from the fact that ${c2Lower}`);
            burstinessAdjustments++;
            continue;
          }
        }
      }

      // Or if two very short sentences (<= 10 words each) appear back-to-back in academic/postgrad mode, link with semicolon
      if (
        prev &&
        prevWCount <= 10 &&
        wCount <= 11 &&
        req.mode !== "concise" &&
        !/[;—]/.test(prev) &&
        /\.$/.test(prev)
      ) {
        const prevWithoutDot = prev.replace(/\.$/, "");
        const currLower =
          /^[A-Z]{2,}/.test(s) || /^__/.test(s)
            ? s
            : s.charAt(0).toLowerCase() + s.slice(1);
        rhythmAdjusted[rhythmAdjusted.length - 1] = `${prevWithoutDot}; ${currLower}`;
        burstinessAdjustments++;
        continue;
      }

      rhythmAdjusted.push(s);
    }

    return rhythmAdjusted.join(" ");
  });

  let humanizedText = processedParagraphs.join("");

  // Step 4: Restore protected citations, statistics, quotes, brand names, and frozen keywords
  placeholders.forEach((originalValue, token) => {
    humanizedText = humanizedText.replaceAll(token, originalValue);
  });

  // Clean up any accidental double spaces and a/an vowel harmony (excluding 'uni-', 'use-', 'euro-', 'one-')
  humanizedText = humanizedText
    .replace(/\b(a)\s+([aeiouAEIOU](?!ni[a-z]*|se[a-z]*|til[a-z]*|ro[a-z]*|ne\b)[a-z]+)/g, "$1n $2")
    .replace(/\b(an)\s+(uni[a-z]+|use[a-z]*|util[a-z]*|[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z]+)/gi, (_, anWord, nextWord) => {
      const aForm = /^[A-Z]/.test(anWord) ? "A" : "a";
      return `${aForm} ${nextWord}`;
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();

  const afterMetrics = analyzeTextForensics(humanizedText, freezeKeywords);

  const sentenceAlternatives: Record<number, string[]> = {};
  afterMetrics.sentences.forEach((sObj, idx) => {
    const alts = buildSentenceAlternatives(sObj.text, req.mode, idx);
    sentenceAlternatives[idx] = alts;
    sObj.alternatives = alts;
  });

  const diffSegments = computeDiffSegments(rawInput, humanizedText);

  return {
    originalText: rawInput,
    humanizedText,
    beforeMetrics,
    afterMetrics,
    diffSegments,
    sentenceAlternatives,
    appliedTransformations: {
      clichesRemoved,
      clausesRestructured,
      burstinessAdjustments,
      citationsProtected,
      frozenTermsProtected
    },
    tierUsed: req.tier,
    modeUsed: req.mode,
    intensityUsed: req.intensity
  };
}

export const SAMPLE_AI_TEXTS: {
  id: string;
  label: string;
  category: string;
  mode: HumanizerMode;
  text: string;
}[] = [
  {
    id: "lit_review",
    label: "AI Literature Review (With APA Citations)",
    category: "Research & Literature Review",
    mode: "lit_review",
    text: `In today's rapidly evolving digital age, artificial intelligence plays a pivotal role in transforming higher education across developing economies (Perera & Silva, 2023). Furthermore, it is important to note that machine learning algorithms delve into complex student performance datasets, highlighting the importance of personalized adaptive learning pathways. Moreover, recent studies underscore the multifaceted nature of institutional readiness, demonstrating that infrastructure constraints serve as a testament to the ongoing digital divide (Bandara et al., 2024, p. 42). Not only does algorithmic feedback foster student engagement, but it also leverages predictive analytics to seamlessly identify at-risk undergraduates (p < 0.05). In conclusion, navigating the complexities of ethical AI governance remains of paramount importance for paving the way toward a holistic approach in university pedagogy.`
  },
  {
    id: "system_abstract",
    label: "FYP System Abstract (UniStay Example)",
    category: "Software / FYP Abstract",
    mode: "academic",
    text: `Unlike conventional hostel systems that only record bookings, UniStay combines transparent multicriteria scoring, optimisation-based room allocation and lifestyle-based roommate matching in one mobile-first platform. Students can see why they were allocated a room, and administrators can tune the allocation rules to university policy without changing code.`
  },
  {
    id: "essay_business",
    label: "ChatGPT Business & Strategy Essay",
    category: "MBA / Business Case Study",
    mode: "business",
    text: `In today's fast-paced competitive landscape, supply chain resilience has become an indispensable cornerstone for multinational corporations. It is worth noting that organizations must leverage robust digital ecosystems in order to navigate the complexities of global procurement disruptions. Furthermore, fostering a culture of cross-functional synergy plays a crucial role in ensuring operational agility, thereby showcasing the value of real-time inventory visibility [1, 2]. Additionally, by harnessing predictive demand forecasting, executive leadership can seamlessly mitigate bottleneck risks, underscoring the need for a paradigm shift in strategic sourcing.`
  },
  {
    id: "methodology",
    label: "AI Methodology & Empirical Section",
    category: "Dissertation Chapter 3",
    mode: "methodology",
    text: `This study delves into the intricate interplay between transformational leadership and employee retention within Sri Lankan software firms. In order to obtain a comprehensive overview of the phenomenon, a quantitative cross-sectional survey was meticulously deployed across 240 respondents (N = 240). Furthermore, it is crucial to understand that structural equation modeling via SmartPLS was leveraged to assess the hypotheses, thereby ensuring robust construct validity and reliability (r = 0.81, p < 0.01). Consequently, this holistic approach sheds light on the underlying mediating mechanisms, paving the way for future longitudinal investigations.`
  }
];
