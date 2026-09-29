import { beforeEach, describe, expect, it } from "vitest";
import {
  localCreateEntry,
  localExportData,
  localFactoryReset,
  localFetchBootstrap,
  localImportData,
  localRemoveNotes,
  localRemoveValues,
  localSetDefaultValueFormula,
  localSetValueFormula,
  localSwitchProfile,
} from "./localApi";

describe("local store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates entries offline", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
      notes: "Morning",
    });
    const data = localFetchBootstrap();
    expect(data.entries).toHaveLength(1);
    expect(data.history_rows[0].value).toBe("10 reps");
    expect(data.history_rows[0].notes).toBe("Morning");
  });

  it("collects notes in dropdown after save", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
      notes: "Morning session",
    });
    const data = localFetchBootstrap();
    expect(data.dropdown_notes).toContain("Morning session");
  });

  it("persists to localStorage", () => {
    localCreateEntry({
      exercise: "Running",
      entry_date: "2026-06-01",
      value: "3 miles",
    });
    expect(localStorage.getItem("track_anything_p:Default")).toContain("Running");
    expect(localFetchBootstrap().entries[0].exercise).toBe("Running");
  });
});


describe("local backup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("permanently deletes values and notes", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
      notes: "Morning session",
    });

    let data = localRemoveValues(["10 reps"]);
    expect(data.dropdown_values).not.toContain("10 reps");
    expect(data.entries).toHaveLength(0);

    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
      notes: "Morning session",
    });

    data = localRemoveNotes(["Morning session"]);
    expect(data.dropdown_notes).not.toContain("Morning session");
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].notes).toBe("");
  });

  it("exports and imports all profiles", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
    });
    localSwitchProfile("Travel");
    localCreateEntry({
      exercise: "Walking",
      entry_date: "2026-06-12",
      value: "2 miles",
    });

    const backup = localExportData();
    localStorage.clear();
    const imported = localImportData(backup);

    expect(imported.active_profile).toBe("Travel");
    expect(imported.entries[0].exercise).toBe("Walking");
    localSwitchProfile("Default");
    expect(localFetchBootstrap().entries[0].exercise).toBe("Pushups");
  });

  it("persists value_formulas and applies to numeric_value", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "2 sets of 10",
    });
    let data = localFetchBootstrap();
    expect(data.value_formulas.default).toBe("first_number");
    expect(data.entries[0].numeric_value).toBe(2);

    data = localSetValueFormula("Pushups", "sum_numbers");
    expect(data.value_formulas.by_name.Pushups).toBe("sum_numbers");
    expect(data.entries[0].numeric_value).toBe(12);

    const raw = localStorage.getItem("track_anything_p:Default");
    expect(raw).toContain("sum_numbers");
  });

  it("applies a default equation to every name", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "2 sets of 10",
    });
    localCreateEntry({
      exercise: "Situps",
      entry_date: "2026-06-11",
      value: "4 sets of 10",
    });

    let data = localSetDefaultValueFormula({ expr: "a * b" });
    expect(data.value_formulas.default).toEqual({ expr: "a * b" });
    expect(data.entries.map((e) => e.numeric_value)).toEqual([20, 40]);

    data = localSetValueFormula("Situps", "sum_numbers");
    expect(data.entries.map((e) => e.numeric_value)).toEqual([20, 14]);

    data = localSetDefaultValueFormula("sum_numbers");
    expect(data.value_formulas.by_name.Situps).toBeUndefined();
    expect(data.entries.map((e) => e.numeric_value)).toEqual([12, 14]);
  });

  it("factory reset drops every profile and starts fresh", () => {
    localCreateEntry({
      exercise: "Pushups",
      entry_date: "2026-06-11",
      value: "10 reps",
    });
    localSetValueFormula("Pushups", "sum_numbers");
    localSwitchProfile("Travel");
    localCreateEntry({
      exercise: "Walking",
      entry_date: "2026-06-12",
      value: "3 miles",
    });

    const data = localFactoryReset();
    expect(data.active_profile).toBe("Default");
    expect(data.dropdown_profiles).toEqual(["Default"]);
    expect(data.entries).toEqual([]);
    expect(data.chart_names).toEqual([]);
    expect(data.dropdown_names).toEqual([]);
    expect(data.value_formulas).toEqual({ default: "first_number", by_name: {} });

    localSwitchProfile("Travel");
    expect(localFetchBootstrap().entries).toEqual([]);
    expect(localFetchBootstrap().value_formulas.default).toBe("first_number");
  });
});
