import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bootstrap, ChartPoint } from "../types";
import * as api from "../api";

interface ChartsPanelProps {
  data: Bootstrap;
}

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

function ChartBlock({ name, chartId }: { name: string; chartId: string }) {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .fetchChart(name)
      .then((res) => {
        if (!cancelled) setPoints(res.points);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  const chartData = useMemo(
    () => points.map((p) => ({ ...p, label: formatDate(p.date) })),
    [points],
  );
  const [yMin, yMax] = yLimits(points.map((p) => p.total));

  if (loading) return <p className="empty">Loading chart…</p>;
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
            value: "Total",
            angle: -90,
            position: "insideLeft",
            fill: "#8b8da3",
            fontSize: 11,
          }}
        />
        <Tooltip
          contentStyle={{
            background: "#181824",
            border: "1px solid #2e2e42",
            borderRadius: 8,
            color: "#eef0f8",
          }}
          labelStyle={{ color: "#8b8da3" }}
          formatter={(v: number) => [v, "Total"]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6d9fff"
          strokeWidth={2}
          fill={`url(#fill-${chartId})`}
          dot={{ fill: "#6d9fff", r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChartsPanel({ data }: ChartsPanelProps) {
  const names = data.chart_names;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(names));

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const n of names) {
        if (prev.has(n)) next.add(n);
      }
      if (next.size === 0 && names.length) names.forEach((n) => next.add(n));
      return next;
    });
  }, [names]);

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
            <h3>{name} — total over time</h3>
            <ChartBlock name={name} chartId={`c${i}`} />
          </section>
        ))
      )}
    </div>
  );
}
