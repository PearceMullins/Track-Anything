import { useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, resolveEntryDraftDate, todayDisplay, todayIso } from "../dateFormat";
import { clearEntryDraft, loadUiSlice, saveUiSlice, type EntryDraft } from "../uiState";
import { normalizeExerciseName } from "../data/models";
import {
  CHAIN_OPERATORS,
  MAX_CHAIN_INPUTS,
  MIN_CHAIN_INPUTS,
  OPERATOR_LABELS,
  OPERATOR_SYMBOLS,
  buildChainExpr,
  chainOpAt,
  clampInputCount,
  emptyValueFormulas,
  explainFormula,
  extractNumbers,
  formulaForName,
  formulaLabel,
  formulaSpecsEqual,
  parseChainExpr,
  resolveNumericValue,
  templateFromExpr,
  variableName,
  type ChainOperator,
  type FormulaSpec,
} from "../data/valueFormulas";

interface EntryFormProps {
  data: Bootstrap;
  onSaved: (data: Bootstrap, focus?: { name: string; entryIndex: number }) => void;
  onChange: (data: Bootstrap) => void;
  onManage: (kind: "names" | "values" | "notes") => void;
}

type EquationMode = "build" | "custom";

function initialDraft(profile: string): EntryDraft {
  const saved = loadUiSlice(profile);
  const draft = saved.entryDraft;
  return {
    name: draft?.name ?? "",
    date: resolveEntryDraftDate(draft?.date, saved.entryDraftDay),
    value: draft?.value ?? "",
    notes: draft?.notes ?? "",
  };
}

function freshDraft(): EntryDraft {
  return {
    name: "",
    date: todayDisplay(),
    value: "",
    notes: "",
  };
}

function emptyInputs(count: number): string[] {
  return Array.from({ length: count }, () => "");
}

function inputsFromDraft(raw: string): string[] {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  return parts.length > 0 ? parts : emptyInputs(MIN_CHAIN_INPUTS);
}

const CUSTOM_TOKENS = ["+", "-", "*", "/", "^", "%", "(", ")", "avg(", "min(", "max(", "round("];

export function EntryForm({ data, onSaved, onChange, onManage }: EntryFormProps) {
  const profile = data.active_profile;
  const dropdownNames = useMemo(() => data.dropdown_names, [data.dropdown_names]);
  const dropdownNotes = useMemo(() => data.dropdown_notes, [data.dropdown_notes]);
  const [initial] = useState(() => initialDraft(profile));
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [notes, setNotes] = useState(initial.notes);
  const [mode, setMode] = useState<EquationMode>("build");
  const [inputs, setInputs] = useState<string[]>(() => inputsFromDraft(initial.value));
  const [count, setCount] = useState(() =>
    clampInputCount(Math.max(MIN_CHAIN_INPUTS, inputs.length)),
  );
  const [operators, setOperators] = useState<ChainOperator[]>([]);
  const [customText, setCustomText] = useState(() => initial.value);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customTouched, setCustomTouched] = useState(false);
  const draftRef = useRef({ name, date, value: "", notes });

  const trimmedName = normalizeExerciseName(name);
  const formulas = data.value_formulas ?? emptyValueFormulas();
  const nameSpec = formulaForName(formulas, trimmedName);
  const nameChain = typeof nameSpec === "object" ? parseChainExpr(nameSpec.expr) : null;
  const specKey = `${trimmedName}|${JSON.stringify(nameSpec)}`;

  useEffect(() => {
    if (nameChain) {
      setMode("build");
      setCount(nameChain.count);
      setOperators(nameChain.operators);
      return;
    }
    if (nameSpec === "first_number") {
      setMode("build");
      setCount(MIN_CHAIN_INPUTS);
      setOperators([]);
      return;
    }
    setMode("custom");
    if (typeof nameSpec === "object") {
      setCustomText((prev) => (prev.trim() ? prev : nameSpec.expr));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  useEffect(() => {
    setInputs((prev) => Array.from({ length: count }, (_, i) => prev[i] ?? ""));
  }, [count]);

  const draftValue = useMemo(() => {
    if (mode === "custom") return customText;
    return inputs.filter((value) => value.trim() !== "").join(", ");
  }, [mode, customText, inputs]);

  useEffect(() => {
    draftRef.current = { name, date, value: draftValue, notes };
  }, [name, date, draftValue, notes]);

  useEffect(() => {
    saveUiSlice(profile, {
      entryDraftDay: todayIso(),
      entryDraft: { name, date, value: draftValue, notes },
    });
  }, [profile, name, date, draftValue, notes]);

  useEffect(() => {
    const syncDateForNewDay = () => {
      const today = todayIso();
      const savedDay = loadUiSlice(profile).entryDraftDay;
      if (savedDay === today) return;
      const next = todayDisplay();
      setDate(next);
      const draft = draftRef.current;
      saveUiSlice(profile, {
        entryDraftDay: today,
        entryDraft: { ...draft, date: next },
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") syncDateForNewDay();
    };

    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") syncDateForNewDay();
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [profile]);

  const chainExpr = useMemo(() => buildChainExpr(operators, count), [operators, count]);
  const numbers = useMemo(
    () => inputs.map((raw) => (raw.trim() === "" ? Number.NaN : Number(raw))),
    [inputs],
  );
  const customTemplate = useMemo(
    () => (mode === "custom" ? templateFromExpr(customText) : null),
    [mode, customText],
  );
  const customNumbers = useMemo(
    () => (mode === "custom" ? extractNumbers(customText) : []),
    [mode, customText],
  );

  const ready =
    mode === "custom"
      ? customTemplate !== null && customNumbers.length > 0
      : numbers.length > 0 && numbers.every((n) => Number.isFinite(n));
  const activeSpec: FormulaSpec =
    mode === "custom" && customTemplate
      ? { expr: customTemplate }
      : { expr: chainExpr };
  const valueText = useMemo(() => {
    if (!ready) return "";
    if (mode === "custom") return customText.trim().split(/\s+/).join(" ");
    return explainFormula(chainExpr, numbers as number[]);
  }, [ready, mode, customText, chainExpr, numbers]);
  const total = ready ? resolveNumericValue(valueText, activeSpec) : 0;

  const reset = () => {
    const draft = freshDraft();
    setName(draft.name);
    setNotes(draft.notes);
    setDate(draft.date);
    setMode("build");
    setInputs(emptyInputs(count));
    setCustomText("");
    setCustomTouched(false);
    clearEntryDraft(profile, draft);
  };

  const save = async () => {
    setError("");
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (mode === "build" && (numbers.length === 0 || !numbers.every((n) => Number.isFinite(n)))) {
      setError("Type a number in every input box.");
      return;
    }
    if (mode === "custom" && !ready) {
      setError("Enter an expression with at least one number, for example (3 + 5) * 2.");
      return;
    }
    setSaving(true);
    try {
      if (!formulaSpecsEqual(nameSpec, activeSpec)) {
        onChange(await api.setValueFormula(trimmedName, activeSpec));
      }
      const result = await api.createEntry({
        exercise: name,
        entry_date: displayToIso(date),
        value: valueText,
        notes,
      });
      const prevIndices = new Set(data.entries.map((entry) => entry.index));
      const added = result.entries.find((entry) => !prevIndices.has(entry.index));
      if (added) {
        onSaved(result, { name: added.exercise, entryIndex: added.index });
      } else {
        onSaved(result);
      }
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const setInputCount = (next: number) => {
    const clamped = clampInputCount(next);
    setCount(clamped);
    setOperators((prev) =>
      Array.from({ length: clamped - 1 }, (_, i) => prev[i] ?? prev[prev.length - 1] ?? "+"),
    );
  };

  const setOperatorAt = (index: number, op: ChainOperator) => {
    setOperators((prev) => {
      const next = Array.from({ length: Math.max(0, count - 1) }, (_, i) => chainOpAt(prev, i));
      next[index] = op;
      return next;
    });
  };

  const setAllOperators = (op: ChainOperator) => {
    setOperators(Array.from({ length: Math.max(0, count - 1) }, () => op));
  };

  const setInputAt = (index: number, raw: string) => {
    setInputs((prev) => prev.map((existing, i) => (i === index ? raw : existing)));
  };

  const switchMode = (next: EquationMode) => {
    if (next === mode) return;
    if (next === "custom" && !customTouched) {
      setCustomText(typeof nameSpec === "object" ? nameSpec.expr : "");
    }
    setMode(next);
  };

  return (
    <section className="card">
      <h2 className="card-title">Log Entry</h2>
      {error && <div className="error-banner">{error}</div>}
      <p className="hint">Type any name, then log the numbers for its equation.</p>

      <div className="form-grid">
        <div className="field">
          <ComboInput
            label="Name"
            value={name}
            options={dropdownNames}
            onChange={setName}
            placeholder="Pushups"
          />
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => onManage("names")}>
              Manage names
            </button>
          </div>
        </div>
        <DateInput id="entry-date" value={date} onChange={setDate} />
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Equation{trimmedName ? ` for ${trimmedName}` : ""}</label>

        <div className="segmented" role="group" aria-label="Equation style">
          <button
            type="button"
            className={mode === "build" ? "active" : ""}
            aria-pressed={mode === "build"}
            onClick={() => switchMode("build")}
          >
            Build an equation
          </button>
          <button
            type="button"
            className={mode === "custom" ? "active" : ""}
            aria-pressed={mode === "custom"}
            onClick={() => switchMode("custom")}
          >
            Custom expression
          </button>
        </div>

        {mode === "build" ? (
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
              {count > 1 ? (
                <label className="formula-all-ops">
                  Operator
                  <select
                    className="total-calc-select"
                    value={chainOpAt(operators, 0)}
                    onChange={(e) => setAllOperators(e.target.value as ChainOperator)}
                  >
                    {CHAIN_OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="formula-op-row">
              {Array.from({ length: count }, (_, i) => (
                <span key={i} className="formula-term">
                  <span className="formula-var-chip" title={`Input ${i + 1}`}>
                    {variableName(i)}
                  </span>
                  <input
                    className="formula-number-input"
                    inputMode="decimal"
                    aria-label={`Number for input ${i + 1}`}
                    value={inputs[i] ?? ""}
                    onChange={(e) => setInputAt(i, e.target.value)}
                    placeholder="0"
                  />
                  {i < count - 1 ? (
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
          </div>
        ) : (
          <div>
            <input
              id="entry-custom-equation"
              className="formula-input"
              value={customText}
              spellCheck={false}
              aria-label="Custom expression with numbers"
              placeholder="e.g. (3 + 5) * 2 or avg(3, 4)"
              onChange={(e) => {
                setCustomTouched(true);
                setCustomText(e.target.value);
              }}
            />
            <div className="formula-insert-row">
              {CUSTOM_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  className="btn btn-ghost formula-insert-btn"
                  onClick={() => {
                    setCustomTouched(true);
                    setCustomText((prev) => `${prev}${token}`);
                  }}
                >
                  {token}
                </button>
              ))}
            </div>
            <p className="formula-hint">
              Type the numbers straight into the expression.{" "}
              {customTemplate ? (
                <>
                  Saved for {trimmedName || "this name"} as <code>{customTemplate}</code>.
                </>
              ) : customText.trim() ? (
                "Add at least one number to save."
              ) : (
                "The numbers you type become this name's inputs."
              )}
            </p>
          </div>
        )}

        <p className="formula-equation">
          {ready ? (
            <>
              Saves as <code>{valueText}</code> · value <strong>{total}</strong> ·{" "}
              {formulaLabel(activeSpec)}
            </>
          ) : mode === "build" ? (
            "Fill in every input to see the value."
          ) : (
            "The expression is not ready yet."
          )}
        </p>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="notes">Notes (optional)</label>
        <SuggestionInput
          id="notes"
          value={notes}
          options={dropdownNotes}
          onChange={setNotes}
          placeholder="Morning session"
          multiline
        />
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => onManage("notes")}>
            Manage notes
          </button>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-accent" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>
    </section>
  );
}
