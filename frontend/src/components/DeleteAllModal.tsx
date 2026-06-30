import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { PermanentDeleteConfirm } from "./PermanentDeleteConfirm";

interface DeleteAllModalProps {
  data: Bootstrap;
  onClose: () => void;
  onDeleted: (data: Bootstrap) => void;
}

export function DeleteAllModal({ data, onClose, onDeleted }: DeleteAllModalProps) {
  const names = data.chart_names;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(names));
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(names));
  const clearAll = () => setSelected(new Set());

  const runDelete = async () => {
    const picked = names.filter((n) => selected.has(n));
    if (!picked.length) {
      setError("Select at least one name to delete.");
      return;
    }
    if (!confirmed) {
      setError("Check the confirmation box to continue.");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      onDeleted(await api.deleteAllNames(picked));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2>Delete all by name</h2>
        {error && <div className="error-banner">{error}</div>}
        <p className="hint warning-text">
          Select which tracked names to remove from history. Every saved entry for a checked name
          will be deleted from this profile.
        </p>

        {names.length === 0 ? (
          <p className="empty">No tracked names yet.</p>
        ) : (
          <>
            <div className="btn-row" style={{ marginBottom: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearAll}>
                Clear all
              </button>
            </div>
            <div className="check-grid modal-check-grid">
              {names.map((name) => (
                <label key={name} className="check-item">
                  <input
                    type="checkbox"
                    checked={selected.has(name)}
                    onChange={() => toggle(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
            <PermanentDeleteConfirm
              label="I understand this will permanently delete all entries for the selected names."
              checked={confirmed}
              onChange={setConfirmed}
            />
          </>
        )}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={runDelete}
            disabled={deleting || names.length === 0}
          >
            {deleting ? "Deleting…" : "Delete selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
