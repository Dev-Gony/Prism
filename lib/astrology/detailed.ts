import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  SunPosition,
} from "astronomy-engine";
import type {
  DetailedAstrologyAspect,
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
  "fire","earth","air","water","fire","earth",
  "air","water","fire","earth","air","water",
];

const ASPECTS: Array<{
  type: DetailedAstrologyAspect["type"];
  angle: number;
  orb: number;
}> = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 6 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "opposition", angle: 180, orb: 8 },
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
    Uranus: Body.Uranus,
    Neptune: Body.Neptune,
    Pluto: Body.Pluto,
  }[body];

  return Ecliptic(GeoVector(target, date, true)).elon;
}

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function calculateAspects(
  bodies: DetailedAstrologyBody[],
): DetailedAstrologyAspect[] {
  const aspects: DetailedAstrologyAspect[] = [];

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];
      const distance = angularDistance(bodyA.longitude, bodyB.longitude);

      const match = ASPECTS
        .map((aspect) => ({
          ...aspect,
          orbDistance: Math.abs(distance - aspect.angle),
        }))
        .filter((aspect) => aspect.orbDistance <= aspect.orb)
        .sort((a, b) => a.orbDistance - b.orbDistance)[0];

      if (!match) continue;

      aspects.push({
        bodyA: bodyA.body,
        bodyB: bodyB.body,
        type: match.type,
        angle: Number(distance.toFixed(2)),
        orb: Number(match.orbDistance.toFixed(2)),
      });
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
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

  const bodyNames: DetailedAstrologyBody["body"][] = timeKnown
    ? [
        "Sun",
        "Moon",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
      ]
    : [
        "Sun",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
      ];

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
    birthplace: { ...birthplace },
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
    aspects: calculateAspects(bodies),
    method: timeKnown
      ? "Astronomy Engine · Sun~Pluto 황경 · 출생시각/지역 반영 · ASC/MC · Whole Sign 12 Houses · 주요 5개 각(conjunction/sextile/square/trine/opposition)"
      : "Astronomy Engine · 출생시간 미상 · 정오 스냅샷 · Moon/ASC/MC/Houses 제외 · Sun~Pluto 시간 비민감 배치 및 주요 각 계산",
    pending: timeKnown
      ? []
      : ["Moon", "ASC", "MC", "DSC", "IC", "12 Houses", "행성별 House"],
  };
}
