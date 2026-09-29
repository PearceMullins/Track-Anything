/** Display dates as MM/DD/YYYY; store and send ISO YYYY-MM-DD to the API. */

export function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

export function displayToIso(display: string): string {
  const trimmed = display.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    throw new Error("Use MM/DD/YYYY format.");
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error("Invalid date.");
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDisplay(): string {
  return isoToDisplay(todayIso());
}

export interface YearMonth {
  year: number;
  /** 0-based month, matching Date#getMonth. */
  month: number;
}

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function isoToYearMonth(iso: string): YearMonth {
  const [year, month] = iso.split("-");
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth)) {
    return isoToYearMonth(todayIso());
  }
  return { year: parsedYear, month: Math.min(11, Math.max(0, parsedMonth - 1)) };
}

export function shiftYearMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const shifted = new Date(year, month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function yearMonthLabel({ year, month }: YearMonth): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Six Sunday-first weeks covering the month, as ISO dates. */
export function monthGridIso({ year, month }: YearMonth): string[] {
  const first = new Date(year, month, 1);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(year, month, 1 - first.getDay() + index);
    return isoFromParts(day.getFullYear(), day.getMonth(), day.getDate());
  });
}

/** Use saved draft date only when the draft was touched on the same calendar day. */
export function resolveEntryDraftDate(
  savedDate: string | undefined,
  savedCalendarDay: string | undefined,
): string {
  const today = todayIso();
  if (!savedCalendarDay || savedCalendarDay !== today) {
    return todayDisplay();
  }
  return savedDate || todayDisplay();
}
