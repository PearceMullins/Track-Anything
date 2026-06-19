import { useState } from "react";
import type { Bootstrap, EntryRecord } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, isoToDisplay } from "../dateFormat";

interface EditEntryModalProps {
  entry: EntryRecord;
  data: Bootstrap;
  onClose: () => void;
  onSaved: (data: Bootstrap) => void;
}

export function EditEntryModal({ entry, data, onClose, onSaved }: EditEntryModalProps) {
  const [name, setName] = useState(entry.exercise);
  const [date, setDate] = useState(isoToDisplay(entry.entry_date));
  const [value, setValue] = useState(entry.value);
  const [notes, setNotes] = useState(entry.notes);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!value.trim()) {
      setError("Value is required.");
      return;
    }
    setSaving(true);
    try {
      const result = await api.updateEntry(entry.index, {
        exercise: name,
        entry_date: displayToIso(date),
        value: value.trim(),
        notes,
        logged_at: entry.logged_at,
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

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="edit-value">Value</label>
          <SuggestionInput
            id="edit-value"
            value={value}
            options={data.dropdown_values}
            onChange={setValue}
            placeholder="10 reps"
          />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="edit-notes">Notes (optional)</label>
          <SuggestionInput
            id="edit-notes"
            value={notes}
            options={data.dropdown_notes}
            onChange={setNotes}
            placeholder="Morning session"
            multiline
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
