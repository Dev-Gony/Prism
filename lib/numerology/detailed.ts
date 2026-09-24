import type { DetailedNumerologyResult } from "@/lib/analysis/detailed-types";

const MASTER_NUMBERS = new Set([11, 22, 33]);

const MEANING: Record<number, string> = {
  1: "자기주도",
  2: "협력과 조율",
  3: "표현과 창의",
  4: "구조와 안정",
  5: "변화와 자유",
  6: "돌봄과 책임",
  7: "탐구와 성찰",
  8: "성취와 실행",
  9: "이상과 공감",
  11: "직관과 영감",
  22: "큰 구조를 현실화",
  33: "돌봄과 헌신",
};

function reduce(value: number, preserveMasters = true) {
  let current = Math.abs(value);

  while (
    current >= 10 &&
    !(preserveMasters && MASTER_NUMBERS.has(current))
  ) {
    current = String(current)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return current;
}

function reductionHistory(value: number) {
  const history = [value];
  let current = value;

  while (current >= 10 && !MASTER_NUMBERS.has(current)) {
    current = String(current)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
    history.push(current);
  }

  return history;
}

function reduceDatePart(value: number) {
  return reduce(
    String(value)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0),
  );
}

function kstToday() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateNumerologyDetailed(
  date: string,
  asOfDate = kstToday(),
): DetailedNumerologyResult {
  const [year, month, day] = date.split("-").map(Number);

  const digits = date.replace(/\D/g, "").split("").map(Number);
  const initial = digits.reduce((sum, digit) => sum + digit, 0);
  const lifePath = reduce(initial);
  const reduction = reductionHistory(initial);

  const reducedMonth = reduceDatePart(month);
  const reducedDay = reduceDatePart(day);
  const reducedYear = reduceDatePart(year);

  const birthdayNumber = reduceDatePart(day);
  const attitudeNumber = reduce(reducedMonth + reducedDay);

  const periodCycles = {
    first: reducedMonth,
    second: reducedDay,
    third: reducedYear,
  };

  const pinnacle1 = reduce(reducedMonth + reducedDay);
  const pinnacle2 = reduce(reducedDay + reducedYear);
  const pinnacle3 = reduce(pinnacle1 + pinnacle2);
  const pinnacle4 = reduce(reducedMonth + reducedYear);

  const challenge1 = Math.abs(reducedDay - reducedMonth);
  const challenge2 = Math.abs(reducedYear - reducedDay);
  const challenge3 = Math.abs(challenge1 - challenge2);
  const challenge4 = Math.abs(reducedYear - reducedMonth);

  const [asOfYear, asOfMonth, asOfDay] = asOfDate.split("-").map(Number);
  const universalYear = reduceDatePart(asOfYear);
  const personalYear = reduce(reducedMonth + reducedDay + universalYear);
  const personalMonth = reduce(personalYear + asOfMonth);
  const personalDay = reduce(personalMonth + asOfDay);

  return {
    lifePath,
    reduction,
    meaningKey: MEANING[lifePath] ?? "개인적 성장",
    birthdayNumber,
    attitudeNumber,
    periodCycles,
    pinnacles: [pinnacle1, pinnacle2, pinnacle3, pinnacle4],
    challenges: [challenge1, challenge2, challenge3, challenge4],
    personalCycles: {
      asOfDate,
      personalYear,
      personalMonth,
      personalDay,
    },
    method:
      "피타고라스식 생년월일 수비학 · Life Path · Birthday Number · Attitude Number · 3 Period Cycles · 4 Pinnacles · 4 Challenges · Personal Year/Month/Day · Master Number 11/22/33 보존",
  };
}
