import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ValueFormulaEditor } from "./ValueFormulaEditor";
import { emptyValueFormulas, setFormulaForName } from "../data/valueFormulas";

function render(config = emptyValueFormulas(), sample = "2 sets of 10") {
  return renderToStaticMarkup(
    <ValueFormulaEditor
      name="Pushups"
      config={config}
      sampleValue={sample}
      onChange={() => {}}
      onSetDefault={() => {}}
    />,
  );
}

describe("ValueFormulaEditor", () => {
  it("shows quick picks for the default formula", () => {
    const html = render();
    expect(html).toContain("Equation for Pushups");
    expect(html).toContain("First number");
    expect(html).toContain("Numbers found: a=2, b=10");
    expect(html).toContain("2");
  });

  it("restores the equation builder for a plain chain", () => {
    const config = setFormulaForName(emptyValueFormulas(), "Pushups", { expr: "a + b + c" });
    const html = render(config);
    expect(html).toContain("Build an equation…");
    expect(html).toContain("a + b + c");
    expect(html).not.toContain("Custom expression using");
  });

  it("falls back to the custom expression editor", () => {
    const config = setFormulaForName(emptyValueFormulas(), "Pushups", { expr: "avg(a, b)" });
    const html = render(config);
    expect(html).toContain("Custom expression…");
    expect(html).toContain("avg(a, b)");
    expect(html).toContain("avg(2, 10) = 6");
  });

  it("offers reset when a name has an override", () => {
    const config = setFormulaForName(emptyValueFormulas(), "Pushups", "sum_numbers");
    const html = render(config);
    expect(html).toContain("Reset Pushups");
    expect(html).toContain("Use for all names");
  });
});
