/** Config-driven value → number formulas for charts and numeric_value. */

export const FORMULA_PRESETS = [
  "first_number",
  "last_number",
  "sum_numbers",
  "product_numbers",
  "max_number",
  "min_number",
] as const;

export type FormulaPreset = (typeof FORMULA_PRESETS)[number];

export type FormulaSpec = FormulaPreset | { expr: string };

export interface ValueFormulasConfig {
  default: FormulaSpec;
  by_name: Record<string, FormulaSpec>;
}

export const PRESET_LABELS: Record<FormulaPreset, string> = {
  first_number: "First number",
  last_number: "Last number",
  sum_numbers: "Sum of all numbers",
  product_numbers: "Product of all numbers",
  max_number: "Largest number",
  min_number: "Smallest number",
};

/** Operators offered by the visual equation builder. */
export const CHAIN_OPERATORS = ["+", "-", "*", "/", "^", "%"] as const;
export type ChainOperator = (typeof CHAIN_OPERATORS)[number];

export const OPERATOR_LABELS: Record<ChainOperator, string> = {
  "+": "Add (+)",
  "-": "Subtract (−)",
  "*": "Multiply (×)",
  "/": "Divide (÷)",
  "^": "Power (^)",
  "%": "Remainder (%)",
};

export const OPERATOR_SYMBOLS: Record<ChainOperator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^",
  "%": "%",
};

export const MIN_CHAIN_INPUTS = 1;
export const MAX_CHAIN_INPUTS = 12;

export const FORMULA_FUNCTIONS = [
  "abs",
  "avg",
  "sum",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "sqrt",
] as const;

export type FormulaFunction = (typeof FORMULA_FUNCTIONS)[number];

export const FORMULA_CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
};

const NUMBER_RE = /[-+]?\d*\.?\d+/g;
const PRESET_SET = new Set<string>(FORMULA_PRESETS);
const CHAIN_OP_SET = new Set<string>(CHAIN_OPERATORS);
const FUNCTION_SET = new Set<string>(FORMULA_FUNCTIONS);

export function emptyValueFormulas(): ValueFormulasConfig {
  return { default: "first_number", by_name: {} };
}

export function isFormulaPreset(value: unknown): value is FormulaPreset {
  return typeof value === "string" && PRESET_SET.has(value);
}

export function isFormulaSpec(value: unknown): value is FormulaSpec {
  if (isFormulaPreset(value)) return true;
  if (value && typeof value === "object" && "expr" in value) {
    return typeof (value as { expr: unknown }).expr === "string";
  }
  return false;
}

export function normalizeValueFormulas(raw: unknown): ValueFormulasConfig {
  const empty = emptyValueFormulas();
  if (!raw || typeof raw !== "object") return empty;
  const obj = raw as Record<string, unknown>;
  const defaultSpec = isFormulaSpec(obj.default) ? obj.default : empty.default;
  const byName: Record<string, FormulaSpec> = {};
  const rawByName = obj.by_name;
  if (rawByName && typeof rawByName === "object") {
    for (const [name, spec] of Object.entries(rawByName as Record<string, unknown>)) {
      if (name && isFormulaSpec(spec)) byName[name] = spec;
    }
  }
  return { default: defaultSpec, by_name: byName };
}

export function formulaForName(
  config: ValueFormulasConfig | null | undefined,
  name: string,
): FormulaSpec {
  const cfg = config ?? emptyValueFormulas();
  const override = cfg.by_name[name];
  return override ?? cfg.default ?? "first_number";
}

export function extractNumbers(text: string): number[] {
  const matches = text.match(NUMBER_RE);
  if (!matches) return [];
  const out: number[] = [];
  for (const m of matches) {
    if (m === "" || m === "+" || m === "-" || m === ".") continue;
    const n = Number(m);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function resolveNumericValue(text: string, formula: FormulaSpec = "first_number"): number {
  if (typeof formula === "object" && formula !== null && "expr" in formula) {
    return evalSafeExpr(formula.expr, extractNumbers(text));
  }
  const nums = extractNumbers(text);
  switch (formula) {
    case "first_number":
      return nums[0] ?? 0;
    case "last_number":
      return nums.length ? nums[nums.length - 1] : 0;
    case "sum_numbers":
      return nums.reduce((a, b) => a + b, 0);
    case "product_numbers":
      return nums.length === 0 ? 0 : nums.reduce((a, b) => a * b, 1);
    case "max_number":
      return nums.length === 0 ? 0 : Math.max(...nums);
    case "min_number":
      return nums.length === 0 ? 0 : Math.min(...nums);
    default:
      return nums[0] ?? 0;
  }
}

export function formulaLabel(spec: FormulaSpec): string {
  if (isFormulaPreset(spec)) return PRESET_LABELS[spec];
  return formatFormulaExpr(spec.expr);
}

/** `a * b` → `a × b` for display only. */
export function formatFormulaExpr(expr: string): string {
  return expr
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/\s+/g, " ")
    .trim();
}

export function variableName(index: number): string {
  return String.fromCharCode(97 + index);
}

export function variableNames(count: number): string[] {
  const total = clampInputCount(count);
  return Array.from({ length: total }, (_, i) => variableName(i));
}

export function clampInputCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_CHAIN_INPUTS;
  return Math.min(MAX_CHAIN_INPUTS, Math.max(MIN_CHAIN_INPUTS, Math.round(count)));
}

/** Builds `a + b + c` from one operator per gap between inputs. */
export function buildChainExpr(operators: readonly string[], count: number): string {
  const total = clampInputCount(count);
  const parts: string[] = [variableName(0)];
  for (let i = 1; i < total; i += 1) {
    parts.push(chainOpAt(operators, i - 1));
    parts.push(variableName(i));
  }
  return parts.join(" ");
}

export function chainOpAt(operators: readonly string[], index: number): ChainOperator {
  const op = operators[index];
  return typeof op === "string" && CHAIN_OP_SET.has(op) ? (op as ChainOperator) : "+";
}

export function isChainOperator(value: unknown): value is ChainOperator {
  return typeof value === "string" && CHAIN_OP_SET.has(value);
}

/** Reads a flat `a + b - c` chain back into builder state; null when not a plain chain. */
export function parseChainExpr(expr: string): { count: number; operators: ChainOperator[] } | null {
  let tokens: Token[];
  try {
    tokens = tokenize(expr);
  } catch {
    return null;
  }
  if (tokens.length < 1 || tokens.length % 2 === 0) return null;
  const operators: ChainOperator[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (i % 2 === 0) {
      if (tok.kind !== "name" || !isVariableToken(tok.name)) return null;
      if (tok.name !== variableName(i / 2)) return null;
    } else {
      if (tok.kind !== "op" || !isChainOperator(tok.op)) return null;
      operators.push(tok.op);
    }
  }
  const count = (tokens.length + 1) / 2;
  if (count < MIN_CHAIN_INPUTS || count > MAX_CHAIN_INPUTS) return null;
  return { count, operators };
}

/** Swaps `a`, `b`, … for the numbers pulled out of a value string. */
export function explainFormula(expr: string, numbers: number[]): string {
  let tokens: Token[];
  try {
    tokens = tokenize(expr);
  } catch {
    return expr;
  }
  return renderTokens(tokens, numbers);
}

export function isValidExpr(expr: string): boolean {
  if (!expr.trim()) return false;
  try {
    const parser = new ExprParser(tokenize(expr), []);
    parser.parseExpression();
    parser.expectEnd();
    return true;
  } catch {
    return false;
  }
}

function renderTokens(tokens: Token[], numbers: number[]): string {
  let out = "";
  tokens.forEach((tok, i) => {
    const prev = tokens[i - 1];
    let text: string;
    if (tok.kind === "num") text = formatNumber(tok.value);
    else if (tok.kind === "name") {
      text = isVariableToken(tok.name)
        ? formatNumber(numbers[tok.name.charCodeAt(0) - 97] ?? 0)
        : tok.name;
    } else if (tok.kind === "op") text = OPERATOR_SYMBOLS[tok.op as ChainOperator] ?? tok.op;
    else if (tok.kind === "lparen") text = "(";
    else if (tok.kind === "rparen") text = ")";
    else text = ",";
    const tight =
      text === ")" ||
      text === "," ||
      (prev?.kind === "lparen") ||
      (tok.kind === "lparen" && prev?.kind === "name");
    out += i === 0 ? text : `${tight ? "" : " "}${text}`;
  });
  return out;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

export function setFormulaForName(
  config: ValueFormulasConfig,
  name: string,
  spec: FormulaSpec,
): ValueFormulasConfig {
  const by_name = { ...config.by_name };
  const def = config.default;
  const sameAsDefault = formulaSpecsEqual(spec, def);
  if (sameAsDefault) {
    delete by_name[name];
  } else {
    by_name[name] = spec;
  }
  return { default: config.default, by_name };
}

export function setDefaultFormula(
  config: ValueFormulasConfig,
  spec: FormulaSpec,
): ValueFormulasConfig {
  const by_name = { ...config.by_name };
  for (const [name, existing] of Object.entries(by_name)) {
    if (formulaSpecsEqual(existing, spec)) delete by_name[name];
  }
  return { default: spec, by_name };
}

export function formulaSpecsEqual(a: FormulaSpec, b: FormulaSpec): boolean {
  if (typeof a === "string" && typeof b === "string") return a === b;
  if (typeof a === "object" && typeof b === "object") return a.expr === b.expr;
  return false;
}

export function renameFormulaName(
  config: ValueFormulasConfig,
  oldName: string,
  newName: string,
): ValueFormulasConfig {
  if (oldName === newName || !(oldName in config.by_name)) return config;
  const by_name = { ...config.by_name };
  by_name[newName] = by_name[oldName];
  delete by_name[oldName];
  return { default: config.default, by_name };
}

export function removeFormulaName(
  config: ValueFormulasConfig,
  name: string,
): ValueFormulasConfig {
  if (!(name in config.by_name)) return config;
  const by_name = { ...config.by_name };
  delete by_name[name];
  return { default: config.default, by_name };
}

/** Safe arithmetic over a,b,c… = extracted numbers (and numeric literals). */
function evalSafeExpr(expr: string, numbers: number[]): number {
  const trimmed = expr.trim();
  if (!trimmed) return 0;
  try {
    const tokens = tokenize(trimmed);
    const parser = new ExprParser(tokens, numbers);
    const value = parser.parseExpression();
    parser.expectEnd();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

type Token =
  | { kind: "num"; value: number }
  | { kind: "name"; name: string }
  | { kind: "op"; op: string }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" };

function isVariableToken(name: string): boolean {
  return name.length === 1 && name >= "a" && name <= "z";
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma" });
      i += 1;
      continue;
    }
    if ("+-*/%^()".includes(ch)) {
      if (ch === "(") tokens.push({ kind: "lparen" });
      else if (ch === ")") tokens.push({ kind: "rparen" });
      else tokens.push({ kind: "op", op: ch });
      i += 1;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let j = i + 1;
      while (j < expr.length && /[a-zA-Z]/.test(expr[j])) j += 1;
      tokens.push({ kind: "name", name: expr.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j += 1;
      const n = Number(expr.slice(i, j));
      if (!Number.isFinite(n)) throw new Error("bad number");
      tokens.push({ kind: "num", value: n });
      i = j;
      continue;
    }
    throw new Error("bad char");
  }
  return tokens;
}

class ExprParser {
  private i = 0;
  constructor(
    private tokens: Token[],
    private numbers: number[],
  ) {}

  expectEnd(): void {
    if (this.i < this.tokens.length) throw new Error("trailing");
  }

  parseExpression(): number {
    let left = this.parseTerm();
    while (this.matchOp("+") || this.matchOp("-")) {
      const op = this.tokens[this.i - 1] as { kind: "op"; op: string };
      const right = this.parseTerm();
      left = op.op === "+" ? left + right : left - right;
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseUnary();
    while (this.matchOp("*") || this.matchOp("/") || this.matchOp("%")) {
      const op = this.tokens[this.i - 1] as { kind: "op"; op: string };
      const right = this.parseUnary();
      if (op.op === "*") left *= right;
      else if (op.op === "/") left = right === 0 ? 0 : left / right;
      else left = right === 0 ? 0 : left - right * Math.trunc(left / right);
    }
    return left;
  }

  private parseUnary(): number {
    if (this.matchOp("+")) return this.parseUnary();
    if (this.matchOp("-")) return -this.parseUnary();
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (this.matchOp("^")) {
      const exponent = this.parseUnary();
      return Math.pow(base, exponent);
    }
    return base;
  }

  private parsePrimary(): number {
    const tok = this.tokens[this.i];
    if (!tok) throw new Error("eof");
    if (tok.kind === "num") {
      this.i += 1;
      return tok.value;
    }
    if (tok.kind === "name") {
      this.i += 1;
      if (isVariableToken(tok.name)) {
        return this.numbers[tok.name.charCodeAt(0) - 97] ?? 0;
      }
      if (FUNCTION_SET.has(tok.name)) {
        return this.callFunction(tok.name);
      }
      const constant = FORMULA_CONSTANTS[tok.name];
      if (constant !== undefined) return constant;
      throw new Error("bad name");
    }
    if (tok.kind === "lparen") {
      this.i += 1;
      const v = this.parseExpression();
      if (!this.tokens[this.i] || this.tokens[this.i].kind !== "rparen") {
        throw new Error("paren");
      }
      this.i += 1;
      return v;
    }
    throw new Error("primary");
  }

  private callFunction(name: string): number {
    if (!this.tokens[this.i] || this.tokens[this.i].kind !== "lparen") {
      throw new Error("expected args");
    }
    this.i += 1;
    const args: number[] = [];
    while (this.tokens[this.i] && this.tokens[this.i].kind !== "rparen") {
      args.push(this.parseExpression());
      if (this.tokens[this.i]?.kind === "comma") this.i += 1;
    }
    if (!this.tokens[this.i] || this.tokens[this.i].kind !== "rparen") {
      throw new Error("args");
    }
    this.i += 1;
    return applyFunction(name, args, this.numbers);
  }

  private matchOp(op: string): boolean {
    const tok = this.tokens[this.i];
    if (tok?.kind === "op" && tok.op === op) {
      this.i += 1;
      return true;
    }
    return false;
  }
}

function applyFunction(name: string, args: number[], numbers: number[]): number {
  const values = args.length > 0 ? args : numbers;
  switch (name) {
    case "abs":
      return Math.abs(firstArg(args));
    case "avg":
      return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "min":
      return values.length === 0 ? 0 : Math.min(...values);
    case "max":
      return values.length === 0 ? 0 : Math.max(...values);
    case "round":
      return Math.floor(firstArg(args) + 0.5);
    case "floor":
      return Math.floor(firstArg(args));
    case "ceil":
      return Math.ceil(firstArg(args));
    case "sqrt": {
      const value = firstArg(args);
      return value < 0 ? 0 : Math.sqrt(value);
    }
    default:
      throw new Error("bad function");
  }
}

function firstArg(args: number[]): number {
  return args[0] ?? 0;
}
