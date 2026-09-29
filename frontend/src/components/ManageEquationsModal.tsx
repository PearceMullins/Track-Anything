import { useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { formulaLabel, type FormulaSpec, type SavedEquation } from "../data/valueFormulas";

interface ManageEquationsModalProps {
  name: string;
  saved: SavedEquation[];
  currentSpec: FormulaSpec | null;
  currentSummary: string;
  onApply: (saved: SavedEquation) => void;
  onChange: (data: Bootstrap) => void;
  onClose: () => void;
}

export function ManageEquationsModal({
  name,
  saved,
  currentSpec,
  currentSummary,
  onApply,
  onChange,
  onClose,
}: ManageEquationsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const selectedList = [...selected];

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const saveCurrent = async () => {
    const label = newLabel.trim();
    if (!currentSpec) {
      setError("Finish the equation in Log Entry before saving it.");
      return;
    }
    if (!label) {
      setError("Name the equation first.");
      return;
    }
    setError("");
    try {
      onChange(await api.saveEquation(label, currentSpec));
      setNewLabel("");
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the equation.");
    }
  };

  const renameSelected = async () => {
    if (selectedList.length !== 1) {
      alert("Select exactly one equation to rename.");
      return;
    }
    const current = saved.find((item) => item.label === selectedList[0]);
    if (!current) return;
    const next = window.prompt(`Rename "${current.label}" to:`, current.label);
    if (!next?.trim() || next.trim() === current.label) return;
    setError("");
    try {
      await api.saveEquation(next.trim(), current.spec);
      const data = await api.removeSavedEquation(current.label);
      onChange(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
    }
  };

  const applySelected = async () => {
    if (selectedList.length !== 1) {
      alert("Select one equation to use.");
      return;
    }
    const current = saved.find((item) => item.label === selectedList[0]);
    if (current) onApply(current);
  };

  const removeSelected = async () => {
    if (selectedList.length === 0) {
      alert("Select one or more equations to delete.");
      return;
    }
    const names = selectedList.map((label) => `"${label}"`).join(", ");
    if (!window.confirm(`Delete the saved equation${selectedList.length > 1 ? "s" : ""} ${names}?`)) {
      return;
    }
    setError("");
    try {
      let data: Bootstrap | null = null;
      for (const label of selectedList) {
        data = await api.removeSavedEquation(label);
      }
      if (data) onChange(data);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage equations</h2>
        {error && <div className="error-banner">{error}</div>}

        <p className="hint">
          Saved equations can be applied to any name. Select one and press <strong>Use</strong>, or
          tick several to delete them.
        </p>

        <div className="formula-advanced" style={{ marginTop: 0 }}>
          <span className="formula-builder-label">Save the equation from Log Entry</span>
          <p className="formula-equation">
            {currentSpec ? (
              <>
                <code>{currentSummary || formulaLabel(currentSpec)}</code>
                {name ? ` · for ${name}` : ""}
              </>
            ) : (
              "Nothing to save yet — finish the equation first."
            )}
          </p>
          <div className="btn-row">
            <input
              className="formula-input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Exercise Volume"
              aria-label="Name for the current equation"
              maxLength={40}
            />
            <button
              type="button"
              className="btn"
              onClick={() => void saveCurrent()}
              disabled={!currentSpec}
            >
              Save current
            </button>
          </div>
        </div>

        {saved.length === 0 ? (
          <p className="empty">No saved equations yet.</p>
        ) : (
          <ul className="modal-list">
            {saved.map((item) => (
              <li key={item.label} className={selected.has(item.label) ? "selected" : ""}>
                <label className="modal-list-item">
                  <input
                    type="checkbox"
                    className="ui-checkbox"
                    checked={selected.has(item.label)}
                    onChange={() => toggle(item.label)}
                  />
                  <span>
                    {item.label}
                    <span className="saved-equation-spec"> — {formulaLabel(item.spec)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void applySelected()}>
            Use
          </button>
          <button type="button" className="btn" onClick={() => void renameSelected()}>
            Rename
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void removeSelected()}>
            Delete{selectedList.length > 1 ? ` (${selectedList.length})` : ""}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ marginLeft: "auto" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
