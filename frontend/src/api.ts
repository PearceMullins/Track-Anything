import type { Bootstrap, ChartPoint } from "./types";
import { isLocalMode } from "./data/config";
import type { EntryInput } from "./data/bootstrap";
import * as local from "./data/localApi";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: string | { msg: string }[] }).detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg
          : `Request failed (${res.status})`;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function runLocal<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

export function fetchBootstrap(): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(local.localFetchBootstrap);
  return request("/bootstrap");
}

export function createEntry(body: unknown): Promise<Bootstrap> {
  if (isLocalMode()) {
    return runLocal(() => local.localCreateEntry(body as EntryInput));
  }
  return request("/entries", { method: "POST", body: JSON.stringify(body) });
}

export function updateEntry(index: number, body: unknown): Promise<Bootstrap> {
  if (isLocalMode()) {
    return runLocal(() => local.localUpdateEntry(index, body as EntryInput));
  }
  return request(`/entries/${index}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteEntry(index: number): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localDeleteEntry(index));
  return request(`/entries/${index}`, { method: "DELETE" });
}

export function fetchChart(name: string): Promise<{ name: string; points: ChartPoint[] }> {
  if (isLocalMode()) return runLocal(() => local.localFetchChart(name));
  return request(`/charts/${encodeURIComponent(name)}`);
}

export function renameName(oldValue: string, newValue: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRenameName(oldValue, newValue));
  return request("/names/rename", {
    method: "POST",
    body: JSON.stringify({ old_value: oldValue, new_value: newValue }),
  });
}

export function removeName(name: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRemoveName(name));
  return request("/names/remove", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameLabel(oldValue: string, newValue: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRenameLabel(oldValue, newValue));
  return request("/labels/rename", {
    method: "POST",
    body: JSON.stringify({ old_value: oldValue, new_value: newValue }),
  });
}

export function removeLabel(name: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRemoveLabel(name));
  return request("/labels/remove", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameValue(oldValue: string, newValue: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRenameValue(oldValue, newValue));
  return request("/values/rename", {
    method: "POST",
    body: JSON.stringify({ old_value: oldValue, new_value: newValue }),
  });
}

export function removeValue(name: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRemoveValue(name));
  return request("/values/remove", { method: "POST", body: JSON.stringify({ name }) });
}

export function deleteAllNames(names: string[]): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localDeleteNames(names));
  return request("/names/delete-all", { method: "POST", body: JSON.stringify({ names }) });
}

export function switchProfile(name: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localSwitchProfile(name));
  return request("/profiles/switch", { method: "POST", body: JSON.stringify({ name }) });
}

export function renameProfile(oldValue: string, newValue: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRenameProfile(oldValue, newValue));
  return request("/profiles/rename", {
    method: "POST",
    body: JSON.stringify({ old_value: oldValue, new_value: newValue }),
  });
}

export function removeProfile(name: string): Promise<Bootstrap> {
  if (isLocalMode()) return runLocal(() => local.localRemoveProfile(name));
  return request("/profiles/remove", { method: "POST", body: JSON.stringify({ name }) });
}
