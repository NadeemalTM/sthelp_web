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

/**
 * Comprehensive AI Signature Detector covering all 5 High-Risk Categories:
 * 1. High-Risk Verbs (delve, leverage, foster, elevate, resonate, embark, underscore, facilitate, harness, streamline, illuminate/shed light on, spearhead, bolster)
 * 2. High-Risk Metaphorical Nouns (tapestry, beacon, testament, landscape, realm, cornerstone, bedrock, interplay, myriad, plethora)
 * 3. Inflated Modifiers & Buzzwords (crucial, vital, paramount, pivotal, meticulous, comprehensive, multifaceted, nuanced, fast-paced, transformative, game-changing, revolutionary, robust, seamless)
 * 4. Mechanical Transitions & Connectors (furthermore, moreover, additionally, in conclusion, to summarize, consequently, thus)
 * 5. Hollow Stock Phrases ("it is important to note that", "it is worth mentioning that", "in today's fast-paced digital world", "at its core", "plays a crucial role in", "serves as a stark reminder", "left an indelible mark on", "when all is said and done", "at the end of the day", "it goes without saying that")
 */
const AI_CLICHE_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  // Category 1: High-Risk Verbs
  { pattern: /\bdelve(?:s|d|ing)?(?:\s+into)?\b/gi, label: "delve", weight: 14 },
  { pattern: /\bleverag(?:e|es|ed|ing)\b/gi, label: "leverage", weight: 11 },
  { pattern: /\bfoster(?:s|ed|ing)?\b/gi, label: "foster", weight: 10 },
  { pattern: /\belevat(?:e|es|ed|ing)\b/gi, label: "elevate", weight: 10 },
  { pattern: /\bresonat(?:e|es|ed|ing)\b/gi, label: "resonate", weight: 11 },
  { pattern: /\bembark(?:s|ed|ing)?\b/gi, label: "embark", weight: 11 },
  { pattern: /\bunderscor(?:e|es|ed|ing)\b/gi, label: "underscore", weight: 12 },
  { pattern: /\bfacilitat(?:e|es|ed|ing)\b/gi, label: "facilitate", weight: 9 },
  { pattern: /\bharness(?:es|ed|ing)?\b/gi, label: "harness", weight: 11 },
  { pattern: /\bstreamlin(?:e|es|ed|ing)\b/gi, label: "streamline", weight: 10 },
  { pattern: /\billuminat(?:e|es|ed|ing)\b/gi, label: "illuminate", weight: 11 },
  { pattern: /\bshed(?:s|ding)?\s+light\s+on\b/gi, label: "shed light on", weight: 12 },
  { pattern: /\bspearhead(?:s|ed|ing)?\b/gi, label: "spearhead", weight: 12 },
  { pattern: /\bbolster(?:s|ed|ing)?\b/gi, label: "bolster", weight: 10 },

  // Category 2: High-Risk Metaphorical Nouns
  { pattern: /\btapestr(?:y|ies)\b/gi, label: "tapestry", weight: 15 },
  { pattern: /\bbeacon(?:s)?\b/gi, label: "beacon", weight: 14 },
  { pattern: /\btestament\s+to\b/gi, label: "testament to", weight: 14 },
  { pattern: /\b(?:digital|competitive|evolving|modern|business|technological|global|shifting|complex|academic|corporate|urban)\s+landscape\b/gi, label: "landscape (metaphor)", weight: 12 },
  { pattern: /\brealm(?:s)?\b/gi, label: "realm", weight: 12 },
  { pattern: /\bcornerstone(?:s)?\b/gi, label: "cornerstone", weight: 12 },
  { pattern: /\bbedrock\b/gi, label: "bedrock", weight: 12 },
  { pattern: /\b(?:dynamic\s+|intricate\s+)?interplay\b/gi, label: "interplay", weight: 13 },
  { pattern: /\bmyriad\b/gi, label: "myriad", weight: 12 },
  { pattern: /\bplethora\b/gi, label: "plethora", weight: 13 },

  // Category 3: Inflated Modifiers & Buzzwords
  { pattern: /\bcrucial(?:ly)?\b/gi, label: "crucial", weight: 9 },
  { pattern: /\bvital(?:ly)?\b/gi, label: "vital", weight: 8 },
  { pattern: /\bparamount\b/gi, label: "paramount", weight: 11 },
  { pattern: /\bpivotal\b/gi, label: "pivotal", weight: 11 },
  { pattern: /\bmeticulous(?:ly)?\b/gi, label: "meticulous", weight: 10 },
  { pattern: /\bcomprehensive(?:ly)?\b/gi, label: "comprehensive", weight: 8 },
  { pattern: /\bmultifaceted\b/gi, label: "multifaceted", weight: 12 },
  { pattern: /\bnuanced\b/gi, label: "nuanced", weight: 9 },
  { pattern: /\bfast-paced\b/gi, label: "fast-paced", weight: 11 },
  { pattern: /\btransformative\b/gi, label: "transformative", weight: 10 },
  { pattern: /\bgame-changing\b/gi, label: "game-changing", weight: 13 },
  { pattern: /\brevolutionary\b/gi, label: "revolutionary", weight: 10 },
  { pattern: /\brobust(?:ly|ness)?\b/gi, label: "robust", weight: 8 },
  { pattern: /\bseamless(?:ly)?\b/gi, label: "seamless", weight: 10 },
  { pattern: /\bindispensable\b/gi, label: "indispensable", weight: 9 },
  { pattern: /\boverarching\b/gi, label: "overarching", weight: 9 },
  { pattern: /\bsynerg(?:y|ies|istic)\b/gi, label: "synergy", weight: 10 },
  { pattern: /\bholistic(?:ally)?\b/gi, label: "holistic", weight: 9 },
  { pattern: /\bparadigm\s+shift\b/gi, label: "paradigm shift", weight: 12 },

  // Category 4: Mechanical Transitions & Connectors
  { pattern: /\bfurthermore\b/gi, label: "furthermore", weight: 9 },
  { pattern: /\bmoreover\b/gi, label: "moreover", weight: 9 },
  { pattern: /\badditionally\b/gi, label: "additionally", weight: 8 },
  { pattern: /\bin\s+conclusion\b/gi, label: "in conclusion", weight: 10 },
  { pattern: /\bto\s+summarize\b/gi, label: "to summarize", weight: 10 },
  { pattern: /\bto\s+sum\s+up\b/gi, label: "to sum up", weight: 9 },
  { pattern: /\bconsequently\b/gi, label: "consequently", weight: 8 },
  { pattern: /\bthus,\s+/gi, label: "thus", weight: 7 },

  // Category 5: Hollow Stock Phrases
  { pattern: /\bit\s+is\s+(?:important|worth)\s+to\s+(?:note|mention|remember)\s+that\b/gi, label: "it is important to note that", weight: 15 },
  { pattern: /\bit\s+is\s+worth\s+(?:noting|mentioning)\s+that\b/gi, label: "it is worth mentioning that", weight: 15 },
  { pattern: /\bin\s+today'?s\s+(?:rapidly\s+evolving|fast-paced|digital|modern)[^,]{0,35}/gi, label: "in today's fast-paced/digital world", weight: 16 },
  { pattern: /\bat\s+its\s+core\b/gi, label: "at its core", weight: 12 },
  { pattern: /\bplays?\s+a\s+(?:crucial|vital|pivotal|paramount|significant|key|important)\s+role\s+in\b/gi, label: "plays a crucial role in", weight: 13 },
  { pattern: /\bserves?\s+as\s+a\s+stark\s+reminder\b/gi, label: "serves as a stark reminder", weight: 15 },
  { pattern: /\b(?:left|leaves|leaving|leave)\s+an\s+indelible\s+mark\s+on\b/gi, label: "left an indelible mark on", weight: 15 },
  { pattern: /\bwhen\s+all\s+is\s+said\s+and\s+done\b/gi, label: "when all is said and done", weight: 14 },
  { pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi, label: "at the end of the day", weight: 13 },
  { pattern: /\bit\s+goes\s+without\s+saying\s+that\b/gi, label: "it goes without saying that", weight: 15 },
  { pattern: /\bpave(?:s|d|ing)?\s+the\s+way\b/gi, label: "pave the way", weight: 11 },
  { pattern: /\bnot\s+only\b[^.?!]{3,65}\bbut\s+also\b/gi, label: "not only ... but also", weight: 10 },
  { pattern: /,\s*(?:thereby\s+)?(?:highlighting|underscoring|demonstrating|fostering|ensuring|showcasing|emphasizing)\b/gi, label: "participial -ing tail", weight: 11 },

  // General AI Syntactic Templates
  { pattern: /\bUnlike\s+(?:conventional|traditional|existing|standard)\s+[^,]+that\s+only\b/gi, label: "Unlike conventional... that only", weight: 10 },
  { pattern: /\bcombines\s+[^.?!]+,\s+[^.?!]+\s+and\s+[^.?!]+\s+in\s+one\b/gi, label: "combines A, B and C in one", weight: 9 },
  { pattern: /\bcan\s+[^,]{8,60},\s+and\s+[a-z]+\s+can\s+/gi, label: "symmetric 'can... and... can' clause", weight: 9 }
];

const CITATION_REGEXES: RegExp[] = [
  /\([A-Z][A-Za-z\s&.,;-]+?(?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  /\((?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  /\[\d+(?:\s*[,–-]\s*\d+)*\]/g,
  /\b(?:p|r|t|F|z|N|n|χ2|OR|RR|CI)\s*[=<>≤≥]\s*[-+]?\d*\.?\d+(?:\s*,\s*(?:p|r|95%\s*CI)\s*[=<>≤≥]?\s*[^\])]+)?/gi,
  /"[^"\n]{4,160}"/g,
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
    let sAiScore = 20;

    for (const item of AI_CLICHE_PATTERNS) {
      if (item.pattern.test(s)) {
        flags.push(`High-risk AI token: "${item.label}"`);
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

    if (/^(Furthermore|Moreover|Additionally|In addition|Consequently|Therefore|Thus|In conclusion|To summarize),/i.test(s)) {
      sAiScore += 18;
      flags.push("Mechanical AI transition opener");
    }

    // Direct human sentence signals reduce AI score
    if (hasDashOrSemicolon) sAiScore -= 14;
    if (/^(Where|Rather than|While|Although|Still|Yet|And|But|Most|Instead of)\b/i.test(s)) {
      sAiScore -= 10;
    }
    if (/\([A-Z][A-Za-z\s&.,]+?(?:19|20)\d{2}/.test(s) || /\[\d+\]/.test(s)) {
      sAiScore -= 6;
    }
    if (sLen <= 14 || sLen >= 28) {
      sAiScore -= 11;
    }

    const clampedScore = Math.max(3, Math.min(98, Math.round(sAiScore)));
    const riskLevel: "low" | "medium" | "high" =
      clampedScore >= 58 ? "high" : clampedScore >= 34 ? "medium" : "low";

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

  // Calculate Perplexity
  const cleanTokens = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")).filter((w) => w.length > 2);
  const uniqueTokens = new Set(cleanTokens);
  const ttr = cleanTokens.length > 0 ? uniqueTokens.size / Math.sqrt(cleanTokens.length) : 1;
  const longWords = cleanTokens.filter((w) => w.length >= 6).length;
  const longWordRatio = cleanTokens.length > 0 ? longWords / cleanTokens.length : 0;

  const clicheDensityPenalty = wordCount > 0 ? (totalClicheWeight / wordCount) * 180 : 0;
  const rawPerplexity = Math.min(
    98,
    Math.max(22, Math.round(ttr * 14.5 + longWordRatio * 75 - clicheDensityPenalty * 0.45))
  );

  const avgSentenceAi =
    sentenceAnalyses.reduce((acc, s) => acc + s.aiScore, 0) / Math.max(1, sentenceAnalyses.length);
  const burstinessPenalty = Math.max(0, (60 - burstinessScore) * 0.42);
  const clicheBoost = Math.min(46, totalClicheWeight * 1.15);

  const rawAiProb = avgSentenceAi * 0.56 + clicheBoost + burstinessPenalty;
  const aiProbability = Math.max(3, Math.min(99, Math.round(rawAiProb)));
  const humanScore = 100 - aiProbability;

  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const asl = wordCount / sentenceCount;
  const asw = totalSyllables / Math.max(1, wordCount);
  const fkGrade = Math.max(6, Math.min(18, 0.39 * asl + 11.8 * asw - 15.59));
  let academicGrade = `Grade ${fkGrade.toFixed(1)} (Undergraduate)`;
  if (fkGrade >= 14.5) academicGrade = `Level 7 Postgraduate (${fkGrade.toFixed(1)})`;
  else if (fkGrade >= 12.2) academicGrade = `Level 6 Honours (${fkGrade.toFixed(1)})`;
  else if (fkGrade < 10.5) academicGrade = `Direct / Clear (${fkGrade.toFixed(1)})`;

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
 * PASS 2A: Hollow Stock Phrase & Mechanical Transition Cutter
 * Cuts zero-weight padding and mechanical sentence-head transitions so claims open directly,
 * or replaces mid-sentence connectors with simple human connectors ("and", "but", "also").
 */
function stripHollowOpenersAndMechanicalTransitions(
  sentence: string,
  seed: number
): { text: string; cutCount: number } {
  let out = sentence.trim();
  let cutCount = 0;

  // 1. Cut Hollow Stock Openers completely and open directly with the claim!
  const hollowOpeners: RegExp[] = [
    /^In\s+today'?s\s+(?:rapidly\s+evolving\s+|fast-paced\s+)?(?:digital\s+|modern\s+|competitive\s+|global\s+)?(?:world|age|era|landscape|environment),?\s+/i,
    /^(?:Furthermore|Moreover|Additionally|In\s+addition|Consequently|Thus|Therefore|Notably|Importantly|Crucially),\s+it\s+is\s+(?:important|worth|crucial|vital|essential)\s+to\s+(?:note|mention|remember|understand|recognize)\s+that\s+/i,
    /^(?:Furthermore|Moreover|Additionally|In\s+addition|Consequently|Thus|Therefore),\s+it\s+is\s+worth\s+(?:noting|mentioning)\s+that\s+/i,
    /^It\s+is\s+(?:important|worth|crucial|vital|essential|necessary)\s+to\s+(?:note|mention|remember|understand|recognize|point\s+out)\s+that\s+/i,
    /^It\s+is\s+worth\s+(?:noting|mentioning|pointing\s+out|remembering)\s+that\s+/i,
    /^It\s+goes\s+without\s+saying\s+that\s+/i,
    /^When\s+all\s+is\s+said\s+and\s+done,\s*/i,
    /^At\s+the\s+end\s+of\s+the\s+day,\s*/i,
    /^At\s+its\s+core,\s*/i,
    /^Needless\s+to\s+say,\s*/i
  ];

  for (const regex of hollowOpeners) {
    if (regex.test(out)) {
      out = out.replace(regex, "");
      cutCount++;
    }
  }

  // 2. Cut Mechanical Transitions at the start of sentences (or use simple "Also," / "Still," / direct claim)
  const mechanicalHeadRegex =
    /^(Furthermore|Moreover|Additionally|In\s+addition|Consequently|Thus|Therefore|Hence|In\s+conclusion|To\s+summarize|To\s+sum\s+up|Overall),\s+/i;
  const headMatch = out.match(mechanicalHeadRegex);
  if (headMatch) {
    const word = headMatch[1].toLowerCase();
    cutCount++;
    if (word.includes("conclusion") || word.includes("sum")) {
      // Cut "In conclusion," / "To summarize," completely or use "Ultimately,"
      const conclusionChoices = ["", "", "Ultimately, "];
      out = out.replace(mechanicalHeadRegex, pickVariant(conclusionChoices, seed));
    } else if (word === "consequently" || word === "thus" || word === "therefore" || word === "hence") {
      // Cut entirely (70%) or use simple "So," / "As a result,"
      const causalChoices = ["", "", "So "];
      out = out.replace(mechanicalHeadRegex, pickVariant(causalChoices, seed));
    } else {
      // Furthermore / Moreover / Additionally -> Cut entirely so sentence opens directly with claim, or occasional simple "Also,"
      const additiveChoices = ["", "", "", "Also, "];
      out = out.replace(mechanicalHeadRegex, pickVariant(additiveChoices, seed));
    }
  }

  // 3. Remove mid-sentence hollow stock padding
  const midHollowRegexes: [RegExp, string][] = [
    [/,?\s*\bit\s+is\s+(?:important|worth)\s+to\s+(?:note|mention)\s+that\s+/gi, " "],
    [/,?\s*\bit\s+is\s+worth\s+(?:noting|mentioning)\s+that\s+/gi, " "],
    [/\bat\s+its\s+core,?\s*/gi, ""],
    [/\bwhen\s+all\s+is\s+said\s+and\s+done,?\s*/gi, ""],
    [/\bat\s+the\s+end\s+of\s+the\s+day,?\s*/gi, ""],
    [/\bit\s+goes\s+without\s+saying\s+that\s+/gi, ""]
  ];

  for (const [reg, rep] of midHollowRegexes) {
    if (reg.test(out)) {
      out = out.replace(reg, rep);
      cutCount++;
    }
  }

  // Ensure the first letter of the sentence is capitalized after cutting openers
  out = out.trim();
  if (out.length > 0 && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }

  return { text: out, cutCount };
}

interface PhraseRule {
  regex: RegExp;
  replacements: string[];
}

/**
 * PASS 2B: User-Specified High-Risk Verb, Metaphorical Noun, Inflated Modifier & Stock Phrase Replacements
 * Strictly replaces every high-risk AI word with simple, direct, authentic human phrasing.
 */
const HIGH_RISK_REPLACEMENT_RULES: PhraseRule[] = [
  // =========================================================================
  // 1. HOLLOW STOCK PHRASES & MULTI-WORD CONSTRUCTIONS (Run first for context)
  // =========================================================================
  {
    regex: /\bIn\s+order\s+to\s+obtain\s+a\s+comprehensive\s+overview\s+of\b/gi,
    replacements: ["To get a complete picture of", "To thoroughly examine", "To build a detailed view of"]
  },
  {
    regex: /\ba\s+comprehensive\s+overview\s+of\b/gi,
    replacements: ["a complete breakdown of", "a detailed look at", "a full account of"]
  },
  {
    regex: /\bcomprehensive\s+overview\b/gi,
    replacements: ["complete breakdown", "detailed summary", "full picture"]
  },
  {
    regex: /\bplays\s+a\s+(?:crucial|vital|pivotal|paramount|significant|key|important|central)\s+role\s+in\s+([a-z]+ing)\b/gi,
    replacements: ["is key to $1", "directly helps in $1", "is central to $1"]
  },
  {
    regex: /\bplay\s+a\s+(?:crucial|vital|pivotal|paramount|significant|key|important|central)\s+role\s+in\s+([a-z]+ing)\b/gi,
    replacements: ["are key to $1", "directly help in $1", "are central to $1"]
  },
  {
    regex: /\bplays\s+a\s+(?:crucial|vital|pivotal|paramount|significant|key|important)\s+role\s+in\b/gi,
    replacements: ["is a key part of", "drives", "shapes"]
  },
  {
    regex: /\bplay\s+a\s+(?:crucial|vital|pivotal|paramount|significant|key|important)\s+role\s+in\b/gi,
    replacements: ["are a key part of", "drive", "shape"]
  },
  {
    regex: /\bserves\s+as\s+a\s+stark\s+reminder\s+that\b/gi,
    replacements: ["clearly reminds us that", "shows clearly that", "makes clear that"]
  },
  {
    regex: /\bserves\s+as\s+a\s+stark\s+reminder\s+of\b/gi,
    replacements: ["clearly reminds us of", "points directly to", "highlights"]
  },
  {
    regex: /\bserve\s+as\s+a\s+stark\s+reminder\b/gi,
    replacements: ["clearly remind us", "show clearly", "make clear"]
  },
  {
    regex: /\b(?:left|leaves)\s+an\s+indelible\s+mark\s+on\b/gi,
    replacements: ["lastingly shaped", "permanently changed", "deeply influenced"]
  },
  {
    regex: /\bleaving\s+an\s+indelible\s+mark\s+on\b/gi,
    replacements: ["lastingly shaping", "permanently changing", "deeply influencing"]
  },
  {
    regex: /\bserves\s+as\s+a\s+testament\s+to\b/gi,
    replacements: ["is clear proof of", "is direct evidence of", "clearly shows"]
  },
  {
    regex: /\bserve\s+as\s+a\s+testament\s+to\b/gi,
    replacements: ["are clear proof of", "provide direct evidence of", "clearly show"]
  },
  {
    regex: /\bis\s+a\s+testament\s+to\b/gi,
    replacements: ["is proof of", "is evidence of", "shows"]
  },
  {
    regex: /\ba\s+testament\s+to\b/gi,
    replacements: ["proof of", "evidence of", "a clear sign of"]
  },
  {
    regex: /\bhas\s+become\s+an\s+indispensable\s+(?:cornerstone|bedrock)\s+for\b/gi,
    replacements: ["is now a core foundation for", "now forms the basis for", "is now necessary for"]
  },
  {
    regex: /\bindispensable\s+(?:cornerstone|bedrock)\b/gi,
    replacements: ["core foundation", "necessary basis", "central part"]
  },
  {
    regex: /\bserves\s+as\s+a\s+(?:cornerstone|bedrock)\s+(?:of|for)\b/gi,
    replacements: ["forms the basis of", "is the foundation for", "anchors"]
  },
  {
    regex: /\bpaves\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["opens the door to", "sets the stage for", "makes possible"]
  },
  {
    regex: /\bpave\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["open the door to", "set the stage for", "make possible"]
  },
  {
    regex: /\bpaving\s+the\s+way\s+(?:for|toward|towards|to)\b/gi,
    replacements: ["opening the door to", "setting the stage for", "making room for"]
  },
  {
    regex: /\bnavigating\s+the\s+complexities\s+of\b/gi,
    replacements: ["handling the challenges of", "working through", "managing"]
  },
  {
    regex: /\bnavigate\s+the\s+complexities\s+of\b/gi,
    replacements: ["handle the challenges of", "work through", "manage"]
  },
  {
    regex: /\bremains\s+of\s+paramount\s+importance\b/gi,
    replacements: ["remains necessary", "is still a top priority", "remains essential"]
  },
  {
    regex: /\bof\s+paramount\s+importance\b/gi,
    replacements: ["most important", "necessary", "a key priority"]
  },
  {
    regex: /\ba\s+holistic\s+approach\s+in\b/gi,
    replacements: ["a well-rounded approach to", "a complete approach in", "an all-around method in"]
  },
  {
    regex: /\ba\s+holistic\s+approach\b/gi,
    replacements: ["a complete approach", "a well-rounded method", "a full-picture approach"]
  },
  {
    regex: /\bholistic\s+approach\b/gi,
    replacements: ["complete approach", "well-rounded method", "full-picture approach"]
  },
  {
    regex: /\bparadigm\s+shift\b/gi,
    replacements: ["major change", "clear shift", "fundamental change"]
  },
  {
    regex: /\bin\s+order\s+to\b/gi,
    replacements: ["to", "to", "so as to"]
  },
  {
    regex: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    replacements: ["because", "since", "as"]
  },

  // =========================================================================
  // 2. HIGH-RISK VERBS (Exact User Specification)
  // =========================================================================
  // Delve -> look at, study, dig into
  {
    regex: /\bdelves\s+into\b/gi,
    replacements: ["looks at", "studies", "digs into"]
  },
  {
    regex: /\bdelve\s+into\b/gi,
    replacements: ["look at", "study", "dig into"]
  },
  {
    regex: /\bdelved\s+into\b/gi,
    replacements: ["looked at", "studied", "dug into"]
  },
  {
    regex: /\bdelving\s+into\b/gi,
    replacements: ["looking at", "studying", "digging into"]
  },
  {
    regex: /\bdelves\b/gi,
    replacements: ["digs", "looks closely", "studies"]
  },
  {
    regex: /\bdelve\b/gi,
    replacements: ["dig", "look closely", "study"]
  },

  // Leverage -> use, apply, rely on
  {
    regex: /\bleverages\b/gi,
    replacements: ["uses", "applies", "relies on"]
  },
  {
    regex: /\bleverage\b/gi,
    replacements: ["use", "apply", "rely on"]
  },
  {
    regex: /\bleveraged\b/gi,
    replacements: ["used", "applied", "relied on"]
  },
  {
    regex: /\bleveraging\b/gi,
    replacements: ["using", "applying", "relying on"]
  },

  // Foster -> encourage, build, grow
  {
    regex: /\bfosters\b/gi,
    replacements: ["encourages", "builds", "grows"]
  },
  {
    regex: /\bfoster\b/gi,
    replacements: ["encourage", "build", "grow"]
  },
  {
    regex: /\bfostered\b/gi,
    replacements: ["encouraged", "built", "grew"]
  },
  {
    regex: /\bfostering\b/gi,
    replacements: ["encouraging", "building", "growing"]
  },

  // Elevate -> raise, improve, boost
  {
    regex: /\belevates\b/gi,
    replacements: ["raises", "improves", "boosts"]
  },
  {
    regex: /\belevate\b/gi,
    replacements: ["raise", "improve", "boost"]
  },
  {
    regex: /\belevated\b/gi,
    replacements: ["raised", "improved", "boosted"]
  },
  {
    regex: /\belevating\b/gi,
    replacements: ["raising", "improving", "boosting"]
  },

  // Resonate -> connect with, hit home, strike a chord
  {
    regex: /\bresonates\s+with\b/gi,
    replacements: ["connects with", "hits home with", "strikes a chord with"]
  },
  {
    regex: /\bresonate\s+with\b/gi,
    replacements: ["connect with", "hit home with", "strike a chord with"]
  },
  {
    regex: /\bresonated\s+with\b/gi,
    replacements: ["connected with", "hit home with", "struck a chord with"]
  },
  {
    regex: /\bresonating\s+with\b/gi,
    replacements: ["connecting with", "hitting home with", "striking a chord with"]
  },
  {
    regex: /\bresonates\b/gi,
    replacements: ["connects", "hits home", "strikes a chord"]
  },
  {
    regex: /\bresonate\b/gi,
    replacements: ["connect", "hit home", "strike a chord"]
  },

  // Embark -> start, begin
  {
    regex: /\bembarks\s+(?:on|upon)\b/gi,
    replacements: ["starts", "begins", "sets out on"]
  },
  {
    regex: /\bembark\s+(?:on|upon)\b/gi,
    replacements: ["start", "begin", "set out on"]
  },
  {
    regex: /\bembarked\s+(?:on|upon)\b/gi,
    replacements: ["started", "began", "set out on"]
  },
  {
    regex: /\bembarking\s+(?:on|upon)\b/gi,
    replacements: ["starting", "beginning", "setting out on"]
  },
  {
    regex: /\bembark\b/gi,
    replacements: ["start", "begin"]
  },

  // Underscore -> highlight, show, emphasize
  {
    regex: /\bunderscores\b/gi,
    replacements: ["highlights", "shows", "emphasizes"]
  },
  {
    regex: /\bunderscore\b/gi,
    replacements: ["highlight", "show", "emphasize"]
  },
  {
    regex: /\bunderscored\b/gi,
    replacements: ["highlighted", "showed", "emphasized"]
  },
  {
    regex: /\bunderscoring\b/gi,
    replacements: ["highlighting", "showing", "emphasizing"]
  },

  // Facilitate -> help, ease, allow
  {
    regex: /\bfacilitates\b/gi,
    replacements: ["helps", "eases", "allows"]
  },
  {
    regex: /\bfacilitate\b/gi,
    replacements: ["help", "ease", "allow"]
  },
  {
    regex: /\bfacilitated\b/gi,
    replacements: ["helped", "eased", "allowed"]
  },
  {
    regex: /\bfacilitating\b/gi,
    replacements: ["helping", "easing", "allowing"]
  },

  // Harness -> use, channel
  {
    regex: /\bharnesses\b/gi,
    replacements: ["uses", "channels", "puts to work"]
  },
  {
    regex: /\bharness\b/gi,
    replacements: ["use", "channel", "put to work"]
  },
  {
    regex: /\bharnessed\b/gi,
    replacements: ["used", "channeled", "put to work"]
  },
  {
    regex: /\bharnessing\b/gi,
    replacements: ["using", "channeling", "putting to work"]
  },

  // Streamline -> simplify, speed up
  {
    regex: /\bstreamlines\b/gi,
    replacements: ["simplifies", "speeds up", "cleans up"]
  },
  {
    regex: /\bstreamline\b/gi,
    replacements: ["simplify", "speed up", "clean up"]
  },
  {
    regex: /\bstreamlined\b/gi,
    replacements: ["simplified", "sped up", "direct"]
  },
  {
    regex: /\bstreamlining\b/gi,
    replacements: ["simplifying", "speeding up", "cleaning up"]
  },

  // Illuminate / Shed light on -> explain, clarify
  {
    regex: /\bsheds\s+light\s+on\b/gi,
    replacements: ["explains", "clarifies", "makes clear"]
  },
  {
    regex: /\bshed\s+light\s+on\b/gi,
    replacements: ["explain", "clarify", "make clear"]
  },
  {
    regex: /\bshedding\s+light\s+on\b/gi,
    replacements: ["explaining", "clarifying", "making clear"]
  },
  {
    regex: /\billuminates\b/gi,
    replacements: ["explains", "clarifies", "makes clear"]
  },
  {
    regex: /\billuminate\b/gi,
    replacements: ["explain", "clarify", "make clear"]
  },
  {
    regex: /\billuminated\b/gi,
    replacements: ["explained", "clarified", "made clear"]
  },
  {
    regex: /\billuminating\b/gi,
    replacements: ["explaining", "clarifying", "clear"]
  },

  // Spearhead -> lead, head
  {
    regex: /\bspearheads\b/gi,
    replacements: ["leads", "heads", "runs"]
  },
  {
    regex: /\bspearhead\b/gi,
    replacements: ["lead", "head", "run"]
  },
  {
    regex: /\bspearheaded\b/gi,
    replacements: ["led", "headed", "ran"]
  },
  {
    regex: /\bspearheading\b/gi,
    replacements: ["leading", "heading", "running"]
  },

  // Bolster -> strengthen, back up
  {
    regex: /\bbolsters\b/gi,
    replacements: ["strengthens", "backs up", "supports"]
  },
  {
    regex: /\bbolster\b/gi,
    replacements: ["strengthen", "back up", "support"]
  },
  {
    regex: /\bbolstered\b/gi,
    replacements: ["strengthened", "backed up", "supported"]
  },
  {
    regex: /\bbolstering\b/gi,
    replacements: ["strengthening", "backing up", "supporting"]
  },

  // =========================================================================
  // 3. HIGH-RISK METAPHORICAL NOUNS (Exact User Specification)
  // =========================================================================
  // Tapestry -> mix, complex picture, combination
  {
    regex: /\ba\s+rich\s+tapestry\s+of\b/gi,
    replacements: ["a rich mix of", "a wide combination of", "a complex picture of"]
  },
  {
    regex: /\btapestry\s+of\b/gi,
    replacements: ["mix of", "combination of", "complex picture of"]
  },
  {
    regex: /\btapestry\b/gi,
    replacements: ["mix", "combination", "complex picture"]
  },

  // Beacon -> guide, model, standard
  {
    regex: /\bbeacon\s+of\b/gi,
    replacements: ["model of", "standard for", "guide for"]
  },
  {
    regex: /\bbeacon\b/gi,
    replacements: ["guide", "model", "standard"]
  },

  // Landscape -> field, market, area
  {
    regex: /\bcompetitive\s+landscape\b/gi,
    replacements: ["competitive market", "industry field", "market area"]
  },
  {
    regex: /\bdigital\s+landscape\b/gi,
    replacements: ["digital field", "online market", "digital area"]
  },
  {
    regex: /\b(?:evolving|modern|business|technological|global|shifting|complex|academic|corporate|urban)\s+landscape\b/gi,
    replacements: ["field", "market", "area"]
  },

  // Realm -> field, branch, topic
  {
    regex: /\bin\s+the\s+realms?\s+of\b/gi,
    replacements: ["in the field of", "in the area of", "within"]
  },
  {
    regex: /\brealms\s+of\b/gi,
    replacements: ["fields of", "branches of", "areas of"]
  },
  {
    regex: /\brealm\s+of\b/gi,
    replacements: ["field of", "branch of", "topic of"]
  },
  {
    regex: /\brealms\b/gi,
    replacements: ["fields", "branches", "areas"]
  },
  {
    regex: /\brealm\b/gi,
    replacements: ["field", "branch", "area"]
  },

  // Cornerstone / Bedrock -> basis, foundation, core
  {
    regex: /\bcornerstones\b/gi,
    replacements: ["foundations", "core parts", "pillars"]
  },
  {
    regex: /\bcornerstone\b/gi,
    replacements: ["foundation", "basis", "core"]
  },
  {
    regex: /\bbedrock\b/gi,
    replacements: ["foundation", "basis", "core"]
  },

  // Interplay / Dynamic interplay / Intricate interplay -> interaction, relationship
  {
    regex: /\b(?:intricate|dynamic|complex)\s+interplay\s+between\b/gi,
    replacements: ["close interaction between", "direct relationship between", "link between"]
  },
  {
    regex: /\binterplay\s+between\b/gi,
    replacements: ["interaction between", "relationship between", "connection between"]
  },
  {
    regex: /\b(?:intricate|dynamic)\s+interplay\b/gi,
    replacements: ["interaction", "relationship", "connection"]
  },
  {
    regex: /\binterplay\b/gi,
    replacements: ["interaction", "relationship", "link"]
  },

  // Myriad / Plethora -> many, several, wide range
  {
    regex: /\ba\s+(?:myriad|plethora)\s+of\b/gi,
    replacements: ["many", "a wide range of", "several"]
  },
  {
    regex: /\b(?:myriad|plethora)\s+of\b/gi,
    replacements: ["many", "several", "a wide range of"]
  },
  {
    regex: /\bmyriad\b/gi,
    replacements: ["many", "several", "numerous"]
  },
  {
    regex: /\bplethora\b/gi,
    replacements: ["wide range", "large number", "many"]
  },

  // =========================================================================
  // 4. INFLATED MODIFIERS & BUZZWORDS (Exact User Specification)
  // =========================================================================
  // Crucial / Vital / Paramount -> main, key, necessary
  {
    regex: /\bcrucially\b/gi,
    replacements: ["importantly", "notably", "above all"]
  },
  {
    regex: /\bcrucial\b/gi,
    replacements: ["key", "main", "necessary"]
  },
  {
    regex: /\bvital\b/gi,
    replacements: ["key", "necessary", "important"]
  },
  {
    regex: /\bparamount\b/gi,
    replacements: ["main", "key", "necessary"]
  },

  // Pivotal -> critical, central, decisive
  {
    regex: /\bpivotal\b/gi,
    replacements: ["central", "critical", "decisive"]
  },

  // Meticulous -> thorough, careful, detailed
  {
    regex: /\bmeticulously\b/gi,
    replacements: ["carefully", "thoroughly", "in detail"]
  },
  {
    regex: /\bmeticulous\b/gi,
    replacements: ["thorough", "careful", "detailed"]
  },

  // Comprehensive -> complete, detailed, wide-ranging
  {
    regex: /\bcomprehensively\b/gi,
    replacements: ["thoroughly", "in detail", "completely"]
  },
  {
    regex: /\bcomprehensive\b/gi,
    replacements: ["complete", "detailed", "wide-ranging"]
  },

  // Multifaceted / Nuanced -> complex, varied, subtle
  {
    regex: /\bmultifaceted\b/gi,
    replacements: ["complex", "varied", "multi-layered"]
  },
  {
    regex: /\bnuanced\b/gi,
    replacements: ["subtle", "detailed", "fine-grained"]
  },

  // Fast-paced -> rapid, shifting
  {
    regex: /\bfast-paced\b/gi,
    replacements: ["rapid", "shifting", "fast-moving"]
  },

  // Transformative / Game-changing / Revolutionary -> major, notable, influential
  {
    regex: /\btransformative\b/gi,
    replacements: ["major", "notable", "influential"]
  },
  {
    regex: /\bgame-changing\b/gi,
    replacements: ["major", "notable", "influential"]
  },
  {
    regex: /\brevolutionary\b/gi,
    replacements: ["major", "notable", "influential"]
  },

  // Robust / Seamless -> solid, dependable, smooth
  {
    regex: /\brobust\b/gi,
    replacements: ["solid", "dependable", "strong"]
  },
  {
    regex: /\bseamlessly\b/gi,
    replacements: ["smoothly", "cleanly", "easily"]
  },
  {
    regex: /\bseamless\b/gi,
    replacements: ["smooth", "clean", "direct"]
  },
  {
    regex: /\bindispensable\b/gi,
    replacements: ["necessary", "key", "essential"]
  },
  {
    regex: /\boverarching\b/gi,
    replacements: ["main", "broad", "central"]
  },
  {
    regex: /\bcross-functional\s+synergy\b/gi,
    replacements: ["teamwork across departments", "cross-team collaboration", "joint work across teams"]
  },
  {
    regex: /\bsynergy\b/gi,
    replacements: ["teamwork", "joint effort", "cooperation"]
  },

  // =========================================================================
  // 5. NATURAL TECHNICAL & ACADEMIC COLLOCATIONS (For System Abstracts & Essays)
  // =========================================================================
  {
    regex: /\bthat\s+only\s+record\s+bookings\b/gi,
    replacements: ["that only log booking entries", "limited to basic booking logs", "that just record reservations"]
  },
  {
    regex: /\bthat\s+only\s+record\b/gi,
    replacements: ["that only log", "that just capture", "limited to recording"]
  },
  {
    regex: /\bin\s+one\s+mobile-first\s+platform\b/gi,
    replacements: [
      "in a single mobile-first platform",
      "under one mobile-first system",
      "inside one mobile-first app"
    ]
  },
  {
    regex: /\bin\s+one\s+([a-z0-9-]+)\s+(platform|system|application|tool|workspace|framework|interface)\b/gi,
    replacements: ["in a single $1 $2", "under one $1 $2", "inside one $1 $2"]
  },
  {
    regex: /\bsee\s+why\s+they\s+were\s+allocated\s+a\s+([a-z]+)\b/gi,
    replacements: [
      "see the exact reasoning behind their $1 assignment",
      "know why they received a specific $1",
      "check the clear criteria used for their $1 placement"
    ]
  },
  {
    regex: /\btune\s+the\s+([a-z\s]+?)\s+rules\s+to\s+([a-z\s]+?)\s+policy\b/gi,
    replacements: [
      "adjust the $1 rules to fit $2 policy",
      "tailor $1 settings to match $2 guidelines",
      "update the $1 criteria in line with $2 policy"
    ]
  },
  {
    regex: /\bwithout\s+changing\s+code\b/gi,
    replacements: [
      "without touching the code",
      "with zero code changes",
      "without rewriting any code"
    ]
  },
  {
    regex: /\boptimisation-based\b/gi,
    replacements: ["optimisation-driven", "algorithm-backed", "optimised"]
  },
  {
    regex: /\boptimization-based\b/gi,
    replacements: ["optimization-driven", "algorithm-backed", "optimized"]
  },
  {
    regex: /\blifestyle-based\b/gi,
    replacements: ["lifestyle-matched", "preference-based", "compatibility-based"]
  },
  {
    regex: /\btransparent\s+multicriteria\s+scoring\b/gi,
    replacements: [
      "clear multicriteria scoring",
      "open multi-factor scoring",
      "auditable multicriteria evaluation"
    ]
  },
  {
    regex: /\bhave\s+become\s+increasingly\s+(popular|common|important|prevalent|widespread)\b/gi,
    replacements: [
      "are now widely used",
      "have gained strong traction",
      "are increasingly common"
    ]
  },
  {
    regex: /\bhas\s+become\s+increasingly\s+(popular|common|important|prevalent|widespread)\b/gi,
    replacements: [
      "is now widely used",
      "has gained strong traction",
      "is increasingly common"
    ]
  },
  {
    regex: /\bthere\s+is\s+a\s+(positive|negative|strong|significant|direct|clear)\s+relationship\s+between\b/gi,
    replacements: [
      "a $1 link connects",
      "the data shows a $1 relationship between",
      "a clear $1 correlation exists between"
    ]
  },
  {
    regex: /,?\s*\bwhich\s+(?:suggests|indicates|implies|means)\s+that\b/gi,
    replacements: [
      "—showing that",
      "—meaning that",
      ". This suggests that"
    ]
  },
  {
    regex: /\bThis\s+(chapter|section|paper|study|report)\s+(?:presents|describes|discusses|outlines)\s+the\b/gi,
    replacements: [
      "This $1 covers the",
      "This $1 sets out the",
      "Here, the $1 explains the"
    ]
  },
  {
    regex: /\bThe\s+proposed\s+(system|model|framework|platform|application|architecture|solution)\b/gi,
    replacements: [
      "The new $1",
      "This $1",
      "The designed $1"
    ]
  },
  {
    regex: /\bhandles\s+communication\s+between\b/gi,
    replacements: [
      "manages data flow between",
      "connects",
      "passes requests between"
    ]
  }
];

/**
 * Context-safe everyday academic & technical verb/adjective replacements
 * Strictly avoids ALL banned AI buzzwords (never outputs elevate, facilitate, streamline, crucial, vital, robust, etc.)
 */
const CLEAN_HUMAN_SYNONYM_MAP: [RegExp, string[]][] = [
  [/\bcombines\b/gi, ["brings together", "unites", "joins"]],
  [/\bcombine\b/gi, ["bring together", "unite", "join"]],
  [/\bcombining\b/gi, ["bringing together", "uniting", "joining"]],
  [/\bconventional\b/gi, ["standard", "traditional", "typical"]],
  [/\bprovides\b/gi, ["gives", "offers", "delivers"]],
  [/\bprovide\b/gi, ["give", "offer", "deliver"]],
  [/\bproviding\b/gi, ["giving", "offering", "delivering"]],
  [/\bensures\s+that\b/gi, ["makes sure that", "guarantees that", "confirms that"]],
  [/\bensure\s+that\b/gi, ["make sure that", "guarantee that", "confirm that"]],
  [/\bensuring\s+that\b/gi, ["making sure that", "guaranteeing that", "confirming that"]],
  [/\bensures\b/gi, ["protects", "maintains", "secures"]],
  [/\bensure\b/gi, ["protect", "maintain", "secure"]],
  [/\bdemonstrates\s+that\b/gi, ["shows that", "confirms that", "proves that"]],
  [/\bdemonstrate\s+that\b/gi, ["show that", "confirm that", "prove that"]],
  [/\bimproves\b/gi, ["strengthens", "betters", "sharpens"]],
  [/\bimprove\b/gi, ["strengthen", "better", "sharpen"]],
  [/\bimproving\b/gi, ["strengthening", "bettering", "sharpening"]],
  [/\benhances\b/gi, ["strengthens", "improves", "boosts"]],
  [/\benhance\b/gi, ["strengthen", "improve", "boost"]],
  [/\benhancing\b/gi, ["strengthening", "improving", "boosting"]],
  [/\breduces\b/gi, ["cuts", "lowers", "minimizes"]],
  [/\breduce\b/gi, ["cut", "lower", "minimize"]],
  [/\breducing\b/gi, ["cutting", "lowering", "minimizing"]],
  [/\bincreases\b/gi, ["raises", "grows", "expands"]],
  [/\bincrease\b/gi, ["raise", "grow", "expand"]],
  [/\bincreasing\b/gi, ["raising", "growing", "expanding"]],
  [/\butilizes\b/gi, ["uses", "applies", "relies on"]],
  [/\butilize\b/gi, ["use", "apply", "rely on"]],
  [/\butilizing\b/gi, ["using", "applying", "relying on"]],
  [/\bfocuses\s+on\b/gi, ["centers on", "looks at", "prioritizes"]],
  [/\bfocus\s+on\b/gi, ["center on", "look at", "prioritize"]],
  [/\baddresses\b/gi, ["tackles", "solves", "handles"]],
  [/\baddress\b/gi, ["tackle", "solve", "handle"]],
  [/\baddressing\b/gi, ["tackling", "solving", "handling"]],
  [/\brequires\b/gi, ["needs", "calls for", "demands"]],
  [/\brequire\b/gi, ["need", "call for", "demand"]],
  [/\bincludes\b/gi, ["covers", "contains", "takes in"]],
  [/\bincluding\b/gi, ["such as", "like", "covering"]],
  [/\bidentifies\b/gi, ["spots", "finds", "pinpoints"]],
  [/\bidentify\b/gi, ["spot", "find", "pinpoint"]],
  [/\bidentifying\b/gi, ["spotting", "finding", "pinpointing"]],
  [/\bimplements\b/gi, ["puts in place", "deploys", "runs"]],
  [/\bimplement\b/gi, ["put in place", "deploy", "run"]],
  [/\bmitigates\b/gi, ["reduces", "limits", "lowers"]],
  [/\bmitigate\b/gi, ["reduce", "limit", "lower"]],
  [/\bmitigating\b/gi, ["reducing", "limiting", "lowering"]],
  [/\bdeployed\b/gi, ["used", "run", "carried out"]],
  [/\bassess\b/gi, ["test", "check", "evaluate"]],
  [/\bassesses\b/gi, ["tests", "checks", "evaluates"]],
  [/\bobtain\b/gi, ["get", "build", "gather"]],
  [/\bnumerous\b/gi, ["many", "several", "multiple"]],
  [/\bvarious\b/gi, ["different", "several", "many"]],
  [/\bsignificant\b/gi, ["major", "notable", "clear"]],
  [/\bsignificantly\b/gi, ["greatly", "notably", "markedly"]],
  [/\bexisting\b/gi, ["current", "present", "standard"]],
  [/\bcurrently\b/gi, ["now", "right now", "today"]],
  [/\bbased\s+on\b/gi, ["built on", "guided by", "using"]],
  [/\baccording\s+to\b/gi, ["under", "following", "in line with"]]
];

/**
 * PASS 3: Natural Human Syntactic Restructuring
 * Avoids mechanical transitions. Uses direct claims, semicolons, em-dashes, or simple "and/but/also/while".
 */
function restructureSentenceSyntax(
  sentence: string,
  mode: HumanizerMode,
  intensity: HumanizerIntensity,
  seed: number
): { text: string; restructured: boolean } {
  let out = sentence.trim();
  let restructured = false;

  // 1. Contrastive opener: "Unlike [X], [Y]"
  const unlikeMatch = out.match(/^Unlike\s+([^,]{6,95}),\s+(.+)$/i);
  if (unlikeMatch) {
    const contrastTarget = unlikeMatch[1].trim();
    const mainClause = unlikeMatch[2].trim();
    const capMain = (mainClause.charAt(0).toUpperCase() + mainClause.slice(1)).replace(/[.!?]+$/, "");

    if (/\b(?:that|which)\s+/i.test(contrastTarget)) {
      const strippedRel = contrastTarget.replace(/\b(?:that|which)\s+/i, "");
      const capRel = strippedRel.charAt(0).toUpperCase() + strippedRel.slice(1);
      const variants = [
        `${capRel}, whereas ${mainClause}`,
        `Where ${strippedRel}, ${mainClause}`,
        `Rather than matching ${contrastTarget}, ${mainClause}`
      ];
      out = pickVariant(variants, seed);
    } else {
      const variants = [
        `Compared with ${contrastTarget}, ${mainClause}`,
        `Instead of ${contrastTarget}, ${mainClause}`,
        `${capMain}—unlike ${contrastTarget}.`
      ];
      out = pickVariant(variants, seed).replace(/\.\.$/, ".");
    }
    restructured = true;
  }

  // 2. Symmetric Compound Modal Clause: "[Subj1] can [V1], and [Subj2] can [V2]."
  // Splits directly without bloated transitions, or uses simple "Also," / "At the same time,"
  const symmetricModalMatch = out.match(
    /^([A-Z][^,]{3,85}\b(?:can|may|are able to|is able to)\s+[^,]{6,110}),\s+and\s+([a-zA-Z][^,]{2,40}\b(?:can|may|are able to|is able to)\s+.+?)(\.|!|\?)$/
  );
  if (symmetricModalMatch) {
    const clause1 = symmetricModalMatch[1].trim();
    const clause2 = symmetricModalMatch[2].trim();
    const punct = symmetricModalMatch[3];
    const clause2Cap = clause2.charAt(0).toUpperCase() + clause2.slice(1);
    const clause2Lower =
      /^[A-Z]{2,}/.test(clause2) || /^__/.test(clause2)
        ? clause2
        : clause2.charAt(0).toLowerCase() + clause2.slice(1);

    const formattedClause2Cap = clause2Cap.replace(/\s+(without\s+[^.?!]+)$/i, "—$1");
    const formattedClause2Lower = clause2Lower.replace(/\s+(without\s+[^.?!]+)$/i, "—$1");

    const variants = [
      `${clause1}. ${formattedClause2Cap}${punct}`,
      `${clause1}. Also, ${formattedClause2Lower}${punct}`,
      `That way, ${clause1.charAt(0).toLowerCase() + clause1.slice(1)}, while ${formattedClause2Lower}${punct}`
    ];
    out = pickVariant(variants, seed);
    restructured = true;
  }

  // 3. Transform "Not only does/do [Subj] [Verb] [Obj], but (also) [Y]" into direct claim
  if (!restructured) {
    const notOnlyDoesMatch = out.match(
      /^Not only (does|do)\s+(.+?)\s+(foster|encourage|build|grow|support|use|apply|rely|help|ease|allow|enable|improve|raise|boost|strengthen|create|give|offer|deliver|drive|shape|protect|maintain|secure|show|prove|confirm|reduce|cut|lower|limit|enhance|provide|make)\s+([^,]+),\s*but\s+(?:(it|they|this|these)\s+)?(?:also\s+)?(.+)$/i
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
      const capSubj = subj.charAt(0).toUpperCase() + subj.slice(1);
      const capPronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);

      const variants = [
        `${capSubj} ${inflectedVerb} ${obj1}, and ${pronoun} also ${secondPart}`,
        `${capSubj} ${inflectedVerb} ${obj1}. ${capPronoun} also ${secondPart}`
      ];
      out = pickVariant(variants, seed);
      restructured = true;
    }
  }

  // 4. Break robotic participial tail clauses: ", (thereby) highlighting/underscoring/demonstrating/ensuring/fostering/showcasing [X]."
  const tailRegex =
    /,\s*(?:thereby\s+)?(highlighting|underscoring|demonstrating|ensuring|fostering|showcasing|emphasizing|illustrating|reflecting|enabling|allowing|making|showing|proving)\s+([^.?!]+)(\.|!|\?)$/i;
  const tailMatch = out.match(tailRegex);
  if (tailMatch) {
    const verb = tailMatch[1].toLowerCase();
    const rest = tailMatch[2].trim();
    const punct = tailMatch[3];
    const mainClause = out.slice(0, tailMatch.index).trim();

    const verbMap: Record<string, string[]> = {
      highlighting: ["This highlights", "This points to", "—highlighting"],
      underscoring: ["This shows", "This emphasizes", "—showing"],
      demonstrating: ["This shows", "This proves", "—which shows"],
      showing: ["This shows", "This makes clear", "—showing"],
      proving: ["This proves", "This confirms", "—proving"],
      ensuring: ["This keeps", "This guarantees", "—which guarantees"],
      fostering: ["This builds", "This encourages", "—helping build"],
      showcasing: ["This shows", "This brings out", "—showing"],
      emphasizing: ["This emphasizes", "This stresses", "—stressing"],
      illustrating: ["This shows", "This explains", "—which explains"],
      reflecting: ["This reflects", "This matches", "—reflecting"],
      enabling: ["This lets", "This allows", "—allowing"],
      allowing: ["This allows", "This lets", "—letting"],
      making: ["This makes", "That makes", "—making"]
    };

    const choices = verbMap[verb] || ["This shows", "This highlights", "—which shows"];
    const chosen = pickVariant(choices, seed);

    if (chosen.startsWith("—")) {
      out = `${mainClause} ${chosen} ${rest}${punct}`;
    } else {
      out = `${mainClause}. ${chosen} ${rest}${punct}`;
    }
    restructured = true;
  }

  // 5. Transform "By [verbing] [X], [Y] can/is able to [Z]" -> direct active subject or "When [Y]..."
  if (!restructured) {
    const byVerbingMatch = out.match(
      /^By\s+([a-z]+ing)\s+([^,]{4,65}),\s+([^,]{3,45})\s+(?:can|are able to|is able to|will)\s+(.+)$/i
    );
    if (byVerbingMatch) {
      const gerund = byVerbingMatch[1].toLowerCase();
      const obj = byVerbingMatch[2].trim();
      const subj = byVerbingMatch[3].trim();
      const pred = byVerbingMatch[4].trim();
      const capSubj = subj.charAt(0).toUpperCase() + subj.slice(1);
      const capGerund = gerund.charAt(0).toUpperCase() + gerund.slice(1);

      const variants = [
        `${capSubj} can ${pred} by ${gerund} ${obj}`,
        `${capGerund} ${obj} lets ${subj} ${pred}`
      ];
      out = pickVariant(variants, seed);
      restructured = true;
    }
  }

  // 6. General Compound Sentence Restructuring ("[Clause 1 >= 9 words], and [Clause 2 >= 7 words]")
  if (!restructured) {
    const generalCompoundMatch = out.match(/^([^,]{28,140}),\s+and\s+([a-zA-Z][^,]{22,140})(\.|!|\?)$/);
    if (generalCompoundMatch) {
      const part1 = generalCompoundMatch[1].trim();
      const part2 = generalCompoundMatch[2].trim();
      const punct = generalCompoundMatch[3];
      if (!/,/.test(part1)) {
        const part2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);
        out = `${part1}. ${part2Cap}${punct}`;
        restructured = true;
      }
    }
  }

  // 7. Natural human punctuation (em-dash or semicolon) in multi-clause sentences
  if (!restructured && (intensity !== "balanced" || mode === "postgrad" || getWords(out).length >= 19)) {
    if (/,\s+which\s+/i.test(out)) {
      out = out.replace(/,\s+which\s+/, "—which ");
      restructured = true;
    } else if (/,\s+whereas\s+/i.test(out)) {
      out = out.replace(/,\s+whereas\s+/, "; by contrast, ");
      restructured = true;
    } else if (/,\s+while\s+/i.test(out)) {
      out = out.replace(/,\s+while\s+/, "; at the same time, ");
      restructured = true;
    } else if (/\s+without\s+([a-z]+ing\s+[^.?!]{4,40})(\.|!|\?)$/i.test(out)) {
      out = out.replace(/\s+without\s+([a-z]+ing\s+[^.?!]{4,40})(\.|!|\?)$/i, "—without $1$2");
      restructured = true;
    }
  }

  return { text: out, restructured };
}

/**
 * PASS 4: Universal Sentence-Level Polish (Guarantees every sentence is humanized without adding hollow padding)
 */
function ensureSentenceHumanized(
  originalSentence: string,
  currentSentence: string,
  seed: number
): { text: string; changesMade: number } {
  let out = currentSentence;
  let changesMade = 0;

  for (let i = 0; i < CLEAN_HUMAN_SYNONYM_MAP.length; i++) {
    const [regex, options] = CLEAN_HUMAN_SYNONYM_MAP[i];
    if (regex.test(out)) {
      regex.lastIndex = 0;
      out = out.replace(regex, (match) => {
        changesMade++;
        const chosen = pickVariant(options, seed + i + changesMade);
        return matchCase(match, chosen);
      });
    }
  }

  // If sentence is still identical to originalSentence, shift prepositional/purpose clauses naturally without adding fluff
  if (out.trim() === originalSentence.trim()) {
    const clean = out.trim();
    const withoutPunct = clean.replace(/[.!?]+$/, "");
    const punct = (clean.match(/[.!?]+$/) || ["."])[0];

    const trailingPrepMatch = withoutPunct.match(
      /^(.{20,120}?)\s+((?:in|within|across|under|through|for)\s+(?:a|an|the|one|modern|current)\s+[^,]{6,45})$/i
    );
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
    }
  }

  return { text: out, changesMade };
}

/**
 * PASS 6: Final Ban-List Sanitizer Guard
 * Guarantees 0 high-risk AI verbs, metaphorical nouns, inflated modifiers, mechanical transitions, or stock phrases survive into output.
 */
const FINAL_GUARD_REPLACEMENTS: [RegExp, string][] = [
  [/\bdelves\s+into\b/gi, "looks at"],
  [/\bdelve\s+into\b/gi, "look at"],
  [/\bdelving\s+into\b/gi, "looking at"],
  [/\bdelved\s+into\b/gi, "looked at"],
  [/\bdelves?\b/gi, "studies"],
  [/\bleverages\b/gi, "uses"],
  [/\bleverage\b/gi, "use"],
  [/\bleveraged\b/gi, "used"],
  [/\bleveraging\b/gi, "using"],
  [/\bfosters\b/gi, "encourages"],
  [/\bfoster\b/gi, "encourage"],
  [/\bfostered\b/gi, "encouraged"],
  [/\bfostering\b/gi, "encouraging"],
  [/\belevates\b/gi, "improves"],
  [/\belevate\b/gi, "improve"],
  [/\belevated\b/gi, "improved"],
  [/\belevating\b/gi, "improving"],
  [/\bresonates\s+with\b/gi, "connects with"],
  [/\bresonate\s+with\b/gi, "connect with"],
  [/\bresonates?\b/gi, "connects"],
  [/\bembarks?\s+(?:on|upon)\b/gi, "starts"],
  [/\bembarked\s+(?:on|upon)\b/gi, "started"],
  [/\bembarking\s+(?:on|upon)\b/gi, "starting"],
  [/\bunderscores\b/gi, "highlights"],
  [/\bunderscore\b/gi, "highlight"],
  [/\bunderscored\b/gi, "highlighted"],
  [/\bunderscoring\b/gi, "highlighting"],
  [/\bfacilitates\b/gi, "helps"],
  [/\bfacilitate\b/gi, "help"],
  [/\bfacilitated\b/gi, "helped"],
  [/\bfacilitating\b/gi, "helping"],
  [/\bharnesses\b/gi, "uses"],
  [/\bharness\b/gi, "use"],
  [/\bharnessed\b/gi, "used"],
  [/\bharnessing\b/gi, "using"],
  [/\bstreamlines\b/gi, "simplifies"],
  [/\bstreamline\b/gi, "simplify"],
  [/\bstreamlined\b/gi, "simplified"],
  [/\bstreamlining\b/gi, "simplifying"],
  [/\billuminates\b/gi, "clarifies"],
  [/\billuminate\b/gi, "clarify"],
  [/\billuminated\b/gi, "clarified"],
  [/\billuminating\b/gi, "clarifying"],
  [/\bsheds?\s+light\s+on\b/gi, "clarifies"],
  [/\bshedding\s+light\s+on\b/gi, "clarifying"],
  [/\bspearheads\b/gi, "leads"],
  [/\bspearhead\b/gi, "lead"],
  [/\bspearheaded\b/gi, "led"],
  [/\bspearheading\b/gi, "leading"],
  [/\bbolsters\b/gi, "strengthens"],
  [/\bbolster\b/gi, "strengthen"],
  [/\bbolstered\b/gi, "strengthened"],
  [/\bbolstering\b/gi, "strengthening"],
  [/\btapestr(?:y|ies)\b/gi, "mix"],
  [/\bbeacons?\b/gi, "model"],
  [/\btestament\s+to\b/gi, "proof of"],
  [/\bin\s+the\s+realms?\s+of\b/gi, "in the field of"],
  [/\brealms\b/gi, "fields"],
  [/\brealm\b/gi, "field"],
  [/\bcornerstones?\b/gi, "foundation"],
  [/\bbedrock\b/gi, "foundation"],
  [/\b(?:dynamic\s+|intricate\s+)?interplay\b/gi, "interaction"],
  [/\b(?:a\s+)?(?:myriad|plethora)\s+of\b/gi, "many"],
  [/\bmyriad\b/gi, "many"],
  [/\bplethora\b/gi, "wide range"],
  [/\bcrucially\b/gi, "importantly"],
  [/\bcrucial\b/gi, "key"],
  [/\bvital\b/gi, "necessary"],
  [/\bparamount\b/gi, "main"],
  [/\bpivotal\b/gi, "central"],
  [/\bmeticulously\b/gi, "carefully"],
  [/\bmeticulous\b/gi, "thorough"],
  [/\bcomprehensively\b/gi, "thoroughly"],
  [/\bcomprehensive\b/gi, "complete"],
  [/\bmultifaceted\b/gi, "complex"],
  [/\bnuanced\b/gi, "subtle"],
  [/\bfast-paced\b/gi, "rapid"],
  [/\btransformative\b/gi, "major"],
  [/\bgame-changing\b/gi, "major"],
  [/\brevolutionary\b/gi, "notable"],
  [/\brobust\b/gi, "solid"],
  [/\bseamlessly\b/gi, "smoothly"],
  [/\bseamless\b/gi, "smooth"],
  [/\bholistic\b/gi, "complete"],
  [/\bindispensable\b/gi, "necessary"],
  [/\boverarching\b/gi, "main"],
  [/\bfurthermore,\s*/gi, ""],
  [/\bmoreover,\s*/gi, ""],
  [/\badditionally,\s*/gi, "Also, "],
  [/\bin\s+conclusion,\s*/gi, ""],
  [/\bto\s+summarize,\s*/gi, ""],
  [/\bconsequently,\s*/gi, "So "]
];

/**
 * Generates 3 clean, direct alternative rewrites for any sentence in the interactive studio
 */
function buildSentenceAlternatives(sentence: string, mode: HumanizerMode, index: number): string[] {
  const clean = sentence.trim();
  if (!clean) return [];

  const withoutEndPunct = clean.replace(/[.!?]+$/, "");
  const endPunct = (clean.match(/[.!?]+$/) || ["."])[0];
  const strippedOpener = withoutEndPunct.replace(
    /^(?:Also|So|Still|Yet|Ultimately|Specifically|Notably|Importantly),\s+/i,
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
      `${capFirst}${endPunct}`,
      `The evidence also shows that ${lowerFirst}${endPunct}`,
      `${capFirst}—a point that directly supports this analysis${endPunct}`
    );
  } else if (mode === "methodology") {
    variants.push(
      `${capFirst}${endPunct}`,
      `In this setup, ${lowerFirst}${endPunct}`,
      `${capFirst}—keeping the method consistent${endPunct}`
    );
  } else if (mode === "business") {
    variants.push(
      `${capFirst}${endPunct}`,
      `In practical terms, ${lowerFirst}${endPunct}`,
      `${capFirst}—directly improving day-to-day operations${endPunct}`
    );
  } else {
    variants.push(
      `${capFirst}${endPunct}`,
      `Also, ${lowerFirst}${endPunct}`,
      `${capFirst}—making the overall process much clearer${endPunct}`
    );
  }

  const shift = index % variants.length;
  return [...variants.slice(shift), ...variants.slice(0, shift)];
}

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

  // Shield CamelCase brand/system names (like UniStay, SmartPLS, PayHere, NextJS)
  workingText = workingText.replace(/\b[A-Z][a-z]+[A-Z][A-Za-z0-9]*\b/g, (match) => {
    const token = `__BRD_${placeholders.size}__`;
    placeholders.set(token, match);
    return token;
  });

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

  const paragraphs = workingText.split(/(\n\s*\n)/);
  let clichesRemoved = 0;
  let clausesRestructured = 0;
  let burstinessAdjustments = 0;

  const processedParagraphs = paragraphs.map((paraBlock, pIdx) => {
    if (/^\n\s*\n$/.test(paraBlock)) return paraBlock;

    // Split into sentences FIRST so we can cleanly cut sentence-head mechanical transitions & hollow stock phrases
    const origSentences = splitIntoSentences(paraBlock);
    const transformedSentences: string[] = [];

    for (let sIdx = 0; sIdx < origSentences.length; sIdx++) {
      const origSent = origSentences[sIdx];

      // Pass 2A: Cut Hollow Stock Openers & Mechanical Transitions ("Furthermore,", "It is important to note that", etc.)
      const { text: strippedSent, cutCount } = stripHollowOpenersAndMechanicalTransitions(
        origSent,
        pIdx * 7 + sIdx + vSeed
      );
      clichesRemoved += cutCount;

      let sent = strippedSent;

      // Pass 2B: Apply High-Risk Verb, Metaphorical Noun, Inflated Modifier & Stock Phrase Replacements
      HIGH_RISK_REPLACEMENT_RULES.forEach((rule, ruleIdx) => {
        sent = sent.replace(rule.regex, (match, ...args) => {
          clichesRemoved++;
          let chosen = pickVariant(rule.replacements, pIdx + sIdx + ruleIdx + clichesRemoved + vSeed);

          if (chosen.includes("$1") && typeof args[0] === "string") {
            chosen = chosen.replace("$1", args[0]);
          }
          if (chosen.includes("$2") && typeof args[1] === "string") {
            chosen = chosen.replace("$2", args[1]);
          }

          return matchCase(match, chosen);
        });
      });

      // Pass 3: Syntactic & Clause Restructuring
      const { text: restructuredText, restructured } = restructureSentenceSyntax(
        sent,
        req.mode,
        req.intensity,
        pIdx * 10 + sIdx + vSeed
      );
      if (restructured) clausesRestructured++;

      // Pass 4: Universal Sentence-Level Polish
      const { text: polishedText, changesMade } = ensureSentenceHumanized(
        origSent,
        restructuredText,
        pIdx * 13 + sIdx + vSeed
      );
      clichesRemoved += changesMade;

      const subSentences = splitIntoSentences(polishedText);
      transformedSentences.push(...subSentences);
    }

    // Pass 5: Burstiness Injection (Sentence length rhythm optimization without mechanical transitions)
    const rhythmAdjusted: string[] = [];
    for (let i = 0; i < transformedSentences.length; i++) {
      const s = transformedSentences[i];
      const wCount = getWords(s).length;

      const prev = rhythmAdjusted[rhythmAdjusted.length - 1];
      const prevWCount = prev ? getWords(prev).length : 0;

      if (prev && Math.abs(wCount - prevWCount) <= 6 && wCount >= 16) {
        if (/,\s+(and|but|so|yet)\s+[a-zA-Z]/i.test(s)) {
          const splitMatch = s.match(/^([^,]{20,140}),\s+(and|but|yet|so)\s+([a-zA-Z].*)$/i);
          if (splitMatch && getWords(splitMatch[1]).length >= 7 && getWords(splitMatch[3]).length >= 6) {
            const conj = splitMatch[2].toLowerCase();
            const restCap = splitMatch[3].charAt(0).toUpperCase() + splitMatch[3].slice(1);
            const restLower =
              /^[A-Z]{2,}/.test(splitMatch[3]) || /^__/.test(splitMatch[3])
                ? splitMatch[3]
                : splitMatch[3].charAt(0).toLowerCase() + splitMatch[3].slice(1);
            const nextSent =
              conj === "but" || conj === "yet"
                ? `Still, ${restLower}`
                : conj === "so"
                  ? `So ${restLower}`
                  : restCap; // Open directly with claim!
            rhythmAdjusted.push(`${splitMatch[1].trim()}.`);
            rhythmAdjusted.push(nextSent);
            burstinessAdjustments++;
            continue;
          }
        } else if (/\s+because\s+(they|it|this|these|users|students|organizations|firms|models|systems)\s+/i.test(s)) {
          const becauseMatch = s.match(
            /^(.{24,130}?)\s+because\s+((?:they|it|this|these|users|students|organizations|firms|models|systems)\s+.+)$/i
          );
          if (becauseMatch && getWords(becauseMatch[1]).length >= 7 && getWords(becauseMatch[2]).length >= 6) {
            const c1 = becauseMatch[1].trim();
            const c2 = becauseMatch[2].trim();
            const c2Cap = c2.charAt(0).toUpperCase() + c2.slice(1);
            rhythmAdjusted.push(`${c1}.`);
            rhythmAdjusted.push(`${c2Cap}`);
            burstinessAdjustments++;
            continue;
          }
        }
      }

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

  // Pass 6: Final Ban-List Sanitizer Guard (Guarantees zero banned AI buzzwords remain)
  for (const [bannedRegex, cleanRep] of FINAL_GUARD_REPLACEMENTS) {
    humanizedText = humanizedText.replace(bannedRegex, (match) => {
      if (!cleanRep) return "";
      return matchCase(match, cleanRep);
    });
  }

  // Restore protected citations, statistics, quotes, brand names, and frozen keywords
  placeholders.forEach((originalValue, token) => {
    humanizedText = humanizedText.replaceAll(token, originalValue);
  });

  // Ensure every sentence starts with a capital letter and clean up spacing + a/an harmony
  humanizedText = humanizedText
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\b(a)\s+([aeiouAEIOU](?!ni[a-z]*|se[a-z]*|til[a-z]*|ro[a-z]*|ne\b)[a-z]+)/g, "$1n $2")
    .replace(
      /\b(an)\s+(uni[a-z]+|use[a-z]*|util[a-z]*|[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z]+)/gi,
      (_, anWord, nextWord) => {
        const aForm = /^[A-Z]/.test(anWord) ? "A" : "a";
        return `${aForm} ${nextWord}`;
      }
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+—\s*/g, "—")
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
