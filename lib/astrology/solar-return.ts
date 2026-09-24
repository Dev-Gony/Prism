import { SearchSunLongitude } from "astronomy-engine";
import type {
  DetailedAnalysisResponse,
  DetailedAstrologyBody,
} from "@/lib/analysis/detailed-types";
import { longitude, signFromLongitude } from "@/lib/astrology/detailed";
import type { Birthplace } from "@/lib/analysis/birthplaces";
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

export type SolarReturnSnapshot = {
  year: number;
  exactUtc: string;
  targetSunLongitude: number;
  returnSunLongitude: number;
  residualOrb: number;
  precision: "exact-birth-time" | "approximate-unknown-birth-time";
  returnPlace: Birthplace | null;
  houseSystem: "whole-sign" | null;
  ascendant: ReturnType<typeof calculateWholeSignHouses>["ascendant"] | null;
  midheaven: ReturnType<typeof calculateWholeSignHouses>["midheaven"] | null;
  houses: ReturnType<typeof calculateWholeSignHouses>["houses"];
  bodies: Array<{
    body: DetailedAstrologyBody["body"];
    longitude: number;
    sign: string;
    house?: number;
  }>;
  note: string;
};

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
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
  const approximateBirthday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Date(
    approximateBirthday.getTime() - 12 * 24 * 60 * 60 * 1000,
  );
}

export function calculateSolarReturn(
  analysis: DetailedAnalysisResponse,
  year: number,
  returnPlace: Birthplace | null = null,
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

  const start = birthdaySearchStart(analysis.input.date, year);
  const found = SearchSunLongitude(natalSun.longitude, start, 30);

  if (!found) {
    throw new Error("해당 연도의 Solar Return 시각을 찾지 못했습니다.");
  }

  const instant = found.date;
  const chart = returnPlace
    ? calculateWholeSignHouses(
        instant,
        returnPlace.latitude,
        returnPlace.longitude,
      )
    : null;
  const bodies = BODY_NAMES.map((body) => {
    const value = longitude(body, instant);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: signFromLongitude(value).sign,
      ...(chart
        ? { house: houseForLongitude(value, chart.ascendant.longitude) }
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
    returnPlace,
    houseSystem: chart ? "whole-sign" : null,
    ascendant: chart?.ascendant ?? null,
    midheaven: chart?.midheaven ?? null,
    houses: chart?.houses ?? [],
    bodies,
    note: !analysis.input.timeKnown
      ? chart
        ? "출생시간 미상 분석의 natal Sun은 정오 스냅샷 기준이라 복귀 시각은 근사값입니다. 선택한 복귀 장소 기준 Whole Sign Houses를 함께 표시합니다."
        : "출생시간 미상 분석의 natal Sun은 정오 스냅샷 기준이라 복귀 시각은 근사값입니다."
      : chart
        ? "태양 황경의 정확 복귀 시각과 선택한 복귀 장소 기준 Whole Sign Houses입니다."
        : "태양 황경의 정확 복귀 시각입니다. 복귀 장소가 없어 ASC와 Houses는 계산하지 않습니다.",
  };
}
