import { useState } from "react";
import type { Bootstrap, EntryRecord } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, isoToDisplay } from "../dateFormat";
import { labelPlaceholder } from "../labelPlaceholder";

interface RowState {
  label: string;
  value: string;
}

interface EditEntryModalProps {
  entry: EntryRecord;
  data: Bootstrap;
  onClose: () => void;
  onSaved: (data: Bootstrap) => void;
}

export function EditEntryModal({ entry, data, onClose, onSaved }: EditEntryModalProps) {
  const [name, setName] = useState(entry.exercise);
  const [date, setDate] = useState(isoToDisplay(entry.workout_date));
  const [notes, setNotes] = useState(entry.notes);
  const [rows, setRows] = useState<RowState[]>(
    entry.set_values.map((v, i) => ({
      label: entry.set_labels[i] ?? "",
      value: v,
    })),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const parsed = rows
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.value);
      const result = await api.updateEntry(entry.index, {
        exercise: name,
        workout_date: displayToIso(date),
        notes,
        logged_at: entry.logged_at,
        rows: parsed,
      });
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h2>Edit entry</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          <ComboInput
            label="Name"
            value={name}
            options={data.dropdown_names}
            onChange={setName}
            placeholder="Pushups"
          />
          <DateInput id="edit-date" value={date} onChange={setDate} />
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
            <button
              type="button"
              className="btn btn-ghost btn-danger"
              onClick={() => rows.length > 1 && setRows((p) => p.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="btn-row" style={{ margin: "12px 0" }}>
          <button type="button" className="btn" onClick={() => setRows((p) => [...p, { label: "", value: "" }])}>
            + Add row
          </button>
        </div>

        <div className="field">
          <label htmlFor="edit-notes">Notes</label>
          <textarea
            id="edit-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="btn-row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-accent" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
