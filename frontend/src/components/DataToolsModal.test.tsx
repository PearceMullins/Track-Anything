import { beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DataToolsModal } from "./DataToolsModal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <DataToolsModal onClose={() => {}} onImported={() => {}} onReset={() => {}} />,
    );
  });
  return { container, root };
}

function unmount({ container, root }: { container: HTMLElement; root: Root }) {
  act(() => root.unmount());
  container.remove();
}

function resetButton(container: HTMLElement): HTMLButtonElement {
  const button = [...container.querySelectorAll("button")].find(
    (item) => item.textContent === "Factory reset",
  );
  if (!button) throw new Error("Factory reset button missing");
  return button;
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("DataToolsModal factory reset", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("requires typing the phrase before reset is allowed", () => {
    const mounted = mount();
    const input = mounted.container.querySelector<HTMLInputElement>("#factory-reset-confirm");
    expect(input).not.toBeNull();
    expect(resetButton(mounted.container).disabled).toBe(true);

    act(() => {
      typeInto(input as HTMLInputElement, "reset");
    });
    expect(resetButton(mounted.container).disabled).toBe(true);

    act(() => {
      typeInto(input as HTMLInputElement, "  Factory Reset ");
    });
    expect(resetButton(mounted.container).disabled).toBe(false);

    act(() => {
      typeInto(input as HTMLInputElement, "");
    });
    expect(resetButton(mounted.container).disabled).toBe(true);
    unmount(mounted);
  });
});
