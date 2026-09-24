import type {
  AnalysisNarrative,
  CrossInsight,
  TraitScore,
} from "@/lib/analysis/types";

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

export type DetailedSajuResult = {
  pillars: DetailedPillar[];
  elements: Record<"목" | "화" | "토" | "금" | "수", number>;
  dayMaster: {
    character: string;
    korean: string;
    element: string;
  };
  tenGodSummary: Record<string, number>;
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
  house?: number;
};

export type DetailedAstrologyAspect = {
  bodyA: DetailedAstrologyBody["body"];
  bodyB: DetailedAstrologyBody["body"];
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  angle: number;
  orb: number;
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
  };
  engines: {
    saju: DetailedSajuResult;
    astrology: DetailedAstrologyResult;
    numerology: DetailedNumerologyResult;
  };
  normalized: TraitScore[];
  cross: CrossInsight[];
  narrative: AnalysisNarrative;
  warnings: string[];
};
