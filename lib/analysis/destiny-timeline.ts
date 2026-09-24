import { calculateSajuAnnualFlow, calculateSajuMonthlyFlow } from "@/lib/saju/detailed";
import { calculateAstrologyTransits } from "@/lib/astrology/detailed";
import { calculateNumerologyDetailed } from "@/lib/numerology/detailed";
import { addMonthsClamped, addYearsClamped, kstDateString } from "@/lib/analysis/asof";
import { buildDestinyTiming } from "@/lib/analysis/destiny-timing";
import type {
  DestinyTimingSummary,
  DetailedAnalysisResponse,
} from "@/lib/analysis/detailed-types";

export type DestinyTimelineResolution = "year" | "quarter" | "month";

export type TransitExactWindow = {
  date: string;
  transitBody: "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
  natalPoint:
    | DetailedAnalysisResponse["engines"]["astrology"]["bodies"][number]["body"]
    | "ASC"
    | "MC";
  type: DetailedAnalysisResponse["engines"]["astrology"]["transits"]["aspects"][number]["type"];
  orb: number;
  phase: "applying" | "separating" | "exact";
  motion: "direct" | "retrograde" | "stationary";
  speedDegPerDay: number;
};

export type DestinyTimelinePoint = {
  asOfDate: string;
  year: number;
  month: number;
  label: string;
  timing: DestinyTimingSummary;
  dominantTheme: string | null;
  convergenceStrength: number;
  transitWindows?: TransitExactWindow[];
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
    monthlyFlow: calculateSajuMonthlyFlow(
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

function monthDate(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function buildTransitExactWindows(
  analysis: DetailedAnalysisResponse,
  year: number,
  month: number,
  limit = 3,
): TransitExactWindow[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const closest = new Map<string, TransitExactWindow>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = monthDate(year, month, day);
    const transits = calculateAstrologyTransits(
      analysis.engines.astrology.bodies,
      analysis.engines.astrology.ascendant,
      analysis.engines.astrology.midheaven,
      date,
    );

    transits.aspects.forEach((aspect) => {
      const body = transits.bodies.find(
        (item) => item.body === aspect.transitBody,
      );
      if (!body) return;

      const key = [
        aspect.transitBody,
        aspect.natalPoint,
        aspect.type,
      ].join(":");
      const candidate: TransitExactWindow = {
        date,
        transitBody: aspect.transitBody,
        natalPoint: aspect.natalPoint,
        type: aspect.type,
        orb: aspect.orb,
        phase: aspect.phase,
        motion: body.motion,
        speedDegPerDay: body.speedDegPerDay,
      };
      const current = closest.get(key);

      if (
        !current ||
        candidate.orb < current.orb ||
        (candidate.orb === current.orb &&
          candidate.date.localeCompare(current.date) < 0)
      ) {
        closest.set(key, candidate);
      }
    });
  }

  return [...closest.values()]
    .filter((item) => item.orb <= 1)
    .sort(
      (a, b) =>
        a.orb - b.orb ||
        a.date.localeCompare(b.date) ||
        a.transitBody.localeCompare(b.transitBody),
    )
    .slice(0, limit);
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
    ...(resolution === "month"
      ? { transitWindows: buildTransitExactWindows(analysis, year, month) }
      : {}),
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
