import { SiderealTime } from "astronomy-engine";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

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

export type ZodiacSign = (typeof SIGNS)[number];

export type ChartAngle = {
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
};

export type HouseCusp = {
  house: number;
  longitude: number;
  sign: ZodiacSign;
};

export type HouseCalculation = {
  system: "whole-sign";
  ramc: number;
  obliquity: number;
  ascendant: ChartAngle;
  midheaven: ChartAngle;
  descendant: ChartAngle;
  imumCoeli: ChartAngle;
  houses: HouseCusp[];
};

function norm360(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function signInfo(longitude: number) {
  const normalized = norm360(longitude);
  const index = Math.floor(normalized / 30);

  return {
    sign: SIGNS[index],
    degreeInSign: Number((normalized - index * 30).toFixed(4)),
  };
}

function angle(longitude: number): ChartAngle {
  const normalized = Number(norm360(longitude).toFixed(4));
  const info = signInfo(normalized);

  return {
    longitude: normalized,
    sign: info.sign,
    degreeInSign: info.degreeInSign,
  };
}

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function meanObliquity(date: Date) {
  // Meeus mean obliquity polynomial, sufficient for the supported 1900-2100 range.
  const t = (julianDay(date) - 2451545.0) / 36525;
  const arcseconds =
    84381.448 -
    46.815 * t -
    0.00059 * t * t +
    0.001813 * t * t * t;

  return arcseconds / 3600;
}

function ascendantLongitude(ramc: number, obliquity: number, latitude: number) {
  const r = ramc * DEG;
  const e = obliquity * DEG;
  const phi = latitude * DEG;

  return norm360(
    Math.atan2(
      Math.cos(r),
      -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e)),
    ) * RAD,
  );
}

function midheavenLongitude(ramc: number, obliquity: number) {
  const r = ramc * DEG;
  const e = obliquity * DEG;

  return norm360(
    Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * RAD,
  );
}

export function calculateWholeSignHouses(
  instantUtc: Date,
  latitude: number,
  longitude: number,
): HouseCalculation {
  const ramc = norm360(SiderealTime(instantUtc) * 15 + longitude);
  const obliquity = meanObliquity(instantUtc);
  const ascLongitude = ascendantLongitude(ramc, obliquity, latitude);
  const mcLongitude = midheavenLongitude(ramc, obliquity);

  const ascSignStart = Math.floor(ascLongitude / 30) * 30;
  const houses: HouseCusp[] = Array.from({ length: 12 }, (_, index) => {
    const cusp = norm360(ascSignStart + index * 30);

    return {
      house: index + 1,
      longitude: Number(cusp.toFixed(4)),
      sign: signInfo(cusp).sign,
    };
  });

  return {
    system: "whole-sign",
    ramc: Number(ramc.toFixed(4)),
    obliquity: Number(obliquity.toFixed(6)),
    ascendant: angle(ascLongitude),
    midheaven: angle(mcLongitude),
    descendant: angle(ascLongitude + 180),
    imumCoeli: angle(mcLongitude + 180),
    houses,
  };
}

export function houseForLongitude(longitude: number, ascendantLongitude: number) {
  const planetSign = Math.floor(norm360(longitude) / 30);
  const ascSign = Math.floor(norm360(ascendantLongitude) / 30);
  return ((planetSign - ascSign + 12) % 12) + 1;
}
