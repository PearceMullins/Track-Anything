import { useEffect, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { PermanentDeleteConfirm } from "./PermanentDeleteConfirm";

interface ManageProfilesModalProps {
  data: Bootstrap;
  onClose: () => void;
  onChange: (data: Bootstrap) => void;
}

const MANAGE_HINT =
  "Use the checkboxes to select profiles. Edit renames one; delete permanently removes all selected. At least one profile must remain.";

function deleteConfirmLabel(selectedList: string[]): string {
  if (selectedList.length === 1) {
    return `I understand this will permanently delete profile "${selectedList[0]}" and all of its history, charts, and dropdown data.`;
  }
  return `I understand this will permanently delete ${selectedList.length} profiles and all of their history, charts, and dropdown data.`;
}

export function ManageProfilesModal({ data, onClose, onChange }: ManageProfilesModalProps) {
  const items = data.dropdown_profiles;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConfirmed(false);
  }, [selected]);

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
      alert("Select exactly one profile to edit.");
      return;
    }
    const current = selectedList[0];
    const next = window.prompt(`Rename profile "${current}" to:`, current);
    if (!next?.trim() || next.trim() === current) return;
    setError("");
    try {
      onChange(await api.renameProfile(current, next.trim()));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
    }
  };

  const remove = async () => {
    if (selectedList.length === 0) {
      alert("Select one or more profiles to delete.");
      return;
    }
    if (selectedList.length >= items.length) {
      setError("At least one profile must remain.");
      return;
    }
    if (!confirmed) {
      setError("Check the confirmation box to continue.");
      return;
    }
    setError("");
    try {
      let latest = data;
      for (const name of selectedList) {
        latest = await api.removeProfile(name);
      }
      onChange(latest);
      setSelected(new Set());
      setConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage profiles</h2>
        {error && <div className="error-banner">{error}</div>}
        <p className="hint">{MANAGE_HINT}</p>

        {items.length === 0 ? (
          <p className="empty">No profiles yet.</p>
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
                    <span>
                      {item}
                      {item === data.active_profile ? " (active)" : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {selectedList.length > 0 && (
          <PermanentDeleteConfirm
            label={deleteConfirmLabel(selectedList)}
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
