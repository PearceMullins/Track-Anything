import { beforeEach, describe, expect, it } from "vitest";
import { localCreateEntry, localFetchBootstrap } from "./localApi";

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
