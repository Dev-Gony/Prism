import type {
  AnalysisNarrative,
  CrossInsight,
  NumerologyQuickResult,
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
};

export type DetailedSajuResult = {
  pillars: DetailedPillar[];
  elements: Record<"목" | "화" | "토" | "금" | "수", number>;
  dayMaster: {
    character: string;
    korean: string;
    element: string;
  };
  method: string;
};

export type DetailedAstrologyBody = {
  body: "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";
  longitude: number;
  sign: string;
  element: "fire" | "earth" | "air" | "water";
  house: number;
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
  instantUtc: string;
  birthplace: {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  bodies: DetailedAstrologyBody[];
  sunSign: string;
  moonSign: string;
  sunElement: DetailedAstrologyBody["element"];
  houseSystem: "whole-sign";
  ascendant: DetailedChartAngle;
  midheaven: DetailedChartAngle;
  descendant: DetailedChartAngle;
  imumCoeli: DetailedChartAngle;
  houses: DetailedHouse[];
  method: string;
  pending: string[];
};

export type DetailedAnalysisResponse = {
  input: {
    date: string;
    time: string;
    birthplaceId: string;
    calendarType?: "solar" | "lunar";
    originalDate?: string;
    isLeapMonth?: boolean;
  };
  engines: {
    saju: DetailedSajuResult;
    astrology: DetailedAstrologyResult;
    numerology: NumerologyQuickResult;
  };
  normalized: TraitScore[];
  cross: CrossInsight[];
  narrative: AnalysisNarrative;
  warnings: string[];
};
