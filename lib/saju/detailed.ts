import lunar from "lunar-javascript";
import type { DetailedSajuResult } from "@/lib/analysis/detailed-types";

const { Solar } = lunar;

const stems = [..."甲乙丙丁戊己庚辛壬癸"];
const branches = [..."子丑寅卯辰巳午未申酉戌亥"];
const stemKo = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const branchKo = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const stemElement = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const stemPolarity = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"] as const;
const branchElement = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

const hiddenStems: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const elementProduces: Record<string, string> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const elementControls: Record<string, string> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
};

function stemMeta(stem: string) {
  const index = stems.indexOf(stem);
  return {
    korean: stemKo[index],
    element: stemElement[index],
    polarity: stemPolarity[index],
  };
}

function tenGod(dayStem: string, targetStem: string) {
  const day = stemMeta(dayStem);
  const target = stemMeta(targetStem);
  const samePolarity = day.polarity === target.polarity;

  if (day.element === target.element) {
    return samePolarity ? "비견" : "겁재";
  }

  if (elementProduces[day.element] === target.element) {
    return samePolarity ? "식신" : "상관";
  }

  if (elementControls[day.element] === target.element) {
    return samePolarity ? "편재" : "정재";
  }

  if (elementControls[target.element] === day.element) {
    return samePolarity ? "편관" : "정관";
  }

  if (elementProduces[target.element] === day.element) {
    return samePolarity ? "편인" : "정인";
  }

  return "미분류";
}

function pillar(
  label: DetailedSajuResult["pillars"][number]["label"],
  text: string,
  dayStem?: string,
) {
  const [stem, branch] = [...text];
  const stemIndex = stems.indexOf(stem);
  const branchIndex = branches.indexOf(branch);
  const branchHidden = hiddenStems[branch] ?? [];

  return {
    label,
    text,
    korean: stemKo[stemIndex] + branchKo[branchIndex],
    stem,
    branch,
    stemElement: stemElement[stemIndex],
    branchElement: branchElement[branchIndex],
    ...(dayStem
      ? {
          stemTenGod: tenGod(dayStem, stem),
          branchTenGod: branchHidden[0]
            ? tenGod(dayStem, branchHidden[0])
            : undefined,
          hiddenStems: branchHidden.map((hiddenStem) => {
            const meta = stemMeta(hiddenStem);
            return {
              stem: hiddenStem,
              korean: meta.korean,
              element: meta.element,
              tenGod: tenGod(dayStem, hiddenStem),
            };
          }),
        }
      : {}),
  };
}

function detectBranchRelations(
  pillarBranches: string[],
): DetailedSajuResult["branchRelations"] {
  const relationPairs: Array<{
    type: "합" | "충" | "파" | "해";
    pairs: [string, string][];
  }> = [
    {
      type: "합",
      pairs: [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]],
    },
    {
      type: "충",
      pairs: [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]],
    },
    {
      type: "파",
      pairs: [["子", "酉"], ["卯", "午"], ["辰", "丑"], ["戌", "未"], ["寅", "亥"], ["巳", "申"]],
    },
    {
      type: "해",
      pairs: [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]],
    },
  ];

  const found: DetailedSajuResult["branchRelations"] = [];
  const present = new Set(pillarBranches);

  relationPairs.forEach(({ type, pairs }) => {
    pairs.forEach(([a, b]) => {
      if (present.has(a) && present.has(b)) {
        found.push({
          type,
          branches: [a, b],
          labels: [branchKo[branches.indexOf(a)], branchKo[branches.indexOf(b)]],
        });
      }
    });
  });

  const punishmentGroups = [
    ["寅", "巳", "申"],
    ["丑", "未", "戌"],
  ];

  punishmentGroups.forEach((group) => {
    if (group.every((branch) => present.has(branch))) {
      found.push({
        type: "형",
        branches: group,
        labels: group.map((branch) => branchKo[branches.indexOf(branch)]),
      });
    }
  });

  [["子", "卯"]].forEach(([a, b]) => {
    if (present.has(a) && present.has(b)) {
      found.push({
        type: "형",
        branches: [a, b],
        labels: [branchKo[branches.indexOf(a)], branchKo[branches.indexOf(b)]],
      });
    }
  });

  ["辰", "午", "酉", "亥"].forEach((branch) => {
    if (pillarBranches.filter((item) => item === branch).length >= 2) {
      found.push({
        type: "형",
        branches: [branch, branch],
        labels: [
          branchKo[branches.indexOf(branch)],
          branchKo[branches.indexOf(branch)],
        ],
      });
    }
  });

  return found;
}

export function calculateSajuDetailed(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number | null,
): DetailedSajuResult {
  const effectiveHour = hour ?? 12;
  const effectiveMinute = minute ?? 0;
  const chinaTime = new Date(
    Date.UTC(year, month - 1, day, effectiveHour - 1, effectiveMinute),
  );

  const terms = Solar.fromYmdHms(
    chinaTime.getUTCFullYear(),
    chinaTime.getUTCMonth() + 1,
    chinaTime.getUTCDate(),
    chinaTime.getUTCHours(),
    effectiveMinute,
    0,
  )
    .getLunar()
    .getEightChar();

  const local = Solar.fromYmdHms(
    year,
    month,
    day,
    effectiveHour,
    effectiveMinute,
    0,
  )
    .getLunar()
    .getEightChar();

  local.setSect(1);

  const rawPillars = [
    { label: "년주" as const, text: terms.getYear() },
    { label: "월주" as const, text: terms.getMonth() },
    { label: "일주" as const, text: local.getDay() },
    ...(hour === null
      ? []
      : [{ label: "시주" as const, text: local.getTime() }]),
  ];

  const dayStem = [...rawPillars[2].text][0];
  const pillars = rawPillars.map((item) =>
    pillar(item.label, item.text, dayStem),
  );

  const elements: DetailedSajuResult["elements"] = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  };

  pillars.forEach((item) => {
    elements[item.stemElement as keyof typeof elements] += 1;
    elements[item.branchElement as keyof typeof elements] += 1;
  });

  const tenGodSummary: Record<string, number> = {};
  pillars.forEach((item) => {
    if (item.label !== "일주" && item.stemTenGod) {
      tenGodSummary[item.stemTenGod] =
        (tenGodSummary[item.stemTenGod] ?? 0) + 1;
    }

    item.hiddenStems?.forEach((hidden) => {
      tenGodSummary[hidden.tenGod] = (tenGodSummary[hidden.tenGod] ?? 0) + 1;
    });
  });

  return {
    pillars,
    elements,
    dayMaster: {
      character: dayStem,
      korean: stemKo[stems.indexOf(dayStem)],
      element: stemElement[stems.indexOf(dayStem)],
    },
    tenGodSummary,
    branchRelations: detectBranchRelations(
      pillars.map((item) => item.branch),
    ),
    method:
      hour === null
        ? "양력 · 한국 표준시(UTC+9) · 출생시간 미상 · 시주 제외 · 천간 십신/지장간/지지 관계 포함 · 진태양시 보정 없음"
        : "양력 · 한국 표준시(UTC+9) · 출생시각 반영 · 23시 일자 변경 · 천간 십신/지장간/지지 관계 포함 · 진태양시 보정 없음",
  };
}
