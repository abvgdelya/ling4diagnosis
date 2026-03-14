export type AnalysisMarkerKey =
  | "lexical"
  | "morphological1"
  | "morphological2"
  | "semantic"
  | "syntactic1"
  | "syntactic2";

export type SeverityLevel = "Low" | "Medium" | "High";

export interface AnalysisCriterion {
  strength: number;
  present: boolean;
}

export interface AnalysisResult {
  score: number;
  severity: SeverityLevel;
  presentMarkers: AnalysisMarkerKey[];
  markerStrengths: Record<AnalysisMarkerKey, number>;
  criteria: Record<AnalysisMarkerKey, AnalysisCriterion>;
  evaluation: string;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 10_000;

export function validateEnglishText(text: string): string | null {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    return "Oops! Seems like there was a problem: Empty text. Try again.";
  }

  if (trimmed.length < MIN_LENGTH) {
    return "Oops! Seems like there was a problem: Text too short (min 50 chars). Try again.";
  }

  if (trimmed.length > MAX_LENGTH) {
    return "Oops! Seems like there was a problem: Text too long (max 10,000 chars). Try again.";
  }

  const specialChars = trimmed.replace(/[\w\s]/g, "").length;
  if (specialChars / trimmed.length > 0.8) {
    return "Oops! Seems like there was a problem: Too many special characters. Try again.";
  }

  const englishChars = trimmed.replace(/[^a-zA-Z\s]/g, "").length;
  const englishRatio = englishChars / trimmed.length;
  if (englishRatio < 0.7) {
    return "Oops! Seems like there was a problem: English text only please. Try again.";
  }

  return null;
}

export function analyzeEnglishText(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  const words = tokenizeWords(lowerText);
  const sentences = splitSentences(text);

  const polarityScore = computeSentimentScore(lowerText);
  const lexicalPresent = polarityScore > 50;

  if (!lexicalPresent) {
    return {
      score: 0,
      severity: "Low",
      presentMarkers: [],
      markerStrengths: {
        lexical: Math.round(polarityScore),
        morphological1: 0,
        morphological2: 0,
        semantic: 0,
        syntactic1: 0,
        syntactic2: 0
      },
      criteria: {
        lexical: { strength: Math.round(polarityScore), present: false },
        morphological1: { strength: 0, present: false },
        morphological2: { strength: 0, present: false },
        semantic: { strength: 0, present: false },
        syntactic1: { strength: 0, present: false },
        syntactic2: { strength: 0, present: false }
      },
      evaluation:
        "✅ Low risk - No required lexical depression markers detected"
    };
  }

  const morph1 = computeMorphologyFirstPerson(words);
  const morph2 = computeMorphologyPassive(text);
  const semantic = computeSemanticMarker(text);
  const synt1 = computeSyntacticShortSentences(sentences);
  const synt2 = computeSyntacticEllipsis(sentences);

  const additional = [
    { key: "morphological1" as const, ...morph1 },
    { key: "morphological2" as const, ...morph2 },
    { key: "semantic" as const, ...semantic },
    { key: "syntactic1" as const, ...synt1 },
    { key: "syntactic2" as const, ...synt2 }
  ];

  const presentAdditional = additional.filter((m) => m.present);
  const additionalAvg =
    presentAdditional.length > 0
      ? presentAdditional.reduce((sum, m) => sum + m.strength, 0) /
        presentAdditional.length
      : polarityScore;

  const score = Math.round(additionalAvg);
  const severity: SeverityLevel = score > 70 ? "High" : "Medium";

  const markerStrengths: Record<AnalysisMarkerKey, number> = {
    lexical: Math.round(polarityScore),
    morphological1: Math.round(morph1.strength),
    morphological2: Math.round(morph2.strength),
    semantic: Math.round(semantic.strength),
    syntactic1: Math.round(synt1.strength),
    syntactic2: Math.round(synt2.strength)
  };

  const criteria: Record<AnalysisMarkerKey, AnalysisCriterion> = {
    lexical: { strength: Math.round(polarityScore), present: true },
    morphological1: {
      strength: Math.round(morph1.strength),
      present: morph1.present
    },
    morphological2: {
      strength: Math.round(morph2.strength),
      present: morph2.present
    },
    semantic: {
      strength: Math.round(semantic.strength),
      present: semantic.present
    },
    syntactic1: {
      strength: Math.round(synt1.strength),
      present: synt1.present
    },
    syntactic2: {
      strength: Math.round(synt2.strength),
      present: synt2.present
    }
  };

  const presentMarkers: AnalysisMarkerKey[] = [
    "lexical",
    ...presentAdditional.map((m) => m.key)
  ];

  const evaluation = `⚠️ ${severity} RISK (lexical ${Math.round(
    polarityScore
  )}% + ${presentAdditional.length} markers, avg ${score}%) - Professional assessment recommended`;

  return {
    score,
    severity,
    presentMarkers,
    markerStrengths,
    criteria,
    evaluation
  };
}

function tokenizeWords(text: string): string[] {
  return text.split(/\W+/).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeSentimentScore(text: string): number {
  const tokens = tokenizeWords(text);
  if (tokens.length === 0) return 0;

  let negative = 0;
  let sentimentBearing = 0;

  for (const w of tokens) {
    // simple heuristic: treat obviously negative suffix/prefix patterns
    if (/(less|loser|failure|hopeless|worthless)$/.test(w)) {
      negative += 1.5;
      sentimentBearing++;
    } else if (/^(unhappy|sad|miserable|depress|alone|guilty|ashamed)/.test(w)) {
      negative += 1;
      sentimentBearing++;
    } else if (/^(good|great|happy|joy|hope|love)/.test(w)) {
      negative -= 0.5;
      sentimentBearing++;
    }
  }

  if (sentimentBearing === 0) return 0;
  const ratio = Math.max(0, Math.min(1, negative / sentimentBearing));
  return ratio * 100;
}

function computeMorphologyFirstPerson(words: string[]): AnalysisCriterion {
  const firstPersonSet = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves"
  ]);

  const otherPronounSet = new Set([
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "they",
    "their",
    "theirs",
    "themselves"
  ]);

  let first = 0;
  let all = 0;

  for (const w of words) {
    if (firstPersonSet.has(w)) {
      first++;
      all++;
    } else if (otherPronounSet.has(w)) {
      all++;
    }
  }

  const ratio = all > 0 ? (first / all) * 100 : 0;
  return { strength: ratio, present: ratio > 50 };
}

function computeMorphologyPassive(text: string): AnalysisCriterion {
  // heuristic passive voice: "be" auxiliary + past participle
  const passiveMatches = text.match(
    /\b(is|was|were|am|are|been|being)\s+\w+(ed|en)\b/gi
  );
  const sentences = splitSentences(text);
  const totalVerbsApprox = sentences.reduce((sum, s) => {
    const wc = s.split(/\W+/).filter(Boolean).length;
    return sum + Math.max(1, Math.floor(wc / 5));
  }, 0);

  const passiveCount = passiveMatches ? passiveMatches.length : 0;
  const ratio =
    totalVerbsApprox > 0 ? (passiveCount / totalVerbsApprox) * 100 : 0;

  return { strength: ratio, present: ratio > 50 };
}

type SemanticClass =
  | "MATERIAL"
  | "BEHAVIORAL"
  | "RELATIONAL"
  | "VERBAL"
  | "MENTAL"
  | "EXISTENTIAL";

function computeSemanticMarker(text: string): AnalysisCriterion {
  // Use simple clause-based heuristics to approximate meaning classes
  const sentences = splitSentences(text);
  let mentalExistential = 0;
  let other = 0;

  for (const sentence of sentences) {
    const verbs = approximateMainVerbs(sentence);
    for (const v of verbs) {
      const cls = classifySemanticVerb(v, sentence);
      if (cls === "MENTAL" || cls === "EXISTENTIAL") {
        mentalExistential++;
      } else {
        other++;
      }
    }
  }

  const total = mentalExistential + other;
  const ratio = total > 0 ? (mentalExistential / total) * 100 : 0;
  return { strength: ratio, present: ratio > 50 };
}

function approximateMainVerbs(sentence: string): string[] {
  const tokens = sentence.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.filter((t) => /[a-z]/.test(t));
}

function classifySemanticVerb(verb: string, sentence: string): SemanticClass {
  const s = sentence.toLowerCase();

  // existence constructions
  if (/there\s+(is|are|was|were|has been|have been)\s+/.test(s)) {
    return "EXISTENTIAL";
  }

  // mental actions approximated by internal state contexts
  if (/i\s+(feel|felt|am feeling)\b/.test(s)) {
    return "MENTAL";
  }

  // relational: copular "be" linking subject and complement
  if (/\b(am|is|are|was|were)\b/.test(s) && /(\blike\b|\bas\b)/.test(s)) {
    return "RELATIONAL";
  }

  // verbal: quoted or reported speech
  if (/[\"“”]/.test(s)) {
    return "VERBAL";
  }

  // behavioral: repeated or habitual descriptions
  if (/\b(always|often|usually|constantly)\b/.test(s)) {
    return "BEHAVIORAL";
  }

  return "MATERIAL";
}

function computeSyntacticShortSentences(
  sentences: string[]
): AnalysisCriterion {
  let short = 0;
  let long = 0;

  for (const s of sentences) {
    const wc = s.split(/\W+/).filter(Boolean).length;
    if (wc >= 11 && wc <= 12) {
      short++;
    } else if (wc > 12) {
      long++;
    }
  }

  const ratio = long > 0 ? (short / long) * 100 : 0;
  return { strength: ratio, present: ratio > 10 };
}

function computeSyntacticEllipsis(sentences: string[]): AnalysisCriterion {
  let ellipsis = 0;

  for (const s of sentences) {
    if (/\.{2,}/.test(s)) {
      ellipsis++;
    }
  }

  const total = sentences.length;
  const ratio = total > 0 ? (ellipsis / total) * 100 : 0;
  return { strength: ratio, present: ratio >= 25 };
}

