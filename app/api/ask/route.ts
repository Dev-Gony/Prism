import { NextResponse } from "next/server";
import { createDetailedAnswer } from "@/lib/llm/detailed-chat";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 192 * 1024;
const MAX_QUESTION_LENGTH = 300;

function isDetailedAnalysis(value: unknown): value is DetailedAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DetailedAnalysisResponse>;

  return Boolean(
    item.input &&
      item.engines?.saju &&
      item.engines?.astrology &&
      item.engines?.numerology &&
      Array.isArray(item.cross) &&
      item.narrative,
  );
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "질문 요청이 너무 커요." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const question =
    typeof (body as { question?: unknown })?.question === "string"
      ? (body as { question: string }).question.trim()
      : "";
  const analysis = (body as { analysis?: unknown })?.analysis;

  if (!question) {
    return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: "질문은 300자 이내로 입력해 주세요." },
      { status: 400 },
    );
  }

  if (!isDetailedAnalysis(analysis)) {
    return NextResponse.json(
      { error: "Detailed 분석 결과가 필요해요." },
      { status: 400 },
    );
  }

  const answer = await createDetailedAnswer(analysis, question);

  return NextResponse.json(answer);
}
