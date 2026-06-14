import { useCallback, useEffect, useRef, useState } from "react";
import type { Bootstrap } from "./types";
import { fetchBootstrap } from "./api";
import { snapshotBootstrap } from "./snapshotBootstrap";
import { EntryForm } from "./components/EntryForm";
import { HistoryPanel } from "./components/HistoryPanel";
import { ChartsPanel } from "./components/ChartsPanel";
import { ManageListModal, type ManageKind } from "./components/ManageListModal";
import { ProfileBar } from "./components/ProfileBar";
import { DeleteAllModal } from "./components/DeleteAllModal";
import { ManageProfilesModal } from "./components/ManageProfilesModal";
import { SupportModal } from "./components/SupportModal";
import { loadUiState, saveUiState, flushUiState, type AppTab } from "./uiState";

export default function App() {
  const [tab, setTab] = useState<AppTab>(() => loadUiState().tab ?? "log");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [manage, setManage] = useState<ManageKind | null>(null);
  const [manageProfiles, setManageProfiles] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [chartsSnapshot, setChartsSnapshot] = useState<Bootstrap | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const lastProfileRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!data) {
      setHistoryReady(false);
      return;
    }
    setHistoryReady(false);
    const idle = window.requestIdleCallback;
    if (idle) {
      const id = idle(() => setHistoryReady(true), { timeout: 400 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setHistoryReady(true), 0);
    return () => window.clearTimeout(timer);
  }, [data?.active_profile]);

  useEffect(() => {
    if (tab === "charts" && data && !chartsSnapshot) {
      setChartsSnapshot(snapshotBootstrap(data));
    }
  }, [tab, data, chartsSnapshot]);

  useEffect(() => {
    if (!data) return;
    const profile = data.active_profile;
    const previous = lastProfileRef.current;
    lastProfileRef.current = profile;

    if (previous !== null && previous !== profile) {
      if (tab === "charts") {
        setChartsSnapshot(snapshotBootstrap(data));
      } else {
        setChartsSnapshot(null);
      }
    }
  }, [data, tab]);

  const changeTab = (next: AppTab) => {
    if (next === "charts" && data) {
      setChartsSnapshot(snapshotBootstrap(data));
    } else if (next !== "charts") {
      setChartsSnapshot(null);
    }
    setTab(next);
    saveUiState({ tab: next });
    flushUiState();
  };

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

      <ProfileBar data={data} onChange={onChange} onManage={() => setManageProfiles(true)} />

      <nav className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "log"}
          className={`tab ${tab === "log" ? "active" : ""}`}
          onClick={() => changeTab("log")}
        >
          Log Entry
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "charts"}
          className={`tab ${tab === "charts" ? "active" : ""}`}
          onClick={() => changeTab("charts")}
        >
          Progress Charts
        </button>
        <button type="button" className="tab tab-donations" onClick={() => setSupportOpen(true)}>
          Donations
        </button>
      </nav>

      <div className="tab-panels">
        <div className="tab-panel" hidden={tab !== "log"}>
          <EntryForm key={data.active_profile} data={data} onSaved={onChange} onManage={setManage} />
          {historyReady ? (
            <HistoryPanel
              key={`history-${data.active_profile}`}
              data={data}
              onChange={onChange}
              onDeleteAll={() => setDeleteAll(true)}
            />
          ) : (
            <section className="card">
              <p className="empty">Loading history…</p>
            </section>
          )}
        </div>
        <div className="tab-panel" hidden={tab !== "charts"}>
          {tab === "charts" && chartsSnapshot ? (
            <ChartsPanel key={chartsSnapshot.active_profile} data={chartsSnapshot} />
          ) : tab === "charts" ? (
            <p className="empty">Loading charts…</p>
          ) : null}
        </div>
      </div>

      <footer className="footer">
        Total adds up the numbers in each entry&apos;s values (e.g. 10 reps + 5 reps = 15).
      </footer>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}

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

      {manageProfiles && (
        <ManageProfilesModal
          data={data}
          onClose={() => setManageProfiles(false)}
          onChange={(next) => {
            onChange(next);
            setManageProfiles(false);
          }}
        />
      )}

      {deleteAll && (
        <DeleteAllModal
          data={data}
          onClose={() => setDeleteAll(false)}
          onDeleted={(next) => {
            onChange(next);
            setDeleteAll(false);
          }}
        />
      )}
    </div>
  );
}
