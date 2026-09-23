export type EngineName = "saju" | "astrology" | "numerology";

export type TraitKey =
  | "autonomy"
  | "reflection"
  | "stability"
  | "sociability"
  | "creativity"
  | "adaptability"
  | "care";

export type TraitScore = {
  trait: TraitKey;
  score: number;
  source: EngineName;
  evidence: string[];
};

export type CrossStatus =
  | "AGREEMENT"
  | "COMPLEMENTARY"
  | "DIVERGENCE"
  | "INSUFFICIENT";

export type CrossInsight = {
  trait: TraitKey;
  status: CrossStatus;
  label: string;
  agreement: number;
  sources: Array<{
    source: EngineName;
    score: number;
    evidence: string[];
  }>;
};

export type SajuQuickResult = {
  pillars: Array<{
    label: "년주" | "월주" | "일주";
    text: string;
    korean: string;
    stem: string;
    branch: string;
    stemElement: string;
    branchElement: string;
  }>;
  elements: Record<"목" | "화" | "토" | "금" | "수", number>;
  dayMaster: { character: string; korean: string; element: string };
  dominantElement: string;
  method: string;
  warnings: string[];
};

export type AstrologyBody = {
  body: "Sun" | "Mercury" | "Venus" | "Mars";
  longitude: number;
  sign: string;
  element: "fire" | "earth" | "air" | "water";
  stableAcrossUtcDay: boolean;
};

export type AstrologyQuickResult = {
  snapshotUtc: string;
  bodies: AstrologyBody[];
  sunSign: string;
  sunElement: AstrologyBody["element"];
  method: string;
  warnings: string[];
};

export type NumerologyQuickResult = {
  lifePath: number;
  reduction: number[];
  meaningKey: string;
  method: string;
};

export type NarrativeKeyword = {
  title: string;
  description: string;
  tags: string[];
};

export type NarrativeObservation = {
  label: string;
  title: string;
  description: string;
};

export type NarrativeCrossHighlight = {
  trait: TraitKey;
  title: string;
  label: string;
  explanation: string;
};

export type AnalysisNarrative = {
  summary: string;
  keywords: NarrativeKeyword[];
  observations: NarrativeObservation[];
  crossHighlights: NarrativeCrossHighlight[];
  generatedBy: "gemini" | "fallback";
  model?: string;
};

export type QuickAnalysisResponse = {
  input: { date: string };
  engines: {
    saju: SajuQuickResult;
    astrology: AstrologyQuickResult;
    numerology: NumerologyQuickResult;
  };
  normalized: TraitScore[];
  cross: CrossInsight[];
  narrative: AnalysisNarrative;
  warnings: string[];
};
