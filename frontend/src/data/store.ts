/** LocalStorage-backed store for Capacitor / offline Android builds. */

import {
  NAME_SUGGESTIONS,
  VALUE_SUGGESTIONS,
  NOTE_SUGGESTIONS,
  TrackEntry,
  entryFromDict,
  normalizeExerciseName,
  normalizeValueText,
  normalizeNoteText,
  canonicalValueText,
  canonicalNoteText,
  parseNumericValue,
} from "./models";

const STORAGE_KEY = "track_anything_data";

export interface PersistedPayload {
  entries: TrackEntry[];
  hidden_names: string[];
  custom_names: string[];
  hidden_values: string[];
  custom_values: string[];
  hidden_notes: string[];
  custom_notes: string[];
}

export function emptyPayload(): PersistedPayload {
  return {
    entries: [],
    hidden_names: [],
    custom_names: [],
    hidden_values: [],
    custom_values: [],
    hidden_notes: [],
    custom_notes: [],
  };
}

function chartDatetime(entryDate: string, sameDayIndex: number): Date {
  const base = new Date(`${entryDate}T12:00:00`);
  base.setMinutes(base.getMinutes() + sameDayIndex * 30);
  return base;
}

export class LocalTrackStore {
  private payload: PersistedPayload = emptyPayload();
  private autosave: boolean;
  private persistHandler: ((payload: PersistedPayload) => void) | null = null;
  private listCache: {
    exercises?: string[];
    names?: string[];
    values?: string[];
    notes?: string[];
  } = {};

  constructor(options?: { autosave?: boolean }) {
    this.autosave = options?.autosave !== false;
    if (this.autosave) {
      this.load();
    }
  }

  setPersistHandler(handler: ((payload: PersistedPayload) => void) | null): void {
    this.persistHandler = handler;
    this.autosave = false;
  }

  toPayload(): PersistedPayload {
    return JSON.parse(JSON.stringify(this.payload)) as PersistedPayload;
  }

  clonePayload(): PersistedPayload {
    return this.toPayload();
  }

  loadPayload(raw: PersistedPayload): void {
    const changed = this.loadFromRaw(raw);
    this.bustListCache();
    if (changed) this.save();
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.payload = emptyPayload();
      return;
    }
    const parsed = JSON.parse(raw) as PersistedPayload & { profiles?: unknown };
    if (parsed.profiles) {
      this.payload = emptyPayload();
      return;
    }
    this.loadFromRaw(parsed as PersistedPayload);
  }

  private loadFromRaw(parsed: PersistedPayload): boolean {
    this.payload = {
      ...emptyPayload(),
      entries: (parsed.entries ?? []).map((e) =>
        entryFromDict(e as unknown as Record<string, unknown>),
      ),
      hidden_names: (parsed.hidden_names ?? []).map(normalizeExerciseName),
      custom_names: (parsed.custom_names ?? []).map(normalizeExerciseName),
      hidden_values: (parsed.hidden_values ?? []).map(normalizeValueText),
      custom_values: (parsed.custom_values ?? []).map((v) =>
        canonicalValueText(normalizeValueText(v)),
      ),
      hidden_notes: (parsed.hidden_notes ?? []).map(normalizeNoteText),
      custom_notes: (parsed.custom_notes ?? []).map((n) =>
        canonicalNoteText(normalizeNoteText(n)),
      ),
    };
    return this.backfillLoggedAt();
  }

  save(): void {
    this.bustListCache();
    if (this.autosave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.payload));
    }
    this.persistHandler?.(this.toPayload());
  }

  private bustListCache(): void {
    this.listCache = {};
  }

  get entries(): TrackEntry[] {
    return [...this.payload.entries];
  }

  add(entry: TrackEntry): void {
    this.payload.entries.push(entry);
    this.rememberEntryLists(entry);
    this.save();
  }

  delete(index: number): void {
    if (index >= 0 && index < this.payload.entries.length) {
      this.payload.entries.splice(index, 1);
      this.save();
    }
  }

  deleteEntries(indices: number[]): void {
    const toRemove = new Set(indices.filter((i) => i >= 0 && i < this.payload.entries.length));
    if (toRemove.size === 0) return;
    this.payload.entries = this.payload.entries.filter((_, i) => !toRemove.has(i));
    this.save();
  }

  update(index: number, entry: TrackEntry): void {
    if (index < 0 || index >= this.payload.entries.length) return;
    if (!entry.logged_at) {
      entry.logged_at = this.payload.entries[index].logged_at;
    }
    this.payload.entries[index] = entry;
    this.payload.hidden_names = this.payload.hidden_names.filter(
      (n) => n !== normalizeExerciseName(entry.exercise),
    );
    this.rememberEntryLists(entry);
    this.save();
  }

  exerciseNames(): string[] {
    if (this.listCache.exercises) return this.listCache.exercises;
    const names = new Set(this.payload.entries.map((e) => e.exercise));
    const result = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    this.listCache.exercises = result;
    return result;
  }

  dropdownNames(): string[] {
    if (this.listCache.names) return this.listCache.names;
    const names = new Set(this.exerciseNames());
    this.payload.custom_names.forEach((n) => names.add(n));
    NAME_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_names.includes(s)) names.add(s);
    });
    this.payload.hidden_names.forEach((n) => names.delete(n));
    const result = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    this.listCache.names = result;
    return result;
  }

  dropdownValues(): string[] {
    if (this.listCache.values) return this.listCache.values;
    const values = new Set(this.usedValues());
    this.payload.custom_values.forEach((v) => values.add(v));
    VALUE_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_values.includes(s)) values.add(s);
    });
    this.payload.hidden_values.forEach((v) => values.delete(v));
    const result = [...values]
      .map((v) => canonicalValueText(v))
      .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    this.listCache.values = result;
    return result;
  }

  hiddenValues(): string[] {
    return [...new Set(this.payload.hidden_values.map((v) => canonicalValueText(v)).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }

  dropdownNotes(): string[] {
    if (this.listCache.notes) return this.listCache.notes;
    const notes = new Set(this.usedNotes());
    this.payload.custom_notes.forEach((n) => notes.add(n));
    NOTE_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_notes.includes(s)) notes.add(s);
    });
    this.payload.hidden_notes.forEach((n) => notes.delete(n));
    const result = [...notes]
      .map((n) => canonicalNoteText(n))
      .filter((n, i, arr) => arr.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    this.listCache.notes = result;
    return result;
  }

  hiddenNotes(): string[] {
    return [...new Set(this.payload.hidden_notes.map((n) => canonicalNoteText(n)).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }

  renameName(oldName: string, newName: string): void {
    const old = normalizeExerciseName(oldName);
    const neu = normalizeExerciseName(newName);
    if (!neu) throw new Error("Name cannot be empty.");
    if (old === neu) return;
    let hadEntries = false;
    for (const entry of this.payload.entries) {
      if (entry.exercise === old) {
        entry.exercise = neu;
        hadEntries = true;
      }
    }
    this.payload.hidden_names = [...new Set([...this.payload.hidden_names, old])].filter(
      (n) => n !== neu,
    );
    this.payload.custom_names = this.payload.custom_names.filter((n) => n !== old);
    if (!hadEntries && !this.exerciseNames().includes(neu)) {
      this.payload.custom_names.push(neu);
    } else {
      this.payload.custom_names = this.payload.custom_names.filter((n) => n !== neu);
    }
    this.save();
  }

  removeName(name: string): void {
    const normalized = normalizeExerciseName(name);
    this.payload.entries = this.payload.entries.filter((e) => e.exercise !== normalized);
    this.payload.hidden_names = [...new Set([...this.payload.hidden_names, normalized])];
    this.payload.custom_names = this.payload.custom_names.filter((n) => n !== normalized);
    this.save();
  }

  removeNames(names: string[]): void {
    for (const name of names) {
      this.removeName(name);
    }
  }

  renameValue(oldValue: string, newValue: string): void {
    const old = normalizeValueText(oldValue);
    const neu = normalizeValueText(newValue);
    if (!neu) throw new Error("Value cannot be empty.");
    if (old === neu) return;
    let hadEntries = false;
    for (const entry of this.payload.entries) {
      if (normalizeValueText(entry.value) === old) {
        entry.value = neu;
        hadEntries = true;
      }
    }
    this.payload.hidden_values = [...new Set([...this.payload.hidden_values, old])].filter(
      (v) => v !== neu,
    );
    this.payload.custom_values = this.payload.custom_values.filter((v) => v !== old);
    if (!hadEntries && !this.usedValues().has(neu)) {
      this.payload.custom_values.push(neu);
    } else {
      this.payload.custom_values = this.payload.custom_values.filter((v) => v !== neu);
    }
    this.save();
  }

  removeValue(value: string): void {
    const normalized = normalizeValueText(value);
    this.payload.hidden_values = [...new Set([...this.payload.hidden_values, normalized])];
    this.payload.custom_values = this.payload.custom_values.filter((v) => v !== normalized);
    this.save();
  }

  removeValues(values: string[]): void {
    let changed = false;
    for (const value of values) {
      const normalized = normalizeValueText(value);
      if (!normalized) continue;
      this.payload.hidden_values = [...new Set([...this.payload.hidden_values, normalized])];
      this.payload.custom_values = this.payload.custom_values.filter((v) => v !== normalized);
      changed = true;
    }
    if (changed) this.save();
  }

  restoreValues(values: string[]): void {
    let changed = false;
    for (const value of values) {
      const normalized = normalizeValueText(value);
      if (!normalized) continue;
      this.payload.hidden_values = this.payload.hidden_values.filter((v) => v !== normalized);
      this.payload.custom_values = [...new Set([...this.payload.custom_values, canonicalValueText(normalized)])];
      changed = true;
    }
    if (changed) {
      this.bustListCache();
      this.save();
    }
  }

  renameNote(oldNote: string, newNote: string): void {
    const old = normalizeNoteText(oldNote);
    const neu = normalizeNoteText(newNote);
    if (!neu) throw new Error("Note cannot be empty.");
    if (old === neu) return;
    let hadEntries = false;
    for (const entry of this.payload.entries) {
      if (normalizeNoteText(entry.notes) === old) {
        entry.notes = neu;
        hadEntries = true;
      }
    }
    this.payload.hidden_notes = [...new Set([...this.payload.hidden_notes, old])].filter(
      (n) => n !== neu,
    );
    this.payload.custom_notes = this.payload.custom_notes.filter((n) => n !== old);
    if (!hadEntries && !this.usedNotes().has(neu)) {
      this.payload.custom_notes.push(neu);
    } else {
      this.payload.custom_notes = this.payload.custom_notes.filter((n) => n !== neu);
    }
    this.save();
  }

  removeNote(note: string): void {
    const normalized = normalizeNoteText(note);
    this.payload.hidden_notes = [...new Set([...this.payload.hidden_notes, normalized])];
    this.payload.custom_notes = this.payload.custom_notes.filter((n) => n !== normalized);
    this.save();
  }

  removeNotes(notes: string[]): void {
    let changed = false;
    for (const note of notes) {
      const normalized = normalizeNoteText(note);
      if (!normalized) continue;
      this.payload.hidden_notes = [...new Set([...this.payload.hidden_notes, normalized])];
      this.payload.custom_notes = this.payload.custom_notes.filter((n) => n !== normalized);
      changed = true;
    }
    if (changed) this.save();
  }

  restoreNotes(notes: string[]): void {
    let changed = false;
    for (const note of notes) {
      const normalized = normalizeNoteText(note);
      if (!normalized) continue;
      this.payload.hidden_notes = this.payload.hidden_notes.filter((n) => n !== normalized);
      this.payload.custom_notes = [...new Set([...this.payload.custom_notes, canonicalNoteText(normalized)])];
      changed = true;
    }
    if (changed) {
      this.bustListCache();
      this.save();
    }
  }

  historyPoints(exercise: string): { date: string; value: number }[] {
    const entries = this.payload.entries
      .filter((e) => e.exercise === exercise)
      .sort((a, b) => {
        const d = a.entry_date.localeCompare(b.entry_date);
        return d !== 0 ? d : (a.logged_at || "").localeCompare(b.logged_at || "");
      });
    const sameDay: Record<string, number> = {};
    return entries.map((entry) => {
      const idx = sameDay[entry.entry_date] ?? 0;
      sameDay[entry.entry_date] = idx + 1;
      const when = chartDatetime(entry.entry_date, idx);
      return { date: when.toISOString(), value: parseNumericValue(entry.value) };
    });
  }

  private rememberEntryLists(entry: TrackEntry): void {
    this.payload.hidden_names = this.payload.hidden_names.filter(
      (n) => n !== normalizeExerciseName(entry.exercise),
    );
    const n = normalizeValueText(entry.value);
    if (n) {
      this.payload.hidden_values = this.payload.hidden_values.filter((v) => v !== n);
    }
    const note = normalizeNoteText(entry.notes);
    if (note) {
      this.payload.hidden_notes = this.payload.hidden_notes.filter((item) => item !== note);
    }
  }

  private usedValues(): Set<string> {
    const values = new Set<string>();
    for (const entry of this.payload.entries) {
      const n = normalizeValueText(entry.value);
      if (n) values.add(n);
    }
    return values;
  }

  private usedNotes(): Set<string> {
    const notes = new Set<string>();
    for (const entry of this.payload.entries) {
      const n = normalizeNoteText(entry.notes);
      if (n) notes.add(n);
    }
    return notes;
  }

  private backfillLoggedAt(): boolean {
    let changed = false;
    const counts: Record<string, number> = {};
    for (const entry of this.payload.entries) {
      if (entry.logged_at) continue;
      const key = `${entry.exercise}|${entry.entry_date}`;
      const idx = counts[key] ?? 0;
      counts[key] = idx + 1;
      const base = new Date(`${entry.entry_date}T08:00:00`);
      base.setHours(base.getHours() + idx * 2);
      entry.logged_at = base.toISOString().slice(0, 19);
      changed = true;
    }
    return changed;
  }
}
