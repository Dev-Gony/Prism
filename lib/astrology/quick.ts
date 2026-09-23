import {
  Body,
  Ecliptic,
  GeoVector,
  SunPosition,
} from "astronomy-engine";
import type {
  AstrologyBody,
  AstrologyQuickResult,
} from "@/lib/analysis/types";

const SIGNS = [
  "양자리","황소자리","쌍둥이자리","게자리","사자자리","처녀자리",
  "천칭자리","전갈자리","사수자리","염소자리","물병자리","물고기자리",
] as const;

const ELEMENTS: AstrologyBody["element"][] = [
  "fire","earth","air","water","fire","earth",
  "air","water","fire","earth","air","water",
];

function signFromLongitude(longitude: number) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return { sign: SIGNS[index], element: ELEMENTS[index] };
}

function longitudeForBody(body: AstrologyBody["body"], date: Date): number {
  if (body === "Sun") return SunPosition(date).elon;
  const target = {
    Mercury: Body.Mercury,
    Venus: Body.Venus,
    Mars: Body.Mars,
  }[body];
  const vector = GeoVector(target, date, true);
  return Ecliptic(vector).elon;
}

function bodySnapshot(
  body: AstrologyBody["body"],
  year: number,
  month: number,
  day: number,
): AstrologyBody {
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  const longitude = longitudeForBody(body, noon);
  const center = signFromLongitude(longitude);
  const startSign = signFromLongitude(longitudeForBody(body, start)).sign;
  const endSign = signFromLongitude(longitudeForBody(body, end)).sign;

  return {
    body,
    longitude: Number(longitude.toFixed(4)),
    sign: center.sign,
    element: center.element,
    stableAcrossUtcDay: startSign === endSign,
  };
}

export function calculateAstrologyQuick(
  year: number,
  month: number,
  day: number,
): AstrologyQuickResult {
  const bodies = (["Sun","Mercury","Venus","Mars"] as const).map((body) =>
    bodySnapshot(body, year, month, day),
  );
  const sun = bodies[0];
  const boundaryBodies = bodies
    .filter((body) => !body.stableAcrossUtcDay)
    .map((body) => body.body);

  return {
    snapshotUtc: new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString(),
    bodies,
    sunSign: sun.sign,
    sunElement: sun.element,
    method: "Astronomy Engine · UTC 12:00 날짜 스냅샷 · 출생지/시간 미사용 · 하우스/ASC/MC 제외",
    warnings: [
      "Quick Reading은 출생시간과 출생지가 없어 하우스, 상승궁(ASC), MC를 계산하지 않습니다.",
      ...(boundaryBodies.length
        ? [boundaryBodies.join(", ") + "는 해당 UTC 날짜 안에서 별자리가 바뀌는 경계라 Detailed Reading에서 출생시간으로 다시 확인합니다."]
        : []),
    ],
  };
}
