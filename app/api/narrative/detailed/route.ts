import { NextResponse } from "next/server";
import { createDetailedNarrative } from "@/lib/llm/gemini";
import type { CrossInsight } from "@/lib/analysis/types";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export const runtime = "nodejs";

type DetailedNarrativeRequest = {
  engines?: DetailedAnalysisResponse["engines"];
  cross?: CrossInsight[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DetailedNarrativeRequest;

    if (
      !body.engines?.saju ||
      !body.engines?.astrology ||
      !body.engines?.numerology ||
      !Array.isArray(body.engines.saju.pillars) ||
      body.engines.saju.pillars.length !== 4 ||
      !Array.isArray(body.engines.astrology.houses) ||
      body.engines.astrology.houses.length !== 12 ||
      !Array.isArray(body.cross)
    ) {
      return NextResponse.json(
        { error: "상세 해석에 필요한 계산 결과가 부족해요." },
        { status: 400 },
      );
    }

    const narrative = await createDetailedNarrative(body.engines, body.cross);

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error("Prism detailed narrative failed", error);

    return NextResponse.json(
      { error: "상세 AI 해석을 정리하지 못했어요." },
      { status: 500 },
    );
  }
}
