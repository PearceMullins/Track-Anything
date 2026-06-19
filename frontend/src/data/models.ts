/** Client-side data models mirroring models.py for offline / Android builds. */

export const NAME_SUGGESTIONS = [
  "Calories",
  "Body Weight",
  "Pushups",
  "Pullups",
  "Running",
] as const;

export const VALUE_SUGGESTIONS = [
  "10 reps",
  "5 reps",
  "20 reps",
  "3 miles",
  "30 minutes",
  "200 lbs",
  "150 lbs",
] as const;

export const NOTE_SUGGESTIONS = [
  "Morning",
  "Evening",
  "Felt good",
  "PR day",
] as const;

export interface TrackEntry {
  exercise: string;
  entry_date: string;
  value: string;
  notes: string;
  logged_at: string;
}

export function normalizeExerciseName(name: string): string {
  return name.trim().split(/\s+/).join(" ");
}

export function normalizeValueText(value: string): string {
  return value.trim().split(/\s+/).join(" ");
}

export function normalizeNoteText(note: string): string {
  return note.trim();
}

export function canonicalNoteText(note: string): string {
  const normalized = normalizeNoteText(note);
  const lower = normalized.toLowerCase();
  for (const suggestion of NOTE_SUGGESTIONS) {
    if (suggestion.toLowerCase() === lower) return suggestion;
  }
  return normalized;
}

export function canonicalValueText(value: string): string {
  const normalized = normalizeValueText(value);
  const lower = normalized.toLowerCase();
  for (const suggestion of VALUE_SUGGESTIONS) {
    if (suggestion.toLowerCase() === lower) return suggestion;
  }
  return normalized;
}

export function parseNumericValue(text: string): number {
  const match = text.match(/[-+]?\d*\.?\d+/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : 0;
}

function coerceValueText(raw: unknown, unit: string): string {
  if (typeof raw === "string") return normalizeValueText(raw);
  const number = Number(raw);
  const text = number === Math.trunc(number) ? String(Math.trunc(number)) : String(number);
  return unit ? `${text} ${unit}` : text;
}

function migrateLegacyEntry(data: Record<string, unknown>, entry_date: string): TrackEntry {
  const unit = String(data.unit ?? "").trim();
  const rawValues = (data.set_values as unknown[]) ?? [];
  const setValues = rawValues.map((v) => coerceValueText(v, unit));
  const setLabels = (data.set_labels as string[] | undefined) ?? [];
  const value = setValues[0]
    ? canonicalValueText(normalizeValueText(setValues[0]))
    : "";
  let notes = String(data.notes ?? "");
  if (setValues.length > 1) {
    const extra = setValues
      .slice(1)
      .map((v, i) => {
        const label = setLabels[i + 1]?.trim() || `Row ${i + 2}`;
        return `${label}: ${v}`;
      })
      .join("; ");
    notes = notes ? `${notes}\n${extra}` : extra;
  }
  return {
    exercise: String(data.exercise),
    entry_date,
    value,
    notes,
    logged_at: String(data.logged_at ?? ""),
  };
}

export function entryFromDict(data: Record<string, unknown>): TrackEntry {
  const entry_date = String(data.entry_date ?? data.workout_date ?? "");
  if (typeof data.value === "string" && data.value.trim()) {
    return {
      exercise: String(data.exercise),
      entry_date,
      value: canonicalValueText(normalizeValueText(data.value)),
      notes: String(data.notes ?? ""),
      logged_at: String(data.logged_at ?? ""),
    };
  }
  if (Array.isArray(data.set_values) && data.set_values.length > 0) {
    return migrateLegacyEntry(data, entry_date);
  }
  return {
    exercise: String(data.exercise),
    entry_date,
    value: "",
    notes: String(data.notes ?? ""),
    logged_at: String(data.logged_at ?? ""),
  };
}

export function entryNumericValue(entry: TrackEntry): number {
  return parseNumericValue(entry.value);
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loggedAtForEntryDate(entryDate: string): string {
  const picked = new Date(`${entryDate}T00:00:00`);
  const today = new Date();
  const sameDay =
    picked.getFullYear() === today.getFullYear() &&
    picked.getMonth() === today.getMonth() &&
    picked.getDate() === today.getDate();
  if (sameDay) {
    const t = today.toTimeString().slice(0, 8);
    return `${entryDate}T${t}`;
  }
  return `${entryDate}T12:00:00`;
}
