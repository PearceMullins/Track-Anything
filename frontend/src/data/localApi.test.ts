import { beforeEach, describe, expect, it } from "vitest";
import { localCreateEntry, localFetchBootstrap } from "./localApi";

describe("local store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates entries offline", () => {
    localCreateEntry({
      exercise: "Pushups",
      workout_date: "2026-06-11",
      rows: [
        { label: "Set 1", value: "10 reps" },
        { label: "Set 2", value: "5 reps" },
      ],
      notes: "Morning",
    });
    const data = localFetchBootstrap();
    expect(data.entries).toHaveLength(1);
    expect(data.history_rows[0].total).toBe(15);
    expect(data.history_rows[0].labels).toEqual(["Set 1", "Set 2"]);
  });

  it("persists to localStorage", () => {
    localCreateEntry({
      exercise: "Running",
      workout_date: "2026-06-01",
      rows: [{ label: "Miles", value: "3 miles" }],
    });
    expect(localStorage.getItem("track_anything_p:Default")).toContain("Running");
    expect(localFetchBootstrap().entries[0].exercise).toBe("Running");
  });
});
