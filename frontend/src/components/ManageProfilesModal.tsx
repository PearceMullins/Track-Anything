import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";

interface ManageProfilesModalProps {
  data: Bootstrap;
  onClose: () => void;
  onChange: (data: Bootstrap) => void;
}

export function ManageProfilesModal({ data, onClose, onChange }: ManageProfilesModalProps) {
  const items = data.dropdown_profiles;
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rename = async () => {
    if (!selected) {
      alert("Select a profile to edit.");
      return;
    }
    const next = window.prompt(`Rename profile "${selected}" to:`, selected);
    if (!next?.trim() || next.trim() === selected) return;
    setError("");
    try {
      onChange(await api.renameProfile(selected, next.trim()));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
    }
  };

  const remove = async () => {
    if (!selected) {
      alert("Select a profile to delete.");
      return;
    }
    if (
      !window.confirm(
        `Delete profile "${selected}" and all of its history, charts, and dropdown data?\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      onChange(await api.removeProfile(selected));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage profiles</h2>
        {error && <div className="error-banner">{error}</div>}
        <p className="hint">Edit or remove profiles. Each profile keeps its own history and lists.</p>

        {items.length === 0 ? (
          <p className="empty">No profiles yet.</p>
        ) : (
          <ul className="modal-list">
            {items.map((item) => (
              <li
                key={item}
                className={selected === item ? "selected" : ""}
                onClick={() => setSelected(item)}
              >
                {item}
                {item === data.active_profile ? " (active)" : ""}
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
