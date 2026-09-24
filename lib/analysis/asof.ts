export function kstDateParts(date = new Date()) {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export function kstDateString(date = new Date()) {
  const parts = kstDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}


export function parseDateParts(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("기준일은 YYYY-MM-DD 형식이어야 합니다.");
  }

  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));

  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    throw new Error("존재하지 않는 기준일입니다.");
  }

  return { year, month, day };
}

export function toKstNoonInstant(value: string) {
  const { year, month, day } = parseDateParts(value);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
}

export function addYearsClamped(value: string, years: number) {
  const { year, month, day } = parseDateParts(value);
  const targetYear = year + years;
  const maxDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const nextDay = Math.min(day, maxDay);

  return `${targetYear}-${String(month).padStart(2, "0")}-${String(
    nextDay,
  ).padStart(2, "0")}`;
}


export function addMonthsClamped(value: string, monthsToAdd: number) {
  const { year, month, day } = parseDateParts(value);
  const baseIndex = year * 12 + (month - 1) + monthsToAdd;
  const targetYear = Math.floor(baseIndex / 12);
  const targetMonthIndex = ((baseIndex % 12) + 12) % 12;
  const targetMonth = targetMonthIndex + 1;
  const maxDay = new Date(
    Date.UTC(targetYear, targetMonth, 0),
  ).getUTCDate();
  const nextDay = Math.min(day, maxDay);

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(
    nextDay,
  ).padStart(2, "0")}`;
}
