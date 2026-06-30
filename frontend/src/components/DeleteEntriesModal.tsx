import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { PermanentDeleteConfirm } from "./PermanentDeleteConfirm";
import { isoToDisplay } from "../dateFormat";

interface DeleteEntriesModalProps {
  data: Bootstrap;
  indices: number[];
  onClose: () => void;
  onDeleted: (data: Bootstrap) => void;
}

export function DeleteEntriesModal({ data, indices, onClose, onDeleted }: DeleteEntriesModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const entries = indices
    .map((i) => data.entries.find((e) => e.index === i))
    .filter((e): e is NonNullable<typeof e> => !!e);

  const count = indices.length;
  const label =
    count === 1
      ? "I understand this will permanently delete the selected entry."
      : `I understand this will permanently delete ${count} selected entries.`;

  const runDelete = async () => {
    if (!confirmed) {
      setError("Check the confirmation box to continue.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      onDeleted(await api.deleteEntries(indices));
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
        <h2>Delete {count === 1 ? "entry" : "entries"}</h2>
        {error && <div className="error-banner">{error}</div>}
        <p className="hint warning-text">This cannot be undone.</p>
        {count <= 5 ? (
          <ul className="modal-list" style={{ marginBottom: 12 }}>
            {entries.map((entry) => (
              <li key={entry.index}>
                {isoToDisplay(entry.entry_date)} — {entry.exercise}
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">{count} entries selected.</p>
        )}
        <PermanentDeleteConfirm label={label} checked={confirmed} onChange={setConfirmed} />
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={runDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
