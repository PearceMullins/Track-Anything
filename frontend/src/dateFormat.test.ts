import { describe, expect, it } from "vitest";
import {
  displayToIso,
  isoToDisplay,
  isoToYearMonth,
  monthGridIso,
  resolveEntryDraftDate,
  shiftYearMonth,
  todayDisplay,
  todayIso,
  yearMonthLabel,
} from "./dateFormat";

describe("dateFormat", () => {
  it("converts ISO to MM/DD/YYYY", () => {
    expect(isoToDisplay("2026-06-11")).toBe("06/11/2026");
  });

  it("converts MM/DD/YYYY to ISO", () => {
    expect(displayToIso("06/11/2026")).toBe("2026-06-11");
  });

  it("rejects invalid display dates", () => {
    expect(() => displayToIso("13/40/2026")).toThrow("Invalid date.");
    expect(() => displayToIso("bad")).toThrow("Use MM/DD/YYYY format.");
  });

  it("today helpers stay in sync", () => {
    expect(isoToDisplay(todayIso())).toBe(todayDisplay());
  });

  it("rolls draft date forward when the calendar day changed", () => {
    expect(resolveEntryDraftDate("06/13/2026", "2026-06-13")).toBe(todayDisplay());
    expect(resolveEntryDraftDate("06/10/2026", todayIso())).toBe("06/10/2026");
    expect(resolveEntryDraftDate(undefined, todayIso())).toBe(todayDisplay());
  });

  it("reads the month from an ISO date", () => {
    expect(isoToYearMonth("2026-09-21")).toEqual({ year: 2026, month: 8 });
    expect(isoToYearMonth("bad")).toEqual(isoToYearMonth(todayIso()));
  });

  it("shifts months across year boundaries", () => {
    expect(shiftYearMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftYearMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("builds a six-week Sunday-first grid for a month", () => {
    const grid = monthGridIso({ year: 2026, month: 8 });
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-08-30");
    expect(new Date(`${grid[0]}T12:00:00`).getDay()).toBe(0);
    expect(grid).toContain("2026-09-01");
    expect(grid).toContain("2026-09-30");
    expect(grid[41]).toBe("2026-10-10");
  });

  it("labels the month for the calendar header", () => {
    expect(yearMonthLabel({ year: 2026, month: 8 })).toContain("2026");
    expect(yearMonthLabel({ year: 2026, month: 8 })).toContain("September");
  });
});
