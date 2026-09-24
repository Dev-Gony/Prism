const MASTER_NUMBERS = new Set([11, 22, 33]);
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

const MEANINGS: Record<number, string> = {
  1: "독립 · 시작 · 자기주도",
  2: "협력 · 감수성 · 조율",
  3: "표현 · 창의 · 사교",
  4: "구조 · 안정 · 실행",
  5: "변화 · 자유 · 경험",
  6: "책임 · 돌봄 · 관계",
  7: "탐구 · 분석 · 내면",
  8: "성과 · 자원 · 관리",
  9: "이상 · 공감 · 완성",
  11: "직관 · 영감 · 전달",
  22: "구축 · 현실화 · 장기 비전",
  33: "헌신 · 돌봄 · 영향",
};

export type NameNumerologyResult = {
  method: "pythagorean-latin";
  inputLabel: string;
  normalizedName: string;
  letterCount: number;
  expression: number;
  soulUrge: number;
  personality: number;
  maturity: number;
  balance: number;
  cornerstone: {
    letter: string;
    value: number;
  };
  capstone: {
    letter: string;
    value: number;
  };
  firstVowel: {
    letter: string;
    value: number;
  } | null;
  hiddenPassion: number[];
  karmicLessons: number[];
  subconsciousSelf: number;
  counts: Record<string, number>;
  meanings: {
    expression: string;
    soulUrge: string;
    personality: string;
    maturity: string;
  };
  notes: string[];
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

function letterValue(letter: string) {
  return ((letter.charCodeAt(0) - 65) % 9) + 1;
}

function normalizeName(raw: string) {
  const ascii = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (/[^A-Z\s'-]/.test(ascii)) {
    throw new Error(
      "이름 수비학 v1은 영문/로마자 표기만 지원합니다. 예: GILDONG HONG",
    );
  }

  const normalized = ascii
    .replace(/['-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const letters = normalized.replace(/\s/g, "");

  if (letters.length < 2) {
    throw new Error("영문/로마자 이름을 두 글자 이상 입력해 주세요.");
  }

  if (letters.length > 80) {
    throw new Error("이름은 영문 80자 이내로 입력해 주세요.");
  }

  return { normalized, letters };
}

function sumLetters(letters: string[]) {
  return letters.reduce((sum, letter) => sum + letterValue(letter), 0);
}

function meaning(value: number) {
  return MEANINGS[value] ?? "개인적 성장";
}

export function calculateNameNumerology(
  rawName: string,
  lifePath: number,
): NameNumerologyResult {
  const { normalized, letters } = normalizeName(rawName);
  const chars = [...letters];
  const vowels = chars.filter((letter) => VOWELS.has(letter));
  const consonants = chars.filter((letter) => !VOWELS.has(letter));

  const expression = reduce(sumLetters(chars));
  const soulUrge = reduce(sumLetters(vowels));
  const personality = reduce(sumLetters(consonants));
  const maturity = reduce(lifePath + expression);

  const words = normalized.split(" ").filter(Boolean);
  const initials = words.map((word) => word[0]);
  const balance = reduce(sumLetters(initials));

  const counts: Record<string, number> = Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [String(index + 1), 0]),
  );

  chars.forEach((letter) => {
    const value = String(letterValue(letter));
    counts[value] = (counts[value] ?? 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts));
  const hiddenPassion = Object.entries(counts)
    .filter(([, count]) => count === maxCount && count > 0)
    .map(([value]) => Number(value));

  const karmicLessons = Object.entries(counts)
    .filter(([, count]) => count === 0)
    .map(([value]) => Number(value));

  const firstVowelLetter = chars.find((letter) => VOWELS.has(letter)) ?? null;

  return {
    method: "pythagorean-latin",
    inputLabel: rawName.trim(),
    normalizedName: normalized,
    letterCount: chars.length,
    expression,
    soulUrge,
    personality,
    maturity,
    balance,
    cornerstone: {
      letter: chars[0],
      value: letterValue(chars[0]),
    },
    capstone: {
      letter: chars[chars.length - 1],
      value: letterValue(chars[chars.length - 1]),
    },
    firstVowel: firstVowelLetter
      ? {
          letter: firstVowelLetter,
          value: letterValue(firstVowelLetter),
        }
      : null,
    hiddenPassion,
    karmicLessons,
    subconsciousSelf: 9 - karmicLessons.length,
    counts,
    meanings: {
      expression: meaning(expression),
      soulUrge: meaning(soulUrge),
      personality: meaning(personality),
      maturity: meaning(maturity),
    },
    notes: [
      "피타고라스식 A=1~I=9, J부터 다시 1로 순환하는 영문 이름 수비학입니다.",
      "Y는 v1에서 자음으로 처리합니다.",
      "한글 이름은 자동 음역하지 않습니다. 사용자가 실제 사용하는 로마자 표기를 직접 입력해야 합니다.",
      "이름 수비학은 전통적·문화적 자기탐색 도구이며 과학적 성격 진단이 아닙니다.",
    ],
  };
}
