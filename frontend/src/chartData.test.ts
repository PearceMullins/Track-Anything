import { describe, expect, it } from "vitest";
import { chartDataKey, chartPointsForExercise } from "./chartData";
import type { EntryRecord } from "./types";

function entry(
  index: number,
  exercise: string,
  entry_date: string,
  set_values: string[],
  volume: number,
): EntryRecord {
  return {
    index,
    exercise,
    entry_date,
    set_values,
    set_labels: set_values.map((_, i) => `Set ${i + 1}`),
    notes: "",
    logged_at: `${entry_date}T12:00:00`,
    volume,
    set_count: set_values.length,
  };
}

describe("chartData", () => {
  it("builds one point per matching entry", () => {
    const entries = [
      entry(0, "Pushups", "2026-06-11", ["10 reps"], 10),
      entry(1, "Pushups", "2026-06-12", ["15 reps"], 15),
      entry(2, "Running", "2026-06-12", ["3 miles"], 3),
    ];
    const points = chartPointsForExercise(entries, "Pushups");
    expect(points).toHaveLength(2);
    expect(points[0].total).toBe(10);
    expect(points[1].total).toBe(15);
  });

  it("changes data key when values change", () => {
    const before = [entry(0, "Pushups", "2026-06-11", ["10 reps"], 10)];
    const after = [entry(0, "Pushups", "2026-06-11", ["20 reps"], 20)];
    expect(chartDataKey(before, "Pushups")).not.toBe(chartDataKey(after, "Pushups"));
  });
});
