import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAIN_OPERATORS,
  FORMULA_PRESETS,
  MAX_CHAIN_INPUTS,
  MIN_CHAIN_INPUTS,
  OPERATOR_LABELS,
  OPERATOR_SYMBOLS,
  PRESET_LABELS,
  buildChainExpr,
  chainOpAt,
  clampInputCount,
  explainFormula,
  extractNumbers,
  formulaForName,
  formulaLabel,
  formulaSpecsEqual,
  formatFormulaExpr,
  isValidExpr,
  parseChainExpr,
  resolveNumericValue,
  variableName,
  type ChainOperator,
  type FormulaPreset,
  type FormulaSpec,
  type ValueFormulasConfig,
} from "../data/valueFormulas";

const BUILD_MODE = "build";
const CUSTOM_MODE = "custom";

type EditorMode = FormulaPreset | typeof BUILD_MODE | typeof CUSTOM_MODE;

const INITIAL_OPERATOR: ChainOperator = "+";

function specToMode(spec: FormulaSpec): EditorMode {
  if (typeof spec === "object") {
    return parseChainExpr(spec.expr) ? BUILD_MODE : CUSTOM_MODE;
  }
  return spec;
}

interface ValueFormulaEditorProps {
  name: string;
  config: ValueFormulasConfig;
  sampleValue?: string;
  onChange: (name: string, spec: FormulaSpec) => void;
  onSetDefault?: (spec: FormulaSpec) => void;
}

/** Debounces parent updates so typing or rapid clicks make one save. */
function useDebouncedEmit<T>(delay: number, emit: (value: T) => void) {
  const pending = useRef<T | null>(null);
  const timer = useRef<number | null>(null);
  const emitRef = useRef(emit);
  emitRef.current = emit;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (value: T) => {
      pending.current = value;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        const next = pending.current;
        pending.current = null;
        if (next !== null) emitRef.current(next);
      }, delay);
    },
    [delay],
  );
}

export function ValueFormulaEditor({
  name,
  config,
  sampleValue = "",
  onChange,
  onSetDefault,
}: ValueFormulaEditorProps) {
  const current = formulaForName(config, name);
  const initialChain = useMemo(
    () => (typeof current === "object" ? parseChainExpr(current.expr) : null),
    [],
  );

  const [mode, setMode] = useState<EditorMode>(() => specToMode(current));
  const [count, setCount] = useState(() => clampInputCount(initialChain?.count ?? MIN_CHAIN_INPUTS));
  const [operators, setOperators] = useState<ChainOperator[]>(
    () => initialChain?.operators ?? [INITIAL_OPERATOR],
  );
  const [expr, setExpr] = useState(() => (typeof current === "object" ? current.expr : "a + b"));
  const [previewInput, setPreviewInput] = useState(sampleValue);

  const hasOverride = name in config.by_name;
  const defaultSpec = config.default;

  const chainExpr = useMemo(() => buildChainExpr(operators, count), [operators, count]);

  const activeSpec: FormulaSpec =
    mode === BUILD_MODE
      ? { expr: chainExpr }
      : mode === CUSTOM_MODE
        ? { expr }
        : (mode as FormulaPreset);

  const emit = useDebouncedEmit<FormulaSpec>(250, (spec) => onChange(name, spec));

  const numbers = useMemo(() => extractNumbers(previewInput), [previewInput]);
  const customValid = mode !== CUSTOM_MODE || isValidExpr(expr);
  const result = useMemo(
    () => (customValid ? resolveNumericValue(previewInput, activeSpec) : 0),
    [previewInput, activeSpec, customValid],
  );
  const substituted = useMemo(() => {
    if (!customValid) return "";
    if (mode === BUILD_MODE) return explainFormula(chainExpr, numbers);
    if (mode === CUSTOM_MODE) return explainFormula(expr, numbers);
    return "";
  }, [customValid, mode, chainExpr, expr, numbers]);

  const mixedOperators = useMemo(() => {
    if (mode !== BUILD_MODE) return false;
    const used = new Set(operators.slice(0, Math.max(0, count - 1)));
    return used.size > 1;
  }, [mode, operators, count]);

  const changeMode = (next: EditorMode) => {
    setMode(next);
    if (next === BUILD_MODE) {
      emit({ expr: chainExpr });
    } else if (next === CUSTOM_MODE) {
      const nextExpr = !expr.trim() ? chainExpr : expr;
      setExpr(nextExpr);
      emit({ expr: nextExpr });
    } else {
      emit(next);
    }
  };

  const setInputCount = (next: number) => {
    const clamped = clampInputCount(next);
    setCount(clamped);
    const nextOps: ChainOperator[] = [];
    for (let i = 0; i < clamped - 1; i += 1) {
      nextOps.push(operators[i] ?? operators[operators.length - 1] ?? INITIAL_OPERATOR);
    }
    setOperators(nextOps);
    emit({ expr: buildChainExpr(nextOps, clamped) });
  };

  const setOperatorAt = (index: number, op: ChainOperator) => {
    const nextOps = operators.map((existing, i) => (i === index ? op : existing));
    setOperators(nextOps);
    emit({ expr: buildChainExpr(nextOps, count) });
  };

  const setAllOperators = (op: ChainOperator) => {
    const nextOps = Array.from({ length: Math.max(0, count - 1) }, () => op);
    setOperators(nextOps);
    emit({ expr: buildChainExpr(nextOps, count) });
  };

  const setCustomExpr = (next: string) => {
    setExpr(next);
    if (isValidExpr(next)) emit({ expr: next });
  };

  const resetToDefault = () => {
    setMode(specToMode(defaultSpec));
    if (typeof defaultSpec === "object") {
      setExpr(defaultSpec.expr);
      const chain = parseChainExpr(defaultSpec.expr);
      if (chain) {
        setCount(chain.count);
        setOperators(chain.operators);
      }
    }
    onChange(name, defaultSpec);
  };

  const totalGaps = Math.max(0, count - 1);

  return (
    <div className="formula-editor">
      <label htmlFor={`formula-mode-${name}`}>Equation for {name}</label>
      <select
        id={`formula-mode-${name}`}
        className="total-calc-select"
        value={mode}
        onChange={(e) => changeMode(e.target.value as EditorMode)}
      >
        <optgroup label="Quick picks">
          {FORMULA_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {PRESET_LABELS[preset]}
            </option>
          ))}
        </optgroup>
        <optgroup label="Equation">
          <option value={BUILD_MODE}>Build an equation…</option>
          <option value={CUSTOM_MODE}>Custom expression…</option>
        </optgroup>
      </select>

      {mode === BUILD_MODE ? (
        <div className="formula-builder">
          <div className="formula-builder-head">
            <span className="formula-builder-label">Inputs</span>
            <div className="formula-stepper" role="group" aria-label="Number of inputs">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setInputCount(count - 1)}
                disabled={count <= MIN_CHAIN_INPUTS}
                aria-label="Fewer inputs"
              >
                −
              </button>
              <span className="formula-stepper-value">{count}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setInputCount(count + 1)}
                disabled={count >= MAX_CHAIN_INPUTS}
                aria-label="More inputs"
              >
                +
              </button>
            </div>
            <label className="formula-all-ops" htmlFor={`formula-all-ops-${name}`}>
              Operator
              <select
                id={`formula-all-ops-${name}`}
                className="total-calc-select"
                value={operators[0] ?? INITIAL_OPERATOR}
                onChange={(e) => setAllOperators(e.target.value as ChainOperator)}
              >
                {CHAIN_OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="formula-op-row">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className="formula-term">
                <span className="formula-var-chip" title={`Input ${i + 1}`}>
                  {variableName(i)}
                </span>
                {i < totalGaps ? (
                  <select
                    className="formula-op-select"
                    aria-label={`Operator between input ${i + 1} and ${i + 2}`}
                    value={chainOpAt(operators, i)}
                    onChange={(e) => setOperatorAt(i, e.target.value as ChainOperator)}
                  >
                    {CHAIN_OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_SYMBOLS[op]}
                      </option>
                    ))}
                  </select>
                ) : null}
              </span>
            ))}
          </div>

          <p className="formula-equation">
            {name} = <code>{formatFormulaExpr(chainExpr)}</code>
          </p>
          <p className="formula-hint">
            Inputs are the numbers found in the entry, in order. Logged value "3 sets of 10" means
            a=3, b=10.
          </p>
          {mixedOperators ? (
            <p className="formula-hint">
              × ÷ ^ % are applied before + −. Use Custom expression for parentheses.
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === CUSTOM_MODE ? (
        <>
          <label htmlFor={`formula-expr-${name}`} style={{ marginTop: 10 }}>
            Expression using <code>a</code>, <code>b</code>, … for numbers in order
          </label>
          <input
            id={`formula-expr-${name}`}
            className="formula-input"
            value={expr}
            onChange={(e) => setCustomExpr(e.target.value)}
            placeholder="a * b"
            spellCheck={false}
          />
          <div className="formula-insert-row">
            {["a", "b", "c", "d", "+", "-", "*", "/", "^", "%", "(", ")", ",", "avg(", "min(", "max(", "round("].map(
              (token) => (
                <button
                  key={token}
                  type="button"
                  className="btn btn-ghost formula-insert-btn"
                  onClick={() => setCustomExpr(`${expr}${token}`)}
                >
                  {token}
                </button>
              ),
            )}
          </div>
          {!customValid ? (
            <p className="formula-error">Check the expression — only numbers, a–z, + − × ÷ ^ % ( ) are allowed.</p>
          ) : null}
        </>
      ) : null}

      <label htmlFor={`formula-preview-${name}`} style={{ marginTop: 10 }}>
        Test with a sample value
      </label>
      <input
        id={`formula-preview-${name}`}
        value={previewInput}
        onChange={(e) => setPreviewInput(e.target.value)}
        placeholder="e.g. 3 sets of 10"
      />
      <p className="formula-numbers">
        {numbers.length === 0
          ? "No numbers in this sample — result is 0."
          : `Numbers found: ${numbers
              .slice(0, MAX_CHAIN_INPUTS)
              .map((n, i) => `${variableName(i)}=${n}`)
              .join(", ")}`}
        {numbers.length > MAX_CHAIN_INPUTS
          ? ` (+${numbers.length - MAX_CHAIN_INPUTS} more ignored)`
          : ""}
      </p>
      <p className={customValid ? "formula-preview" : "formula-error"}>
        {customValid
          ? `${substituted ? `${substituted} = ` : ""}${result}`
          : "Fix the expression to preview."}{" "}
        · active: {formulaLabel(activeSpec)}
      </p>

      <div className="btn-row formula-actions">
        {onSetDefault && !formulaSpecsEqual(activeSpec, defaultSpec) ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onSetDefault(activeSpec)}
          >
            Use for all names
          </button>
        ) : null}
        {hasOverride ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetToDefault}>
            Reset {name}
          </button>
        ) : null}
      </div>
    </div>
  );
}
