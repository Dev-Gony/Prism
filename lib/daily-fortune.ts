export const KST_TIME_ZONE = "Asia/Seoul";
export const PRODUCTION_SITE_URL = "https://prism-nine-livid.vercel.app";

export type DailyFortunePayload = {
  schemaVersion: "v1";
  date: string;
  overallScore: number;
  headline: string;
  summary: string;
  areas: Array<{
    key: "focus" | "relationship" | "balance";
    label: string;
    score: number;
    guidance: string;
  }>;
  signals: string[];
  source: {
    analysisId: string;
    analysisType: string;
  };
  disclaimer: string;
};

export function getKstDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type GuestAnalysisInput = {
  input: { date: string };
  engines: {
    saju: { dominantElement: string };
    astrology: { sunSign: string };
    numerology: { lifePath: number };
  };
  narrative: {
    keywords: Array<{ title: string }>;
  };
};

const DAILY_HEADLINES = [
  "작은 선택을 선명하게 만드는 날",
  "속도보다 방향을 살피기 좋은 날",
  "흩어진 생각을 한곳에 모으는 날",
  "익숙한 흐름에 새 관점을 더하는 날",
  "관계와 내 리듬의 균형을 맞추는 날",
] as const;

function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function scoreFromSeed(seed: string, area: string) {
  return 58 + (stableHash(`${seed}|${area}`) % 35);
}

export function buildGuestDailyFortune(
  analysis: GuestAnalysisInput,
  fortuneDate = getKstDate(),
): DailyFortunePayload {
  const seed = [
    analysis.input.date,
    fortuneDate,
    analysis.engines.saju.dominantElement,
    analysis.engines.astrology.sunSign,
    analysis.engines.numerology.lifePath,
  ].join("|");
  const focus = scoreFromSeed(seed, "focus");
  const relationship = scoreFromSeed(seed, "relationship");
  const balance = scoreFromSeed(seed, "balance");
  const keyword = analysis.narrative.keywords[0]?.title;

  return {
    schemaVersion: "v1",
    date: fortuneDate,
    overallScore: Math.round((focus + relationship + balance) / 3),
    headline: DAILY_HEADLINES[stableHash(`${seed}|headline`) % DAILY_HEADLINES.length],
    summary: keyword
      ? `내 분석의 핵심 키워드인 ‘${keyword}’을 오늘의 선택에 가볍게 적용해 보세요.`
      : "세 가지 분석 신호를 바탕으로 오늘의 리듬을 정리했어요.",
    areas: [
      {
        key: "focus",
        label: "집중",
        score: focus,
        guidance:
          "해야 할 일을 세 가지보다 적게 고르고, 가장 중요한 한 가지부터 마무리해 보세요.",
      },
      {
        key: "relationship",
        label: "관계",
        score: relationship,
        guidance:
          "상대의 뜻을 추측하기보다 짧고 분명하게 확인하는 대화가 도움이 됩니다.",
      },
      {
        key: "balance",
        label: "균형",
        score: balance,
        guidance:
          "짧은 산책이나 스트레칭으로 생각과 몸의 속도를 한 번 맞춰 보세요.",
      },
    ],
    signals: [
      analysis.engines.saju.dominantElement,
      analysis.engines.astrology.sunSign,
      String(analysis.engines.numerology.lifePath),
    ],
    source: {
      analysisId: "guest-session",
      analysisType: "quick",
    },
    disclaimer:
      "전통적·문화적 자기탐색을 위한 참고 정보이며 미래를 보장하지 않습니다.",
  };
}
