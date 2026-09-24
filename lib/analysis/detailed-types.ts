import type {
  AnalysisNarrative,
  CrossInsight,
  TraitScore,
} from "@/lib/analysis/types";

export type DaYunGender = "male" | "female";

export type DetailedPillar = {
  label: "년주" | "월주" | "일주" | "시주";
  text: string;
  korean: string;
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
  stemTenGod?: string;
  branchTenGod?: string;
  hiddenStems?: Array<{
    stem: string;
    korean: string;
    element: string;
    tenGod: string;
  }>;
};

export type DetailedDaYunPeriod = {
  index: number;
  ganZhi: string;
  korean: string;
  stem: string;
  branch: string;
  stemTenGod: string;
  branchTenGod: string | null;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  startDateTime: string;
  endDateTimeExclusive: string;
  xun: string;
  xunKong: string;
  branchRelations: Array<{
    type: "합" | "충" | "형" | "파" | "해";
    natalBranch: string;
    daYunBranch: string;
    natalLabel: string;
  }>;
};

export type DetailedDaYunResult = {
  available: boolean;
  pendingReason: string | null;
  gender: DaYunGender | null;
  genderCode: 0 | 1 | null;
  sect: 2;
  forward: boolean | null;
  directionLabel: "순행" | "역행" | null;
  ruleLabel: string;
  startOffset: {
    years: number;
    months: number;
    days: number;
    hours: number;
  } | null;
  startDateTime: string | null;
  periods: DetailedDaYunPeriod[];
};

export type DetailedSajuResult = {
  pillars: DetailedPillar[];
  elements: Record<"목" | "화" | "토" | "금" | "수", number>;
  dayMaster: {
    character: string;
    korean: string;
    element: string;
  };
  tenGodSummary: Record<string, number>;
  monthCommand: {
    branch: string;
    korean: string;
    element: string;
    mainHiddenStem: string;
    mainHiddenTenGod: string;
  };
  rooting: {
    dayMasterRooted: boolean;
    rootBranches: Array<{
      branch: string;
      label: string;
      hiddenStem: string;
    }>;
    visibleStemRoots: Array<{
      pillar: string;
      stem: string;
      rootBranches: string[];
    }>;
  };
  exposedHiddenStems: Array<{
    stem: string;
    korean: string;
    element: string;
    tenGod: string;
    sourceBranches: string[];
    visiblePillars: string[];
  }>;
  strength: {
    score: number;
    level: "신강 경향" | "중화 경향" | "신약 경향";
    factors: string[];
    heuristic: true;
  };
  annualFlow: {
    asOfDate: string;
    pillar: string;
    korean: string;
    stemTenGod: string;
    branchRelations: Array<{
      type: "합" | "충" | "형" | "파" | "해";
      natalBranch: string;
      annualBranch: string;
      natalLabel: string;
    }>;
  };
  daYun: DetailedDaYunResult;
  monthlyFlow: {
    asOfDate: string;
    pillar: string;
    korean: string;
    stemTenGod: string;
    branchRelations: Array<{
      type: "합" | "충" | "형" | "파" | "해";
      natalBranch: string;
      monthlyBranch: string;
      natalLabel: string;
    }>;
  };
  branchRelations: Array<{
    type: "합" | "충" | "형" | "파" | "해";
    branches: string[];
    labels: string[];
  }>;
  method: string;
};

export type DetailedAstrologyBody = {
  body:
    | "Sun"
    | "Moon"
    | "Mercury"
    | "Venus"
    | "Mars"
    | "Jupiter"
    | "Saturn"
    | "Uranus"
    | "Neptune"
    | "Pluto";
  longitude: number;
  sign: string;
  element: "fire" | "earth" | "air" | "water";
  modality: "cardinal" | "fixed" | "mutable";
  dignity:
    | "domicile"
    | "exaltation"
    | "detriment"
    | "fall"
    | "modern-ruler"
    | "peregrine";
  speedDegPerDay: number;
  motion: "direct" | "retrograde" | "stationary";
  house?: number;
};

export type DetailedAstrologyAspect = {
  bodyA: DetailedAstrologyBody["body"];
  bodyB: DetailedAstrologyBody["body"];
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  angle: number;
  orb: number;
  phase: "applying" | "separating" | "exact";
};

export type DetailedChartAngle = {
  longitude: number;
  sign: string;
  degreeInSign: number;
};

export type DetailedHouse = {
  house: number;
  longitude: number;
  sign: string;
};

export type DetailedAstrologyResult = {
  timeKnown: boolean;
  instantUtc: string | null;
  birthplace: {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  bodies: DetailedAstrologyBody[];
  sunSign: string;
  moonSign: string | null;
  sunElement: DetailedAstrologyBody["element"];
  houseSystem: "whole-sign" | null;
  ascendant: DetailedChartAngle | null;
  midheaven: DetailedChartAngle | null;
  descendant: DetailedChartAngle | null;
  imumCoeli: DetailedChartAngle | null;
  houses: DetailedHouse[];
  aspects: DetailedAstrologyAspect[];
  balance: {
    elements: Record<"fire" | "earth" | "air" | "water", number>;
    modalities: Record<"cardinal" | "fixed" | "mutable", number>;
  };
  chartRuler: {
    ascendantSign: string;
    primary: DetailedAstrologyBody["body"];
    coRuler?: DetailedAstrologyBody["body"];
    sign: string;
    house?: number;
  } | null;
  houseRulers: Array<{
    house: number;
    sign: string;
    ruler: DetailedAstrologyBody["body"];
    coRuler?: DetailedAstrologyBody["body"];
    rulerSign: string | null;
    rulerHouse: number | null;
  }>;
  patterns: {
    stelliums: Array<{
      sign: string;
      bodies: DetailedAstrologyBody["body"][];
    }>;
    angularBodies: Array<{
      body: DetailedAstrologyBody["body"];
      house: number;
    }>;
    retrogrades: DetailedAstrologyBody["body"][];
  };
  transits: {
    asOfDate: string;
    bodies: Array<{
      body: "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
      longitude: number;
      sign: string;
      speedDegPerDay: number;
      motion: "direct" | "retrograde" | "stationary";
    }>;
    aspects: Array<{
      transitBody: "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
      natalPoint: DetailedAstrologyBody["body"] | "ASC" | "MC";
      type: DetailedAstrologyAspect["type"];
      orb: number;
      phase: "applying" | "separating" | "exact";
    }>;
  };
  method: string;
  pending: string[];
};

export type DetailedNumerologyResult = {
  lifePath: number;
  reduction: number[];
  meaningKey: string;
  birthdayNumber: number;
  attitudeNumber: number;
  periodCycles: {
    first: number;
    second: number;
    third: number;
  };
  pinnacles: [number, number, number, number];
  challenges: [number, number, number, number];
  personalCycles: {
    asOfDate: string;
    personalYear: number;
    personalMonth: number;
    personalDay: number;
  };
  method: string;
};

export type DetailedAnalysisResponse = {
  input: {
    date: string;
    time: string | null;
    timeKnown: boolean;
    birthplaceId: string;
    calendarType?: "solar" | "lunar";
    originalDate?: string;
    isLeapMonth?: boolean;
    yunGender?: DaYunGender | null;
  };
  engines: {
    saju: DetailedSajuResult;
    astrology: DetailedAstrologyResult;
    numerology: DetailedNumerologyResult;
  };
  normalized: TraitScore[];
  cross: CrossInsight[];
  narrative: AnalysisNarrative;
  destinyTiming?: DestinyTimingSummary;
  warnings: string[];
};


export type DestinyTheme =
  | "self"
  | "expression"
  | "relationships"
  | "resources"
  | "responsibility"
  | "learning"
  | "expansion"
  | "change"
  | "transformation";

export type DestinyTimingSignal = {
  source: "saju" | "astrology" | "numerology";
  theme: DestinyTheme;
  title: string;
  evidence: string[];
};

export type DestinyTimingSummary = {
  asOfDate: string;
  signals: DestinyTimingSignal[];
  convergences: Array<{
    theme: DestinyTheme;
    sources: Array<"saju" | "astrology" | "numerology">;
    strength: number;
    label: string;
  }>;
};
