import { useRef, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import {
  BACKUP_MIME,
  asJsonFile,
  downloadBackupFile,
  isNativeApp,
  pickNativeBackupFile,
  saveNativeBackup,
  shareNativeBackup,
} from "../data/backupFiles";
import { exportUiState, importUiState } from "../uiState";

interface DataToolsModalProps {
  onClose: () => void;
  onImported: (data: Bootstrap) => void;
}

export function DataToolsModal({ onClose, onImported }: DataToolsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const buildBackup = async () => ({
    ...(await api.exportAppData()),
    ui_state: exportUiState(),
  });

  const exportData = async () => {
    setError("");
    setStatus("");
    try {
      const backup = await buildBackup();
      if (isNativeApp()) {
        const { fileName } = await saveNativeBackup(backup);
        setStatus(`Exported ${fileName}.`);
        return;
      }
      const file = asJsonFile(backup);
      downloadBackupFile(file);
      setStatus(`Exported ${file.name} to Downloads.`);
    } catch (e) {
      if (e instanceof Error && e.message.toLowerCase().includes("cancel")) return;
      setError(e instanceof Error ? e.message : "Export failed.");
    }
  };

  const shareData = async () => {
    setError("");
    setStatus("");
    try {
      const backup = await buildBackup();
      if (isNativeApp()) {
        const { fileName } = await shareNativeBackup(backup);
        setStatus(`Opened share sheet for ${fileName}.`);
        return;
      }
      const file = asJsonFile(backup);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Track Anything backup", files: [file] });
        setStatus("Shared backup.");
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: "Track Anything backup",
          text: JSON.stringify(backup),
        });
        setStatus("Shared backup.");
        return;
      }
      downloadBackupFile(file);
      setStatus("Sharing unavailable. Exported backup.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Share failed.");
    }
  };

  const applyImport = async (file: File) => {
    const ok = window.confirm(
      "Import backup and replace all current app data? This cannot be undone unless you exported current data first.",
    );
    if (!ok) return;
    setError("");
    setStatus("");
    try {
      const backup = JSON.parse(await file.text()) as Record<string, unknown>;
      const next = await api.importAppData(backup);
      importUiState(backup.ui_state);
      onImported(next);
      setStatus("Imported backup.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    await applyImport(file);
  };

  const startImport = async () => {
    if (isNativeApp()) {
      setError("");
      setStatus("");
      const openPicker = window.confirm(
        "Import a backup file saved on this phone?\n\nIf the backup is still in email or messages, open the attachment there and choose Track Anything. If you saved or downloaded it, tap OK to pick it now.",
      );
      if (!openPicker) {
        setStatus("Open the shared backup attachment from email or messages, then choose Track Anything.");
        return;
      }
      try {
        await importFile((await pickNativeBackupFile()) ?? undefined);
      } catch (e) {
        if (e instanceof Error && e.message.toLowerCase().includes("cancel")) return;
        setError(e instanceof Error ? e.message : "Could not open file picker.");
      }
      return;
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-narrow" onClick={(e) => e.stopPropagation()}>
        <h2>Data</h2>
        {error && <div className="error-banner">{error}</div>}
        {status && <p className="status-banner">{status}</p>}

        {isNativeApp() && (
          <div className="hint import-help">
            <p>Shared backup from email or messages:</p>
            <ol>
              <li>Tap the backup attachment.</li>
              <li>Tap Save to device, then use Import here.</li>
              <li>Or tap Send a copy and choose Track Anything.</li>
            </ol>
          </div>
        )}

        <div className="data-actions">
          <button type="button" className="btn" onClick={exportData}>
            Export
          </button>
          <button type="button" className="btn" onClick={shareData}>
            Share
          </button>
          <button type="button" className="btn" onClick={() => void startImport()}>
            Import
          </button>
          <input
            ref={fileInputRef}
            className="file-picker"
            type="file"
            accept={`${BACKUP_MIME},.json,application/json`}
            onChange={(e) => {
              void importFile(e.currentTarget.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
