/** LocalStorage-backed store for Capacitor / offline Android builds. */

import {
  NAME_SUGGESTIONS,
  LABEL_SUGGESTIONS,
  VALUE_SUGGESTIONS,
  WorkoutEntry,
  entryFromDict,
  normalizeExerciseName,
  normalizeSetLabel,
  normalizeUnit,
  normalizeValueText,
  canonicalSetLabel,
  canonicalValueText,
  parseNumericValue,
} from "./models";

const STORAGE_KEY = "track_anything_data";

interface PersistedPayload {
  entries: WorkoutEntry[];
  hidden_names: string[];
  custom_names: string[];
  hidden_units: string[];
  custom_units: string[];
  hidden_set_labels: string[];
  custom_set_labels: string[];
  hidden_values: string[];
  custom_values: string[];
}

function emptyPayload(): PersistedPayload {
  return {
    entries: [],
    hidden_names: [],
    custom_names: [],
    hidden_units: [],
    custom_units: [],
    hidden_set_labels: [],
    custom_set_labels: [],
    hidden_values: [],
    custom_values: [],
  };
}

function chartDatetime(workoutDate: string, sameDayIndex: number): Date {
  const base = new Date(`${workoutDate}T12:00:00`);
  base.setMinutes(base.getMinutes() + sameDayIndex * 30);
  return base;
}

export class LocalWorkoutStore {
  private payload: PersistedPayload = emptyPayload();

  constructor() {
    this.load();
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.payload = emptyPayload();
      return;
    }
    const parsed = JSON.parse(raw) as PersistedPayload;
    this.payload = {
      ...emptyPayload(),
      ...parsed,
      entries: (parsed.entries ?? []).map((e) =>
        entryFromDict(e as unknown as Record<string, unknown>),
      ),
      hidden_names: (parsed.hidden_names ?? []).map(normalizeExerciseName),
      custom_names: (parsed.custom_names ?? []).map(normalizeExerciseName),
      hidden_units: (parsed.hidden_units ?? []).map(normalizeUnit),
      custom_units: (parsed.custom_units ?? []).map(normalizeUnit),
      hidden_set_labels: (parsed.hidden_set_labels ?? []).map(normalizeSetLabel),
      custom_set_labels: (parsed.custom_set_labels ?? []).map((l) =>
        canonicalSetLabel(normalizeSetLabel(l)),
      ),
      hidden_values: (parsed.hidden_values ?? []).map(normalizeValueText),
      custom_values: (parsed.custom_values ?? []).map((v) =>
        canonicalValueText(normalizeValueText(v)),
      ),
    };
    const changed = this.backfillLoggedAt();
    if (changed) this.save();
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.payload));
  }

  get entries(): WorkoutEntry[] {
    return [...this.payload.entries];
  }

  add(entry: WorkoutEntry): void {
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

  update(index: number, entry: WorkoutEntry): void {
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
    const names = new Set(this.payload.entries.map((e) => e.exercise));
    return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  dropdownNames(): string[] {
    const names = new Set(this.exerciseNames());
    this.payload.custom_names.forEach((n) => names.add(n));
    NAME_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_names.includes(s)) names.add(s);
    });
    this.payload.hidden_names.forEach((n) => names.delete(n));
    return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  dropdownSetLabels(): string[] {
    const labels = new Set(this.usedSetLabels());
    this.payload.custom_set_labels.forEach((l) => labels.add(l));
    LABEL_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_set_labels.includes(s)) labels.add(s);
    });
    this.payload.hidden_set_labels.forEach((l) => labels.delete(l));
    return [...labels]
      .map((l) => canonicalSetLabel(l))
      .filter((l, i, arr) => arr.findIndex((x) => x.toLowerCase() === l.toLowerCase()) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  dropdownValues(): string[] {
    const values = new Set(this.usedValues());
    this.payload.custom_values.forEach((v) => values.add(v));
    VALUE_SUGGESTIONS.forEach((s) => {
      if (!this.payload.hidden_values.includes(s)) values.add(s);
    });
    this.payload.hidden_values.forEach((v) => values.delete(v));
    return [...values]
      .map((v) => canonicalValueText(v))
      .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
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
    const before = this.payload.entries.length;
    this.payload.entries = this.payload.entries.filter((e) => e.exercise !== normalized);
    void (before - this.payload.entries.length);
    this.payload.hidden_names = [...new Set([...this.payload.hidden_names, normalized])];
    this.payload.custom_names = this.payload.custom_names.filter((n) => n !== normalized);
    this.save();
  }

  renameSetLabel(oldLabel: string, newLabel: string): void {
    const old = normalizeSetLabel(oldLabel);
    const neu = normalizeSetLabel(newLabel);
    if (!neu) throw new Error("Set label cannot be empty.");
    if (old === neu) return;
    let hadEntries = false;
    for (const entry of this.payload.entries) {
      entry.set_labels = entry.set_labels.map((l) => {
        if (normalizeSetLabel(l) === old) {
          hadEntries = true;
          return neu;
        }
        return l;
      });
    }
    this.payload.hidden_set_labels = [
      ...new Set([...this.payload.hidden_set_labels, old]),
    ].filter((l) => l !== neu);
    this.payload.custom_set_labels = this.payload.custom_set_labels.filter((l) => l !== old);
    if (!hadEntries && !this.usedSetLabels().has(neu)) {
      this.payload.custom_set_labels.push(neu);
    } else {
      this.payload.custom_set_labels = this.payload.custom_set_labels.filter((l) => l !== neu);
    }
    this.save();
  }

  removeSetLabel(label: string): void {
    const normalized = normalizeSetLabel(label);
    this.payload.hidden_set_labels = [...new Set([...this.payload.hidden_set_labels, normalized])];
    this.payload.custom_set_labels = this.payload.custom_set_labels.filter((l) => l !== normalized);
    this.save();
  }

  renameValue(oldValue: string, newValue: string): void {
    const old = normalizeValueText(oldValue);
    const neu = normalizeValueText(newValue);
    if (!neu) throw new Error("Value cannot be empty.");
    if (old === neu) return;
    let hadEntries = false;
    for (const entry of this.payload.entries) {
      entry.set_values = entry.set_values.map((v) => {
        if (normalizeValueText(v) === old) {
          hadEntries = true;
          return neu;
        }
        return v;
      });
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

  historyPoints(exercise: string): { date: string; total: number }[] {
    const entries = this.payload.entries
      .filter((e) => e.exercise === exercise)
      .sort((a, b) => {
        const d = a.workout_date.localeCompare(b.workout_date);
        return d !== 0 ? d : (a.logged_at || "").localeCompare(b.logged_at || "");
      });
    const sameDay: Record<string, number> = {};
    return entries.map((entry) => {
      const idx = sameDay[entry.workout_date] ?? 0;
      sameDay[entry.workout_date] = idx + 1;
      const when = chartDatetime(entry.workout_date, idx);
      const total = entry.set_values.reduce((s, v) => s + parseNumericValue(v), 0);
      return { date: when.toISOString(), total };
    });
  }

  private rememberEntryLists(entry: WorkoutEntry): void {
    this.payload.hidden_names = this.payload.hidden_names.filter(
      (n) => n !== normalizeExerciseName(entry.exercise),
    );
    for (const label of entry.set_labels) {
      const n = normalizeSetLabel(label);
      if (n) {
        this.payload.hidden_set_labels = this.payload.hidden_set_labels.filter((l) => l !== n);
      }
    }
    for (const value of entry.set_values) {
      const n = normalizeValueText(value);
      if (n) {
        this.payload.hidden_values = this.payload.hidden_values.filter((v) => v !== n);
      }
    }
  }

  private usedSetLabels(): Set<string> {
    const labels = new Set<string>();
    for (const entry of this.payload.entries) {
      for (const label of entry.set_labels) {
        const n = normalizeSetLabel(label);
        if (n) labels.add(n);
      }
    }
    return labels;
  }

  private usedValues(): Set<string> {
    const values = new Set<string>();
    for (const entry of this.payload.entries) {
      for (const value of entry.set_values) {
        const n = normalizeValueText(value);
        if (n) values.add(n);
      }
    }
    return values;
  }

  private backfillLoggedAt(): boolean {
    let changed = false;
    const counts: Record<string, number> = {};
    for (const entry of this.payload.entries) {
      if (entry.logged_at) continue;
      const key = `${entry.exercise}|${entry.workout_date}`;
      const idx = counts[key] ?? 0;
      counts[key] = idx + 1;
      const base = new Date(`${entry.workout_date}T08:00:00`);
      base.setHours(base.getHours() + idx * 2);
      entry.logged_at = base.toISOString().slice(0, 19);
      changed = true;
    }
    return changed;
  }
}

let singleton: LocalWorkoutStore | null = null;

export function getLocalStore(): LocalWorkoutStore {
  if (!singleton) singleton = new LocalWorkoutStore();
  return singleton;
}

export function resetLocalStoreForTests(): void {
  singleton = null;
}
