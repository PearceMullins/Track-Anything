export type AppTab = "log" | "charts";

export interface EntryDraft {
  name: string;
  date: string;
  value: string;
  notes: string;
}

export interface ProfileUiSlice {
  entryDraft?: EntryDraft;
  /** ISO calendar day (YYYY-MM-DD) when entryDraft was last updated. */
  entryDraftDay?: string;
  chartSelected?: string[];
  historyDisplayNames?: string[];
  historyShowValues?: boolean;
  historyShowNotes?: boolean;
  /** @deprecated use historySelectedIndices */
  historySelected?: number | null;
  historySelectedIndices?: number[];
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

function normalizeDraft(raw: unknown): EntryDraft | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const draft = raw as Record<string, unknown>;
  if (typeof draft.value === "string") {
    return {
      name: String(draft.name ?? ""),
      date: String(draft.date ?? ""),
      value: draft.value,
      notes: String(draft.notes ?? ""),
    };
  }
  const rows = draft.rows as Array<{ label?: string; value?: string }> | undefined;
  const firstRow = rows?.find((row) => row.value?.trim());
  return {
    name: String(draft.name ?? ""),
    date: String(draft.date ?? ""),
    value: firstRow?.value?.trim() ?? "",
    notes: String(draft.notes ?? ""),
  };
}

function migrateLegacy(raw: Record<string, unknown>): UiState {
  const state = emptyUiState();
  if (raw.tab === "log" || raw.tab === "charts") {
    state.tab = raw.tab;
  }
  const legacySlice: ProfileUiSlice = {};
  const entryDraft = normalizeDraft(raw.entryDraft);
  if (entryDraft) legacySlice.entryDraft = entryDraft;
  if (raw.chartSelected) legacySlice.chartSelected = raw.chartSelected as string[];
  if (raw.historyDisplayNames) legacySlice.historyDisplayNames = raw.historyDisplayNames as string[];
  if (Array.isArray(raw.historySelectedIndices)) {
    legacySlice.historySelectedIndices = raw.historySelectedIndices as number[];
  } else if (raw.historySelected !== undefined && raw.historySelected !== null) {
    legacySlice.historySelectedIndices = [raw.historySelected as number];
  }
  if (Object.keys(legacySlice).length) {
    state.byProfile[DEFAULT_PROFILE_KEY] = legacySlice;
  }
  if (raw.byProfile && typeof raw.byProfile === "object") {
    const byProfile = raw.byProfile as Record<string, ProfileUiSlice>;
    for (const [profile, slice] of Object.entries(byProfile)) {
      state.byProfile[profile] = {
        ...slice,
        entryDraft: slice.entryDraft ? normalizeDraft(slice.entryDraft) : undefined,
      };
    }
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

export function exportUiState(): UiState {
  return JSON.parse(JSON.stringify(loadUiState())) as UiState;
}

export function importUiState(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  cachedState = migrateLegacy(raw as Record<string, unknown>);
  flushUiState();
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
