import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChartTooltipContent } from "./ChartTooltipContent";
import type { ChartSeriesPoint } from "../types";

const point: ChartSeriesPoint & { label: string } = {
  date: "2026-09-28T12:00:00.000Z",
  label: "Sep 28",
  value: 125,
  valueDisplay: "5 × 5 × 5",
  entryIndex: 0,
  notes: "Evening",
};

describe("ChartTooltipContent", () => {
  it("shows the logged expression and the equation result", () => {
    const html = renderToStaticMarkup(<ChartTooltipContent point={point} />);
    expect(html).toContain("Sep 28");
    expect(html).toContain("Value: 5 × 5 × 5");
    expect(html).toContain("Result: 125");
    expect(html).toContain("Evening");
  });

  it("labels projected points separately", () => {
    const html = renderToStaticMarkup(
      <ChartTooltipContent point={{ ...point, isProjected: true, notes: "" }} />,
    );
    expect(html).toContain("Projected: 5 × 5 × 5");
    expect(html).toContain("Projected result: 125");
  });
});
