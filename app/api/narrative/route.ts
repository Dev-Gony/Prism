import { NextResponse } from "next/server";
import { createNarrative } from "@/lib/llm/gemini";
import type {
  CrossInsight,
  QuickAnalysisResponse,
} from "@/lib/analysis/types";

export const runtime = "nodejs";

type NarrativeRequest = {
  engines?: QuickAnalysisResponse["engines"];
  cross?: CrossInsight[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeRequest;

    if (
      !body.engines?.saju ||
      !body.engines?.astrology ||
      !body.engines?.numerology ||
      !Array.isArray(body.cross)
    ) {
      return NextResponse.json(
        { error: "해석에 필요한 계산 결과가 부족해요." },
        { status: 400 },
      );
    }

    const narrative = await createNarrative(body.engines, body.cross);

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error("Prism narrative failed", error);
    return NextResponse.json(
      { error: "AI 해석을 정리하지 못했어요." },
      { status: 500 },
    );
  }
}
