import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { exportUiState, importUiState } from "../uiState";

interface DataToolsModalProps {
  onClose: () => void;
  onImported: (data: Bootstrap) => void;
}

const MIME = "application/json";

function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `track-anything-backup-${stamp}.json`;
}

function asJsonFile(data: unknown): File {
  const json = JSON.stringify(data, null, 2);
  return new File([json], backupFileName(), { type: MIME });
}

async function shareNativeBackup(data: unknown): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const canShare = await Share.canShare();
  if (!canShare.value) return false;

  const fileName = backupFileName();
  const json = JSON.stringify(data, null, 2);
  const result = await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: "Track Anything backup",
    text: "Track Anything backup",
    files: [result.uri],
    dialogTitle: "Share backup",
  });
  return true;
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
      downloadFile(asJsonFile(await buildBackup()));
      setStatus("Exported backup.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    }
  };

  const shareData = async () => {
    setError("");
    setStatus("");
    try {
      const backup = await buildBackup();
      if (await shareNativeBackup(backup)) {
        setStatus("Shared backup.");
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
      downloadFile(file);
      setStatus("Sharing unavailable. Exported backup.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Share failed.");
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-narrow" onClick={(e) => e.stopPropagation()}>
        <h2>Data</h2>
        {error && <div className="error-banner">{error}</div>}
        {status && <p className="status-banner">{status}</p>}

        <div className="data-actions">
          <button type="button" className="btn" onClick={exportData}>
            Export
          </button>
          <button type="button" className="btn" onClick={shareData}>
            Share
          </button>
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileInputRef}
            className="file-picker"
            type="file"
            accept={`${MIME},.json`}
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
