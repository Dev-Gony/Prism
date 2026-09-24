import { SearchSunLongitude } from "astronomy-engine";
import type {
  DetailedAnalysisResponse,
  DetailedAstrologyBody,
} from "@/lib/analysis/detailed-types";
import { longitude, signFromLongitude } from "@/lib/astrology/detailed";

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
  bodies: Array<{
    body: DetailedAstrologyBody["body"];
    longitude: number;
    sign: string;
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
  const bodies = BODY_NAMES.map((body) => {
    const value = longitude(body, instant);

    return {
      body,
      longitude: Number(value.toFixed(4)),
      sign: signFromLongitude(value).sign,
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
    bodies,
    note: analysis.input.timeKnown
      ? "태양 황경의 정확 복귀 시각입니다. Solar Return 당시 체류 장소가 입력되지 않아 ASC와 Houses는 계산하지 않습니다."
      : "출생시간 미상 분석의 natal Sun은 정오 스냅샷 기준이므로 복귀 시각도 근사값입니다. ASC와 Houses는 계산하지 않습니다.",
  };
}
