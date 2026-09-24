import { SearchSunLongitude } from "astronomy-engine";
import type {
  DetailedAnalysisResponse,
  DetailedAstrologyAspect,
  DetailedAstrologyBody,
  DetailedChartAngle,
  DetailedHouse,
} from "@/lib/analysis/detailed-types";
import { longitude, signFromLongitude } from "@/lib/astrology/detailed";
import {
  calculateWholeSignHouses,
  houseForLongitude,
} from "@/lib/astrology/houses";

const BODY_NAMES: DetailedAstrologyBody["body"][] = [
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
];

const ASPECTS: Array<{
  type: DetailedAstrologyAspect["type"];
  angle: number;
  orb: number;
}> = [
  { type: "conjunction", angle: 0, orb: 6 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 5 },
  { type: "trine", angle: 120, orb: 5 },
  { type: "opposition", angle: 180, orb: 6 },
];

export type SolarReturnLocation = {
  label: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type SolarReturnAspect = {
  bodyA: DetailedAstrologyBody["body"];
  bodyB: DetailedAstrologyBody["body"];
  type: DetailedAstrologyAspect["type"];
  orb: number;
};

export type SolarReturnNatalAspect = {
  returnBody: DetailedAstrologyBody["body"];
  natalPoint: DetailedAstrologyBody["body"] | "ASC" | "MC";
  type: DetailedAstrologyAspect["type"];
  orb: number;
};

export type SolarReturnSnapshot = {
  year: number;
  exactUtc: string;
  targetSunLongitude: number;
  returnSunLongitude: number;
  residualOrb: number;
  precision: "exact-birth-time" | "approximate-unknown-birth-time";
  location: SolarReturnLocation | null;
  angles: {
    ascendant: DetailedChartAngle;
    midheaven: DetailedChartAngle;
    descendant: DetailedChartAngle;
    imumCoeli: DetailedChartAngle;
  } | null;
  houses: DetailedHouse[];
  bodies: Array<{
    body: DetailedAstrologyBody["body"];
    longitude: number;
    sign: string;
    house?: number;
  }>;
  aspects: SolarReturnAspect[];
  natalAspects: SolarReturnNatalAspect[];
  note: string;
};

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function nearestAspect(distance: number) {
  return ASPECTS
    .map((aspect) => ({
      ...aspect,
      orbDistance: Math.abs(distance - aspect.angle),
    }))
    .filter((aspect) => aspect.orbDistance <= aspect.orb)
    .sort((a, b) => a.orbDistance - b.orbDistance)[0];
}

function birthdaySearchStart(birthDate: string, year: number) {
  const [, monthText, dayText] = birthDate.split("-");
  const month = Number(monthText);
  const requestedDay = Number(dayText);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(requestedDay) ||
    requestedDay < 1 ||
    requestedDay > 31
  ) {
    throw new Error("Solar Return 기준 생년월일이 올바르지 않습니다.");
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(requestedDay, daysInMonth);
  const approximateBirthday = new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0),
  );

  return new Date(
    approximateBirthday.getTime() - 12 * 24 * 60 * 60 * 1000,
  );
}

function calculateReturnAspects(
  bodies: SolarReturnSnapshot["bodies"],
): SolarReturnAspect[] {
  const aspects: SolarReturnAspect[] = [];

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];
      const match = nearestAspect(
        angularDistance(bodyA.longitude, bodyB.longitude),
      );

      if (!match) continue;

      aspects.push({
        bodyA: bodyA.body,
        bodyB: bodyB.body,
        type: match.type,
        orb: Number(match.orbDistance.toFixed(2)),
      });
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function calculateNatalOverlay(
  analysis: DetailedAnalysisResponse,
  bodies: SolarReturnSnapshot["bodies"],
): SolarReturnNatalAspect[] {
  const natalPoints = [
    ...analysis.engines.astrology.bodies.map((body) => ({
      point: body.body as DetailedAstrologyBody["body"] | "ASC" | "MC",
      longitude: body.longitude,
    })),
    ...(analysis.engines.astrology.ascendant
      ? [
          {
            point: "ASC" as const,
            longitude: analysis.engines.astrology.ascendant.longitude,
          },
        ]
      : []),
    ...(analysis.engines.astrology.midheaven
      ? [
          {
            point: "MC" as const,
            longitude: analysis.engines.astrology.midheaven.longitude,
          },
        ]
      : []),
  ];

  const overlay: SolarReturnNatalAspect[] = [];

  bodies.forEach((returnBody) => {
    natalPoints.forEach((natal) => {
      const match = nearestAspect(
        angularDistance(returnBody.longitude, natal.longitude),
      );

      if (!match || match.orbDistance > 3) return;

      overlay.push({
        returnBody: returnBody.body,
        natalPoint: natal.point,
        type: match.type,
        orb: Number(match.orbDistance.toFixed(2)),
      });
    });
  });

  return overlay.sort((a, b) => a.orb - b.orb).slice(0, 16);
}

function validateLocation(location: SolarReturnLocation | null | undefined) {
  if (!location) return null;

  if (
    !Number.isFinite(location.latitude) ||
    location.latitude < -89.9 ||
    location.latitude > 89.9 ||
    !Number.isFinite(location.longitude) ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    throw new Error("Solar Return 위치 좌표가 올바르지 않습니다.");
  }

  return {
    label: location.label.trim() || "선택 위치",
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    ...(location.timezone?.trim()
      ? { timezone: location.timezone.trim() }
      : {}),
  };
}

export function calculateSolarReturn(
  analysis: DetailedAnalysisResponse,
  year: number,
  rawLocation?: SolarReturnLocation | null,
): SolarReturnSnapshot {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("Solar Return 연도는 1900~2100 사이여야 합니다.");
  }

  const natalSun = analysis.engines.astrology.bodies.find(
    (body) => body.body === "Sun",
  );

  if (!natalSun) {
    throw new Error("Solar Return 계산에 필요한 natal Sun이 없습니다.");
  }

  const location = validateLocation(rawLocation);
  const start = birthdaySearchStart(analysis.input.date, year);
  const found = SearchSunLongitude(natalSun.longitude, start, 30);

  if (!found) {
    throw new Error("해당 연도의 Solar Return 시각을 찾지 못했습니다.");
  }

  const instant = found.date;
  const chart = location
    ? calculateWholeSignHouses(
        instant,
        location.latitude,
        location.longitude,
      )
    : null;

  const bodies = BODY_NAMES.map((body) => {
    const value = longitude(body, instant);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: signFromLongitude(value).sign,
      ...(chart
        ? {
            house: houseForLongitude(
              value,
              chart.ascendant.longitude,
            ),
          }
        : {}),
    };
  });

  const returnSun = bodies.find((body) => body.body === "Sun")!;

  return {
    year,
    exactUtc: instant.toISOString(),
    targetSunLongitude: Number(natalSun.longitude.toFixed(4)),
    returnSunLongitude: returnSun.longitude,
    residualOrb: Number(
      angularDistance(natalSun.longitude, returnSun.longitude).toFixed(6),
    ),
    precision: analysis.input.timeKnown
      ? "exact-birth-time"
      : "approximate-unknown-birth-time",
    location,
    angles: chart
      ? {
          ascendant: chart.ascendant,
          midheaven: chart.midheaven,
          descendant: chart.descendant,
          imumCoeli: chart.imumCoeli,
        }
      : null,
    houses: chart?.houses ?? [],
    bodies,
    aspects: calculateReturnAspects(bodies),
    natalAspects: calculateNatalOverlay(analysis, bodies),
    note: location
      ? analysis.input.timeKnown
        ? `태양 황경의 정확 복귀 시각과 ${location.label} 위치를 반영한 Whole Sign Solar Return 차트입니다. 실제 복귀 순간 체류 위치가 다르면 ASC와 Houses도 달라집니다.`
        : `출생시간 미상 분석의 natal Sun은 정오 스냅샷 기준이라 복귀 시각이 근사값입니다. ${location.label} 위치를 사용해 ASC와 Houses를 계산했지만 출생시간 오차의 영향을 받을 수 있습니다.`
      : analysis.input.timeKnown
        ? "태양 황경의 정확 복귀 시각입니다. Solar Return 당시 체류 장소가 입력되지 않아 ASC와 Houses는 계산하지 않습니다."
        : "출생시간 미상 분석의 natal Sun은 정오 스냅샷 기준이므로 복귀 시각도 근사값입니다. ASC와 Houses는 계산하지 않습니다.",
  };
}
