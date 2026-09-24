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
import { kstDateString } from "@/lib/analysis/asof";
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

const MODALITIES: DetailedAstrologyBody["modality"][] = [
  "cardinal","fixed","mutable","cardinal","fixed","mutable",
  "cardinal","fixed","mutable","cardinal","fixed","mutable",
];

const SIGN_RULERS: Record<
  string,
  { primary: DetailedAstrologyBody["body"]; coRuler?: DetailedAstrologyBody["body"] }
> = {
  양자리: { primary: "Mars" },
  황소자리: { primary: "Venus" },
  쌍둥이자리: { primary: "Mercury" },
  게자리: { primary: "Moon" },
  사자자리: { primary: "Sun" },
  처녀자리: { primary: "Mercury" },
  천칭자리: { primary: "Venus" },
  전갈자리: { primary: "Mars", coRuler: "Pluto" },
  사수자리: { primary: "Jupiter" },
  염소자리: { primary: "Saturn" },
  물병자리: { primary: "Saturn", coRuler: "Uranus" },
  물고기자리: { primary: "Jupiter", coRuler: "Neptune" },
};

const DOMICILES: Partial<Record<DetailedAstrologyBody["body"], string[]>> = {
  Sun: ["사자자리"],
  Moon: ["게자리"],
  Mercury: ["쌍둥이자리", "처녀자리"],
  Venus: ["황소자리", "천칭자리"],
  Mars: ["양자리", "전갈자리"],
  Jupiter: ["사수자리", "물고기자리"],
  Saturn: ["염소자리", "물병자리"],
};

const EXALTATIONS: Partial<Record<DetailedAstrologyBody["body"], string>> = {
  Sun: "양자리",
  Moon: "황소자리",
  Mercury: "처녀자리",
  Venus: "물고기자리",
  Mars: "염소자리",
  Jupiter: "게자리",
  Saturn: "천칭자리",
};

const DETRIMENTS: Partial<Record<DetailedAstrologyBody["body"], string[]>> = {
  Sun: ["물병자리"],
  Moon: ["염소자리"],
  Mercury: ["사수자리", "물고기자리"],
  Venus: ["양자리", "전갈자리"],
  Mars: ["황소자리", "천칭자리"],
  Jupiter: ["쌍둥이자리", "처녀자리"],
  Saturn: ["게자리", "사자자리"],
};

const FALLS: Partial<Record<DetailedAstrologyBody["body"], string>> = {
  Sun: "천칭자리",
  Moon: "전갈자리",
  Mercury: "물고기자리",
  Venus: "처녀자리",
  Mars: "게자리",
  Jupiter: "염소자리",
  Saturn: "양자리",
};

const MODERN_DOMICILES: Partial<Record<DetailedAstrologyBody["body"], string>> = {
  Uranus: "물병자리",
  Neptune: "물고기자리",
  Pluto: "전갈자리",
};

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
    modality: MODALITIES[index],
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

function dignityFor(
  body: DetailedAstrologyBody["body"],
  sign: string,
): DetailedAstrologyBody["dignity"] {
  if (DOMICILES[body]?.includes(sign)) return "domicile";
  if (EXALTATIONS[body] === sign) return "exaltation";
  if (DETRIMENTS[body]?.includes(sign)) return "detriment";
  if (FALLS[body] === sign) return "fall";
  if (MODERN_DOMICILES[body] === sign) return "modern-ruler";
  return "peregrine";
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


function nearestAspect(distance: number) {
  return ASPECTS
    .map((aspect) => ({
      ...aspect,
      orbDistance: Math.abs(distance - aspect.angle),
    }))
    .filter((aspect) => aspect.orbDistance <= aspect.orb)
    .sort((a, b) => a.orbDistance - b.orbDistance)[0];
}

export function calculateAstrologyTransits(
  natalBodies: DetailedAstrologyBody[],
  ascendant: DetailedAstrologyResult["ascendant"],
  midheaven: DetailedAstrologyResult["midheaven"],
  asOfDate = kstDateString(),
): DetailedAstrologyResult["transits"] {
  const [year, month, day] = asOfDate.split("-").map(Number);
  const now = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
  const transitBodies = (
    ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const
  ).map((body) => {
    const value = longitude(body, now);
    const sign = signFromLongitude(value);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: sign.sign,
    };
  });

  const natalPoints = [
    ...natalBodies.map((body) => ({
      point: body.body as DetailedAstrologyBody["body"] | "ASC" | "MC",
      longitude: body.longitude,
    })),
    ...(ascendant
      ? [{ point: "ASC" as const, longitude: ascendant.longitude }]
      : []),
    ...(midheaven
      ? [{ point: "MC" as const, longitude: midheaven.longitude }]
      : []),
  ];

  const aspects: DetailedAstrologyResult["transits"]["aspects"] = [];

  transitBodies.forEach((transit) => {
    natalPoints.forEach((natal) => {
      const distance = angularDistance(transit.longitude, natal.longitude);
      const match = nearestAspect(distance);
      if (!match) return;

      aspects.push({
        transitBody: transit.body,
        natalPoint: natal.point,
        type: match.type,
        orb: Number(match.orbDistance.toFixed(2)),
      });
    });
  });

  return {
    asOfDate,
    bodies: transitBodies,
    aspects: aspects.sort((a, b) => a.orb - b.orb),
  };
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
      modality: sign.modality,
      dignity: dignityFor(body, sign.sign),
      ...(chart
        ? { house: houseForLongitude(value, chart.ascendant.longitude) }
        : {}),
    };
  });

  const sun = bodies.find((body) => body.body === "Sun")!;
  const moon = timeKnown
    ? bodies.find((body) => body.body === "Moon") ?? null
    : null;

  const balance = bodies.reduce(
    (acc, body) => {
      acc.elements[body.element] += 1;
      acc.modalities[body.modality] += 1;
      return acc;
    },
    {
      elements: { fire: 0, earth: 0, air: 0, water: 0 },
      modalities: { cardinal: 0, fixed: 0, mutable: 0 },
    },
  );

  const chartRuler = chart
    ? (() => {
        const ruler = SIGN_RULERS[chart.ascendant.sign];
        const primaryBody = bodies.find((body) => body.body === ruler.primary);
        return {
          ascendantSign: chart.ascendant.sign,
          primary: ruler.primary,
          coRuler: ruler.coRuler,
          sign: primaryBody?.sign ?? "-",
          house: primaryBody?.house,
        };
      })()
    : null;

  const houseRulers = chart
    ? chart.houses.map((house) => {
        const ruler = SIGN_RULERS[house.sign];
        const rulerBody = bodies.find((body) => body.body === ruler.primary);

        return {
          house: house.house,
          sign: house.sign,
          ruler: ruler.primary,
          coRuler: ruler.coRuler,
          rulerSign: rulerBody?.sign ?? null,
          rulerHouse: rulerBody?.house ?? null,
        };
      })
    : [];

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
    balance,
    chartRuler,
    houseRulers,
    transits: calculateAstrologyTransits(
      bodies,
      chart?.ascendant ?? null,
      chart?.midheaven ?? null,
    ),
    method: timeKnown
      ? "Astronomy Engine · Sun~Pluto 황경 · 출생시각/지역 반영 · ASC/MC · Whole Sign 12 Houses · 주요 5개 각 · 원소/모달리티 균형 · 차트 룰러/하우스 룰러 · 기본 dignity"
      : "Astronomy Engine · 출생시간 미상 · 정오 스냅샷 · Moon/ASC/MC/Houses 제외 · Sun~Pluto 시간 비민감 배치 및 주요 각 계산",
    pending: timeKnown
      ? []
      : ["Moon", "ASC", "MC", "DSC", "IC", "12 Houses", "행성별 House"],
  };
}
