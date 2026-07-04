import { describe, expect, it } from "vitest";
import {
  aggregateByCalendarDay,
  buildChartSeries,
  computeProjectedPoints,
  dailyChangeRate,
  historicalSpacingDays,
  seriesYLimits,
} from "./forecastData";
import type { ChartPointDetail } from "./types";

function point(date: string, value: number, minutes = 0): ChartPointDetail {
  const d = new Date(`${date}T12:00:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return {
    date: d.toISOString(),
    value,
    valueDisplay: String(value),
    entryIndex: 0,
    notes: "",
  };
}

describe("forecastData", () => {
  it("aggregates same-day entries to daily averages", () => {
    const daily = aggregateByCalendarDay([
      point("2026-06-17", 5, 0),
      point("2026-06-17", 90, 30),
      point("2026-06-24", 15),
    ]);
    expect(daily).toHaveLength(2);
    expect(daily[0].value).toBe(47.5);
    expect(daily[1].value).toBe(15);
  });

  it("reads spacing between consecutive history points", () => {
    const historical = [point("2026-06-17", 10), point("2026-06-19", 16), point("2026-06-24", 18)];
    expect(historicalSpacingDays(historical)).toEqual([2, 5]);
  });

  it("projects the same number of points as history", () => {
    const historical = [point("2026-06-17", 10), point("2026-06-19", 16), point("2026-06-24", 18)];
    const projected = computeProjectedPoints(historical);
    expect(projected).toHaveLength(3);
  });

  it("uses historical spacing for projected dates", () => {
    const historical = [point("2026-06-17", 10), point("2026-06-19", 16), point("2026-06-24", 18)];
    const projected = computeProjectedPoints(historical);
    expect(projected[0].date.slice(0, 10)).toBe("2026-06-26");
    expect(projected[1].date.slice(0, 10)).toBe("2026-07-01");
    expect(projected[2].date.slice(0, 10)).toBe("2026-07-06");
  });

  it("does not explode when same-day entries differ widely", () => {
    const historical = [
      point("2026-06-17", 5, 0),
      point("2026-06-17", 90, 30),
      point("2026-06-24", 15),
    ];
    const projected = computeProjectedPoints(historical);
    expect(projected).toHaveLength(3);
    expect(projected[2].value).toBeLessThan(45);
  });

  it("extends recent daily trend from the last entry", () => {
    const historical = [point("2026-06-17", 10), point("2026-06-24", 20), point("2026-07-01", 30)];
    const projected = computeProjectedPoints(historical);
    expect(projected[0].value).toBeGreaterThan(30);
    expect(projected[2].value).toBeGreaterThan(projected[0].value);
  });

  it("projects flat when only one calendar day exists", () => {
    const historical = [point("2026-06-17", 12, 0), point("2026-06-17", 18, 30)];
    expect(dailyChangeRate(aggregateByCalendarDay(historical))).toBe(0);
    const projected = computeProjectedPoints(historical);
    expect(projected).toHaveLength(2);
    expect(projected[0].value).toBe(18);
    expect(projected[1].value).toBe(18);
  });

  it("builds combined series with bridge point", () => {
    const historical = [point("2026-01-01", 10), point("2026-01-08", 20)];
    const projected = computeProjectedPoints(historical);
    const rows = buildChartSeries(historical, projected, (iso) => iso.slice(0, 10));
    expect(rows).toHaveLength(4);
    expect(rows[1].actual).toBe(20);
    expect(rows[1].projected).toBe(20);
    expect(rows[2].isProjected).toBe(true);
    expect(rows[2].actual).toBeNull();
  });

  it("computes y limits from both series", () => {
    const rows = buildChartSeries(
      [point("2026-01-01", 10)],
      [{ date: point("2026-02-01", 50).date, value: 50, isProjected: true }],
      (iso) => iso,
    );
    const [min, max] = seriesYLimits(rows);
    expect(min).toBeLessThan(10);
    expect(max).toBeGreaterThan(50);
  });
});
