import lunar from "lunar-javascript";
import { AnalysisInputError, parseBirthDate } from "@/lib/analysis/input";

export type CalendarType = "solar" | "lunar";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseLunarDate(raw: unknown) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AnalysisInputError("생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.");
  }

  const [year, month, day] = raw.split("-").map(Number);

  if (year < 1900 || year > 2100) {
    throw new AnalysisInputError("Prism은 1900년부터 2100년까지 지원합니다.");
  }

  if (month < 1 || month > 12 || day < 1 || day > 30) {
    throw new AnalysisInputError("음력 생년월일을 다시 확인해 주세요.");
  }

  return { year, month, day };
}

export function normalizeBirthInput(
  raw: unknown,
  calendarType: unknown,
  isLeapMonth: unknown = false,
) {
  const type: CalendarType = calendarType === "lunar" ? "lunar" : "solar";

  if (type === "solar") {
    const parsed = parseBirthDate(raw);

    return {
      ...parsed,
      calendarType: type,
      originalDate: parsed.date,
      isLeapMonth: false,
    };
  }

  const parsed = parseLunarDate(raw);
  const leap = Boolean(isLeapMonth);

  try {
    const lunarDate = lunar.Lunar.fromYmd(
      parsed.year,
      leap ? -parsed.month : parsed.month,
      parsed.day,
    );
    const solar = lunarDate.getSolar();
    const year = solar.getYear();
    const month = solar.getMonth();
    const day = solar.getDay();

    return {
      date: `${year}-${pad(month)}-${pad(day)}`,
      year,
      month,
      day,
      calendarType: type,
      originalDate: raw as string,
      isLeapMonth: leap,
    };
  } catch {
    throw new AnalysisInputError(
      leap
        ? "선택한 윤달 날짜가 존재하지 않아요."
        : "선택한 음력 날짜가 존재하지 않아요.",
    );
  }
}
