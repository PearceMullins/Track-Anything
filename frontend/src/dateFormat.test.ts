import { describe, expect, it } from "vitest";
import { displayToIso, isoToDisplay, resolveEntryDraftDate, todayDisplay, todayIso } from "./dateFormat";

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
});
