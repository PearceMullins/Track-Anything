/** Offline API implementation used by Capacitor / local-storage builds. */

import type { Bootstrap, ChartPoint } from "../types";
import { buildBootstrap, entryFromInput, type EntryInput } from "./bootstrap";
import { getProfileManager } from "./profileManager";

function bootstrap(): Bootstrap {
  const pm = getProfileManager();
  return buildBootstrap(pm.trackStore, pm.activeProfile, pm.dropdownProfiles());
}

export function localFetchBootstrap(): Bootstrap {
  return bootstrap();
}

export function localCreateEntry(body: EntryInput): Bootstrap {
  getProfileManager().trackStore.add(entryFromInput(body));
  return bootstrap();
}

export function localUpdateEntry(index: number, body: EntryInput): Bootstrap {
  const store = getProfileManager().trackStore;
  if (index < 0 || index >= store.entries.length) {
    throw new Error("Entry not found.");
  }
  const entry = entryFromInput(body);
  entry.logged_at = body.logged_at || store.entries[index].logged_at;
  store.update(index, entry);
  return bootstrap();
}

export function localDeleteEntry(index: number): Bootstrap {
  const store = getProfileManager().trackStore;
  if (index < 0 || index >= store.entries.length) {
    throw new Error("Entry not found.");
  }
  store.delete(index);
  return bootstrap();
}

export function localFetchChart(name: string): { name: string; points: ChartPoint[] } {
  return { name, points: getProfileManager().trackStore.historyPoints(name) };
}

export function localRenameName(oldValue: string, newValue: string): Bootstrap {
  getProfileManager().trackStore.renameName(oldValue, newValue);
  return bootstrap();
}

export function localRemoveName(name: string): Bootstrap {
  getProfileManager().trackStore.removeName(name);
  return bootstrap();
}

export function localDeleteNames(names: string[]): Bootstrap {
  getProfileManager().removeNames(names);
  return bootstrap();
}

export function localSwitchProfile(name: string): Bootstrap {
  getProfileManager().switchProfile(name);
  return bootstrap();
}

export function localRenameProfile(oldValue: string, newValue: string): Bootstrap {
  getProfileManager().renameProfile(oldValue, newValue);
  return bootstrap();
}

export function localRemoveProfile(name: string): Bootstrap {
  getProfileManager().removeProfile(name);
  return bootstrap();
}

export function localRenameLabel(oldValue: string, newValue: string): Bootstrap {
  getProfileManager().trackStore.renameSetLabel(oldValue, newValue);
  return bootstrap();
}

export function localRemoveLabel(name: string): Bootstrap {
  getProfileManager().trackStore.removeSetLabel(name);
  return bootstrap();
}

export function localRenameValue(oldValue: string, newValue: string): Bootstrap {
  getProfileManager().trackStore.renameValue(oldValue, newValue);
  return bootstrap();
}

export function localRemoveValue(name: string): Bootstrap {
  getProfileManager().trackStore.removeValue(name);
  return bootstrap();
}
