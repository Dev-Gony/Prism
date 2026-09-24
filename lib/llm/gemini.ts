import { GoogleGenAI } from "@google/genai";
import { fallbackNarrative } from "@/lib/analysis/fallback";
import type {
  AnalysisNarrative,
  CrossInsight,
  QuickAnalysisResponse,
  TraitKey,
} from "@/lib/analysis/types";
import type { DetailedAnalysisResponse } from "@/lib/analysis/detailed-types";

type QuickEnginePayload = QuickAnalysisResponse["engines"];
type DetailedEnginePayload = DetailedAnalysisResponse["engines"];

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

function logFallback(
  mode: "quick" | "detailed",
  reason: string,
  error?: unknown,
) {
  if (error instanceof Error) {
    console.error("[Prism][Gemini] fallback", {
      mode,
      reason,
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error("[Prism][Gemini] fallback", {
    mode,
    reason,
    error: error ? String(error) : undefined,
  });
}

async function generateNarrative(
  mode: "quick" | "detailed",
  engines: QuickEnginePayload | DetailedEnginePayload,
  cross: CrossInsight[],
): Promise<AnalysisNarrative> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    logFallback(mode, "missing_api_key");
    return fallbackNarrative(cross);
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const commonInstruction = [
    "당신은 Prism의 설명 레이어입니다.",
    "사주·점성술·수비학 계산값을 새로 만들거나 수정하지 마세요.",
    "제공된 구조화 데이터만 근거로 사용하세요.",
    "세 체계가 다르게 보이면 하나를 정답으로 고르지 말고 차이를 설명하세요.",
    "미래 사건을 단정적으로 예언하지 마세요.",
    "전문용어보다 쉬운 한국어를 먼저 쓰세요.",
    "사용자를 단정적으로 규정하지 말고 '보여요', '읽을 수 있어요'처럼 표현하세요.",
    "과학적 성격 진단처럼 표현하지 마세요.",
    "모바일에서 읽기 좋게 각 문장을 짧게 쓰세요.",
  ];

  const detailedTimeKnown =
    mode === "detailed" &&
    "astrology" in engines &&
    Boolean((engines as DetailedEnginePayload).astrology.timeKnown);

  const modeInstruction =
    mode === "detailed"
      ? detailedTimeKnown
        ? [
            "이 요청은 Detailed Reading입니다.",
            "출생시간과 출생지역을 반영한 시주, Moon, ASC, MC, 12 Houses, 행성별 House 정보를 중요한 추가 근거로 활용하세요.",
            "사주의 월령, 통근, 투간, 강약 휴리스틱, 십신, 지장간, 합충형파해를 서로 구분해 근거로 활용하세요.",
            "점성술의 10개 행성, 주요 각과 orb, applying/separating, 행성 direct/retrograde, stellium, angular emphasis, 원소/모달리티 균형, 차트 룰러, 하우스 룰러, dignity를 활용하세요.",
            "수비학의 Life Path뿐 아니라 Birthday, Attitude, Period Cycles, Pinnacles, Challenges, Personal Year/Month/Day를 활용하세요.",
            "Quick Reading보다 무엇이 더 구체화되었는지 자연스럽게 드러내세요.",
            "ASC·MC·House·시주 같은 전문용어는 먼저 일상적인 의미를 설명한 뒤 괄호나 짧은 보조 표현으로 전문용어를 붙이세요.",
            "수비학 Life Path처럼 출생시간 추가로 바뀌지 않는 값은 억지로 변화한 것처럼 설명하지 마세요.",
          ]
        : [
            "이 요청은 출생시간을 모르는 Detailed-lite Reading입니다.",
            "시주, Moon, ASC, MC, DSC, IC, Houses는 제공되지 않았으므로 절대 추측하지 마세요.",
            "출생지역과 생년월일로 확장 가능한 정보만 설명하세요.",
            "사주의 월령, 통근, 투간, 강약 휴리스틱, 십신, 지장간과 수비학의 장기/현재 주기는 시간 미상이어도 제공된 값 범위에서 활용하세요.",
            "점성술은 Moon/ASC/House를 제외하되 제공된 시간 비민감 행성, 주요 각, 원소/모달리티 균형을 활용하세요.",
            "시간이 없어 알 수 없는 항목은 한계로 명확히 설명하고, 부족한 값을 있는 것처럼 말하지 마세요.",
            "수비학 Life Path는 출생시간과 무관하므로 그대로 유지된다는 점을 존중하세요.",
          ]
      : [
          "이 요청은 Quick Reading입니다.",
          "출생시간·출생지가 없는 분석의 한계를 존중하세요.",
          "시주, ASC, MC, Houses처럼 제공되지 않은 값을 추측하지 마세요.",
        ];

  const task =
    mode === "detailed"
      ? detailedTimeKnown
        ? "아래 Detailed Reading 데이터를 바탕으로 출생시간과 위치를 반영한 깊이 있는 Prism 해석을 작성하세요."
        : "아래 Detailed-lite 데이터를 바탕으로 출생시간 없이 확인 가능한 정보만 사용해 Prism 해석을 작성하세요."
      : "아래 Quick Reading 데이터를 바탕으로 Prism의 세 관점이 함께 말하는 내용을 다정하고 간결하게 정리하세요.";

  const input = [
    ...commonInstruction,
    ...modeInstruction,
    "",
    task,
    "summary는 2문장 이내, keyword/observation/cross explanation은 각각 2문장 이내로 작성하세요.",
    "crossHighlights의 trait 값은 제공된 cross의 trait 중에서만 선택하세요.",
    "",
    JSON.stringify({ mode, engines, cross }),
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
      logFallback(mode, "empty_response");
      return fallbackNarrative(cross);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logFallback(mode, "invalid_json", error);
      return fallbackNarrative(cross);
    }

    if (!isNarrative(parsed)) {
      logFallback(mode, "schema_validation_failed");
      return fallbackNarrative(cross);
    }

    return {
      ...parsed,
      generatedBy: "gemini",
      model,
    };
  } catch (error) {
    logFallback(mode, "interaction_failed", error);
    return fallbackNarrative(cross);
  }
}

export function createNarrative(
  engines: QuickEnginePayload,
  cross: CrossInsight[],
): Promise<AnalysisNarrative> {
  return generateNarrative("quick", engines, cross);
}

export function createDetailedNarrative(
  engines: DetailedEnginePayload,
  cross: CrossInsight[],
): Promise<AnalysisNarrative> {
  return generateNarrative("detailed", engines, cross);
}
