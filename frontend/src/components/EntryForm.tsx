import { useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";
import { DateInput } from "./DateInput";
import { SuggestionInput } from "./SuggestionInput";
import { displayToIso, resolveEntryDraftDate, todayDisplay, todayIso } from "../dateFormat";
import { clearEntryDraft, loadUiSlice, saveUiSlice, type EntryDraft } from "../uiState";

interface EntryFormProps {
  data: Bootstrap;
  onSaved: (data: Bootstrap) => void;
  onManage: (kind: "names" | "values" | "notes") => void;
}

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

export function EntryForm({ data, onSaved, onManage }: EntryFormProps) {
  const profile = data.active_profile;
  const dropdownNames = useMemo(() => data.dropdown_names, [data.dropdown_names]);
  const dropdownValues = useMemo(() => data.dropdown_values, [data.dropdown_values]);
  const dropdownNotes = useMemo(() => data.dropdown_notes, [data.dropdown_notes]);
  const [initial] = useState(() => initialDraft(profile));
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [value, setValue] = useState(initial.value);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const draftRef = useRef({ name, date, value, notes });

  useEffect(() => {
    draftRef.current = { name, date, value, notes };
  }, [name, date, value, notes]);

  useEffect(() => {
    saveUiSlice(profile, {
      entryDraftDay: todayIso(),
      entryDraft: { name, date, value, notes },
    });
  }, [profile, name, date, value, notes]);

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

  const reset = () => {
    const draft = freshDraft();
    setName(draft.name);
    setNotes(draft.notes);
    setDate(draft.date);
    setValue(draft.value);
    clearEntryDraft(profile, draft);
  };

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
      const result = await api.createEntry({
        exercise: name,
        entry_date: displayToIso(date),
        value: value.trim(),
        notes,
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
      <p className="hint">Type any name, value, or note — suggestions appear from your history.</p>

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

      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="entry-value">Value</label>
        <SuggestionInput
          id="entry-value"
          value={value}
          options={dropdownValues}
          onChange={setValue}
          placeholder="10 reps"
        />
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => onManage("values")}>
            Manage values
          </button>
        </div>
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
