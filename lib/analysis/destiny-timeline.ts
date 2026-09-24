import { calculateSajuAnnualFlow } from "@/lib/saju/detailed";
import { calculateAstrologyTransits } from "@/lib/astrology/detailed";
import { calculateNumerologyDetailed } from "@/lib/numerology/detailed";
import { addYearsClamped, kstDateString } from "@/lib/analysis/asof";
import { buildDestinyTiming } from "@/lib/analysis/destiny-timing";
import type {
  DestinyTimingSummary,
  DetailedAnalysisResponse,
} from "@/lib/analysis/detailed-types";

export type DestinyTimelinePoint = {
  asOfDate: string;
  year: number;
  timing: DestinyTimingSummary;
  dominantTheme: string | null;
  convergenceStrength: number;
};

export type DestinyTimelineResult = {
  anchorDate: string;
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

export function buildDestinyTimeline(
  analysis: DetailedAnalysisResponse,
  yearsBefore = 1,
  yearsAfter = 5,
): DestinyTimelineResult {
  const anchorDate = kstDateString();
  const points: DestinyTimelinePoint[] = [];

  for (let offset = -yearsBefore; offset <= yearsAfter; offset += 1) {
    const asOfDate = addYearsClamped(anchorDate, offset);
    const timing = buildDestinyTimingAtDate(analysis, asOfDate);
    const top = timing.convergences[0];

    points.push({
      asOfDate,
      year: Number(asOfDate.slice(0, 4)),
      timing,
      dominantTheme: top?.label ?? null,
      convergenceStrength: top?.strength ?? 0,
    });
  }

  return { anchorDate, points };
}
