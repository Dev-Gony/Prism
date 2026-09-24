import { NextResponse } from "next/server";
import { AnalysisInputError } from "@/lib/analysis/input";
import { normalizeBirthInput } from "@/lib/analysis/calendar";
import { getBirthplace } from "@/lib/analysis/birthplaces";
import { calculateSajuDetailed } from "@/lib/saju/detailed";
import { calculateAstrologyDetailed } from "@/lib/astrology/detailed";
import { calculateNumerologyDetailed } from "@/lib/numerology/detailed";
import { normalizeDetailedResults } from "@/lib/analysis/normalize";
import { crossAnalyze } from "@/lib/analysis/cross";
import { fallbackNarrative } from "@/lib/analysis/fallback";
import { buildDestinyTiming } from "@/lib/analysis/destiny-timing";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export const runtime = "nodejs";

function parseTime(raw: unknown, timeKnown: unknown) {
  if (timeKnown === false || raw === null || raw === "") {
    return { time: null, hour: null, minute: null, timeKnown: false };
  }

  if (typeof raw !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    throw new AnalysisInputError("태어난 시간을 HH:MM 형식으로 입력해 주세요.");
  }

  const [hour, minute] = raw.split(":").map(Number);
  return { time: raw, hour, minute, timeKnown: true };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: unknown;
      time?: unknown;
      birthplaceId?: unknown;
      calendarType?: unknown;
      isLeapMonth?: unknown;
      timeKnown?: unknown;
    };

    const input = normalizeBirthInput(
      body.date,
      body.calendarType,
      body.isLeapMonth,
    );
    const time = parseTime(body.time, body.timeKnown);

    if (typeof body.birthplaceId !== "string") {
      throw new AnalysisInputError("태어난 지역을 선택해 주세요.");
    }

    const birthplace = getBirthplace(body.birthplaceId);
    if (!birthplace) {
      throw new AnalysisInputError("지원하는 출생 지역을 선택해 주세요.");
    }

    const saju = calculateSajuDetailed(
      input.year,
      input.month,
      input.day,
      time.hour,
      time.minute,
    );

    const astrology = calculateAstrologyDetailed(
      input.year,
      input.month,
      input.day,
      time.hour,
      time.minute,
      birthplace,
    );

    const numerology = calculateNumerologyDetailed(input.date);
    const normalized = normalizeDetailedResults(saju, astrology, numerology);
    const cross = crossAnalyze(normalized);
    const narrative = fallbackNarrative(cross);
    const destinyTiming = buildDestinyTiming(saju, astrology, numerology);

    const response: DetailedAnalysisResponse = {
      input: {
        date: input.date,
        time: time.time,
        timeKnown: time.timeKnown,
        birthplaceId: birthplace.id,
        calendarType: input.calendarType,
        originalDate: input.originalDate,
        isLeapMonth: input.isLeapMonth,
      },
      engines: {
        saju,
        astrology,
        numerology,
      },
      normalized,
      cross,
      narrative,
      destinyTiming,
      warnings: [
        "Detailed v1은 대한민국 주요 도시 출생지를 우선 지원합니다.",
        time.timeKnown
          ? "ASC·MC·12 Houses는 출생시간과 출생지역을 기준으로 계산합니다."
          : "출생시간 미상으로 시주, Moon, ASC, MC, 12 Houses는 계산에서 제외했습니다.",
        "사주 계산은 진태양시 보정을 아직 적용하지 않습니다.",
        "해석은 전통적·문화적 자기탐색을 위한 참고 정보입니다.",
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AnalysisInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Prism detailed analysis failed", error);
    return NextResponse.json(
      { error: "상세 분석 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
