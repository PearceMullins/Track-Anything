import { describe, expect, it } from "vitest";
import { chartDataKey, chartPointsForExercise } from "./chartData";
import { parseNumericValue } from "./data/models";
import type { EntryRecord } from "./types";

function entry(
  index: number,
  exercise: string,
  entry_date: string,
  value: string,
  notes = "",
): EntryRecord {
  return {
    index,
    exercise,
    entry_date,
    value,
    notes,
    logged_at: `${entry_date}T12:00:00`,
    numeric_value: parseNumericValue(value),
  };
}

describe("chartData", () => {
  it("builds one point per matching entry", () => {
    const entries = [
      entry(0, "Pushups", "2026-06-11", "10 reps"),
      entry(1, "Pushups", "2026-06-12", "15 reps"),
      entry(2, "Running", "2026-06-12", "3 miles"),
    ];
    const points = chartPointsForExercise(entries, "Pushups");
    expect(points).toHaveLength(2);
    expect(points[0].value).toBe(10);
    expect(points[1].value).toBe(15);
    expect(points[0].valueDisplay).toBe("10 reps");
    expect(points[0].notes).toBe("");
  });

  it("includes notes on chart points", () => {
    const entries = [entry(0, "Pushups", "2026-06-11", "10 reps", "Morning set")];
    const points = chartPointsForExercise(entries, "Pushups");
    expect(points[0].notes).toBe("Morning set");
  });

  it("changes data key when values change", () => {
    const before = [entry(0, "Pushups", "2026-06-11", "10 reps")];
    const after = [entry(0, "Pushups", "2026-06-11", "20 reps")];
    expect(chartDataKey(before, "Pushups")).not.toBe(chartDataKey(after, "Pushups"));
  });
});
