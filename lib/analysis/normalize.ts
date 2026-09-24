import type {
  AstrologyQuickResult,
  EngineName,
  NumerologyQuickResult,
  SajuQuickResult,
  TraitKey,
  TraitScore,
} from "@/lib/analysis/types";

type TraitVector = Record<TraitKey,number>;
const TRAITS:TraitKey[]=["autonomy","reflection","stability","sociability","creativity","adaptability","care"];

const SAJU_ELEMENT:Record<string,TraitVector>={
  목:{autonomy:3,reflection:3,stability:2,sociability:3,creativity:4,adaptability:4,care:3},
  화:{autonomy:4,reflection:2,stability:2,sociability:4,creativity:4,adaptability:3,care:3},
  토:{autonomy:3,reflection:3,stability:5,sociability:3,creativity:2,adaptability:2,care:4},
  금:{autonomy:4,reflection:4,stability:4,sociability:2,creativity:2,adaptability:2,care:2},
  수:{autonomy:2,reflection:5,stability:2,sociability:3,creativity:4,adaptability:5,care:3},
};

const ASTRO_ELEMENT:Record<AstrologyQuickResult["sunElement"],TraitVector>={
  fire:{autonomy:5,reflection:2,stability:2,sociability:4,creativity:4,adaptability:3,care:2},
  earth:{autonomy:3,reflection:3,stability:5,sociability:2,creativity:2,adaptability:2,care:3},
  air:{autonomy:3,reflection:4,stability:2,sociability:5,creativity:5,adaptability:4,care:3},
  water:{autonomy:2,reflection:5,stability:3,sociability:3,creativity:4,adaptability:4,care:5},
};

const NUMEROLOGY:Record<number,TraitVector>={
  1:{autonomy:5,reflection:2,stability:3,sociability:3,creativity:3,adaptability:3,care:2},
  2:{autonomy:2,reflection:4,stability:3,sociability:4,creativity:3,adaptability:4,care:5},
  3:{autonomy:3,reflection:2,stability:2,sociability:5,creativity:5,adaptability:4,care:3},
  4:{autonomy:3,reflection:3,stability:5,sociability:2,creativity:2,adaptability:2,care:3},
  5:{autonomy:4,reflection:2,stability:1,sociability:4,creativity:4,adaptability:5,care:2},
  6:{autonomy:2,reflection:3,stability:4,sociability:4,creativity:3,adaptability:3,care:5},
  7:{autonomy:4,reflection:5,stability:3,sociability:2,creativity:3,adaptability:3,care:2},
  8:{autonomy:5,reflection:3,stability:4,sociability:3,creativity:2,adaptability:3,care:2},
  9:{autonomy:3,reflection:4,stability:2,sociability:4,creativity:4,adaptability:4,care:5},
  11:{autonomy:3,reflection:5,stability:2,sociability:3,creativity:5,adaptability:4,care:4},
  22:{autonomy:4,reflection:4,stability:5,sociability:3,creativity:4,adaptability:3,care:4},
  33:{autonomy:2,reflection:4,stability:4,sociability:4,creativity:4,adaptability:3,care:5},
};

function emit(source:EngineName,vector:TraitVector,evidence:(trait:TraitKey)=>string[]):TraitScore[]{
  return TRAITS.map((trait)=>({trait,score:vector[trait],source,evidence:evidence(trait)}));
}

export function normalizeQuickResults(
  saju:SajuQuickResult,
  astrology:AstrologyQuickResult,
  numerology:NumerologyQuickResult,
):TraitScore[]{
  const day=SAJU_ELEMENT[saju.dayMaster.element] ?? SAJU_ELEMENT.토;
  const dominant=SAJU_ELEMENT[saju.dominantElement] ?? day;
  const sajuVector=Object.fromEntries(
    TRAITS.map((trait)=>[trait,Math.round(day[trait]*0.7+dominant[trait]*0.3)]),
  ) as TraitVector;
  const astroVector=ASTRO_ELEMENT[astrology.sunElement];
  const numberVector=NUMEROLOGY[numerology.lifePath] ?? NUMEROLOGY[7];

  return [
    ...emit("saju",sajuVector,()=>["일간 "+saju.dayMaster.korean+saju.dayMaster.element,"대표 오행 "+saju.dominantElement]),
    ...emit("astrology",astroVector,()=>["태양 "+astrology.sunSign,"태양 원소 "+astrology.sunElement]),
    ...emit("numerology",numberVector,()=>["Life Path "+numerology.lifePath,numerology.meaningKey]),
  ];
}


import type {
  DetailedAstrologyResult,
  DetailedNumerologyResult,
  DetailedSajuResult,
} from "@/lib/analysis/detailed-types";

export function normalizeDetailedResults(
  saju: DetailedSajuResult,
  astrology: DetailedAstrologyResult,
  numerology: DetailedNumerologyResult,
): TraitScore[] {
  const dominantElement = Object.entries(saju.elements).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? saju.dayMaster.element;

  const day = SAJU_ELEMENT[saju.dayMaster.element] ?? SAJU_ELEMENT.토;
  const dominant = SAJU_ELEMENT[dominantElement] ?? day;
  const hourElement = saju.pillars[3]?.stemElement
    ? SAJU_ELEMENT[saju.pillars[3].stemElement]
    : null;

  const sajuVector = Object.fromEntries(
    TRAITS.map((trait) => [
      trait,
      Math.round(
        hourElement
          ? day[trait] * 0.55 +
              dominant[trait] * 0.25 +
              hourElement[trait] * 0.2
          : day[trait] * 0.7 + dominant[trait] * 0.3,
      ),
    ]),
  ) as TraitVector;

  const astroVector = ASTRO_ELEMENT[astrology.sunElement];
  const numberVector = NUMEROLOGY[numerology.lifePath] ?? NUMEROLOGY[7];

  return [
    ...emit("saju", sajuVector, () => [
      "일간 " + saju.dayMaster.korean + saju.dayMaster.element,
      saju.pillars[3]
        ? "시주 " + saju.pillars[3].text
        : "출생시간 미상 · 시주 제외",
      "대표 오행 " + dominantElement,
    ]),
    ...emit("astrology", astroVector, () => [
      "태양 " + astrology.sunSign,
      astrology.moonSign
        ? "달 " + astrology.moonSign
        : "출생시간 미상 · 달/ASC/House 제외",
      astrology.timeKnown ? "출생시각 반영" : "정오 스냅샷 기반",
    ]),
    ...emit("numerology", numberVector, () => [
      "Life Path " + numerology.lifePath,
      "Birthday " + numerology.birthdayNumber,
      "Attitude " + numerology.attitudeNumber,
      "Pinnacles " + numerology.pinnacles.join("/"),
      numerology.meaningKey,
    ]),
  ];
}
