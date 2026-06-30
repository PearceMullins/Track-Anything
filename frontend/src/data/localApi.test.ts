import { beforeEach, describe, expect, it } from "vitest";
import {
  localCreateEntry,
  localExportData,
  localFetchBootstrap,
  localImportData,
  localRemoveNotes,
  localRemoveValues,
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
});
