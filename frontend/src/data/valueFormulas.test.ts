import { describe, expect, it } from "vitest";
import {
  buildChainExpr,
  clampInputCount,
  emptyValueFormulas,
  explainFormula,
  extractNumbers,
  formulaForName,
  formulaLabel,
  isValidExpr,
  normalizeValueFormulas,
  parseChainExpr,
  resolveNumericValue,
  setDefaultFormula,
  setFormulaForName,
  variableNames,
} from "./valueFormulas";

describe("valueFormulas", () => {
  it("defaults to first_number", () => {
    expect(resolveNumericValue("10 reps 20")).toBe(10);
    expect(resolveNumericValue("no number")).toBe(0);
    expect(formulaForName(undefined, "Pushups")).toBe("first_number");
  });

  it("applies presets", () => {
    const text = "2 sets of 5 and 10";
    expect(extractNumbers(text)).toEqual([2, 5, 10]);
    expect(resolveNumericValue(text, "last_number")).toBe(10);
    expect(resolveNumericValue(text, "sum_numbers")).toBe(17);
    expect(resolveNumericValue(text, "product_numbers")).toBe(100);
    expect(resolveNumericValue(text, "max_number")).toBe(10);
    expect(resolveNumericValue(text, "min_number")).toBe(2);
  });

  it("product and max/min of empty are 0", () => {
    expect(resolveNumericValue("none", "product_numbers")).toBe(0);
    expect(resolveNumericValue("none", "max_number")).toBe(0);
    expect(resolveNumericValue("none", "min_number")).toBe(0);
  });

  it("evaluates safe expr over a,b,...", () => {
    expect(resolveNumericValue("3 x 4", { expr: "a * b" })).toBe(12);
    expect(resolveNumericValue("10 and 2", { expr: "(a + b) / 2" })).toBe(6);
    expect(resolveNumericValue("5", { expr: "a * 2 + 1" })).toBe(11);
    expect(resolveNumericValue("1 2", { expr: "c" })).toBe(0);
  });

  it("rejects unsafe expr tokens", () => {
    expect(resolveNumericValue("10", { expr: "a; alert(1)" })).toBe(0);
    expect(resolveNumericValue("10", { expr: "" })).toBe(0);
  });

  it("normalizes config and resolves per name", () => {
    const cfg = normalizeValueFormulas({
      default: "sum_numbers",
      by_name: { Running: "last_number", Complex: { expr: "a*b" } },
    });
    expect(formulaForName(cfg, "Pushups")).toBe("sum_numbers");
    expect(formulaForName(cfg, "Running")).toBe("last_number");
    expect(resolveNumericValue("3 x 4", formulaForName(cfg, "Complex"))).toBe(12);
    expect(normalizeValueFormulas(null)).toEqual(emptyValueFormulas());
  });

  it("setFormulaForName clears override when matching default", () => {
    let cfg = emptyValueFormulas();
    cfg = setFormulaForName(cfg, "Pushups", "sum_numbers");
    expect(cfg.by_name.Pushups).toBe("sum_numbers");
    cfg = setFormulaForName(cfg, "Pushups", "first_number");
    expect(cfg.by_name.Pushups).toBeUndefined();
  });

  it("builds chains from operators and input count", () => {
    expect(buildChainExpr(["+", "+"], 3)).toBe("a + b + c");
    expect(buildChainExpr(["-"], 2)).toBe("a - b");
    expect(buildChainExpr(["/", "*", "+"], 4)).toBe("a / b * c + d");
    expect(buildChainExpr([], 2)).toBe("a + b");
    expect(buildChainExpr([], 1)).toBe("a");
    expect(variableNames(3)).toEqual(["a", "b", "c"]);
    expect(variableNames(1)).toEqual(["a"]);
    expect(clampInputCount(0)).toBe(1);
    expect(clampInputCount(1)).toBe(1);
    expect(clampInputCount(99)).toBe(12);
  });

  it("round-trips built chains through parseChainExpr", () => {
    const expr = buildChainExpr(["*", "-"], 3);
    expect(parseChainExpr(expr)).toEqual({ count: 3, operators: ["*", "-"] });
    expect(parseChainExpr("a + b + c + d")).toEqual({
      count: 4,
      operators: ["+", "+", "+"],
    });
    expect(parseChainExpr("a")).toEqual({ count: 1, operators: [] });
    expect(parseChainExpr("(a + b) * c")).toBeNull();
    expect(parseChainExpr("3 * a")).toBeNull();
    expect(parseChainExpr("avg(a, b)")).toBeNull();
    expect(parseChainExpr("b + a")).toBeNull();
  });

  it("evaluates operators chosen by the builder", () => {
    expect(resolveNumericValue("2 5 10", { expr: buildChainExpr(["+", "+"], 3) })).toBe(17);
    expect(resolveNumericValue("2 5 10", { expr: buildChainExpr(["*", "-"], 3) })).toBe(2 * 5 - 10);
    expect(resolveNumericValue("2 4", { expr: buildChainExpr(["^"], 2) })).toBe(16);
    expect(resolveNumericValue("7 4", { expr: buildChainExpr(["%"], 2) })).toBe(3);
    expect(resolveNumericValue("1 0", { expr: buildChainExpr(["%"], 2) })).toBe(0);
    expect(resolveNumericValue("0 0", { expr: buildChainExpr(["/"], 2) })).toBe(0);
  });

  it("applies math precedence for mixed operators", () => {
    expect(resolveNumericValue("2 3 4", { expr: "a + b * c" })).toBe(14);
    expect(resolveNumericValue("2 3 4", { expr: "(a + b) * c" })).toBe(20);
    expect(resolveNumericValue("2 3", { expr: "-a ^ b" })).toBe(-8);
    expect(resolveNumericValue("2 3", { expr: "2 ^ a ^ b" })).toBe(256);
  });

  it("supports functions and constants", () => {
    expect(resolveNumericValue("9", { expr: "abs(-a)" })).toBe(9);
    expect(resolveNumericValue("3 8 5", { expr: "min(a, b, c)" })).toBe(3);
    expect(resolveNumericValue("3 8 5", { expr: "max(a b c)" })).toBe(8);
    expect(resolveNumericValue("2 4 6", { expr: "avg(a, b, c)" })).toBe(4);
    expect(resolveNumericValue("2 4 6", { expr: "sum()" })).toBe(12);
    expect(resolveNumericValue("2 4 6", { expr: "avg()" })).toBe(4);
    expect(resolveNumericValue("2.4 2.5", { expr: "round(a) + round(b)" })).toBe(5);
    expect(resolveNumericValue("2.9 9", { expr: "floor(a) + ceil(b)" })).toBe(11);
    expect(resolveNumericValue("-4 9", { expr: "sqrt(a) + sqrt(b)" })).toBe(3);
    expect(resolveNumericValue("1", { expr: "round(pi * 100)" })).toBe(314);
  });

  it("rejects unknown names and malformed calls", () => {
    expect(resolveNumericValue("1 2", { expr: "nope(a, b)" })).toBe(0);
    expect(resolveNumericValue("1 2", { expr: "min(" })).toBe(0);
    expect(isValidExpr("a + b")).toBe(true);
    expect(isValidExpr("avg(a, b)")).toBe(true);
    expect(isValidExpr("a +")).toBe(false);
    expect(isValidExpr("nope(a)")).toBe(false);
    expect(isValidExpr("   ")).toBe(false);
  });

  it("explains an expression with the extracted numbers", () => {
    expect(explainFormula("a * b", [3, 4])).toBe("3 × 4");
    expect(explainFormula("(a + b) / 2", [10, 2])).toBe("(10 + 2) ÷ 2");
    expect(explainFormula("avg(a, b)", [10, 2])).toBe("avg(10, 2)");
    expect(explainFormula("a ^ 2", [3])).toBe("3 ^ 2");
  });

  it("labels presets and expressions for display", () => {
    expect(formulaLabel("first_number")).toBe("First number");
    expect(formulaLabel({ expr: "a * b" })).toBe("a × b");
  });

  it("setDefaultFormula moves the fallback and prunes matching overrides", () => {
    let cfg = emptyValueFormulas();
    cfg = setFormulaForName(cfg, "Pushups", "sum_numbers");
    cfg = setFormulaForName(cfg, "Running", { expr: "a * b" });
    cfg = setDefaultFormula(cfg, "sum_numbers");
    expect(cfg.default).toBe("sum_numbers");
    expect(cfg.by_name.Pushups).toBeUndefined();
    expect(cfg.by_name.Running).toEqual({ expr: "a * b" });
    cfg = setDefaultFormula(cfg, { expr: "a * b" });
    expect(cfg.by_name.Running).toBeUndefined();
  });
});
