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
  hour: number,
  minute: number,
  birthplace: Birthplace,
): DetailedAstrologyResult {
  // Detailed v1 supports Korean birthplaces from 1990 onward.
  // KST is UTC+9 for this supported range.
  const instant = new Date(
    Date.UTC(year, month - 1, day, hour - 9, minute, 0),
  );

  const bodies = (
    ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const
  ).map((body) => {
    const value = longitude(body, instant);
    const sign = signFromLongitude(value);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: sign.sign,
      element: sign.element,
    };
  });

  const sun = bodies.find((body) => body.body === "Sun")!;
  const moon = bodies.find((body) => body.body === "Moon")!;

  return {
    instantUtc: instant.toISOString(),
    birthplace: {
      ...birthplace,
    },
    bodies,
    sunSign: sun.sign,
    moonSign: moon.sign,
    sunElement: sun.element,
    method:
      "Astronomy Engine · 출생시각 KST→UTC 변환 · Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn ecliptic longitude",
    pending: [
      "ASC 계산",
      "MC 계산",
      "House system 확정 및 12 Houses 계산",
    ],
  };
}
