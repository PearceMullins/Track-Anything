import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const BACKUP_MIME = "application/json";
const BACKUP_PREFIX = "track-anything-backup-";

interface BackupImportPayload {
  id?: string;
  fileName?: string;
  data?: string;
}

export interface NativeBackupImport {
  id: string;
  file: File;
}

interface BackupFilePlugin {
  saveJson(options: { fileName: string; data: string; mimeType: string }): Promise<{ uri?: string }>;
  getPendingImport(): Promise<BackupImportPayload>;
  addListener(
    eventName: "backupImport",
    listenerFunc: (payload: BackupImportPayload) => void,
  ): Promise<PluginListenerHandle>;
}

const BackupFile = registerPlugin<BackupFilePlugin>("BackupFile");

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `${BACKUP_PREFIX}${stamp}.json`;
}

export function asJsonFile(data: unknown, fileName = backupFileName()): File {
  const json = JSON.stringify(data, null, 2);
  return new File([json], fileName, { type: BACKUP_MIME });
}

export function asJsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

async function writeBackupJson(json: string, fileName: string, directory: Directory) {
  return Filesystem.writeFile({
    path: fileName,
    data: json,
    directory,
    encoding: Encoding.UTF8,
  });
}

async function ensureDocumentsPermission(): Promise<void> {
  const status = await Filesystem.checkPermissions();
  if (status.publicStorage === "granted") return;

  if (status.publicStorage === "prompt" || status.publicStorage === "prompt-with-rationale") {
    const nextStatus = await Filesystem.requestPermissions();
    if (nextStatus.publicStorage === "granted") return;
  }

  throw new Error("Storage permission denied.");
}

function base64ToText(data: string): string {
  const payload = data.includes(",") ? data.split(",").pop() ?? "" : data;
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function fileFromPayload(payload: BackupImportPayload): NativeBackupImport | null {
  if (!payload.data) return null;
  const fileName = payload.fileName || backupFileName();
  return {
    id: payload.id || `${fileName}-${payload.data.length}`,
    file: new File([payload.data], fileName, { type: BACKUP_MIME }),
  };
}

function fileNameFromUrl(url: string): string {
  const withoutQuery = url.split("?")[0];
  const name = withoutQuery.split("/").pop();
  return name ? decodeURIComponent(name) : backupFileName();
}

function shouldReadOpenUrl(url: string): boolean {
  const lower = decodeURIComponent(url).toLowerCase();
  return lower.endsWith(".json") || lower.includes(BACKUP_PREFIX);
}

async function fileFromOpenUrl(event: URLOpenListenerEvent): Promise<NativeBackupImport | null> {
  if (!event.url || !shouldReadOpenUrl(event.url)) return null;
  const result = await Filesystem.readFile({
    path: event.url,
    encoding: Encoding.UTF8,
  });
  if (typeof result.data !== "string") return null;

  return {
    id: `ios-${event.url}`,
    file: new File([result.data], fileNameFromUrl(event.url), { type: BACKUP_MIME }),
  };
}

export async function saveNativeBackup(data: unknown): Promise<{ fileName: string; json: string }> {
  const fileName = backupFileName();
  const json = asJsonText(data);

  if (Capacitor.getPlatform() === "android") {
    await BackupFile.saveJson({ fileName, data: json, mimeType: BACKUP_MIME });
    return { fileName, json };
  }

  await ensureDocumentsPermission();
  await writeBackupJson(json, fileName, Directory.Documents);

  return { fileName, json };
}

export async function shareNativeBackup(data: unknown): Promise<{ fileName: string; json: string }> {
  const fileName = backupFileName();
  const json = asJsonText(data);
  const canShare = await Share.canShare();
  if (!canShare.value) throw new Error("Sharing unavailable.");

  const cached = await writeBackupJson(json, fileName, Directory.Cache);
  await Share.share({
    title: "Track Anything backup",
    text: "Track Anything backup attached. To import it later, open this file and choose Track Anything.",
    files: [cached.uri],
    dialogTitle: "Share backup file",
  });

  return { fileName, json };
}

export async function pickNativeBackupFile(): Promise<File | null> {
  const result = await FilePicker.pickFiles({ readData: true });
  const picked = result.files[0];
  if (!picked) return null;

  const fileName = picked.name || backupFileName();
  const fileType = picked.mimeType || BACKUP_MIME;

  if (picked.blob) return new File([picked.blob], fileName, { type: fileType });
  if (picked.data) return new File([base64ToText(picked.data)], fileName, { type: fileType });

  throw new Error("Could not read selected file.");
}

export async function getPendingNativeBackupImport(): Promise<NativeBackupImport | null> {
  if (!isNativeApp() || Capacitor.getPlatform() !== "android") return null;
  return fileFromPayload(await BackupFile.getPendingImport());
}

export async function addNativeBackupImportListener(
  onImport: (incoming: NativeBackupImport) => void,
): Promise<PluginListenerHandle[]> {
  if (!isNativeApp()) return [];

  if (Capacitor.getPlatform() === "android") {
    const handle = await BackupFile.addListener("backupImport", (payload) => {
      const incoming = fileFromPayload(payload);
      if (incoming) onImport(incoming);
    });
    return [handle];
  }

  const handle = await App.addListener("appUrlOpen", async (event) => {
    const incoming = await fileFromOpenUrl(event);
    if (incoming) onImport(incoming);
  });
  return [handle];
}

export function downloadBackupFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
