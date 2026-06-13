import { useCallback, useEffect, useState } from "react";
import type { Bootstrap } from "./types";
import { fetchBootstrap } from "./api";
import { EntryForm } from "./components/EntryForm";
import { HistoryPanel } from "./components/HistoryPanel";
import { ChartsPanel } from "./components/ChartsPanel";
import { ManageListModal, type ManageKind } from "./components/ManageListModal";

type Tab = "log" | "charts";

export default function App() {
  const [tab, setTab] = useState<Tab>("log");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [manage, setManage] = useState<ManageKind | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await fetchBootstrap());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (next: Bootstrap) => setData(next);

  if (error && !data) {
    return (
      <div className="app">
        <div className="error-banner">
          {error}
          <br />
          <small>Make sure the API is running: python main.py --dev-frontend</small>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app">
        <p className="empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Track Anything</h1>
        <p>Log anything, review history, and see your progress over time.</p>
      </header>

      <nav className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`tab ${tab === "log" ? "active" : ""}`}
          onClick={() => setTab("log")}
        >
          Log Entry
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${tab === "charts" ? "active" : ""}`}
          onClick={() => setTab("charts")}
        >
          Progress Charts
        </button>
      </nav>

      {tab === "log" ? (
        <>
          <EntryForm data={data} onSaved={onChange} onManage={setManage} />
          <HistoryPanel data={data} onChange={onChange} />
        </>
      ) : (
        <ChartsPanel data={data} />
      )}

      <footer className="footer">
        Total adds up the numbers in each entry&apos;s values (e.g. 10 reps + 5 reps = 15).
      </footer>

      {manage && (
        <ManageListModal
          kind={manage}
          data={data}
          onClose={() => setManage(null)}
          onChange={(next) => {
            onChange(next);
            setManage(null);
          }}
        />
      )}
    </div>
  );
}
