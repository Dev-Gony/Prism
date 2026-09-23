export class AnalysisInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisInputError";
  }
}

export function parseBirthDate(raw: unknown) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AnalysisInputError("생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.");
  }

  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AnalysisInputError("실제로 존재하는 생년월일을 입력해 주세요.");
  }

  if (year < 1900 || year > 2100) {
    throw new AnalysisInputError("Quick MVP는 1900년부터 2100년까지 지원합니다.");
  }

  return { date: raw, year, month, day };
}
