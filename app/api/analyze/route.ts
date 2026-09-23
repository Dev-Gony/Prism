import { NextResponse } from "next/server";
import { AnalysisInputError } from "@/lib/analysis/input";
import { normalizeBirthInput } from "@/lib/analysis/calendar";
import { calculateSajuQuick } from "@/lib/saju/quick";
import { calculateAstrologyQuick } from "@/lib/astrology/quick";
import { calculateNumerologyQuick } from "@/lib/numerology/quick";
import { normalizeQuickResults } from "@/lib/analysis/normalize";
import { crossAnalyze } from "@/lib/analysis/cross";
import { fallbackNarrative } from "@/lib/analysis/fallback";
import type { QuickAnalysisResponse } from "@/lib/analysis/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: unknown;
      calendarType?: unknown;
      isLeapMonth?: unknown;
    };
    const input = normalizeBirthInput(
      body.date,
      body.calendarType,
      body.isLeapMonth,
    );

    const saju = calculateSajuQuick(input.year, input.month, input.day);
    const astrology = calculateAstrologyQuick(input.year, input.month, input.day);
    const numerology = calculateNumerologyQuick(input.date);
    const normalized = normalizeQuickResults(saju, astrology, numerology);
    const cross = crossAnalyze(normalized);

    // Do not block the core result on LLM latency.
    // Gemini enrichment runs separately through /api/narrative.
    const narrative = fallbackNarrative(cross);

    const response: QuickAnalysisResponse = {
      input: {
        date: input.date,
        calendarType: input.calendarType,
        originalDate: input.originalDate,
        isLeapMonth: input.isLeapMonth,
      },
      engines: { saju, astrology, numerology },
      normalized,
      cross,
      narrative,
      warnings: [
        ...saju.warnings,
        ...astrology.warnings,
        "Prism의 해석은 전통적·문화적 자기탐색 프레임워크를 활용한 참고 정보이며 과학적 성격 진단이나 미래 예측을 의미하지 않습니다.",
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AnalysisInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Prism analysis failed", error);
    return NextResponse.json(
      { error: "분석 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
