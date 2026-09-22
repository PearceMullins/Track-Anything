import { beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EntryForm } from "./EntryForm";
import type { Bootstrap } from "../types";
import { emptyValueFormulas, setFormulaForName } from "../data/valueFormulas";
import { importUiState, saveUiSlice } from "../uiState";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function bootstrap(formulas = emptyValueFormulas()): Bootstrap {
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
  };
}

function draft(name: string) {
  saveUiSlice("Default", {
    entryDraft: { name, date: "2026-06-11", value: "", notes: "" },
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

function numberInputs(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll<HTMLInputElement>(".formula-number-input")];
}

describe("EntryForm equation inputs", () => {
  beforeEach(() => {
    localStorage.clear();
    importUiState({ tab: "log", byProfile: {} });
  });

  it("starts with a single input and no free-text value field", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    expect(mounted.container.textContent).toContain("Equation for Pushups");
    expect(numberInputs(mounted.container)).toHaveLength(1);
    expect(mounted.container.textContent).not.toContain("Manage values");
    expect(mounted.container.textContent).not.toContain("Chart");
    unmount(mounted);
  });

  it("restores the name's equation and totals the typed numbers", () => {
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
    let formulas = emptyValueFormulas();
    formulas = setFormulaForName(formulas, "Pushups", { expr: "a + b" });
    const mounted = mount(bootstrap(formulas));

    const more = mounted.container.querySelector<HTMLButtonElement>('[aria-label="More inputs"]');
    act(() => {
      more?.click();
    });
    expect(numberInputs(mounted.container)).toHaveLength(3);

    const boxes = numberInputs(mounted.container);
    act(() => {
      typeInto(boxes[0], "2");
      typeInto(boxes[1], "5");
      typeInto(boxes[2], "10");
    });
    expect(mounted.container.textContent).toContain("2 + 5 + 10");
    expect(mounted.container.textContent).toContain("17");
    unmount(mounted);
  });

  it("flags names that use an advanced equation", () => {
    draft("Pushups");
    let formulas = emptyValueFormulas();
    formulas = setFormulaForName(formulas, "Pushups", "min_number");
    const mounted = mount(bootstrap(formulas));
    expect(mounted.container.textContent).toContain("advanced equation");
    expect(mounted.container.textContent).toContain("Smallest number");
    expect(mounted.container.textContent).toContain("Use number inputs");
    unmount(mounted);
  });

  it("asks for every input before saving", () => {
    draft("Pushups");
    const mounted = mount(bootstrap());
    const save = [...mounted.container.querySelectorAll("button")].find(
      (button) => button.textContent === "Save entry",
    );
    act(() => {
      save?.click();
    });
    expect(mounted.container.textContent).toContain("Fill in every input");
    unmount(mounted);
  });
});
