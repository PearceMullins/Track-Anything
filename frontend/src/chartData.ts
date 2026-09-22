import type { ChartPointDetail, EntryRecord } from "./types";
import { formulaForName, resolveNumericValue, type ValueFormulasConfig } from "./data/valueFormulas";

function chartDatetime(entryDate: string, sameDayIndex: number): Date {
  const base = new Date(`${entryDate}T12:00:00`);
  base.setMinutes(base.getMinutes() + sameDayIndex * 30);
  return base;
}

function chartPointFromEntry(
  entry: EntryRecord,
  sameDayIndex: number,
  formulas?: ValueFormulasConfig | null,
): ChartPointDetail {
  const formula = formulaForName(formulas, entry.exercise);
  return {
    date: chartDatetime(entry.entry_date, sameDayIndex).toISOString(),
    value: resolveNumericValue(entry.value, formula),
    valueDisplay: entry.value,
    entryIndex: entry.index,
    notes: entry.notes,
  };
}

/** Chart points for one tracked name. Y-axis uses the configured value formula. */
export function chartPointsForExercise(
  entries: EntryRecord[],
  exercise: string,
  formulas?: ValueFormulasConfig | null,
): ChartPointDetail[] {
  const matching = entries
    .filter((entry) => entry.exercise === exercise)
    .sort((a, b) => {
      const byDate = a.entry_date.localeCompare(b.entry_date);
      return byDate !== 0 ? byDate : (a.logged_at || "").localeCompare(b.logged_at || "");
    });

  const sameDay: Record<string, number> = {};
  return matching.map((entry) => {
    const idx = sameDay[entry.entry_date] ?? 0;
    sameDay[entry.entry_date] = idx + 1;
    return chartPointFromEntry(entry, idx, formulas);
  });
}

/** Stable key so chart components remount when underlying entry data changes. */
export function chartDataKey(entries: EntryRecord[], exercise: string): string {
  return entries
    .filter((entry) => entry.exercise === exercise)
    .map(
      (entry) =>
        `${entry.index}:${entry.entry_date}:${entry.logged_at}:${entry.value}:${entry.notes}`,
    )
    .join(";");
}
