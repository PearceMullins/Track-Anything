import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";

export type ManageKind = "names" | "labels" | "values";

interface ManageListModalProps {
  kind: ManageKind;
  data: Bootstrap;
  onClose: () => void;
  onChange: (data: Bootstrap) => void;
}

const TITLES: Record<ManageKind, string> = {
  names: "Manage names",
  labels: "Manage labels",
  values: "Manage values",
};

function itemsFor(kind: ManageKind, data: Bootstrap): string[] {
  if (kind === "names") return data.dropdown_names;
  if (kind === "labels") return data.dropdown_set_labels;
  return data.dropdown_values;
}

export function ManageListModal({ kind, data, onClose, onChange }: ManageListModalProps) {
  const items = itemsFor(kind, data);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rename = async () => {
    if (!selected) {
      alert(`Select an item to edit.`);
      return;
    }
    const next = window.prompt(`Rename "${selected}" to:`, selected);
    if (!next?.trim() || next.trim() === selected) return;
    setError("");
    try {
      const fn =
        kind === "names"
          ? api.renameName
          : kind === "labels"
            ? api.renameLabel
            : api.renameValue;
      onChange(await fn(selected, next.trim()));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
    }
  };

  const remove = async () => {
    if (!selected) {
      alert(`Select an item to delete.`);
      return;
    }
    const msg =
      kind === "names"
        ? `Remove "${selected}" from the dropdown and delete all saved records for it?`
        : `Remove "${selected}" from the dropdown?`;
    if (!window.confirm(msg)) return;
    setError("");
    try {
      const fn =
        kind === "names" ? api.removeName : kind === "labels" ? api.removeLabel : api.removeValue;
      onChange(await fn(selected));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{TITLES[kind]}</h2>
        {error && <div className="error-banner">{error}</div>}
        <p className="hint">Edit or remove items from the suggestion list.</p>

        {items.length === 0 ? (
          <p className="empty">No suggestions yet — type values in the form first.</p>
        ) : (
          <ul className="modal-list">
            {items.map((item) => (
              <li
                key={item}
                className={selected === item ? "selected" : ""}
                onClick={() => setSelected(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={rename}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            Delete
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
