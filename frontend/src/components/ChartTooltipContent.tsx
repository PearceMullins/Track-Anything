import type { ChartPointDetail } from "../types";

interface ChartTooltipContentProps {
  point: ChartPointDetail & { label: string };
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
      {point.notes ? <div className="chart-tooltip-notes">{point.notes}</div> : null}
    </div>
  );
}
