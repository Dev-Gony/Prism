import lunar from "lunar-javascript";
import type { DetailedSajuResult } from "@/lib/analysis/detailed-types";

const { Solar } = lunar;

const stems = [..."甲乙丙丁戊己庚辛壬癸"];
const branches = [..."子丑寅卯辰巳午未申酉戌亥"];
const stemKo = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const branchKo = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const stemElement = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const branchElement = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function pillar(label: DetailedSajuResult["pillars"][number]["label"], text: string) {
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

export function calculateSajuDetailed(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): DetailedSajuResult {
  const chinaTime = new Date(Date.UTC(year, month - 1, day, hour - 1, minute));

  const terms = Solar.fromYmdHms(
    chinaTime.getUTCFullYear(),
    chinaTime.getUTCMonth() + 1,
    chinaTime.getUTCDate(),
    chinaTime.getUTCHours(),
    minute,
    0,
  )
    .getLunar()
    .getEightChar();

  const local = Solar.fromYmdHms(year, month, day, hour, minute, 0)
    .getLunar()
    .getEightChar();

  local.setSect(1);

  const pillars = [
    pillar("년주", terms.getYear()),
    pillar("월주", terms.getMonth()),
    pillar("일주", local.getDay()),
    pillar("시주", local.getTime()),
  ];

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

  return {
    pillars,
    elements,
    dayMaster: {
      character: pillars[2].stem,
      korean: stemKo[stems.indexOf(pillars[2].stem)],
      element: pillars[2].stemElement,
    },
    method:
      "양력 · 한국 표준시(UTC+9) · 출생시각 반영 · 23시 일자 변경 · 진태양시 보정 없음",
  };
}
