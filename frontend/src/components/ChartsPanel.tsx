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
import type { Bootstrap, EntryRecord } from "../types";
import { chartPointsForExercise } from "../chartData";
import {
  buildChartSeries,
  computeProjectedPoints,
  seriesYLimits,
  type ChartSeriesRow,
} from "../forecastData";
import { loadUiSlice, saveUiSlice } from "../uiState";
import {
  emptyValueFormulas,
  formulaForName,
  formulaLabel,
  type ValueFormulasConfig,
} from "../data/valueFormulas";
import { ChartTooltipContent } from "./ChartTooltipContent";

interface ChartsPanelProps {
  data: Bootstrap;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const ChartBlock = memo(function ChartBlock({
  name,
  chartId,
  entries,
  showForecast,
  formulas,
}: {
  name: string;
  chartId: string;
  entries: EntryRecord[];
  showForecast: boolean;
  formulas: ValueFormulasConfig;
}) {
  const points = useMemo(
    () => chartPointsForExercise(entries, name, formulas),
    [entries, name, formulas],
  );

  const projected = useMemo(
    () => (showForecast ? computeProjectedPoints(points) : []),
    [points, showForecast],
  );

  const chartData = useMemo<ChartSeriesRow[]>(
    () => buildChartSeries(points, showForecast ? projected : [], formatDate),
    [points, projected, showForecast],
  );

  const [yMin, yMax] = useMemo(() => seriesYLimits(chartData), [chartData]);

  if (points.length === 0) return <p className="empty">No data for {name}.</p>;

  return (
    <>
      {showForecast && projected.length > 0 ? (
        <p className="chart-hint chart-forecast-auto-hint">
          Projecting {projected.length} point{projected.length === 1 ? "" : "s"} with the same spacing
          as your history for {name}.
        </p>
      ) : null}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d9fff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6d9fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`fill-forecast-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
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
              const point = payload[0]?.payload as ChartSeriesRow | undefined;
              if (!point) return null;
              return <ChartTooltipContent point={point} />;
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            connectNulls={false}
            stroke="#6d9fff"
            strokeWidth={2}
            fill={`url(#fill-${chartId})`}
            dot={{ fill: "#6d9fff", r: 4 }}
            activeDot={{ fill: "#eef0f8", stroke: "#6d9fff", strokeWidth: 2, r: 6 }}
          />
          {showForecast && projected.length > 0 ? (
            <Area
              type="monotone"
              dataKey="projected"
              connectNulls
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill={`url(#fill-forecast-${chartId})`}
              dot={{ fill: "#a78bfa", r: 3 }}
              activeDot={{ fill: "#eef0f8", stroke: "#a78bfa", strokeWidth: 2, r: 5 }}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
});

export function ChartsPanel({ data }: ChartsPanelProps) {
  const profile = data.active_profile;
  const names = data.chart_names;
  const entries = data.entries;
  const formulas = data.value_formulas ?? emptyValueFormulas();
  const saved = loadUiSlice(profile);

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (saved.chartSelected?.length) return new Set(saved.chartSelected.filter((n) => names.includes(n)));
    return new Set(names);
  });
  const [showForecast, setShowForecast] = useState(() => saved.chartShowForecast ?? false);

  useEffect(() => {
    saveUiSlice(profile, {
      chartSelected: [...selected],
      chartShowForecast: showForecast,
    });
  }, [profile, selected, showForecast]);

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

      <section className="card">
        <div className="toolbar">
          <h2 className="card-title" style={{ margin: 0 }}>
            Forecast projection
          </h2>
          <div className="history-field-toggle" role="group" aria-label="Forecast options">
            <label className="inline-check">
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
              />
              Show forecast
            </label>
          </div>
        </div>
        {showForecast ? (
          <p className="chart-hint" style={{ margin: 0 }}>
            Extends your recent daily trend using the same number of points and date spacing as your
            logged history.
          </p>
        ) : (
          <p className="chart-hint" style={{ margin: 0 }}>
            Enable forecast to extend each chart with a projected line based on your logged history.
          </p>
        )}
        {showForecast ? (
          <p className="chart-legend-hint">
            <span className="chart-legend-dot chart-legend-actual" aria-hidden /> Actual
            <span className="chart-legend-dot chart-legend-projected" aria-hidden /> Projected
          </p>
        ) : null}
      </section>

      {active.length === 0 ? (
        <p className="empty">Select one or more names above to view charts.</p>
      ) : (
        active.map((name, i) => {
          return (
            <section key={name} className="card chart-card">
              <h3>{name} — value over time</h3>
              <div className="chart-formula-row">
                <span className="chart-formula-label">
                  Equation: {formulaLabel(formulaForName(formulas, name))} — set in Log Entry
                </span>
              </div>
              <p className="chart-hint">
                Hover over a point to see notes. Dashed line extends your recent daily trend.
              </p>
              <ChartBlock
                name={name}
                chartId={`c${i}`}
                entries={entries}
                showForecast={showForecast}
                formulas={formulas}
              />
            </section>
          );
        })
      )}
    </div>
  );
}
