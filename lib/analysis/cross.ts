import type {
  CrossInsight,
  CrossStatus,
  TraitKey,
  TraitScore,
} from "@/lib/analysis/types";

const LABELS: Record<TraitKey, string> = {
  autonomy: "자기 주도성과 독립성",
  reflection: "깊이 생각하고 성찰하는 방식",
  stability: "안정과 구조를 중요하게 보는 정도",
  sociability: "사람과 관계 맺는 방식",
  creativity: "표현과 아이디어를 펼치는 방식",
  adaptability: "변화에 적응하는 방식",
  care: "돌봄과 공감의 방향",
};

const SOURCE_LABELS = {
  saju: "Modi",
  astrology: "Stella",
  numerology: "Pico",
} as const;

const DIRECTIONS: Record<TraitKey, [string, string, string]> = {
  autonomy: [
    "주변 맥락을 살핀 뒤 결정하는",
    "내 기준과 주변 맥락을 함께 보는",
    "스스로 기준을 세워 결정하는",
  ],
  reflection: [
    "생각을 오래 붙잡기보다 빠르게 반응하는",
    "생각과 실행의 속도를 균형 있게 맞추는",
    "충분히 생각하고 의미를 정리하는",
  ],
  stability: [
    "고정된 틀보다 변화와 시도를 우선하는",
    "안정과 변화를 상황에 맞게 조율하는",
    "예측 가능한 구조와 지속성을 중시하는",
  ],
  sociability: [
    "넓은 교류보다 선택적인 관계를 선호하는",
    "혼자 있는 시간과 교류를 균형 있게 쓰는",
    "사람과의 교류에서 에너지를 얻는",
  ],
  creativity: [
    "새로움보다 검증된 방식과 실용성을 우선하는",
    "익숙한 방식에 필요한 만큼 변화를 더하는",
    "새로운 방식으로 표현하고 아이디어를 펼치는",
  ],
  adaptability: [
    "변화 전에 기준과 준비를 먼저 세우는",
    "상황을 보며 속도와 방식을 조절하는",
    "변화한 환경에 빠르게 맞춰 움직이는",
  ],
  care: [
    "정서적 배려보다 명확한 경계를 우선하는",
    "나와 타인의 필요를 함께 살피는",
    "타인의 감정과 필요를 세심하게 살피는",
  ],
};

const OBSERVATIONS: Record<TraitKey, string> = {
  autonomy:
    "결정을 내릴 때 내 기준과 주변 의견 중 무엇을 먼저 보는지 관찰해 보세요.",
  reflection:
    "충분히 생각할 때와 즉시 대응할 때의 차이를 관찰해 보세요.",
  stability:
    "계획이 바뀌는 순간 틀을 지키는지 새 방식을 택하는지 관찰해 보세요.",
  sociability:
    "혼자 회복하는 순간과 사람 속에서 힘을 얻는 순간을 비교해 보세요.",
  creativity:
    "검증된 방식을 따를 때와 새 방식을 시도할 때의 에너지를 비교해 보세요.",
  adaptability:
    "예상 밖 변화에서 준비를 먼저 하는지 바로 움직이는지 관찰해 보세요.",
  care: "타인의 필요를 살피는 일과 내 경계를 지키는 일의 균형을 관찰해 보세요.",
};

export function traitLabel(trait: TraitKey) {
  return LABELS[trait];
}

export function sourceTraitSummary(trait: TraitKey, score: number) {
  const band = score <= 2 ? 0 : score >= 4 ? 2 : 1;
  return `${DIRECTIONS[trait][band]} 쪽으로 읽어요.`;
}

export function buildCrossExplanation(insight: CrossInsight) {
  const sources = [...insight.sources].sort((a, b) => b.score - a.score);
  const observation = OBSERVATIONS[insight.trait];

  if (sources.length < 2 || insight.status === "INSUFFICIENT") {
    return `이 특성을 비교하려면 두 가지 이상의 분석 결과가 필요해요. ${observation}`;
  }

  const highest = sources[0];
  const lowest = sources[sources.length - 1];
  const average = sources.reduce((sum, item) => sum + item.score, 0) / sources.length;
  const averageBand = average <= 2.5 ? 0 : average >= 3.5 ? 2 : 1;

  if (insight.status === "AGREEMENT") {
    return `세 관점이 모두 ${DIRECTIONS[insight.trait][averageBand]} 쪽으로 모여요. ${observation}`;
  }

  const comparison = `${SOURCE_LABELS[highest.source]}는 ${highest.score}/5, ${SOURCE_LABELS[lowest.source]}는 ${lowest.score}/5로 읽었어요.`;

  if (insight.status === "DIVERGENCE") {
    return `${comparison} 환경이나 역할에 따라 이 특성이 크게 달라질 수 있어요. ${observation}`;
  }

  return `${comparison} 둘 중 하나가 정답이라기보다 상황에 따라 두 방식이 서로 보완될 수 있어요. ${observation}`;
}

function classify(scores: number[]): CrossStatus {
  if (scores.length < 2) return "INSUFFICIENT";
  const range = Math.max(...scores) - Math.min(...scores);
  if (range <= 1) return "AGREEMENT";
  if (range >= 3) return "DIVERGENCE";
  return "COMPLEMENTARY";
}

export function crossAnalyze(traits: TraitScore[]): CrossInsight[] {
  const grouped = new Map<TraitKey, TraitScore[]>();
  traits.forEach((item) => {
    const bucket = grouped.get(item.trait) ?? [];
    bucket.push(item);
    grouped.set(item.trait, bucket);
  });

  return Array.from(grouped.entries())
    .map(([trait, items]) => {
      const scores = items.map((item) => item.score);
      const status = classify(scores);
      const range = scores.length
        ? Math.max(...scores) - Math.min(...scores)
        : 5;
      return {
        trait,
        status,
        label: LABELS[trait],
        agreement:
          status === "INSUFFICIENT" ? 0 : Math.max(0, 100 - range * 22),
        sources: items.map((item) => ({
          source: item.source,
          score: item.score,
          evidence: item.evidence,
        })),
      };
    })
    .sort((a, b) => b.agreement - a.agreement);
}
