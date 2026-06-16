"""Multi-profile storage — each profile has isolated history and dropdown lists."""

from __future__ import annotations

import json
from pathlib import Path

from data_store import TrackStore, empty_store_payload
from models import DEFAULT_PROFILE, normalize_profile_name
from paths import data_file, resolve_data_file


class ProfileManager:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or resolve_data_file()
        self._active = DEFAULT_PROFILE
        self._profiles: dict[str, dict] = {DEFAULT_PROFILE: empty_store_payload()}
        self._hidden_profiles: set[str] = set()
        self._custom_profiles: set[str] = set()
        self._store = TrackStore(path=None)
        self._store.set_persist_hook(self._persist_active)
        self.load()

    @property
    def store(self) -> TrackStore:
        return self._store

    @property
    def active_profile(self) -> str:
        return self._active

    def load(self) -> None:
        if not self.path.exists():
            self._profiles = {DEFAULT_PROFILE: empty_store_payload()}
            self._hidden_profiles = set()
            self._custom_profiles = set()
            self._active = DEFAULT_PROFILE
            self._apply_active()
            return

        with open(self.path, encoding="utf-8") as f:
            raw = json.load(f)

        if "profiles" in raw:
            self._active = normalize_profile_name(raw.get("active_profile", DEFAULT_PROFILE))
            self._profiles = {
                normalize_profile_name(name): payload
                for name, payload in raw.get("profiles", {}).items()
            }
            self._hidden_profiles = {
                normalize_profile_name(n) for n in raw.get("hidden_profiles", [])
            }
            self._custom_profiles = {
                normalize_profile_name(n) for n in raw.get("custom_profiles", [])
            }
        else:
            self._profiles = {DEFAULT_PROFILE: raw}
            self._hidden_profiles = set()
            self._custom_profiles = set()
            self._active = DEFAULT_PROFILE

        if self._active not in self._profiles:
            self._profiles[self._active] = empty_store_payload()
        if DEFAULT_PROFILE not in self._profiles:
            self._profiles[DEFAULT_PROFILE] = empty_store_payload()

        self._apply_active()

    def save_all(self) -> None:
        self._profiles[self._active] = self._store.to_payload()
        payload = {
            "active_profile": self._active,
            "profiles": self._profiles,
            "hidden_profiles": sorted(self._hidden_profiles, key=str.lower),
            "custom_profiles": sorted(self._custom_profiles, key=str.lower),
        }
        target = data_file()
        if self.path != target:
            self.path = target
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def _persist_active(self, profile_payload: dict) -> None:
        self._profiles[self._active] = profile_payload
        self.save_all()

    def _apply_active(self) -> None:
        self._store.load_from_payload(self._profiles[self._active])

    def profile_names(self) -> list[str]:
        return sorted(self._profiles.keys(), key=str.lower)

    def dropdown_profiles(self) -> list[str]:
        names: set[str] = set(self.profile_names())
        names |= self._custom_profiles
        names -= self._hidden_profiles
        return sorted(names, key=str.lower)

    def switch_profile(self, name: str) -> None:
        name = normalize_profile_name(name)
        if not name:
            raise ValueError("Profile name cannot be empty.")
        self._profiles[self._active] = self._store.to_payload()
        if name not in self._profiles:
            self._profiles[name] = empty_store_payload()
            self._custom_profiles.add(name)
        self._active = name
        self._hidden_profiles.discard(name)
        self._custom_profiles.discard(name)
        self._apply_active()
        self.save_all()

    def rename_profile(self, old_name: str, new_name: str) -> None:
        old = normalize_profile_name(old_name)
        new = normalize_profile_name(new_name)
        if not new:
            raise ValueError("Profile name cannot be empty.")
        if old == new:
            return
        if old not in self._profiles:
            raise ValueError("Profile not found.")

        self._profiles[new] = self._profiles.pop(old)
        self._hidden_profiles.add(old)
        self._hidden_profiles.discard(new)
        self._custom_profiles.discard(old)
        if old == self._active:
            self._active = new
        elif new not in self.profile_names():
            self._custom_profiles.add(new)
        self.save_all()
        if self._active == new:
            self._apply_active()

    def remove_profile(self, name: str) -> None:
        name = normalize_profile_name(name)
        if name not in self._profiles:
            return
        if len(self._profiles) <= 1:
            raise ValueError("At least one profile must remain.")
        del self._profiles[name]
        self._hidden_profiles.add(name)
        self._custom_profiles.discard(name)
        if self._active == name:
            self._active = DEFAULT_PROFILE if DEFAULT_PROFILE in self._profiles else next(iter(self._profiles))
            self._apply_active()
        self.save_all()

    def remove_names(self, names: list[str]) -> int:
        return self._store.remove_names(names)
