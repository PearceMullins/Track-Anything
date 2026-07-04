import type { ChartPointDetail } from "./types";

export interface ProjectedPoint {
  date: string;
  value: number;
  isProjected: true;
}

export interface ChartSeriesRow extends ChartPointDetail {
  label: string;
  isProjected: boolean;
  /** Historical series; null on pure forecast points. */
  actual: number | null;
  /** Forecast series; null on pure historical points (except bridge). */
  projected: number | null;
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetween(fromDay: string, toDay: string): number {
  const from = new Date(`${fromDay}T12:00:00`).getTime();
  const to = new Date(`${toDay}T12:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** One value per calendar day so same-day entries do not skew the trend. */
function aggregateByCalendarDay(points: ChartPointDetail[]): ChartPointDetail[] {
  const byDay = new Map<string, ChartPointDetail[]>();
  for (const point of points) {
    const key = dateKey(point.date);
    const list = byDay.get(key) ?? [];
    list.push(point);
    byDay.set(key, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayPoints]) => {
      const avgValue = dayPoints.reduce((sum, p) => sum + p.value, 0) / dayPoints.length;
      const last = dayPoints[dayPoints.length - 1];
      return {
        ...last,
        date: new Date(`${day}T12:00:00`).toISOString(),
        value: avgValue,
      };
    });
}

/** Calendar-day gaps between consecutive chart points. */
export function historicalSpacingDays(points: ChartPointDetail[]): number[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const steps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    steps.push(
      Math.max(1, daysBetween(dateKey(sorted[i - 1].date), dateKey(sorted[i].date))),
    );
  }
  return steps;
}

function projectionStepDays(steps: number[], index: number): number {
  if (steps.length === 0) return 1;
  return steps[Math.min(index, steps.length - 1)];
}

/** Average per-day change between consecutive calendar days. */
function dailyChangeRate(dailyPoints: ChartPointDetail[]): number {
  if (dailyPoints.length < 2) return 0;

  let totalChange = 0;
  let totalDays = 0;
  for (let i = 1; i < dailyPoints.length; i++) {
    const prevDay = dateKey(dailyPoints[i - 1].date);
    const currDay = dateKey(dailyPoints[i].date);
    const span = Math.max(1, daysBetween(prevDay, currDay));
    totalChange += dailyPoints[i].value - dailyPoints[i - 1].value;
    totalDays += span;
  }
  return totalDays === 0 ? 0 : totalChange / totalDays;
}

function clampProjectedValue(
  value: number,
  dailyPoints: ChartPointDetail[],
  lastValue: number,
): number {
  const values = dailyPoints.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) {
    const margin = Math.max(Math.abs(lastValue) * 0.25, 1);
    return Math.min(lastValue + margin, Math.max(Math.max(0, lastValue - margin), value));
  }
  const floor = Math.max(0, min - range);
  const ceiling = max + range * 2;
  return Math.min(ceiling, Math.max(floor, value));
}

function projectValue(
  dailyPoints: ChartPointDetail[],
  lastPoint: ChartPointDetail,
  targetDay: string,
): number {
  const lastDay = dateKey(lastPoint.date);
  const daysAhead = Math.max(0, daysBetween(lastDay, targetDay));
  const rate = dailyChangeRate(dailyPoints);
  const raw = Math.max(0, lastPoint.value + rate * daysAhead);
  return clampProjectedValue(raw, dailyPoints, lastPoint.value);
}

/**
 * Project the same number of points as history, using the same date spacing
 * between consecutive entries.
 */
export function computeProjectedPoints(historical: ChartPointDetail[]): ProjectedPoint[] {
  if (historical.length === 0) return [];

  const sorted = [...historical].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const lastDay = dateKey(last.date);
  const daily = aggregateByCalendarDay(sorted);
  const steps = historicalSpacingDays(sorted);
  const pointCount = sorted.length;

  const projected: ProjectedPoint[] = [];
  let daysAhead = 0;

  for (let i = 0; i < pointCount; i++) {
    daysAhead += projectionStepDays(steps, i);
    const day = addDays(lastDay, daysAhead);
    const value = projectValue(daily, last, day);
    projected.push({
      date: new Date(`${day}T12:00:00`).toISOString(),
      value: Math.round(value * 100) / 100,
      isProjected: true,
    });
  }
  return projected;
}

function rowFromHistorical(point: ChartPointDetail, label: string): ChartSeriesRow {
  return {
    ...point,
    label,
    isProjected: false,
    actual: point.value,
    projected: null,
  };
}

function rowFromProjected(point: ProjectedPoint, label: string): ChartSeriesRow {
  return {
    date: point.date,
    value: point.value,
    valueDisplay: `${point.value} (projected)`,
    entryIndex: -1,
    notes: "",
    label,
    isProjected: true,
    actual: null,
    projected: point.value,
  };
}

/** Merge historical + projected rows for Recharts (dual series with bridge point). */
export function buildChartSeries(
  historical: ChartPointDetail[],
  projected: ProjectedPoint[],
  formatLabel: (iso: string) => string,
): ChartSeriesRow[] {
  const rows = historical.map((p) => rowFromHistorical(p, formatLabel(p.date)));

  if (projected.length === 0) return rows;

  const last = rows[rows.length - 1];
  if (last) {
    last.projected = last.actual;
  }

  for (const point of projected) {
    rows.push(rowFromProjected(point, formatLabel(point.date)));
  }
  return rows;
}

export function seriesYLimits(rows: ChartSeriesRow[]): [number, number] {
  const values: number[] = [];
  for (const row of rows) {
    if (row.actual != null) values.push(row.actual);
    if (row.projected != null) values.push(row.projected);
  }
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span === 0 ? Math.max(Math.abs(min) * 0.05, 1) : Math.max(span * 0.08, 1e-9);
  return [min - pad, max + pad];
}

export { aggregateByCalendarDay, dailyChangeRate };
