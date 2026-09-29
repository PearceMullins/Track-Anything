import type { ChartSeriesPoint } from "../types";

interface ChartTooltipContentProps {
  point: ChartSeriesPoint & { label: string };
}

export function ChartTooltipContent({ point }: ChartTooltipContentProps) {
  const projected = "isProjected" in point && point.isProjected;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{point.label}</div>
      <div className="chart-tooltip-total">
        {projected ? "Projected: " : "Value: "}
        {point.valueDisplay}
      </div>
      <div className="chart-tooltip-result">
        {projected ? "Projected result: " : "Result: "}
        {point.value}
      </div>
      {point.notes ? <div className="chart-tooltip-notes">{point.notes}</div> : null}
    </div>
  );
}
