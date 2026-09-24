import { calculateSajuAnnualFlow } from "@/lib/saju/detailed";
import { calculateAstrologyTransits } from "@/lib/astrology/detailed";
import { calculateNumerologyDetailed } from "@/lib/numerology/detailed";
import { addMonthsClamped, addYearsClamped, kstDateString } from "@/lib/analysis/asof";
import { buildDestinyTiming } from "@/lib/analysis/destiny-timing";
import type {
  DestinyTimingSummary,
  DetailedAnalysisResponse,
} from "@/lib/analysis/detailed-types";

export type DestinyTimelineResolution = "year" | "quarter" | "month";

export type DestinyTimelinePoint = {
  asOfDate: string;
  year: number;
  month: number;
  label: string;
  timing: DestinyTimingSummary;
  dominantTheme: string | null;
  convergenceStrength: number;
};

export type DestinyTimelineResult = {
  anchorDate: string;
  resolution: DestinyTimelineResolution;
  points: DestinyTimelinePoint[];
};

export function buildDestinyTimingAtDate(
  analysis: DetailedAnalysisResponse,
  asOfDate: string,
): DestinyTimingSummary {
  const saju = {
    ...analysis.engines.saju,
    annualFlow: calculateSajuAnnualFlow(
      analysis.engines.saju.pillars,
      analysis.engines.saju.dayMaster.character,
      asOfDate,
    ),
  };

  const astrology = {
    ...analysis.engines.astrology,
    transits: calculateAstrologyTransits(
      analysis.engines.astrology.bodies,
      analysis.engines.astrology.ascendant,
      analysis.engines.astrology.midheaven,
      asOfDate,
    ),
  };

  const numerology = calculateNumerologyDetailed(
    analysis.input.date,
    asOfDate,
  );

  return buildDestinyTiming(saju, astrology, numerology);
}

function pointFromDate(
  analysis: DetailedAnalysisResponse,
  asOfDate: string,
  resolution: DestinyTimelineResolution,
): DestinyTimelinePoint {
  const timing = buildDestinyTimingAtDate(analysis, asOfDate);
  const top = timing.convergences[0];
  const year = Number(asOfDate.slice(0, 4));
  const month = Number(asOfDate.slice(5, 7));
  const quarter = Math.floor((month - 1) / 3) + 1;

  return {
    asOfDate,
    year,
    month,
    label:
      resolution === "year"
        ? String(year)
        : resolution === "quarter"
          ? `${year} Q${quarter}`
          : `${year}.${String(month).padStart(2, "0")}`,
    timing,
    dominantTheme: top?.label ?? null,
    convergenceStrength: top?.strength ?? 0,
  };
}

export function buildDestinyTimeline(
  analysis: DetailedAnalysisResponse,
  yearsBefore = 1,
  yearsAfter = 5,
): DestinyTimelineResult {
  const anchorDate = kstDateString();
  const points: DestinyTimelinePoint[] = [];

  for (let offset = -yearsBefore; offset <= yearsAfter; offset += 1) {
    const asOfDate = addYearsClamped(anchorDate, offset);
    points.push(pointFromDate(analysis, asOfDate, "year"));
  }

  return { anchorDate, resolution: "year", points };
}

export function buildDestinyTimelineByResolution(
  analysis: DetailedAnalysisResponse,
  resolution: DestinyTimelineResolution,
  count = 12,
): DestinyTimelineResult {
  const anchorDate = kstDateString();
  const points: DestinyTimelinePoint[] = [];

  if (resolution === "year") {
    return buildDestinyTimeline(analysis, 1, Math.max(1, Math.min(10, count)));
  }

  const safeCount =
    resolution === "quarter"
      ? Math.max(4, Math.min(16, count))
      : Math.max(6, Math.min(24, count));
  const stepMonths = resolution === "quarter" ? 3 : 1;
  const startOffset = -stepMonths;

  for (let index = 0; index < safeCount + 1; index += 1) {
    const asOfDate = addMonthsClamped(
      anchorDate,
      startOffset + index * stepMonths,
    );

    points.push(pointFromDate(analysis, asOfDate, resolution));
  }

  return {
    anchorDate,
    resolution,
    points,
  };
}
