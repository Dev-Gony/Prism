import { GoogleGenAI } from "@google/genai";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

export type DetailedAnswer = {
  answer: string;
  evidence: string[];
  generatedBy: "gemini" | "fallback";
  model?: string;
};

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    evidence: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
    },
  },
  required: ["answer", "evidence"],
};

function fallbackAnswer(
  analysis: DetailedAnalysisResponse,
  question: string,
): DetailedAnswer {
  const top = analysis.narrative.keywords[0];
  const cross = analysis.narrative.crossHighlights[0];
  const timeNote = analysis.input.timeKnown
    ? `ASC ${analysis.engines.astrology.ascendant?.sign ?? "-"}, MC ${analysis.engines.astrology.midheaven?.sign ?? "-"}`
    : "출생시간 미상으로 시주·ASC·MC·House는 제외";

  return {
    answer:
      `현재 결과 안에서 보면 “${question}”에 가장 가까운 단서는 ${top?.title ?? "핵심 성향"} 쪽이에요. ` +
      `${top?.description ?? analysis.narrative.summary} ` +
      `교차 분석에서는 ${cross?.title ?? "세 관점의 공통점"}이 함께 잡혀 있어요.`,
    evidence: [
      top ? `핵심 성향: ${top.title}` : "Detailed 핵심 성향",
      cross ? `교차 분석: ${cross.title}` : "세 관점 교차 분석",
      timeNote,
    ],
    generatedBy: "fallback",
  };
}

function validAnswer(value: unknown): value is { answer: string; evidence: string[] } {
  if (!value || typeof value !== "object") return false;
  const item = value as { answer?: unknown; evidence?: unknown };

  return (
    typeof item.answer === "string" &&
    item.answer.trim().length > 0 &&
    Array.isArray(item.evidence) &&
    item.evidence.length >= 1 &&
    item.evidence.every((entry) => typeof entry === "string")
  );
}

export async function createDetailedAnswer(
  analysis: DetailedAnalysisResponse,
  question: string,
): Promise<DetailedAnswer> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) return fallbackAnswer(analysis, question);

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const input = [
    "당신은 Prism Detailed Reading의 제한된 후속질문 설명 도우미입니다.",
    "반드시 제공된 계산 결과와 해석 데이터 안에서만 답하세요.",
    "사주, 점성술, 수비학 값을 새로 계산하거나 수정하지 마세요.",
    "제공되지 않은 출생시간, 하우스, 천체 위치를 추측하지 마세요.",
    "미래 사건을 예언하거나 의료·법률·재정 결정을 대신하지 마세요.",
    "사용자를 단정적으로 규정하지 말고 경향/가능성 언어를 사용하세요.",
    "질문이 현재 분석 범위를 벗어나면 그 한계를 짧게 밝히고, 현재 결과에서 연결 가능한 부분만 답하세요.",
    "답변은 한국어 3~6문장으로 간결하게 작성하세요.",
    "evidence에는 실제 데이터에서 사용한 근거만 1~4개 넣으세요.",
    "",
    `사용자 질문: ${question}`,
    "",
    JSON.stringify({
      input: analysis.input,
      engines: analysis.engines,
      cross: analysis.cross,
      narrative: analysis.narrative,
      warnings: analysis.warnings,
    }),
  ].join("\n");

  try {
    const interaction = await ai.interactions.create({
      model,
      input,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: ANSWER_SCHEMA,
      },
    });

    const raw = interaction.output_text?.trim();
    if (!raw) return fallbackAnswer(analysis, question);

    const parsed = JSON.parse(raw);
    if (!validAnswer(parsed)) return fallbackAnswer(analysis, question);

    return {
      ...parsed,
      generatedBy: "gemini",
      model,
    };
  } catch (error) {
    console.error("[Prism][Gemini] detailed question fallback", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });

    return fallbackAnswer(analysis, question);
  }
}
