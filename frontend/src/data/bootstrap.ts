/** Build API-shaped responses from the local store. */

import type { Bootstrap } from "../types";
import {
  TrackEntry,
  entryVolume,
  loggedAtForEntryDate,
  normalizeExerciseName,
  normalizeValueText,
} from "./models";
import { LocalTrackStore } from "./store";

export interface RowInput {
  label: string;
  value: string;
}

export interface EntryInput {
  exercise: string;
  entry_date?: string;
  workout_date?: string; // legacy alias
  rows: RowInput[];
  notes?: string;
  logged_at?: string;
}

function formatTotal(volume: number): string {
  return volume === Math.trunc(volume) ? String(Math.trunc(volume)) : String(volume);
}

export function buildBootstrap(
  store: LocalTrackStore,
  activeProfile: string,
  dropdownProfiles: string[],
): Bootstrap {
  const rawEntries = store.entries;
  const entries = new Array(rawEntries.length);
  const history_rows = new Array(rawEntries.length);

  for (let index = 0; index < rawEntries.length; index++) {
    const entry = rawEntries[index];
    const volume = entryVolume(entry);
    entries[index] = {
      index,
      ...entry,
      volume,
      set_count: entry.set_values.length,
    };
    history_rows[index] = {
      entry_index: index,
      entry_date: entry.entry_date,
      name: entry.exercise,
      labels: entry.set_labels.map((label) => label.trim() || "—"),
      values: entry.set_values,
      notes: entry.notes,
      total: volume,
      total_display: formatTotal(volume),
    };
  }

  return {
    entries,
    history_rows,
    dropdown_names: store.dropdownNames(),
    dropdown_set_labels: store.dropdownSetLabels(),
    dropdown_values: store.dropdownValues(),
    chart_names: store.exerciseNames(),
    active_profile: activeProfile,
    dropdown_profiles: dropdownProfiles,
  };
}

export function entryFromInput(data: EntryInput): TrackEntry {
  const exercise = normalizeExerciseName(data.exercise);
  if (!exercise) throw new Error("Name is required.");
  const set_values: string[] = [];
  const set_labels: string[] = [];
  for (const row of data.rows) {
    const value = normalizeValueText(row.value);
    const label = row.label.trim();
    if (!value) continue;
    if (!label) throw new Error("Each row needs a label.");
    set_labels.push(label);
    set_values.push(value);
  }
  if (!set_values.length) throw new Error("At least one value is required.");
  const entry_date = data.entry_date || data.workout_date;
  if (!entry_date) throw new Error("Date is required.");
  const logged_at = data.logged_at || loggedAtForEntryDate(entry_date);
  return {
    exercise,
    entry_date,
    set_values,
    set_labels,
    notes: (data.notes ?? "").trim(),
    logged_at,
    unit: "",
  };
}
