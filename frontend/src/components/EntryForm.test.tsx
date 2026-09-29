import { beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EntryForm } from "./EntryForm";
import type { Bootstrap } from "../types";
import { emptyValueFormulas, setFormulaForName, type SavedEquation } from "../data/valueFormulas";
import { importUiState, saveUiSlice } from "../uiState";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function bootstrap(
  formulas = emptyValueFormulas(),
  saved: SavedEquation[] = [],
): Bootstrap {
  return {
    entries: [],
    history_rows: [],
    dropdown_names: ["Pushups"],
    dropdown_values: ["10 reps"],
    dropdown_notes: ["Morning"],
    hidden_values: [],
    hidden_notes: [],
    chart_names: ["Pushups"],
    active_profile: "Default",
    dropdown_profiles: ["Default"],
    value_formulas: formulas,
    saved_equations: saved,
  };
}

function draft(name: string, value = "") {
  saveUiSlice("Default", {
    entryDraft: { name, date: "2026-06-11", value, notes: "" },
  });
}

function mount(data: Bootstrap): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <EntryForm data={data} onSaved={() => {}} onChange={() => {}} onManage={() => {}} />,
    );
  });
  return { container, root };
}

function unmount({ container, root }: { container: HTMLElement; root: Root }) {
  act(() => root.unmount());
  container.remove();
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function button(container: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll("button")].find((item) => item.textContent === label);
}

function numberInputs(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll<HTMLInputElement>(".formula-number-input")];
}

describe("EntryForm equation", () => {
  beforeEach(() => {
    localStorage.clear();
    importUiState({ tab: "log", byProfile: {} });
  });

  it("offers only the two equation modes", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    expect(mounted.container.textContent).toContain("Equation for Pushups");
    expect(button(mounted.container, "Build an equation")).toBeDefined();
    expect(button(mounted.container, "Custom expression")).toBeDefined();
    expect(mounted.container.textContent).not.toContain("First number");
    expect(mounted.container.textContent).not.toContain("Smallest number");
    expect(mounted.container.textContent).not.toContain("Advanced");
    unmount(mounted);
  });

  it("starts in builder mode with a single input", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    expect(numberInputs(mounted.container)).toHaveLength(1);
    expect(mounted.container.textContent).toContain("Fill in every input");
    unmount(mounted);
  });

  it("restores the name's built equation and totals the numbers", () => {
    draft("Pushups");
    let formulas = emptyValueFormulas();
    formulas = setFormulaForName(formulas, "Pushups", { expr: "a * b" });
    const mounted = mount(bootstrap(formulas));

    const boxes = numberInputs(mounted.container);
    expect(boxes).toHaveLength(2);
    act(() => {
      typeInto(boxes[0], "3");
      typeInto(boxes[1], "4");
    });
    expect(mounted.container.textContent).toContain("Saves as");
    expect(mounted.container.textContent).toContain("3 × 4");
    expect(mounted.container.textContent).toContain("12");
    unmount(mounted);
  });

  it("adds inputs and applies one operator to every gap", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    act(() => {
      mounted.container.querySelector<HTMLButtonElement>('[aria-label="More inputs"]')?.click();
    });
    expect(numberInputs(mounted.container)).toHaveLength(2);

    const boxes = numberInputs(mounted.container);
    act(() => {
      typeInto(boxes[0], "20");
      typeInto(boxes[1], "5");
    });
    expect(mounted.container.textContent).toContain("20 + 5");
    expect(mounted.container.textContent).toContain("25");
    unmount(mounted);
  });

  it("switches to a custom expression and derives the template", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    act(() => {
      button(mounted.container, "Custom expression")?.click();
    });

    const input = mounted.container.querySelector<HTMLInputElement>("#entry-custom-equation");
    expect(input).not.toBeNull();
    act(() => {
      typeInto(input as HTMLInputElement, "(3 + 5) * 2");
    });
    expect(mounted.container.textContent).toContain("(a + b) * c");
    expect(mounted.container.textContent).toContain("(3 + 5) * 2");
    expect(mounted.container.textContent).toContain("16");
    unmount(mounted);
  });

  it("rejects a custom expression without numbers", () => {
    draft("Pushups");
    let formulas = emptyValueFormulas();
    formulas = setFormulaForName(formulas, "Pushups", { expr: "avg(a, b)" });
    const mounted = mount(bootstrap(formulas));

    const input = mounted.container.querySelector<HTMLInputElement>("#entry-custom-equation");
    expect(input?.value).toBe("avg(a, b)");
    act(() => {
      typeInto(input as HTMLInputElement, "a + b");
    });
    expect(mounted.container.textContent).toContain("Add at least one number");

    act(() => {
      button(mounted.container, "Save entry")?.click();
    });
    expect(mounted.container.textContent).toContain("Enter an expression with at least one number");
    unmount(mounted);
  });

  it("asks for every input before saving in builder mode", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    act(() => {
      button(mounted.container, "Save entry")?.click();
    });
    expect(mounted.container.textContent).toContain("Type a number in every input box");
    unmount(mounted);
  });

  it("restores unfinished numbers from the draft", () => {
    draft("Pushups", "3, 10");
    let formulas = emptyValueFormulas();
    formulas = setFormulaForName(formulas, "Pushups", { expr: "a + b" });
    const mounted = mount(bootstrap(formulas));
    const boxes = numberInputs(mounted.container);
    expect(boxes.map((box) => box.value)).toEqual(["3", "10"]);
    unmount(mounted);
  });

  it("lists saved equations and applies one to the builder", () => {
    draft("Pushups");
    const saved: SavedEquation[] = [
      { label: "Volume", spec: { expr: "a * b * c" } },
      { label: "Two-set average", spec: { expr: "avg(a, b)" } },
    ];
    const mounted = mount(bootstrap(emptyValueFormulas(), saved));
    expect(mounted.container.textContent).toContain("Volume");
    expect(mounted.container.textContent).toContain("Two-set average");
    expect(mounted.container.textContent).toContain("Save this equation as…");

    const volume = [...mounted.container.querySelectorAll("button")].find(
      (item) => item.textContent === "Volume",
    );
    act(() => {
      volume?.click();
    });
    expect(numberInputs(mounted.container)).toHaveLength(3);

    const average = [...mounted.container.querySelectorAll("button")].find(
      (item) => item.textContent === "Two-set average",
    );
    act(() => {
      average?.click();
    });
    const input = mounted.container.querySelector<HTMLInputElement>("#entry-custom-equation");
    expect(input?.value).toBe("avg(0, 0)");
    unmount(mounted);
  });
});
