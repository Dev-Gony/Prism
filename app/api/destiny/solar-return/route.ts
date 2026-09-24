import { NextResponse } from "next/server";
import { calculateSolarReturn } from "@/lib/astrology/solar-return";
import { getBirthplace } from "@/lib/analysis/birthplaces";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256 * 1024;

function isDetailedAnalysis(value: unknown): value is DetailedAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DetailedAnalysisResponse>;

  return Boolean(
    item.input?.date &&
      item.engines?.astrology &&
      Array.isArray(item.engines.astrology.bodies) &&
      item.engines.astrology.bodies.some((body) => body.body === "Sun"),
  );
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Solar Return 요청이 너무 커요." },
      { status: 413 },
    );
  }

  let body: {
    analysis?: unknown;
    year?: unknown;
    returnPlaceId?: unknown;
  };

  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (!isDetailedAnalysis(body.analysis)) {
    return NextResponse.json(
      { error: "Detailed 분석 결과가 필요해요." },
      { status: 400 },
    );
  }

  const year =
    typeof body.year === "number" && Number.isInteger(body.year)
      ? body.year
      : new Date().getUTCFullYear();

  if (year < 1900 || year > 2100) {
    return NextResponse.json(
      { error: "1900~2100년 사이에서 확인해 주세요." },
      { status: 400 },
    );
  }

  const returnPlace =
    typeof body.returnPlaceId === "string" && body.returnPlaceId.trim()
      ? getBirthplace(body.returnPlaceId.trim())
      : null;

  if (
    typeof body.returnPlaceId === "string" &&
    body.returnPlaceId.trim() &&
    !returnPlace
  ) {
    return NextResponse.json(
      { error: "선택한 Solar Return 장소를 찾지 못했어요." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      calculateSolarReturn(
        body.analysis,
        year,
        returnPlace
          ? {
              label: returnPlace.label,
              latitude: returnPlace.latitude,
              longitude: returnPlace.longitude,
              timezone: returnPlace.timezone,
            }
          : null,
      ),
    );
  } catch (error) {
    console.error("Prism solar return failed", error);
    return NextResponse.json(
      { error: "Solar Return을 계산하지 못했어요." },
      { status: 500 },
    );
  }
}
