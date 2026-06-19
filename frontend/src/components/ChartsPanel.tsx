import { memo, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bootstrap, ChartPointDetail, EntryRecord } from "../types";
import { chartPointsForExercise } from "../chartData";
import { loadUiSlice, saveUiSlice } from "../uiState";
import { ChartTooltipContent } from "./ChartTooltipContent";

interface ChartsPanelProps {
  data: Bootstrap;
}

type ChartRow = ChartPointDetail & { label: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function yLimits(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span === 0 ? Math.max(Math.abs(min) * 0.05, 1) : Math.max(span * 0.08, 1e-9);
  return [min - pad, max + pad];
}

const ChartBlock = memo(function ChartBlock({
  name,
  chartId,
  entries,
}: {
  name: string;
  chartId: string;
  entries: EntryRecord[];
}) {
  const points = useMemo(() => chartPointsForExercise(entries, name), [entries, name]);

  const chartData = useMemo<ChartRow[]>(
    () => points.map((point) => ({ ...point, label: formatDate(point.date) })),
    [points],
  );
  const [yMin, yMax] = yLimits(points.map((point) => point.value));

  if (points.length === 0) return <p className="empty">No data for {name}.</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d9fff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6d9fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2e2e42" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#8b8da3", fontSize: 11 }} tickLine={false} />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: "#8b8da3", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            label={{
              value: "Value",
              angle: -90,
              position: "insideLeft",
              fill: "#8b8da3",
              fontSize: 11,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ChartRow | undefined;
              if (!point) return null;
              return <ChartTooltipContent point={point} />;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6d9fff"
            strokeWidth={2}
            fill={`url(#fill-${chartId})`}
            dot={{ fill: "#6d9fff", r: 4 }}
            activeDot={{ fill: "#eef0f8", stroke: "#6d9fff", strokeWidth: 2, r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
  );
});

export function ChartsPanel({ data }: ChartsPanelProps) {
  const profile = data.active_profile;
  const names = data.chart_names;
  const entries = data.entries;
  const [selected, setSelected] = useState<Set<string>>(() => {
    const saved = loadUiSlice(profile).chartSelected;
    if (saved?.length) return new Set(saved.filter((n) => names.includes(n)));
    return new Set(names);
  });

  useEffect(() => {
    saveUiSlice(profile, { chartSelected: [...selected] });
  }, [profile, selected]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(names));
  const clearAll = () => setSelected(new Set());

  const active = names.filter((n) => selected.has(n));

  return (
    <div>
      <section className="card">
        <div className="toolbar">
          <h2 className="card-title" style={{ margin: 0 }}>
            Charts to display
          </h2>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>

        {names.length === 0 ? (
          <p className="empty">Log entries to see chart names here.</p>
        ) : (
          <div className="check-grid">
            {names.map((name) => (
              <label key={name} className="check-item">
                <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
                {name}
              </label>
            ))}
          </div>
        )}
      </section>

      {active.length === 0 ? (
        <p className="empty">Select one or more names above to view charts.</p>
      ) : (
        active.map((name, i) => (
          <section key={name} className="card chart-card">
            <h3>{name} — value over time</h3>
            <p className="chart-hint">Hover over a point to see notes.</p>
            <ChartBlock name={name} chartId={`c${i}`} entries={entries} />
          </section>
        ))
      )}
    </div>
  );
}
