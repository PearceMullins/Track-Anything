export type AppTab = "log" | "charts";

export interface EntryDraftRow {
  label: string;
  value: string;
}

export interface EntryDraft {
  name: string;
  date: string;
  notes: string;
  rows: EntryDraftRow[];
}

export interface ProfileUiSlice {
  entryDraft?: EntryDraft;
  chartSelected?: string[];
  historyDisplayNames?: string[];
  historySelected?: number | null;
}

export interface UiState {
  tab: AppTab;
  byProfile: Record<string, ProfileUiSlice>;
}

const STORAGE_KEY = "track_anything_ui";
const DEFAULT_PROFILE_KEY = "Default";
const PERSIST_DELAY_MS = 500;

let cachedState: UiState | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function emptyUiState(): UiState {
  return { tab: "log", byProfile: {} };
}

function migrateLegacy(raw: Record<string, unknown>): UiState {
  const state = emptyUiState();
  if (raw.tab === "log" || raw.tab === "charts") {
    state.tab = raw.tab;
  }
  const legacySlice: ProfileUiSlice = {};
  if (raw.entryDraft) legacySlice.entryDraft = raw.entryDraft as EntryDraft;
  if (raw.chartSelected) legacySlice.chartSelected = raw.chartSelected as string[];
  if (raw.historyDisplayNames) legacySlice.historyDisplayNames = raw.historyDisplayNames as string[];
  if (raw.historySelected !== undefined) legacySlice.historySelected = raw.historySelected as number | null;
  if (Object.keys(legacySlice).length) {
    state.byProfile[DEFAULT_PROFILE_KEY] = legacySlice;
  }
  if (raw.byProfile && typeof raw.byProfile === "object") {
    state.byProfile = { ...state.byProfile, ...(raw.byProfile as Record<string, ProfileUiSlice>) };
  }
  return state;
}

function readFromStorage(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyUiState();
    return migrateLegacy(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return emptyUiState();
  }
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushUiState();
  }, PERSIST_DELAY_MS);
}

export function flushUiState(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!cachedState) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
}

export function loadUiState(): UiState {
  if (!cachedState) {
    cachedState = readFromStorage();
  }
  return cachedState;
}

export function saveUiState(patch: Partial<UiState>): void {
  cachedState = { ...loadUiState(), ...patch };
  schedulePersist();
}

export function loadUiSlice(profile: string): ProfileUiSlice {
  return loadUiState().byProfile[profile] ?? {};
}

export function saveUiSlice(profile: string, patch: Partial<ProfileUiSlice>): void {
  const current = loadUiState();
  const byProfile = { ...current.byProfile };
  byProfile[profile] = { ...(byProfile[profile] ?? {}), ...patch };
  cachedState = { ...current, byProfile };
  schedulePersist();
}

export function clearEntryDraft(profile: string, draft: EntryDraft): void {
  saveUiSlice(profile, { entryDraft: draft });
  flushUiState();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushUiState);
}
