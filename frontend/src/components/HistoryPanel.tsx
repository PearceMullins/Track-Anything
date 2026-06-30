import { memo, useEffect, useMemo, useState } from "react";
import type { Bootstrap, EntryRecord, HistoryRow } from "../types";
import { EditEntryModal } from "./EditEntryModal";
import { DeleteEntriesModal } from "./DeleteEntriesModal";
import { HistoryManageMenu } from "./HistoryManageMenu";
import { isoToDisplay } from "../dateFormat";
import { loadUiSlice, saveUiSlice } from "../uiState";

interface HistoryPanelProps {
  data: Bootstrap;
  displayFocus?: { name: string; nonce: number } | null;
  onChange: (data: Bootstrap) => void;
  onDeleteAll: () => void;
}

const HistoryTableRow = memo(function HistoryTableRow({
  row,
  selected,
  onSelect,
  onEdit,
  showValues,
  showNotes,
}: {
  row: HistoryRow;
  selected: boolean;
  onSelect: (entryIndex: number) => void;
  onEdit: (entryIndex: number) => void;
  showValues: boolean;
  showNotes: boolean;
}) {
  return (
    <tr
      className={selected ? "selected" : ""}
      onClick={() => onSelect(row.entry_index)}
      onDoubleClick={() => onEdit(row.entry_index)}
    >
      <td className="row-check-cell" onClick={(e) => e.stopPropagation()}>
        <label className="row-check">
          <input
            type="checkbox"
            className="ui-checkbox"
            checked={selected}
            onChange={() => onSelect(row.entry_index)}
            aria-label={`Select entry ${isoToDisplay(row.entry_date)} — ${row.name}`}
          />
        </label>
      </td>
      <td className="history-anchor">{isoToDisplay(row.entry_date)}</td>
      <td className="history-anchor">{row.name}</td>
      {showValues && <td className="history-anchor">{row.value}</td>}
      {showNotes && <td className="history-anchor">{row.notes || "-"}</td>}
    </tr>
  );
});

function loadSelectedIndices(profile: string): Set<number> {
  const slice = loadUiSlice(profile);
  if (slice.historySelectedIndices?.length) {
    return new Set(slice.historySelectedIndices);
  }
  if (slice.historySelected != null) {
    return new Set([slice.historySelected]);
  }
  return new Set();
}

export function HistoryPanel({ data, displayFocus, onChange, onDeleteAll }: HistoryPanelProps) {
  const profile = data.active_profile;
  const names = data.chart_names;
  const [displayNames, setDisplayNames] = useState<Set<string>>(() => {
    const saved = loadUiSlice(profile).historyDisplayNames;
    if (saved?.length) return new Set(saved.filter((n) => names.includes(n)));
    return new Set(names);
  });
  const [selected, setSelected] = useState<Set<number>>(() => loadSelectedIndices(profile));
  const [editing, setEditing] = useState<EntryRecord | null>(null);
  const [deletingIndices, setDeletingIndices] = useState<number[] | null>(null);
  const [showValues, setShowValues] = useState(() => loadUiSlice(profile).historyShowValues ?? true);
  const [showNotes, setShowNotes] = useState(() => loadUiSlice(profile).historyShowNotes ?? true);

  useEffect(() => {
    saveUiSlice(profile, { historyDisplayNames: [...displayNames] });
  }, [profile, displayNames]);

  useEffect(() => {
    saveUiSlice(profile, { historyShowValues: showValues, historyShowNotes: showNotes });
  }, [profile, showValues, showNotes]);

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
    const name = displayFocus?.name;
    if (!name || !names.includes(name)) return;
    setDisplayNames((prev) => {
      if (prev.has(name)) return prev;
      return new Set([...prev, name]);
    });
  }, [displayFocus?.name, displayFocus?.nonce, names]);

  useEffect(() => {
    saveUiSlice(profile, { historySelectedIndices: [...selected] });
  }, [profile, selected]);

  useEffect(() => {
    const valid = new Set(data.entries.map((e) => e.index));
    setSelected((prev) => {
      const next = new Set([...prev].filter((i) => valid.has(i)));
      return next.size === prev.size ? prev : next;
    });
  }, [data.entries]);

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
    const visible = new Set(visibleRows.map((row) => row.entry_index));
    setSelected((prev) => {
      const next = new Set([...prev].filter((i) => visible.has(i)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleRows]);

  const toggleSelect = (entryIndex: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entryIndex)) next.delete(entryIndex);
      else next.add(entryIndex);
      return next;
    });
  };

  const selectAllVisible = () => setSelected(new Set(visibleRows.map((row) => row.entry_index)));
  const clearSelection = () => setSelected(new Set());

  const selectedList = [...selected];
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.entry_index));
  const someVisibleSelected =
    visibleRows.some((row) => selected.has(row.entry_index)) && !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) clearSelection();
    else selectAllVisible();
  };

  const openEdit = (entryIndex: number) => {
    const entry = data.entries.find((e) => e.index === entryIndex);
    if (entry) setEditing(entry);
  };

  const editSelected = () => {
    if (selectedList.length !== 1) {
      alert("Select exactly one entry to edit.");
      return;
    }
    const entry = data.entries.find((e) => e.index === selectedList[0]);
    if (!entry) return;
    if (!window.confirm(`Edit this entry?\n\n${isoToDisplay(entry.entry_date)} — ${entry.exercise}`)) return;
    setEditing(entry);
  };

  const openDeleteSelected = () => {
    if (selectedList.length === 0) {
      alert("Select one or more entries to delete.");
      return;
    }
    setDeletingIndices(selectedList);
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
                  className="ui-checkbox"
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
          <div className="history-field-toggle" role="group" aria-label="History fields">
            <label className="inline-check">
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={showValues}
                onChange={(e) => setShowValues(e.target.checked)}
              />
              Values
            </label>
            <label className="inline-check">
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
              />
              Notes
            </label>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={selectAllVisible}>
              Select all
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearSelection}>
              Clear selection
            </button>
            <HistoryManageMenu
              selectedCount={selectedList.length}
              onEdit={editSelected}
              onDelete={openDeleteSelected}
              onDeleteAll={onDeleteAll}
            />
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
                  <th className="row-check-cell">
                    <label className="row-check">
                      <input
                        type="checkbox"
                        className="ui-checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected;
                        }}
                        onChange={toggleSelectAllVisible}
                        aria-label="Select all visible entries"
                      />
                    </label>
                  </th>
                  <th>Date</th>
                  <th>Name</th>
                  {showValues && <th>Value</th>}
                  {showNotes && <th>Notes</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <HistoryTableRow
                    key={row.entry_index}
                    row={row}
                    selected={selected.has(row.entry_index)}
                    onSelect={toggleSelect}
                    onEdit={openEdit}
                    showValues={showValues}
                    showNotes={showNotes}
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

        {deletingIndices && (
          <DeleteEntriesModal
            data={data}
            indices={deletingIndices}
            onClose={() => setDeletingIndices(null)}
            onDeleted={(next) => {
              onChange(next);
              setSelected(new Set());
              setDeletingIndices(null);
            }}
          />
        )}
      </section>
    </>
  );
}
