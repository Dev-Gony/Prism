import type {
  DestinyTheme,
  DestinyTimingSignal,
  DestinyTimingSummary,
  DetailedAstrologyResult,
  DetailedNumerologyResult,
  DetailedSajuResult,
} from "@/lib/analysis/detailed-types";

const THEME_LABELS: Record<DestinyTheme, string> = {
  self: "자기 방향",
  expression: "표현과 생산",
  relationships: "관계와 조율",
  resources: "자원과 성취",
  responsibility: "책임과 구조",
  learning: "학습과 성찰",
  expansion: "확장과 기회",
  change: "변화와 전환",
  transformation: "정리와 재구성",
};

function sajuTheme(tenGod: string): DestinyTheme {
  if (["비견", "겁재"].includes(tenGod)) return "self";
  if (["식신", "상관"].includes(tenGod)) return "expression";
  if (["정재", "편재"].includes(tenGod)) return "resources";
  if (["정관", "편관"].includes(tenGod)) return "responsibility";
  if (["정인", "편인"].includes(tenGod)) return "learning";
  return "self";
}

function numerologyTheme(value: number): DestinyTheme {
  const map: Record<number, DestinyTheme> = {
    1: "self",
    2: "relationships",
    3: "expression",
    4: "responsibility",
    5: "change",
    6: "relationships",
    7: "learning",
    8: "resources",
    9: "transformation",
    11: "learning",
    22: "responsibility",
    33: "relationships",
  };

  return map[value] ?? "self";
}

function astrologyTheme(
  body: DetailedAstrologyResult["transits"]["bodies"][number]["body"],
): DestinyTheme {
  const map = {
    Jupiter: "expansion",
    Saturn: "responsibility",
    Uranus: "change",
    Neptune: "learning",
    Pluto: "transformation",
  } as const;

  return map[body];
}

export function buildDestinyTiming(
  saju: DetailedSajuResult,
  astrology: DetailedAstrologyResult,
  numerology: DetailedNumerologyResult,
): DestinyTimingSummary {
  const signals: DestinyTimingSignal[] = [];

  signals.push({
    source: "saju",
    theme: sajuTheme(saju.annualFlow.stemTenGod),
    title: `세운 ${saju.annualFlow.pillar} · ${saju.annualFlow.stemTenGod}`,
    evidence: [
      `기준일 ${saju.annualFlow.asOfDate}`,
      `연간 천간 십신 ${saju.annualFlow.stemTenGod}`,
      ...(saju.annualFlow.branchRelations.length
        ? saju.annualFlow.branchRelations.map(
            (relation) =>
              `${relation.natalLabel}와 세운 지지 ${relation.type}`,
          )
        : ["원국 지지와 주요 합충형파해 신호 없음"]),
    ],
  });

  const strongestTransit = astrology.transits.aspects[0];
  if (strongestTransit) {
    const transitBody = astrology.transits.bodies.find(
      (body) => body.body === strongestTransit.transitBody,
    );

    signals.push({
      source: "astrology",
      theme: astrologyTheme(strongestTransit.transitBody),
      title: `${strongestTransit.transitBody} transit · ${strongestTransit.type} · ${strongestTransit.phase}`,
      evidence: [
        `기준일 ${astrology.transits.asOfDate}`,
        `${strongestTransit.transitBody} → natal ${strongestTransit.natalPoint}`,
        `orb ${strongestTransit.orb.toFixed(2)}° · ${strongestTransit.phase} · ${transitBody?.motion ?? "motion unavailable"}`,
      ],
    });
  } else {
    const jupiter = astrology.transits.bodies.find(
      (body) => body.body === "Jupiter",
    );
    if (jupiter) {
      signals.push({
        source: "astrology",
        theme: "expansion",
        title: `Jupiter transit · ${jupiter.sign}`,
        evidence: [
          `기준일 ${astrology.transits.asOfDate}`,
          `${jupiter.motion} · ${jupiter.speedDegPerDay.toFixed(3)}°/day`,
          "주요 natal point와 허용 orb 내 major aspect 없음",
        ],
      });
    }
  }

  signals.push({
    source: "numerology",
    theme: numerologyTheme(numerology.personalCycles.personalYear),
    title: `Personal Year ${numerology.personalCycles.personalYear}`,
    evidence: [
      `기준일 ${numerology.personalCycles.asOfDate}`,
      `Personal Month ${numerology.personalCycles.personalMonth}`,
      `Personal Day ${numerology.personalCycles.personalDay}`,
    ],
  });

  const grouped = new Map<DestinyTheme, Set<DestinyTimingSignal["source"]>>();
  signals.forEach((signal) => {
    const sources = grouped.get(signal.theme) ?? new Set();
    sources.add(signal.source);
    grouped.set(signal.theme, sources);
  });

  const convergences = [...grouped.entries()]
    .filter(([, sources]) => sources.size >= 2)
    .map(([theme, sources]) => ({
      theme,
      sources: [...sources],
      strength: Math.round((sources.size / 3) * 100),
      label: THEME_LABELS[theme],
    }))
    .sort((a, b) => b.strength - a.strength);

  return {
    asOfDate: numerology.personalCycles.asOfDate,
    signals,
    convergences,
  };
}
