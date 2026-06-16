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
