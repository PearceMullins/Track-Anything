import { memo, useEffect, useMemo, useState } from "react";
import type { Bootstrap, EntryRecord, HistoryRow } from "../types";
import * as api from "../api";
import { EditEntryModal } from "./EditEntryModal";
import { isoToDisplay } from "../dateFormat";
import { loadUiSlice, saveUiSlice } from "../uiState";

interface HistoryPanelProps {
  data: Bootstrap;
  onChange: (data: Bootstrap) => void;
  onDeleteAll: () => void;
}

const HistoryTableRow = memo(function HistoryTableRow({
  row,
  selected,
  onSelect,
  onEdit,
}: {
  row: HistoryRow;
  selected: boolean;
  onSelect: (entryIndex: number) => void;
  onEdit: (entryIndex: number) => void;
}) {
  return (
    <tr
      className={selected ? "selected" : ""}
      onClick={() => onSelect(row.entry_index)}
      onDoubleClick={() => onEdit(row.entry_index)}
    >
      <td className="history-anchor">{isoToDisplay(row.entry_date)}</td>
      <td className="history-anchor">{row.name}</td>
      <td className="history-stack">
        {row.labels.map((label, i) => (
          <div key={i} className="stack-line">
            {label}
          </div>
        ))}
      </td>
      <td className="history-stack">
        {row.values.map((value, i) => (
          <div key={i} className="stack-line">
            {value}
          </div>
        ))}
      </td>
      <td className="history-anchor history-total">{row.total_display}</td>
      <td className="history-anchor">{row.notes || "—"}</td>
    </tr>
  );
});

export function HistoryPanel({ data, onChange, onDeleteAll }: HistoryPanelProps) {
  const profile = data.active_profile;
  const names = data.chart_names;
  const [displayNames, setDisplayNames] = useState<Set<string>>(() => {
    const saved = loadUiSlice(profile).historyDisplayNames;
    if (saved?.length) return new Set(saved.filter((n) => names.includes(n)));
    return new Set(names);
  });
  const [selected, setSelected] = useState<number | null>(
    () => loadUiSlice(profile).historySelected ?? null,
  );
  const [editing, setEditing] = useState<EntryRecord | null>(null);

  useEffect(() => {
    saveUiSlice(profile, { historyDisplayNames: [...displayNames] });
  }, [profile, displayNames]);

  useEffect(() => {
    setDisplayNames((prev) => {
      const next = new Set<string>();
      for (const n of names) {
        if (prev.has(n)) next.add(n);
      }
      if (next.size === 0 && names.length) names.forEach((n) => next.add(n));
      return next;
    });
  }, [names]);

  useEffect(() => {
    saveUiSlice(profile, { historySelected: selected });
  }, [profile, selected]);

  useEffect(() => {
    if (selected !== null && !data.entries.some((e) => e.index === selected)) {
      setSelected(null);
    }
  }, [data.entries, selected]);

  const toggleName = (name: string) => {
    setDisplayNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAllNames = () => setDisplayNames(new Set(names));
  const clearAllNames = () => setDisplayNames(new Set());

  const visibleRows = useMemo(
    () => data.history_rows.filter((row) => displayNames.has(row.name)),
    [data.history_rows, displayNames],
  );

  useEffect(() => {
    if (selected !== null && !visibleRows.some((row) => row.entry_index === selected)) {
      setSelected(null);
    }
  }, [visibleRows, selected]);

  const select = (entryIndex: number) => setSelected((prev) => (prev === entryIndex ? null : entryIndex));

  const openEdit = (entryIndex: number) => {
    const entry = data.entries.find((e) => e.index === entryIndex);
    if (entry) setEditing(entry);
  };

  const editSelected = () => {
    if (selected === null) {
      alert("Select an entry to edit.");
      return;
    }
    const entry = data.entries.find((e) => e.index === selected);
    if (!entry) return;
    if (!window.confirm(`Edit this entry?\n\n${isoToDisplay(entry.entry_date)} — ${entry.exercise}`)) return;
    setEditing(entry);
  };

  const deleteSelected = async () => {
    if (selected === null) {
      alert("Select an entry to delete.");
      return;
    }
    if (!window.confirm("Delete selected entry?")) return;
    onChange(await api.deleteEntry(selected));
    setSelected(null);
  };

  return (
    <>
      <section className="card">
        <div className="toolbar">
          <h2 className="card-title" style={{ margin: 0 }}>
            History to display
          </h2>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={selectAllNames}>
              Select all
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearAllNames}>
              Clear all
            </button>
          </div>
        </div>

        {names.length === 0 ? (
          <p className="empty">Log entries to see names here.</p>
        ) : (
          <div className="check-grid">
            {names.map((name) => (
              <label key={name} className="check-item">
                <input
                  type="checkbox"
                  checked={displayNames.has(name)}
                  onChange={() => toggleName(name)}
                />
                {name}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="toolbar">
          <h2 className="card-title" style={{ margin: 0 }}>
            History
          </h2>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={editSelected}>
              Edit
            </button>
            <button type="button" className="btn btn-ghost btn-danger" onClick={deleteSelected}>
              Delete
            </button>
            <button type="button" className="btn btn-ghost btn-danger" onClick={onDeleteAll}>
              Delete all
            </button>
          </div>
        </div>

        {data.history_rows.length === 0 ? (
          <p className="empty">No entries yet. Log something above.</p>
        ) : visibleRows.length === 0 ? (
          <p className="empty">Select one or more names above to view history.</p>
        ) : (
          <div className="table-wrap history-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Total</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <HistoryTableRow
                    key={row.entry_index}
                    row={row}
                    selected={selected === row.entry_index}
                    onSelect={select}
                    onEdit={openEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <EditEntryModal
            entry={editing}
            data={data}
            onClose={() => setEditing(null)}
            onSaved={(next) => {
              onChange(next);
              setEditing(null);
            }}
          />
        )}
      </section>
    </>
  );
}
