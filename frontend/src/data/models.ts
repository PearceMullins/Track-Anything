/** Client-side data models mirroring models.py for offline / Android builds. */

export const NAME_SUGGESTIONS = [
  "Calories",
  "Body Weight",
  "Pushups",
  "Pullups",
  "Running",
] as const;

export const LABEL_SUGGESTIONS = [
  "first set",
  "second set",
  "third set",
  "Morning",
  "Evening",
  "Warm-up",
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

export interface WorkoutEntry {
  exercise: string;
  workout_date: string;
  set_values: string[];
  set_labels: string[];
  notes: string;
  logged_at: string;
  unit: string;
}

export function normalizeUnit(unit: string): string {
  return unit.trim().split(/\s+/).join(" ");
}

export function normalizeExerciseName(name: string): string {
  return name.trim().split(/\s+/).join(" ");
}

export function normalizeSetLabel(label: string): string {
  return label.trim().split(/\s+/).join(" ");
}

export function normalizeValueText(value: string): string {
  return value.trim().split(/\s+/).join(" ");
}

export function canonicalSetLabel(label: string): string {
  const normalized = normalizeSetLabel(label);
  const lower = normalized.toLowerCase();
  for (const suggestion of LABEL_SUGGESTIONS) {
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

export function alignSetLabels(labels: string[], count: number): string[] {
  const normalized = labels.map(normalizeSetLabel);
  while (normalized.length < count) normalized.push("");
  return normalized.slice(0, count);
}

function coerceValueText(raw: unknown, unit: string): string {
  if (typeof raw === "string") return normalizeValueText(raw);
  const number = Number(raw);
  const text = number === Math.trunc(number) ? String(Math.trunc(number)) : String(number);
  return unit ? `${text} ${unit}` : text;
}

export function entryFromDict(data: Record<string, unknown>): WorkoutEntry {
  const unit = normalizeUnit(String(data.unit ?? ""));
  const rawValues = data.set_values as unknown[];
  const set_values = rawValues.map((v) => coerceValueText(v, unit));
  const rawLabels = data.set_labels as string[] | undefined;
  const set_labels = alignSetLabels(
    rawLabels ? rawLabels.map(String) : [],
    set_values.length,
  );
  return {
    exercise: String(data.exercise),
    workout_date: String(data.workout_date),
    set_values: set_values.map((v) => canonicalValueText(normalizeValueText(v))),
    set_labels: set_labels.map(canonicalSetLabel),
    notes: String(data.notes ?? ""),
    logged_at: String(data.logged_at ?? ""),
    unit,
  };
}

export function entryVolume(entry: WorkoutEntry): number {
  return entry.set_values.reduce((sum, v) => sum + parseNumericValue(v), 0);
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loggedAtForWorkoutDate(workoutDate: string): string {
  const picked = new Date(`${workoutDate}T00:00:00`);
  const today = new Date();
  const sameDay =
    picked.getFullYear() === today.getFullYear() &&
    picked.getMonth() === today.getMonth() &&
    picked.getDate() === today.getDate();
  if (sameDay) {
    const t = today.toTimeString().slice(0, 8);
    return `${workoutDate}T${t}`;
  }
  return `${workoutDate}T12:00:00`;
}
