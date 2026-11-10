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

// High-probability AI signature words & phrases flagged by Turnitin AI, GPTZero, and Originality.ai
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
  { pattern: /\burban\s+landscape|digital\s+landscape|competitive\s+landscape|evolving\s+landscape\b/gi, label: "evolving landscape", weight: 11 }
];

// Citation & numeric patterns to protect
const CITATION_REGEXES: RegExp[] = [
  // APA / Harvard parenthetical citations e.g. (Smith, 2022), (Silva & Perera, 2023, p. 14), (World Bank, 2021; IMF, 2022)
  /\([A-Z][A-Za-z\s&.,;-]+?(?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  // Narrative citation years e.g. (2023, p. 12) or (2021)
  /\((?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+(?:-\d+)?)?\)/g,
  // IEEE style numeric brackets e.g. [1], [12, 15], [3]-[6]
  /\[\d+(?:\s*[,–-]\s*\d+)*\]/g,
  // Statistical results e.g. (p < 0.05), (r = 0.74, p = .001), p < .01
  /\b(?:p|r|t|F|z|χ2|OR|RR|CI)\s*[=<>≤≥]\s*[-+]?\d*\.?\d+(?:\s*,\s*95%\s*CI\s*\[[^\]]+\])?/gi,
  // Direct double-quoted phrases (up to 160 chars)
  /"[^"\n]{4,160}"/g,
  // URLs and DOIs
  /https?:\/\/[^\s)]+|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g
];

function splitIntoSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  // Protect common abbreviations before splitting
  const protectedAbbrev = cleaned
    .replace(/\b(et\s+al)\./gi, "$1__DOT__")
    .replace(/\b(e\.g|i\.e|vs|cf|viz|al|pp|fig|eq|dr|prof|mr|mrs|ms|st|no|vol|ch|sec)\./gi, "$1__DOT__")
    .replace(/(\d)\.(\d)/g, "$1__DEC__$2");

  const rawParts = protectedAbbrev.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(“[])/);
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

  // Detect protected citations/quotes
  const protectedFound = new Set<string>();
  for (const regex of CITATION_REGEXES) {
    const matches = trimmed.match(regex);
    if (matches) {
      matches.forEach((m) => protectedFound.add(m));
    }
  }
  for (const kw of customFrozenWords) {
    const cleanKw = kw.trim();
    if (cleanKw && trimmed.toLowerCase().includes(cleanKw.toLowerCase())) {
      protectedFound.add(cleanKw);
    }
  }

  // Detect global AI cliches
  const detectedClichesSet = new Set<string>();
  let totalClicheWeight = 0;
  for (const item of AI_CLICHE_PATTERNS) {
    const matches = trimmed.match(item.pattern);
    if (matches && matches.length > 0) {
      detectedClichesSet.add(item.label);
      totalClicheWeight += item.weight * matches.length;
    }
  }

  // Analyze each sentence & compute sentence length stats for Burstiness
  const sentenceLengths: number[] = [];
  const sentenceAnalyses: SentenceAnalysis[] = sentenceStrings.map((s, idx) => {
    const sWords = getWords(s);
    const sLen = sWords.length;
    sentenceLengths.push(sLen);

    const flags: string[] = [];
    let sAiScore = 24; // baseline

    for (const item of AI_CLICHE_PATTERNS) {
      if (item.pattern.test(s)) {
        flags.push(`AI footprint: "${item.label}"`);
        sAiScore += item.weight * 2.1;
      }
      item.pattern.lastIndex = 0;
    }

    // Check robotic sentence length uniformity (17-24 words with no punctuation variance)
    const commaCount = (s.match(/,/g) || []).length;
    const hasDashOrSemicolon = /[;—–:]/.test(s);
    if (sLen >= 18 && sLen <= 25 && commaCount >= 2 && !hasDashOrSemicolon) {
      sAiScore += 14;
      if (flags.length === 0) flags.push("Uniform LLM clause cadence");
    }

    // Check formulaic starter
    if (/^(Furthermore|Moreover|Additionally|In addition|Consequently|Therefore|Thus|Notably|Importantly),/i.test(s)) {
      sAiScore += 16;
      flags.push("Predictable transition opener");
    }

    // Human signals reduce AI score
    if (hasDashOrSemicolon) sAiScore -= 12;
    if (/\([A-Z][A-Za-z\s&.,]+?(?:19|20)\d{2}/.test(s) || /\[\d+\]/.test(s)) {
      sAiScore -= 6;
    }
    if (sLen <= 11 || sLen >= 31) {
      sAiScore -= 9; // non-uniform sentence length is a strong human burstiness marker
    }

    const clampedScore = Math.max(4, Math.min(98, Math.round(sAiScore)));
    const riskLevel: "low" | "medium" | "high" =
      clampedScore >= 62 ? "high" : clampedScore >= 38 ? "medium" : "low";

    return {
      index: idx,
      text: s,
      wordCount: sLen,
      aiScore: clampedScore,
      riskLevel,
      flags: flags.slice(0, 3)
    };
  });

  // Calculate Burstiness (Coefficient of variation of sentence lengths + adjacent delta)
  let burstinessScore = 52;
  if (sentenceLengths.length >= 2) {
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    // Also measure adjacent sentence length jumps
    let adjacentJumpSum = 0;
    for (let i = 1; i < sentenceLengths.length; i++) {
      adjacentJumpSum += Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]);
    }
    const avgJump = adjacentJumpSum / (sentenceLengths.length - 1);

    // AI typically has cv ~ 0.18-0.25 and avgJump ~ 3-5. Humans have cv ~ 0.42-0.65 and avgJump ~ 8-14.
    const rawBurst = cv * 105 + avgJump * 3.1;
    burstinessScore = Math.max(12, Math.min(98, Math.round(rawBurst)));
  } else {
    burstinessScore = 60;
  }

  // Calculate Perplexity / Lexical Diversity (Type-Token Ratio + Rare/Academic word density - Cliche penalty)
  const cleanTokens = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")).filter((w) => w.length > 2);
  const uniqueTokens = new Set(cleanTokens);
  const ttr = cleanTokens.length > 0 ? uniqueTokens.size / Math.sqrt(cleanTokens.length) : 1; // Root TTR (Guiraud's index)
  const longWords = cleanTokens.filter((w) => w.length >= 7).length;
  const longWordRatio = cleanTokens.length > 0 ? longWords / cleanTokens.length : 0;

  const clicheDensityPenalty = wordCount > 0 ? (totalClicheWeight / wordCount) * 180 : 0;
  const rawPerplexity = Math.min(97, Math.max(18, Math.round(ttr * 13.5 + longWordRatio * 85 - clicheDensityPenalty * 0.45)));

  // Overall AI probability combining sentence scores, cliche weight, and burstiness deficit
  const avgSentenceAi =
    sentenceAnalyses.reduce((acc, s) => acc + s.aiScore, 0) / Math.max(1, sentenceAnalyses.length);
  const burstinessPenalty = Math.max(0, (58 - burstinessScore) * 0.45);
  const clicheBoost = Math.min(42, totalClicheWeight * 1.15);

  const rawAiProb = avgSentenceAi * 0.62 + clicheBoost + burstinessPenalty;
  const aiProbability = Math.max(3, Math.min(99, Math.round(rawAiProb)));
  const humanScore = 100 - aiProbability;

  // Flesch-Kincaid Grade estimate
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

// Multi-option replacement bank by phrase/word
interface PhraseRule {
  regex: RegExp;
  replacements: Record<HumanizerMode, string[]> | string[];
}

const PHRASE_REPLACEMENTS: PhraseRule[] = [
  {
    regex: /\bIn today's rapidly evolving (?:world|landscape|digital age|era),?\s*/gi,
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
    regex: /\bIn today's (?:digital age|fast-paced world|modern world),?\s*/gi,
    replacements: ["In contemporary contexts, ", "Across modern institutions, ", "Within current practice, "]
  },
  {
    regex: /\bIt is important to note that\s+/gi,
    replacements: {
      academic: ["crucially, ", "a key consideration is that ", "notably, "],
      postgrad: ["critically, ", "a salient analytical distinction is that ", "importantly, however, "],
      lit_review: ["several scholars emphasize that ", "a recurring observation in the literature is that ", "crucially, prior work notes that "],
      methodology: ["from a methodological standpoint, ", "a key operational constraint is that ", "specifically, "],
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
    regex: /\bplays\s+a\s+(?:pivotal|crucial|vital|paramount)\s+role\s+in\b/gi,
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
    regex: /\bplay\s+a\s+(?:pivotal|crucial|vital|paramount)\s+role\s+in\b/gi,
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
  {
    regex: /\bIn\s+order\s+to\b/gi,
    replacements: ["To", "So as to", "To effectively"]
  },
  {
    regex: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    replacements: ["because", "since", "given that"]
  },
  {
    regex: /\bplays\s+a\s+significant\s+role\s+in\b/gi,
    replacements: ["substantially shapes", "materially influences", "directly contributes to"]
  },
  {
    regex: /\ba\s+wide\s+range\s+of\b/gi,
    replacements: ["diverse", "multiple", "varied"]
  }
];

function pickVariant(options: string[], seed: number): string {
  return options[Math.abs(seed) % options.length];
}

/**
 * Restructures robotic AI sentence syntax (e.g. participial -ing tails, "Not only... but also", passive fluff)
 */
function restructureSentenceSyntax(
  sentence: string,
  mode: HumanizerMode,
  intensity: HumanizerIntensity,
  seed: number
): { text: string; restructured: boolean } {
  let out = sentence;
  let restructured = false;

  // 1. Transform "Not only does/do [Subj] [Verb] [Obj], but (also) [Y]" into natural scholarly prose
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

  // 2. Break or transform robotic participial tail clauses: ", highlighting/underscoring/demonstrating/ensuring/fostering/showcasing [X]."
  const tailRegex = /,\s*(?:thereby\s+)?(highlighting|underscoring|demonstrating|ensuring|fostering|showcasing|emphasizing|illustrating|reflecting)\s+([^.?!]+)(\.|!|\?)$/i;
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
      reflecting: ["This trend mirrors", "At its core, this captures", "—which corresponds to"]
    };

    const choices = verbMap[verb] || ["This directly illustrates", "In turn, this shows", "—which clarifies"];
    const chosen = pickVariant(choices, seed);

    if (chosen.startsWith("—")) {
      out = `${mainClause} ${chosen} ${rest}${punct}`;
    } else {
      // Split into two sentences to boost burstiness!
      out = `${mainClause}. ${chosen} ${rest}${punct}`;
    }
    restructured = true;
  }

  // 3. Transform "By [verbing] [X], [Y] can/is able to [Z]" when in enhanced/stealth mode
  if (intensity !== "balanced" && !restructured) {
    const byVerbingMatch = out.match(/^By\s+([a-z]+ing)\s+([^,]{6,55}),\s+([^,]{4,40})\s+(?:can|are able to|is able to)\s+(.+)$/i);
    if (byVerbingMatch) {
      const gerund = byVerbingMatch[1].toLowerCase();
      const obj = byVerbingMatch[2].trim();
      const subj = byVerbingMatch[3].trim();
      const pred = byVerbingMatch[4].trim();
      out = `When ${subj} prioritize ${gerund} ${obj}, they are better positioned to ${pred}`;
      restructured = true;
    }
  }

  // 4. In stealth or postgrad mode, inject subtle scholarly punctuation (em-dash or semicolon) into long multi-comma sentences
  if ((intensity === "stealth" || mode === "postgrad") && !restructured) {
    const words = getWords(out);
    if (words.length >= 22 && !/[;—–]/.test(out)) {
      // Replace ", which " or ", whereas " or ", while " with an em-dash or semicolon structure
      if (/,\s+which\s+/i.test(out)) {
        out = out.replace(/,\s+which\s+/, "—which ");
        restructured = true;
      } else if (/,\s+while\s+/i.test(out)) {
        out = out.replace(/,\s+while\s+/, "; meanwhile, ");
        restructured = true;
      } else if (/,\s+because\s+/i.test(out)) {
        out = out.replace(/,\s+because\s+/, "—primarily because ");
        restructured = true;
      }
    }
  }

  return { text: out, restructured };
}

/**
 * Generates 3 distinct academic alternative rewrites for a given humanized sentence
 */
function buildSentenceAlternatives(sentence: string, mode: HumanizerMode, index: number): string[] {
  const clean = sentence.trim();
  if (!clean) return [];

  const withoutEndPunct = clean.replace(/[.!?]+$/, "");
  const endPunct = (clean.match(/[.!?]+$/) || ["."])[0];
  const lowerFirst =
    /^[A-Z]{2,}/.test(withoutEndPunct) || /^I\b/.test(withoutEndPunct)
      ? withoutEndPunct
      : withoutEndPunct.charAt(0).toLowerCase() + withoutEndPunct.slice(1);

  const variants: string[] = [];

  if (mode === "postgrad" || mode === "lit_review") {
    variants.push(
      `From a critical analytical perspective, ${lowerFirst}${endPunct}`,
      `Empirical evidence further indicates that ${lowerFirst}${endPunct}`,
      `${withoutEndPunct}—a distinction that carries direct theoretical weight${endPunct}`
    );
  } else if (mode === "methodology") {
    variants.push(
      `Within the operationalized framework, ${lowerFirst}${endPunct}`,
      `Specifically, the analytical procedure confirms that ${lowerFirst}${endPunct}`,
      `${withoutEndPunct}, thereby maintaining methodological rigor${endPunct}`
    );
  } else if (mode === "business") {
    variants.push(
      `From an executive standpoint, ${lowerFirst}${endPunct}`,
      `In practical commercial terms, ${lowerFirst}${endPunct}`,
      `${withoutEndPunct}—directly strengthening operational performance${endPunct}`
    );
  } else {
    variants.push(
      `In practical terms, ${lowerFirst}${endPunct}`,
      `A closer assessment shows that ${lowerFirst}${endPunct}`,
      `${withoutEndPunct}—a factor of direct relevance to this analysis${endPunct}`
    );
  }

  // Rotate slightly by index so adjacent sentences don't show identical prefix order
  const shift = index % variants.length;
  return [...variants.slice(shift), ...variants.slice(0, shift)];
}

/**
 * Computes word-level / phrase-level diff segments between original and humanized text
 */
export function computeDiffSegments(original: string, humanized: string): DiffSegment[] {
  const origWords = original.trim().split(/(\s+)/);
  const humWords = humanized.trim().split(/(\s+)/);

  // Simple LCS-inspired windowed token matcher for clean UI highlighting
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

    // Look ahead in origWords and humWords within a small window (16 tokens) for resync
    let foundSync = false;
    for (let lookHum = 1; lookHum <= 14 && j + lookHum < humWords.length; lookHum++) {
      for (let lookOrig = 0; lookOrig <= 14 && i + lookOrig < origWords.length; lookOrig++) {
        if (
          humWords[j + lookHum].trim().length > 2 &&
          humWords[j + lookHum] === origWords[i + lookOrig]
        ) {
          // Everything from j to j + lookHum - 1 is changed
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

  // Merge adjacent segments of same type
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

  const beforeMetrics = analyzeTextForensics(rawInput, freezeKeywords);

  // Step 1: Protect citations, statistical expressions, quotes, and frozen keywords
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

    // Apply Phrase & Cliche Replacements
    PHRASE_REPLACEMENTS.forEach((rule, ruleIdx) => {
      para = para.replace(rule.regex, (match) => {
        clichesRemoved++;
        const pool = Array.isArray(rule.replacements)
          ? rule.replacements
          : rule.replacements[req.mode] || rule.replacements.academic;
        const chosen = pickVariant(pool, pIdx + ruleIdx + clichesRemoved);
        // Preserve capitalization if original match started with uppercase and replacement is lowercase
        if (
          /^[A-Z]/.test(match) &&
          chosen.length > 0 &&
          /^[a-z]/.test(chosen)
        ) {
          return chosen.charAt(0).toUpperCase() + chosen.slice(1);
        }
        return chosen;
      });
    });

    // Split paragraph into sentences for syntactic & burstiness engineering
    const sentences = splitIntoSentences(para);
    const transformedSentences: string[] = [];

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const current = sentences[sIdx];
      const { text: restructuredText, restructured } = restructureSentenceSyntax(
        current,
        req.mode,
        req.intensity,
        pIdx * 10 + sIdx
      );
      if (restructured) clausesRestructured++;

      // Re-split in case restructureSentenceSyntax split a participial tail into two sentences
      const subSentences = splitIntoSentences(restructuredText);
      transformedSentences.push(...subSentences);
    }

    // Step 3: Burstiness Injection (Sentence length rhythm optimization)
    const rhythmAdjusted: string[] = [];
    for (let i = 0; i < transformedSentences.length; i++) {
      const s = transformedSentences[i];
      const wCount = getWords(s).length;

      // If 2 consecutive sentences have very similar medium lengths (16-24 words), vary rhythm
      const prev = rhythmAdjusted[rhythmAdjusted.length - 1];
      const prevWCount = prev ? getWords(prev).length : 0;

      if (
        prev &&
        Math.abs(wCount - prevWCount) <= 3 &&
        wCount >= 18 &&
        wCount <= 28 &&
        /,\s+(and|but|so|yet)\s+[a-z]/i.test(s)
      ) {
        // Split compound sentence at coordinating conjunction into a crisp second sentence
        const splitMatch = s.match(/^(.*20?[^,]+),\s+(and|but|yet|so)\s+([a-z].*)$/i);
        if (splitMatch && getWords(splitMatch[1]).length >= 8 && getWords(splitMatch[3]).length >= 6) {
          const conj = splitMatch[2].toLowerCase();
          const restCap = splitMatch[3].charAt(0).toUpperCase() + splitMatch[3].slice(1);
          const connector =
            conj === "but" || conj === "yet"
              ? "However, "
              : conj === "so"
                ? "Consequently, "
                : req.mode === "concise"
                  ? ""
                  : "In parallel, ";
          rhythmAdjusted.push(`${splitMatch[1].trim()}.`);
          rhythmAdjusted.push(`${connector}${restCap}`);
          burstinessAdjustments++;
          continue;
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

  // Step 4: Restore protected citations, statistics, quotes, and frozen keywords
  placeholders.forEach((originalValue, token) => {
    humanizedText = humanizedText.replaceAll(token, originalValue);
  });

  // Clean up any accidental double spaces and a/an vowel harmony
  humanizedText = humanizedText
    .replace(/\b(a)\s+([aeiouAEIOU](?!ni(?:vers|form|on|que|lateral)|se\b|ser\b|til|ro\b)[a-z]+)/g, "$1n $2")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();

  // Compute post-humanization metrics
  const afterMetrics = analyzeTextForensics(humanizedText, freezeKeywords);

  // Build sentence alternatives for interactive sentence studio
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

