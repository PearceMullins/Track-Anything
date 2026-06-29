/** Multi-profile storage for offline / Android builds. */

import { DEFAULT_PROFILE, normalizeProfileName } from "./profileNames";
import { LocalTrackStore, type PersistedPayload, emptyPayload } from "./store";

const ROOT_KEY = "track_anything_profiles";
const LEGACY_KEY = "track_anything_data";
const PROFILE_KEY_PREFIX = "track_anything_p:";

interface ProfileRoot {
  version: 2;
  active_profile: string;
  profile_names: string[];
  hidden_profiles: string[];
  custom_profiles: string[];
}

interface LegacyRootFile {
  active_profile?: string;
  profiles?: Record<string, PersistedPayload>;
  hidden_profiles?: string[];
  custom_profiles?: string[];
}

export interface AppDataExport {
  app: "track-anything";
  version: 2;
  exported_at: string;
  active_profile: string;
  profiles: Record<string, PersistedPayload>;
  hidden_profiles: string[];
  custom_profiles: string[];
}

function profileStorageKey(name: string): string {
  return `${PROFILE_KEY_PREFIX}${name}`;
}

export class ProfileManager {
  private active = DEFAULT_PROFILE;
  private profileNames: string[] = [DEFAULT_PROFILE];
  private hiddenProfiles = new Set<string>();
  private customProfiles = new Set<string>();
  private payloadCache: Record<string, PersistedPayload> = {};
  private store = new LocalTrackStore({ autosave: false });

  constructor() {
    this.store.setPersistHandler((payload) => this.persistActive(payload));
    this.load();
  }

  get activeProfile(): string {
    return this.active;
  }

  get trackStore(): LocalTrackStore {
    return this.store;
  }

  load(): void {
    this.migrateLegacyIfNeeded();
    const root = this.readRoot();
    this.active = normalizeProfileName(root.active_profile || DEFAULT_PROFILE);
    this.profileNames = [...new Set(root.profile_names.map(normalizeProfileName))];
    this.hiddenProfiles = new Set(root.hidden_profiles.map(normalizeProfileName));
    this.customProfiles = new Set(root.custom_profiles.map(normalizeProfileName));

    if (!this.profileNames.includes(this.active)) {
      this.profileNames.push(this.active);
    }
    if (!this.profileNames.includes(DEFAULT_PROFILE)) {
      this.profileNames.push(DEFAULT_PROFILE);
    }

    this.applyActive(this.readProfilePayload(this.active));
  }

  private migrateLegacyIfNeeded(): void {
    if (localStorage.getItem(ROOT_KEY)) return;

    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) {
      this.writeRoot({
        version: 2,
        active_profile: DEFAULT_PROFILE,
        profile_names: [DEFAULT_PROFILE],
        hidden_profiles: [],
        custom_profiles: [],
      });
      this.writeProfilePayload(DEFAULT_PROFILE, emptyPayload());
      return;
    }

    const parsed = JSON.parse(legacyRaw) as LegacyRootFile & PersistedPayload;
    if (parsed.profiles) {
      const names = Object.keys(parsed.profiles).map(normalizeProfileName);
      const active = normalizeProfileName(parsed.active_profile || DEFAULT_PROFILE);
      for (const [name, payload] of Object.entries(parsed.profiles)) {
        this.writeProfilePayload(normalizeProfileName(name), payload);
      }
      this.writeRoot({
        version: 2,
        active_profile: active,
        profile_names: names.length ? names : [DEFAULT_PROFILE],
        hidden_profiles: (parsed.hidden_profiles ?? []).map(normalizeProfileName),
        custom_profiles: (parsed.custom_profiles ?? []).map(normalizeProfileName),
      });
    } else {
      this.writeProfilePayload(DEFAULT_PROFILE, parsed as PersistedPayload);
      this.writeRoot({
        version: 2,
        active_profile: DEFAULT_PROFILE,
        profile_names: [DEFAULT_PROFILE],
        hidden_profiles: [],
        custom_profiles: [],
      });
    }

    localStorage.removeItem(LEGACY_KEY);
  }

  private readRoot(): ProfileRoot {
    const raw = localStorage.getItem(ROOT_KEY);
    if (!raw) {
      return {
        version: 2,
        active_profile: DEFAULT_PROFILE,
        profile_names: [DEFAULT_PROFILE],
        hidden_profiles: [],
        custom_profiles: [],
      };
    }
    return JSON.parse(raw) as ProfileRoot;
  }

  private writeRoot(root: ProfileRoot): void {
    localStorage.setItem(ROOT_KEY, JSON.stringify(root));
  }

  private readProfilePayload(name: string): PersistedPayload {
    const normalized = normalizeProfileName(name);
    const cached = this.payloadCache[normalized];
    if (cached) return cached;

    const raw = localStorage.getItem(profileStorageKey(normalized));
    const payload = raw ? (JSON.parse(raw) as PersistedPayload) : emptyPayload();
    this.payloadCache[normalized] = payload;
    return payload;
  }

  private writeProfilePayload(name: string, payload: PersistedPayload): void {
    const normalized = normalizeProfileName(name);
    this.payloadCache[normalized] = payload;
    localStorage.setItem(profileStorageKey(normalized), JSON.stringify(payload));
  }

  private normalizePayload(raw: unknown): PersistedPayload {
    const store = new LocalTrackStore({ autosave: false });
    store.loadPayload((raw ?? {}) as PersistedPayload);
    return store.toPayload();
  }

  private clearProfileStorage(): void {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith(PROFILE_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  }

  private persistActive(payload: PersistedPayload): void {
    this.writeProfilePayload(this.active, payload);
  }

  private applyActive(payload: PersistedPayload): void {
    this.store.loadPayload(payload);
  }

  private syncRoot(): void {
    this.writeRoot({
      version: 2,
      active_profile: this.active,
      profile_names: [...new Set(this.profileNames)].sort((a, b) => a.localeCompare(b)),
      hidden_profiles: [...this.hiddenProfiles].sort((a, b) => a.localeCompare(b)),
      custom_profiles: [...this.customProfiles].sort((a, b) => a.localeCompare(b)),
    });
  }

  dropdownProfiles(): string[] {
    const names = new Set(this.profileNames);
    this.customProfiles.forEach((n) => names.add(n));
    this.hiddenProfiles.forEach((n) => names.delete(n));
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  exportData(): AppDataExport {
    this.writeProfilePayload(this.active, this.store.clonePayload());
    const names = [...new Set([...this.profileNames, this.active])].sort((a, b) =>
      a.localeCompare(b),
    );
    const profiles: Record<string, PersistedPayload> = {};
    for (const name of names) {
      profiles[name] = this.normalizePayload(this.readProfilePayload(name));
    }

    return {
      app: "track-anything",
      version: 2,
      exported_at: new Date().toISOString(),
      active_profile: this.active,
      profiles,
      hidden_profiles: [...this.hiddenProfiles].sort((a, b) => a.localeCompare(b)),
      custom_profiles: [...this.customProfiles].sort((a, b) => a.localeCompare(b)),
    };
  }

  importData(raw: unknown): void {
    if (!raw || typeof raw !== "object") throw new Error("Backup file is not valid.");
    const data = raw as Partial<AppDataExport>;
    if (!data.profiles || typeof data.profiles !== "object") {
      throw new Error("Backup file is missing profiles.");
    }

    const nextProfiles: Record<string, PersistedPayload> = {};
    for (const [rawName, payload] of Object.entries(data.profiles as Record<string, unknown>)) {
      const name = normalizeProfileName(rawName);
      if (name) nextProfiles[name] = this.normalizePayload(payload);
    }
    if (Object.keys(nextProfiles).length === 0) throw new Error("Backup file has no profiles.");
    if (!nextProfiles[DEFAULT_PROFILE]) nextProfiles[DEFAULT_PROFILE] = emptyPayload();

    const active = normalizeProfileName(data.active_profile || DEFAULT_PROFILE);
    this.active = nextProfiles[active] ? active : DEFAULT_PROFILE;
    this.profileNames = Object.keys(nextProfiles).sort((a, b) => a.localeCompare(b));
    this.hiddenProfiles = new Set(
      (Array.isArray(data.hidden_profiles) ? data.hidden_profiles : [])
        .map(normalizeProfileName)
        .filter(Boolean),
    );
    this.customProfiles = new Set(
      (Array.isArray(data.custom_profiles) ? data.custom_profiles : [])
        .map(normalizeProfileName)
        .filter(Boolean),
    );
    this.payloadCache = {};
    this.clearProfileStorage();
    for (const [name, payload] of Object.entries(nextProfiles)) {
      this.writeProfilePayload(name, payload);
    }
    this.applyActive(this.readProfilePayload(this.active));
    this.syncRoot();
  }

  switchProfile(name: string): void {
    const normalized = normalizeProfileName(name);
    if (!normalized) throw new Error("Profile name cannot be empty.");

    this.writeProfilePayload(this.active, this.store.clonePayload());

    if (!this.profileNames.includes(normalized)) {
      this.profileNames.push(normalized);
      this.writeProfilePayload(normalized, emptyPayload());
      this.customProfiles.add(normalized);
    }

    this.active = normalized;
    this.hiddenProfiles.delete(normalized);
    this.customProfiles.delete(normalized);
    this.applyActive(this.readProfilePayload(normalized));
    this.syncRoot();
  }

  renameProfile(oldName: string, newName: string): void {
    const old = normalizeProfileName(oldName);
    const neu = normalizeProfileName(newName);
    if (!neu) throw new Error("Profile name cannot be empty.");
    if (old === neu) return;
    if (!this.profileNames.includes(old)) throw new Error("Profile not found.");

    const payload = this.readProfilePayload(old);
    this.writeProfilePayload(neu, payload);
    localStorage.removeItem(profileStorageKey(old));
    delete this.payloadCache[old];

    this.profileNames = this.profileNames.map((n) => (n === old ? neu : n));
    this.hiddenProfiles.add(old);
    this.hiddenProfiles.delete(neu);
    this.customProfiles.delete(old);
    if (this.active === old) this.active = neu;
    this.syncRoot();
    if (this.active === neu) this.applyActive(payload);
  }

  removeProfile(name: string): void {
    const normalized = normalizeProfileName(name);
    if (!this.profileNames.includes(normalized)) return;
    if (this.profileNames.length <= 1) {
      throw new Error("At least one profile must remain.");
    }

    localStorage.removeItem(profileStorageKey(normalized));
    delete this.payloadCache[normalized];
    this.profileNames = this.profileNames.filter((n) => n !== normalized);
    this.hiddenProfiles.add(normalized);
    this.customProfiles.delete(normalized);

    if (this.active === normalized) {
      this.active = this.profileNames.includes(DEFAULT_PROFILE)
        ? DEFAULT_PROFILE
        : this.profileNames[0];
      this.applyActive(this.readProfilePayload(this.active));
    }
    this.syncRoot();
  }

  removeNames(names: string[]): void {
    for (const name of names) {
      this.store.removeName(name);
    }
  }
}

let singleton: ProfileManager | null = null;

export function getProfileManager(): ProfileManager {
  if (!singleton) singleton = new ProfileManager();
  return singleton;
}

export function getLocalStore(): LocalTrackStore {
  return getProfileManager().trackStore;
}

export function resetProfileManagerForTests(): void {
  singleton = null;
}

export { ROOT_KEY as PROFILE_ROOT_KEY, profileStorageKey };
