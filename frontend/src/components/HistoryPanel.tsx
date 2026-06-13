import { useState } from "react";
import type { Bootstrap, EntryRecord } from "../types";
import * as api from "../api";
import { EditEntryModal } from "./EditEntryModal";
import { isoToDisplay } from "../dateFormat";

interface HistoryPanelProps {
  data: Bootstrap;
  onChange: (data: Bootstrap) => void;
}

export function HistoryPanel({ data, onChange }: HistoryPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<EntryRecord | null>(null);

  const select = (entryIndex: number) => setSelected((prev) => (prev === entryIndex ? null : entryIndex));

  const editSelected = () => {
    if (selected === null) {
      alert("Select an entry to edit.");
      return;
    }
    const entry = data.entries.find((e) => e.index === selected);
    if (!entry) return;
    if (!window.confirm(`Edit this entry?\n\n${isoToDisplay(entry.workout_date)} — ${entry.exercise}`)) return;
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
        </div>
      </div>

      {data.history_rows.length === 0 ? (
        <p className="empty">No entries yet. Log something above.</p>
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
              {data.history_rows.map((row) => (
                <tr
                  key={row.entry_index}
                  className={selected === row.entry_index ? "selected" : ""}
                  onClick={() => select(row.entry_index)}
                  onDoubleClick={() => {
                    const entry = data.entries.find((e) => e.index === row.entry_index);
                    if (entry) setEditing(entry);
                  }}
                >
                  <td className="history-anchor">{isoToDisplay(row.workout_date)}</td>
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
  );
}
