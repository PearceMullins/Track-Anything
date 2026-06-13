/** Offline API implementation used by Capacitor / local-storage builds. */

import type { Bootstrap, ChartPoint } from "../types";
import { buildBootstrap, entryFromInput, type EntryInput } from "./bootstrap";
import { getLocalStore } from "./store";

function bootstrap(): Bootstrap {
  return buildBootstrap(getLocalStore());
}

export function localFetchBootstrap(): Bootstrap {
  return bootstrap();
}

export function localCreateEntry(body: EntryInput): Bootstrap {
  const store = getLocalStore();
  store.add(entryFromInput(body));
  return bootstrap();
}

export function localUpdateEntry(index: number, body: EntryInput): Bootstrap {
  const store = getLocalStore();
  if (index < 0 || index >= store.entries.length) {
    throw new Error("Entry not found.");
  }
  const entry = entryFromInput(body);
  entry.logged_at = body.logged_at || store.entries[index].logged_at;
  store.update(index, entry);
  return bootstrap();
}

export function localDeleteEntry(index: number): Bootstrap {
  const store = getLocalStore();
  if (index < 0 || index >= store.entries.length) {
    throw new Error("Entry not found.");
  }
  store.delete(index);
  return bootstrap();
}

export function localFetchChart(name: string): { name: string; points: ChartPoint[] } {
  return { name, points: getLocalStore().historyPoints(name) };
}

export function localRenameName(oldValue: string, newValue: string): Bootstrap {
  getLocalStore().renameName(oldValue, newValue);
  return bootstrap();
}

export function localRemoveName(name: string): Bootstrap {
  getLocalStore().removeName(name);
  return bootstrap();
}

export function localRenameLabel(oldValue: string, newValue: string): Bootstrap {
  getLocalStore().renameSetLabel(oldValue, newValue);
  return bootstrap();
}

export function localRemoveLabel(name: string): Bootstrap {
  getLocalStore().removeSetLabel(name);
  return bootstrap();
}

export function localRenameValue(oldValue: string, newValue: string): Bootstrap {
  getLocalStore().renameValue(oldValue, newValue);
  return bootstrap();
}

export function localRemoveValue(name: string): Bootstrap {
  getLocalStore().removeValue(name);
  return bootstrap();
}
