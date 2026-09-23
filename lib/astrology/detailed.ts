import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  SunPosition,
} from "astronomy-engine";
import type {
  DetailedAstrologyBody,
  DetailedAstrologyResult,
} from "@/lib/analysis/detailed-types";
import type { Birthplace } from "@/lib/analysis/birthplaces";
import {
  calculateWholeSignHouses,
  houseForLongitude,
} from "@/lib/astrology/houses";

const SIGNS = [
  "양자리",
  "황소자리",
  "쌍둥이자리",
  "게자리",
  "사자자리",
  "처녀자리",
  "천칭자리",
  "전갈자리",
  "사수자리",
  "염소자리",
  "물병자리",
  "물고기자리",
] as const;

const ELEMENTS: DetailedAstrologyBody["element"][] = [
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
];

function signFromLongitude(longitude: number) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);

  return {
    sign: SIGNS[index],
    element: ELEMENTS[index],
  };
}

function longitude(body: DetailedAstrologyBody["body"], date: Date) {
  if (body === "Sun") return SunPosition(date).elon;
  if (body === "Moon") return EclipticGeoMoon(date).lon;

  const target = {
    Mercury: Body.Mercury,
    Venus: Body.Venus,
    Mars: Body.Mars,
    Jupiter: Body.Jupiter,
    Saturn: Body.Saturn,
  }[body];

  return Ecliptic(GeoVector(target, date, true)).elon;
}

export function calculateAstrologyDetailed(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number | null,
  birthplace: Birthplace,
): DetailedAstrologyResult {
  const timeKnown = hour !== null && minute !== null;
  const effectiveHour = hour ?? 12;
  const effectiveMinute = minute ?? 0;

  // KST is UTC+9 for the supported Korean birthplace presets.
  const instant = new Date(
    Date.UTC(year, month - 1, day, effectiveHour - 9, effectiveMinute, 0),
  );

  const chart = timeKnown
    ? calculateWholeSignHouses(
        instant,
        birthplace.latitude,
        birthplace.longitude,
      )
    : null;

  const bodyNames = timeKnown
    ? (["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const)
    : (["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const);

  const bodies = bodyNames.map((body) => {
    const value = longitude(body, instant);
    const sign = signFromLongitude(value);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: sign.sign,
      element: sign.element,
      ...(chart
        ? { house: houseForLongitude(value, chart.ascendant.longitude) }
        : {}),
    };
  });

  const sun = bodies.find((body) => body.body === "Sun")!;
  const moon = timeKnown
    ? bodies.find((body) => body.body === "Moon") ?? null
    : null;

  return {
    timeKnown,
    instantUtc: timeKnown ? instant.toISOString() : null,
    birthplace: {
      ...birthplace,
    },
    bodies,
    sunSign: sun.sign,
    moonSign: moon?.sign ?? null,
    sunElement: sun.element,
    houseSystem: chart?.system ?? null,
    ascendant: chart?.ascendant ?? null,
    midheaven: chart?.midheaven ?? null,
    descendant: chart?.descendant ?? null,
    imumCoeli: chart?.imumCoeli ?? null,
    houses: chart?.houses ?? [],
    method: timeKnown
      ? "Astronomy Engine · 출생시각 KST→UTC 변환 · Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn · ASC/MC · Whole Sign 12 Houses"
      : "Astronomy Engine · 출생시간 미상 · 정오 스냅샷으로 시간 비민감 행성만 계산 · Moon/ASC/MC/Houses 제외",
    pending: timeKnown
      ? []
      : ["Moon", "ASC", "MC", "DSC", "IC", "12 Houses", "행성별 House"],
  };
}
