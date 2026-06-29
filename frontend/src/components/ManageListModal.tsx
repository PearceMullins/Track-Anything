import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";

export type ManageKind = "names" | "values" | "notes";

interface ManageListModalProps {
  kind: ManageKind;
  data: Bootstrap;
  onClose: () => void;
  onChange: (data: Bootstrap) => void;
}

const TITLES: Record<ManageKind, string> = {
  names: "Manage names",
  values: "Manage values",
  notes: "Manage notes",
};

function itemsFor(kind: ManageKind, data: Bootstrap): string[] {
  if (kind === "names") return data.dropdown_names;
  if (kind === "values") return data.dropdown_values;
  return data.dropdown_notes;
}

function hiddenItemsFor(kind: ManageKind, data: Bootstrap): string[] {
  if (kind === "values") return data.hidden_values;
  if (kind === "notes") return data.hidden_notes;
  return [];
}

function renameFn(kind: ManageKind) {
  if (kind === "names") return api.renameName;
  if (kind === "values") return api.renameValue;
  return api.renameNote;
}

async function removeBatch(kind: ManageKind, items: string[]): Promise<Bootstrap> {
  if (kind === "names") return api.deleteAllNames(items);
  if (kind === "values") return api.removeValues(items);
  return api.removeNotes(items);
}

async function restoreBatch(kind: ManageKind, items: string[]): Promise<Bootstrap> {
  if (kind === "values") return api.showValues(items);
  if (kind === "notes") return api.showNotes(items);
  throw new Error("Only values and notes can be shown.");
}

function deleteConfirmMessage(kind: ManageKind, count: number): string {
  const n = count === 1 ? "this item" : `these ${count} items`;
  if (kind === "names") {
    return `Remove ${n} from the dropdown and delete all saved records for ${count === 1 ? "it" : "them"}?`;
  }
  if (kind === "values") {
    return `Hide ${n} from the values dropdown?`;
  }
  return `Hide ${n} from the notes dropdown? Saved entries keep their note text.`;
}

export function ManageListModal({ kind, data, onClose, onChange }: ManageListModalProps) {
  const visibleItems = itemsFor(kind, data);
  const hiddenItems = hiddenItemsFor(kind, data);
  const canShowHidden = kind === "values" || kind === "notes";
  const [view, setView] = useState<"visible" | "hidden">("visible");
  const items = view === "hidden" ? hiddenItems : visibleItems;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");

  const switchView = (next: "visible" | "hidden") => {
    setView(next);
    setSelected(new Set());
    setError("");
  };

  const toggle = (item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items));
  const clearSelection = () => setSelected(new Set());

  const selectedList = [...selected];

  const rename = async () => {
    if (selectedList.length !== 1) {
      alert("Select exactly one item to edit.");
      return;
    }
    const current = selectedList[0];
    const next = window.prompt(`Rename "${current}" to:`, current);
    if (!next?.trim() || next.trim() === current) return;
    setError("");
    try {
      onChange(await renameFn(kind)(current, next.trim()));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
    }
  };

  const remove = async () => {
    if (selectedList.length === 0) {
      alert(`Select one or more items to ${kind === "names" ? "delete" : "hide"}.`);
      return;
    }
    if (!window.confirm(deleteConfirmMessage(kind, selectedList.length))) return;
    setError("");
    try {
      onChange(await removeBatch(kind, selectedList));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const restore = async () => {
    if (selectedList.length === 0) {
      alert("Select one or more items to show.");
      return;
    }
    setError("");
    try {
      onChange(await restoreBatch(kind, selectedList));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{TITLES[kind]}</h2>
        {error && <div className="error-banner">{error}</div>}

        {canShowHidden && (
          <div className="segmented" role="tablist" aria-label={`${kind} visibility`}>
            <button
              type="button"
              role="tab"
              aria-selected={view === "visible"}
              className={view === "visible" ? "active" : ""}
              onClick={() => switchView("visible")}
            >
              Visible
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "hidden"}
              className={view === "hidden" ? "active" : ""}
              onClick={() => switchView("hidden")}
            >
              Hidden ({hiddenItems.length})
            </button>
          </div>
        )}

        <p className="hint">
          {view === "hidden"
            ? "Select hidden items to show them again."
            : kind === "names"
              ? "Use the checkboxes to select items. Edit renames one; delete removes all selected."
              : "Use the checkboxes to select items. Edit renames one; hide removes all selected from suggestions."}
        </p>

        {items.length === 0 ? (
          <p className="empty">{view === "hidden" ? `No hidden ${kind}.` : "No suggestions yet. Type in the form first."}</p>
        ) : (
          <>
            <div className="btn-row" style={{ marginBottom: "0.75rem" }}>
              <button type="button" className="btn btn-ghost" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
            <ul className="modal-list">
              {items.map((item) => (
                <li key={item} className={selected.has(item) ? "selected" : ""}>
                  <label className="modal-list-item">
                    <input
                      type="checkbox"
                      className="ui-checkbox"
                      checked={selected.has(item)}
                      onChange={() => toggle(item)}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="btn-row">
          {view === "visible" ? (
            <>
              <button type="button" className="btn" onClick={rename}>
                Edit
              </button>
              <button type="button" className="btn btn-danger" onClick={remove}>
                {kind === "names" ? "Delete" : "Hide"}
                {selectedList.length > 1 ? ` (${selectedList.length})` : ""}
              </button>
            </>
          ) : (
            <button type="button" className="btn" onClick={restore}>
              Show{selectedList.length > 1 ? ` (${selectedList.length})` : ""}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
