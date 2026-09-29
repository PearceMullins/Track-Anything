import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DateInput } from "./DateInput";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(value: string, onChange: (next: string) => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<DateInput id="entry-date" value={value} onChange={onChange} />);
  });
  return { container, root };
}

function unmount({ container, root }: { container: HTMLElement; root: Root }) {
  act(() => root.unmount());
  container.remove();
}

function button(container: HTMLElement, match: string | RegExp): HTMLButtonElement | undefined {
  return [...container.querySelectorAll("button")].find((item) => {
    const text = item.textContent ?? "";
    const label = item.getAttribute("aria-label") ?? "";
    if (typeof match === "string") return text === match || label === match;
    return match.test(text) || match.test(label);
  });
}

describe("DateInput calendar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hides the calendar until the Calendar button is pressed", () => {
    const mounted = mount("06/11/2026", () => {});
    expect(mounted.container.querySelector(".calendar")).toBeNull();
    act(() => {
      button(mounted.container, "Calendar")?.click();
    });
    const grid = mounted.container.querySelector(".calendar-grid");
    expect(grid).not.toBeNull();
    expect(grid?.querySelectorAll("button")).toHaveLength(42);
    expect(mounted.container.textContent).toContain("June 2026");
    unmount(mounted);
  });

  it("marks the selected day and reports the picked date", () => {
    const onChange = vi.fn();
    const mounted = mount("06/11/2026", onChange);
    act(() => {
      button(mounted.container, "Calendar")?.click();
    });

    const dayButtons = [
      ...mounted.container.querySelectorAll<HTMLButtonElement>(".calendar-day"),
    ];
    expect(dayButtons).toHaveLength(42);
    const selected = dayButtons.find((item) => item.classList.contains("selected"));
    expect(selected?.getAttribute("aria-label")).toBe("06/11/2026");

    const twentieth = dayButtons.find((item) => item.getAttribute("aria-label") === "06/20/2026");
    act(() => {
      twentieth?.click();
    });
    expect(onChange).toHaveBeenCalledWith("06/20/2026");
    expect(mounted.container.querySelector(".calendar")).toBeNull();
    unmount(mounted);
  });

  it("moves between months and returns to today", () => {
    const onChange = vi.fn();
    const mounted = mount("06/11/2026", onChange);
    act(() => {
      button(mounted.container, "Calendar")?.click();
    });
    act(() => {
      button(mounted.container, "Next month")?.click();
    });
    expect(mounted.container.textContent).toContain("July 2026");
    act(() => {
      button(mounted.container, "Previous month")?.click();
      button(mounted.container, "Previous month")?.click();
    });
    expect(mounted.container.textContent).toContain("May 2026");

    const today = button(mounted.container, /^Today/);
    expect(today).toBeDefined();
    act(() => {
      today?.click();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    unmount(mounted);
  });
});
