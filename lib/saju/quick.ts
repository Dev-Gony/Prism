import lunar from "lunar-javascript";
import type { SajuQuickResult } from "@/lib/analysis/types";

const { Solar } = lunar;
const stems = [..."甲乙丙丁戊己庚辛壬癸"];
const branches = [..."子丑寅卯辰巳午未申酉戌亥"];
const stemKo = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const branchKo = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const stemElement = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const branchElement = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function pillar(label: "년주" | "월주" | "일주", text: string) {
  const [stem, branch] = [...text];
  return {
    label,
    text,
    korean: stemKo[stems.indexOf(stem)] + branchKo[branches.indexOf(branch)],
    stem,
    branch,
    stemElement: stemElement[stems.indexOf(stem)],
    branchElement: branchElement[branches.indexOf(branch)],
  };
}

export function calculateSajuQuick(year: number, month: number, day: number): SajuQuickResult {
  const assumedHour = 12;
  const chinaTime = new Date(Date.UTC(year, month - 1, day, assumedHour - 1));
  const terms = Solar.fromYmdHms(
    chinaTime.getUTCFullYear(),
    chinaTime.getUTCMonth() + 1,
    chinaTime.getUTCDate(),
    chinaTime.getUTCHours(),
    0,
    0,
  ).getLunar().getEightChar();

  const local = Solar.fromYmdHms(year, month, day, assumedHour, 0, 0)
    .getLunar()
    .getEightChar();
  local.setSect(1);

  const pillars = [
    pillar("년주", terms.getYear()),
    pillar("월주", terms.getMonth()),
    pillar("일주", local.getDay()),
  ];

  const elements: SajuQuickResult["elements"] = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  pillars.forEach((item) => {
    elements[item.stemElement as keyof typeof elements] += 1;
    elements[item.branchElement as keyof typeof elements] += 1;
  });

  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];

  return {
    pillars,
    elements,
    dayMaster: {
      character: pillars[2].stem,
      korean: stemKo[stems.indexOf(pillars[2].stem)],
      element: pillars[2].stemElement,
    },
    dominantElement,
    method: "양력 · Quick Reading · 출생시간 미입력 · 한국 표준시 정오 기준 · 시주 제외",
    warnings: [
      "출생시간이 없어 시주는 계산하지 않습니다.",
      "절기 경계일에는 실제 출생시간에 따라 년주·월주가 달라질 수 있어 Detailed Reading에서 재계산합니다.",
      "오행 개수는 년주·월주·일주의 천간과 지지 대표 오행 6자를 센 값이며 강약 판단이 아닙니다.",
    ],
  };
}
