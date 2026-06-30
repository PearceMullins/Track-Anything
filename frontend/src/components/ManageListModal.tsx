import { useEffect, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { PermanentDeleteConfirm } from "./PermanentDeleteConfirm";

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

function deleteConfirmLabel(kind: ManageKind): string {
  if (kind === "names") {
    return "I understand this will permanently delete all entries for the selected names.";
  }
  if (kind === "values") {
    return "I understand this will permanently delete all entries with the selected values.";
  }
  return "I understand this will permanently delete the selected note text from saved entries.";
}

const MANAGE_HINT =
  "Use the checkboxes to select items. Edit renames one; delete permanently removes all selected.";

export function ManageListModal({ kind, data, onClose, onChange }: ManageListModalProps) {
  const items = itemsFor(kind, data);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConfirmed(false);
  }, [selected, kind]);

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
      alert("Select one or more items to delete.");
      return;
    }
    if (!confirmed) {
      setError("Check the confirmation box to continue.");
      return;
    }
    setError("");
    try {
      onChange(await removeBatch(kind, selectedList));
      setSelected(new Set());
      setConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{TITLES[kind]}</h2>
        {error && <div className="error-banner">{error}</div>}

        <p className="hint">{MANAGE_HINT}</p>

        {items.length === 0 ? (
          <p className="empty">No suggestions yet. Type in the form first.</p>
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

        {selectedList.length > 0 && (
          <PermanentDeleteConfirm
            label={deleteConfirmLabel(kind)}
            checked={confirmed}
            onChange={setConfirmed}
          />
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={rename}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            Delete{selectedList.length > 1 ? ` (${selectedList.length})` : ""}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
