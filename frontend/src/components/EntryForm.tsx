import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, todayDisplay } from "../dateFormat";
import { labelPlaceholder } from "../labelPlaceholder";

interface RowState {
  label: string;
  value: string;
}

interface EntryFormProps {
  data: Bootstrap;
  onSaved: (data: Bootstrap) => void;
  onManage: (kind: "names" | "labels" | "values") => void;
}

function emptyRow(): RowState {
  return { label: "", value: "" };
}

export function EntryForm({ data, onSaved, onManage }: EntryFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayDisplay());
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<RowState[]>([emptyRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setName("");
    setNotes("");
    setDate(todayDisplay());
    setRows([emptyRow()]);
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const parsed = rows
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.value);
      const result = await api.createEntry({
        exercise: name,
        workout_date: displayToIso(date),
        notes,
        rows: parsed,
      });
      onSaved(result);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <h2 className="card-title">Log Entry</h2>
      {error && <div className="error-banner">{error}</div>}
      <p className="hint">Type any name, label, or value — suggestions appear from your history.</p>

      <div className="form-grid">
        <div className="field">
          <ComboInput
            label="Name"
            value={name}
            options={data.dropdown_names}
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

      <div className="rows-header">
        <span>Label</span>
        <span>Value</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div className="row-line" key={i}>
          <SuggestionInput
            value={row.label}
            options={data.dropdown_set_labels}
            onChange={(label) => updateRow(i, { label })}
            placeholder={labelPlaceholder(i)}
          />
          <SuggestionInput
            value={row.value}
            options={data.dropdown_values}
            onChange={(value) => updateRow(i, { value })}
            placeholder="10 reps"
          />
          <button type="button" className="btn btn-ghost btn-danger" onClick={() => removeRow(i)}>
            Remove
          </button>
        </div>
      ))}

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={addRow}>
          + Add row
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onManage("labels")}>
          Manage labels
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onManage("values")}>
          Manage values
        </button>
        <button type="button" className="btn btn-accent" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </section>
  );
}
