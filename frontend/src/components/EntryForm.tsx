import { useEffect, useMemo, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, todayDisplay } from "../dateFormat";
import { labelPlaceholder } from "../labelPlaceholder";
import { clearEntryDraft, loadUiSlice, saveUiSlice, type EntryDraftRow } from "../uiState";

interface EntryFormProps {
  data: Bootstrap;
  onSaved: (data: Bootstrap) => void;
  onManage: (kind: "names" | "labels" | "values") => void;
}

function emptyRow(): EntryDraftRow {
  return { label: "", value: "" };
}

function initialDraft(profile: string) {
  const saved = loadUiSlice(profile).entryDraft;
  return {
    name: saved?.name ?? "",
    date: saved?.date || todayDisplay(),
    notes: saved?.notes ?? "",
    rows: saved?.rows?.length ? saved.rows : [emptyRow()],
  };
}

function freshDraft() {
  return {
    name: "",
    date: todayDisplay(),
    notes: "",
    rows: [emptyRow()],
  };
}

export function EntryForm({ data, onSaved, onManage }: EntryFormProps) {
  const profile = data.active_profile;
  const dropdownNames = useMemo(() => data.dropdown_names, [data.dropdown_names]);
  const dropdownLabels = useMemo(() => data.dropdown_set_labels, [data.dropdown_set_labels]);
  const dropdownValues = useMemo(() => data.dropdown_values, [data.dropdown_values]);
  const [initial] = useState(() => initialDraft(profile));
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [notes, setNotes] = useState(initial.notes);
  const [rows, setRows] = useState<EntryDraftRow[]>(initial.rows);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    saveUiSlice(profile, { entryDraft: { name, date, notes, rows } });
  }, [profile, name, date, notes, rows]);

  const updateRow = (index: number, patch: Partial<EntryDraftRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    const draft = freshDraft();
    setName(draft.name);
    setNotes(draft.notes);
    setDate(draft.date);
    setRows(draft.rows);
    clearEntryDraft(profile, draft);
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
        entry_date: displayToIso(date),
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

      <div className="rows-header">
        <span>Label</span>
        <span>Value</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div className="row-line" key={i}>
          <SuggestionInput
            value={row.label}
            options={dropdownLabels}
            onChange={(label) => updateRow(i, { label })}
            placeholder={labelPlaceholder(i)}
          />
          <SuggestionInput
            value={row.value}
            options={dropdownValues}
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
