/** Build API-shaped responses from the local store. */

import type { Bootstrap } from "../types";
import {
  TrackEntry,
  entryNumericValue,
  loggedAtForEntryDate,
  normalizeExerciseName,
  normalizeValueText,
} from "./models";
import { LocalTrackStore } from "./store";

export interface EntryInput {
  exercise: string;
  entry_date?: string;
  workout_date?: string; // legacy alias
  value: string;
  notes?: string;
  logged_at?: string;
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
    const numeric_value = entryNumericValue(entry);
    entries[index] = {
      index,
      ...entry,
      numeric_value,
    };
    history_rows[index] = {
      entry_index: index,
      entry_date: entry.entry_date,
      name: entry.exercise,
      value: entry.value,
      notes: entry.notes,
    };
  }

  return {
    entries,
    history_rows,
    dropdown_names: store.dropdownNames(),
    dropdown_values: store.dropdownValues(),
    dropdown_notes: store.dropdownNotes(),
    hidden_values: store.hiddenValues(),
    hidden_notes: store.hiddenNotes(),
    chart_names: store.exerciseNames(),
    active_profile: activeProfile,
    dropdown_profiles: dropdownProfiles,
  };
}

export function entryFromInput(data: EntryInput): TrackEntry {
  const exercise = normalizeExerciseName(data.exercise);
  if (!exercise) throw new Error("Name is required.");
  const value = normalizeValueText(data.value);
  if (!value) throw new Error("Value is required.");
  const entry_date = data.entry_date || data.workout_date;
  if (!entry_date) throw new Error("Date is required.");
  const logged_at = data.logged_at || loggedAtForEntryDate(entry_date);
  return {
    exercise,
    entry_date,
    value,
    notes: (data.notes ?? "").trim(),
    logged_at,
  };
}
