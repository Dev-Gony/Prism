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

function isNarrative(value: unknown): value is Omit<AnalysisNarrative,"generatedBy"|"model"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string,unknown>;
  return (
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.keywords) &&
    Array.isArray(candidate.observations) &&
    Array.isArray(candidate.crossHighlights)
  );
}

export async function createNarrative(
  engines: EnginePayload,
  cross: CrossInsight[],
): Promise<AnalysisNarrative> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return fallbackNarrative(cross);

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = [
    "당신은 Prism의 설명 레이어다.",
    "사주·점성술·수비학의 계산값을 새로 만들거나 수정하지 않는다.",
    "제공된 구조화 데이터만 근거로 사용한다.",
    "세 체계가 충돌하면 하나를 정답으로 고르지 않고 차이를 설명한다.",
    "출생시간·출생지가 없는 Quick Reading의 한계를 존중한다.",
    "미래 사건을 단정적으로 예언하지 않는다.",
    "전문용어보다 쉬운 한국어 설명을 먼저 쓴다.",
    "출력은 JSON 객체 하나만 반환한다.",
  ].join("\n");

  const prompt = {
    task: "Quick Reading 결과를 모바일 결과 화면용으로 짧고 다정하게 설명해 주세요.",
    requiredShape: {
      summary: "한두 문장",
      keywords: [{ title:"짧은 핵심 키워드",description:"2문장 이내",tags:["#태그1","#태그2"] }],
      observations: [{ label:"1. 타고난 결",title:"짧은 제목",description:"2문장 이내" }],
      crossHighlights: [{
        trait:"autonomy 등 허용된 trait key",
        title:"교차 분석 제목",
        label:"비슷하게 보여요/서로 보완돼요/조금 다르게 보여요/더 알아야 해요",
        explanation:"근거를 과장하지 않은 2문장 이내 설명",
      }],
    },
    constraints: {
      keywordCount:3,
      observationCount:5,
      crossHighlightCount:3,
      allowedTraitKeys:TRAIT_KEYS,
    },
    engines,
    cross,
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify(prompt),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const raw = response.text?.trim();
    if (!raw) return fallbackNarrative(cross);
    const parsed = JSON.parse(raw) as unknown;
    if (!isNarrative(parsed)) return fallbackNarrative(cross);

    const safe = parsed as Omit<AnalysisNarrative,"generatedBy"|"model">;
    return {
      ...safe,
      keywords: safe.keywords.slice(0,3),
      observations: safe.observations.slice(0,5),
      crossHighlights: safe.crossHighlights
        .filter((item)=>TRAIT_KEYS.includes(item.trait))
        .slice(0,3),
      generatedBy:"gemini",
      model,
    };
  } catch (error) {
    console.error("Gemini narrative fallback", error);
    return fallbackNarrative(cross);
  }
}
