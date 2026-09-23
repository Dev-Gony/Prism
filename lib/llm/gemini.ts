import { GoogleGenAI } from "@google/genai";
import { fallbackNarrative } from "@/lib/analysis/fallback";
import type {
  AnalysisNarrative,
  CrossInsight,
  QuickAnalysisResponse,
  TraitKey,
} from "@/lib/analysis/types";

type EnginePayload = QuickAnalysisResponse["engines"];

const TRAIT_KEYS: TraitKey[] = [
  "autonomy",
  "reflection",
  "stability",
  "sociability",
  "creativity",
  "adaptability",
  "care",
];

const NARRATIVE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keywords: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["title", "description", "tags"],
      },
    },
    observations: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["label", "title", "description"],
      },
    },
    crossHighlights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          trait: { type: "string", enum: TRAIT_KEYS },
          title: { type: "string" },
          label: {
            type: "string",
            enum: [
              "비슷하게 보여요",
              "서로 보완돼요",
              "조금 다르게 보여요",
              "더 알아야 해요",
            ],
          },
          explanation: { type: "string" },
        },
        required: ["trait", "title", "label", "explanation"],
      },
    },
  },
  required: ["summary", "keywords", "observations", "crossHighlights"],
};

function isNarrative(
  value: unknown,
): value is Omit<AnalysisNarrative, "generatedBy" | "model"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.keywords) ||
    !Array.isArray(candidate.observations) ||
    !Array.isArray(candidate.crossHighlights)
  ) {
    return false;
  }

  return (
    candidate.keywords.length === 3 &&
    candidate.observations.length === 5 &&
    candidate.crossHighlights.length === 3 &&
    candidate.crossHighlights.every((item) => {
      if (!item || typeof item !== "object") return false;
      const trait = (item as { trait?: unknown }).trait;
      return typeof trait === "string" && TRAIT_KEYS.includes(trait as TraitKey);
    })
  );
}

function logFallback(reason: string, error?: unknown) {
  if (error instanceof Error) {
    console.error("[Prism][Gemini] fallback", {
      reason,
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error("[Prism][Gemini] fallback", {
    reason,
    error: error ? String(error) : undefined,
  });
}

export async function createNarrative(
  engines: EnginePayload,
  cross: CrossInsight[],
): Promise<AnalysisNarrative> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    logFallback("missing_api_key");
    return fallbackNarrative(cross);
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const ai = new GoogleGenAI({ apiKey });

  const instruction = [
    "당신은 Prism의 설명 레이어입니다.",
    "사주·점성술·수비학 계산값을 새로 만들거나 수정하지 마세요.",
    "제공된 구조화 데이터만 근거로 사용하세요.",
    "세 체계가 다르게 보이면 하나를 정답으로 고르지 말고 차이를 설명하세요.",
    "출생시간·출생지가 없는 Quick Reading의 한계를 존중하세요.",
    "미래 사건을 단정적으로 예언하지 마세요.",
    "전문용어보다 쉬운 한국어를 먼저 쓰세요.",
    "사용자를 단정적으로 규정하지 말고 '보여요', '읽을 수 있어요'처럼 표현하세요.",
    "모바일에서 읽기 좋게 각 문장을 짧게 쓰세요.",
  ].join("\n");

  const input = [
    instruction,
    "",
    "아래 Quick Reading 데이터를 Prism의 세 요정이 함께 정리한 것처럼 다정하고 간결하게 설명하세요.",
    "summary는 2문장 이내, keyword/observation/cross explanation은 각각 2문장 이내로 작성하세요.",
    "",
    JSON.stringify({ engines, cross }),
  ].join("\n");

  try {
    const interaction = await ai.interactions.create({
      model,
      input,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: NARRATIVE_SCHEMA,
      },
    });

    const raw = interaction.output_text?.trim();

    if (!raw) {
      logFallback("empty_response");
      return fallbackNarrative(cross);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logFallback("invalid_json", error);
      return fallbackNarrative(cross);
    }

    if (!isNarrative(parsed)) {
      logFallback("schema_validation_failed");
      return fallbackNarrative(cross);
    }

    return {
      ...parsed,
      generatedBy: "gemini",
      model,
    };
  } catch (error) {
    logFallback("interaction_failed", error);
    return fallbackNarrative(cross);
  }
}
