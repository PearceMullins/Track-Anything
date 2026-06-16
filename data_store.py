"""JSON file persistence for tracked entry history."""

import json
from datetime import datetime, timedelta
from pathlib import Path

from typing import Callable

from models import (
    NAME_SUGGESTIONS,
    LABEL_SUGGESTIONS,
    VALUE_SUGGESTIONS,
    TrackEntry,
    normalize_exercise_name,
    normalize_set_label,
    normalize_unit,
    normalize_value_text,
    canonical_set_label,
    canonical_value_text,
)
from paths import data_file

DEFAULT_DATA_FILE = data_file()


def empty_store_payload() -> dict:
    return {
        "entries": [],
        "hidden_names": [],
        "custom_names": [],
        "hidden_units": [],
        "custom_units": [],
        "hidden_set_labels": [],
        "custom_set_labels": [],
        "hidden_values": [],
        "custom_values": [],
    }


class TrackStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path
        self._on_persist: Callable[[dict], None] | None = None
        self._entries: list[TrackEntry] = []
        self._hidden_names: set[str] = set()
        self._custom_names: set[str] = set()
        self._hidden_units: set[str] = set()
        self._custom_units: set[str] = set()
        self._hidden_set_labels: set[str] = set()
        self._custom_set_labels: set[str] = set()
        self._hidden_values: set[str] = set()
        self._custom_values: set[str] = set()
        if self.path is not None:
            self.load()

    def set_persist_hook(self, hook: Callable[[dict], None] | None) -> None:
        self._on_persist = hook

    def load(self) -> None:
        if self.path is None or not self.path.exists():
            self._reset_empty()
            return
        with open(self.path, encoding="utf-8") as f:
            raw = json.load(f)
        if "profiles" in raw:
            self._reset_empty()
            return
        self.load_from_payload(raw)

    def _reset_empty(self) -> None:
        self._entries = []
        self._hidden_names = set()
        self._custom_names = set()
        self._hidden_units = set()
        self._custom_units = set()
        self._hidden_set_labels = set()
        self._custom_set_labels = set()
        self._hidden_values = set()
        self._custom_values = set()

    def to_payload(self) -> dict:
        return {
            "entries": [e.to_dict() for e in self._entries],
            "hidden_names": sorted(self._hidden_names, key=str.lower),
            "custom_names": sorted(self._custom_names, key=str.lower),
            "hidden_units": sorted(self._hidden_units, key=str.lower),
            "custom_units": sorted(self._custom_units, key=str.lower),
            "hidden_set_labels": sorted(self._hidden_set_labels, key=str.lower),
            "custom_set_labels": sorted(self._custom_set_labels, key=str.lower),
            "hidden_values": sorted(self._hidden_values, key=str.lower),
            "custom_values": sorted(self._custom_values, key=str.lower),
        }

    def load_from_payload(self, raw: dict) -> None:
        self._entries = [TrackEntry.from_dict(item) for item in raw.get("entries", [])]
        self._hidden_names = {normalize_exercise_name(n) for n in raw.get("hidden_names", [])}
        self._custom_names = {normalize_exercise_name(n) for n in raw.get("custom_names", [])}
        self._hidden_units = {normalize_unit(u) for u in raw.get("hidden_units", [])}
        self._custom_units = {normalize_unit(u) for u in raw.get("custom_units", [])}
        self._hidden_set_labels = {normalize_set_label(l) for l in raw.get("hidden_set_labels", [])}
        self._custom_set_labels = {normalize_set_label(l) for l in raw.get("custom_set_labels", [])}
        self._hidden_values = {normalize_value_text(v) for v in raw.get("hidden_values", [])}
        self._custom_values = {normalize_value_text(v) for v in raw.get("custom_values", [])}
        self._backfill_logged_at()
        if self._canonicalize_custom_lists():
            self.save()

    def save(self) -> None:
        payload = self.to_payload()
        if self._on_persist:
            self._on_persist(payload)
        elif self.path is not None:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)

    @property
    def entries(self) -> list[TrackEntry]:
        return list(self._entries)

    def add(self, entry: TrackEntry) -> None:
        self._entries.append(entry)
        self._remember_entry_lists(entry)
        self.save()

    def _remember_entry_lists(self, entry: TrackEntry) -> None:
        self._hidden_names.discard(normalize_exercise_name(entry.exercise))
        for label in entry.set_labels:
            normalized = normalize_set_label(label)
            if normalized:
                self._hidden_set_labels.discard(normalized)
        for value in entry.set_values:
            normalized = normalize_value_text(value)
            if normalized:
                self._hidden_values.discard(normalized)

    def delete(self, index: int) -> None:
        if 0 <= index < len(self._entries):
            del self._entries[index]
            self.save()

    def update(self, index: int, entry: TrackEntry) -> None:
        if 0 <= index < len(self._entries):
            if not entry.logged_at:
                entry.logged_at = self._entries[index].logged_at
            self._entries[index] = entry
            self._hidden_names.discard(normalize_exercise_name(entry.exercise))
            self._remember_entry_lists(entry)
            self.save()

    def exercise_names(self) -> list[str]:
        names = {e.exercise for e in self._entries}
        return sorted(names, key=str.lower)

    def dropdown_names(self) -> list[str]:
        names: set[str] = set(self.exercise_names())
        names |= self._custom_names
        for suggestion in NAME_SUGGESTIONS:
            if suggestion not in self._hidden_names:
                names.add(suggestion)
        names -= self._hidden_names
        return sorted(names, key=str.lower)

    def rename_name(self, old_name: str, new_name: str) -> None:
        old = normalize_exercise_name(old_name)
        new = normalize_exercise_name(new_name)
        if not new:
            raise ValueError("Name cannot be empty.")
        if old == new:
            return

        had_entries = False
        for entry in self._entries:
            if entry.exercise == old:
                entry.exercise = new
                had_entries = True

        self._hidden_names.add(old)
        self._hidden_names.discard(new)
        self._custom_names.discard(old)

        if not had_entries and new not in self.exercise_names():
            self._custom_names.add(new)
        else:
            self._custom_names.discard(new)

        self.save()

    def remove_name(self, name: str) -> int:
        name = normalize_exercise_name(name)
        before = len(self._entries)
        self._entries = [e for e in self._entries if e.exercise != name]
        deleted = before - len(self._entries)

        self._hidden_names.add(name)
        self._custom_names.discard(name)
        self.save()
        return deleted

    def remove_names(self, names: list[str]) -> int:
        total = 0
        for name in names:
            total += self.remove_name(name)
        return total

    def used_units(self) -> set[str]:
        return {normalize_unit(e.unit) for e in self._entries if normalize_unit(e.unit)}

    def dropdown_units(self) -> list[str]:
        units: set[str] = set(self.used_units())
        units |= self._custom_units
        units -= self._hidden_units
        return sorted(units, key=str.lower)

    def rename_unit(self, old_unit: str, new_unit: str) -> None:
        old = normalize_unit(old_unit)
        new = normalize_unit(new_unit)
        if not new:
            raise ValueError("Unit cannot be empty.")
        if old == new:
            return

        had_entries = False
        for entry in self._entries:
            if normalize_unit(entry.unit) == old:
                entry.unit = new
                had_entries = True

        self._hidden_units.add(old)
        self._hidden_units.discard(new)
        self._custom_units.discard(old)

        if not had_entries and new not in self.used_units():
            self._custom_units.add(new)
        else:
            self._custom_units.discard(new)

        self.save()

    def remove_unit(self, unit: str) -> None:
        unit = normalize_unit(unit)
        self._hidden_units.add(unit)
        self._custom_units.discard(unit)
        self.save()

    def used_set_labels(self) -> set[str]:
        labels: set[str] = set()
        for entry in self._entries:
            for label in entry.set_labels:
                normalized = normalize_set_label(label)
                if normalized:
                    labels.add(normalized)
        return labels

    def dropdown_set_labels(self) -> list[str]:
        labels: set[str] = set(self.used_set_labels())
        labels |= self._custom_set_labels
        for suggestion in LABEL_SUGGESTIONS:
            if suggestion not in self._hidden_set_labels:
                labels.add(suggestion)
        labels -= self._hidden_set_labels
        return sorted({canonical_set_label(l) for l in labels}, key=str.lower)

    def rename_set_label(self, old_label: str, new_label: str) -> None:
        old = normalize_set_label(old_label)
        new = normalize_set_label(new_label)
        if not new:
            raise ValueError("Set label cannot be empty.")
        if old == new:
            return

        had_entries = False
        for entry in self._entries:
            for i, label in enumerate(entry.set_labels):
                if normalize_set_label(label) == old:
                    entry.set_labels[i] = new
                    had_entries = True

        self._hidden_set_labels.add(old)
        self._hidden_set_labels.discard(new)
        self._custom_set_labels.discard(old)

        if not had_entries and new not in self.used_set_labels():
            self._custom_set_labels.add(new)
        else:
            self._custom_set_labels.discard(new)

        self.save()

    def remove_set_label(self, label: str) -> None:
        label = normalize_set_label(label)
        self._hidden_set_labels.add(label)
        self._custom_set_labels.discard(label)
        self.save()

    def used_values(self) -> set[str]:
        values: set[str] = set()
        for entry in self._entries:
            for value in entry.set_values:
                normalized = normalize_value_text(value)
                if normalized:
                    values.add(normalized)
        return values

    def dropdown_values(self) -> list[str]:
        values: set[str] = set(self.used_values())
        values |= self._custom_values
        for suggestion in VALUE_SUGGESTIONS:
            if suggestion not in self._hidden_values:
                values.add(suggestion)
        values -= self._hidden_values
        return sorted({canonical_value_text(v) for v in values}, key=str.lower)

    def rename_value(self, old_value: str, new_value: str) -> None:
        old = normalize_value_text(old_value)
        new = normalize_value_text(new_value)
        if not new:
            raise ValueError("Value cannot be empty.")
        if old == new:
            return

        had_entries = False
        for entry in self._entries:
            for i, value in enumerate(entry.set_values):
                if normalize_value_text(value) == old:
                    entry.set_values[i] = new
                    had_entries = True

        self._hidden_values.add(old)
        self._hidden_values.discard(new)
        self._custom_values.discard(old)

        if not had_entries and new not in self.used_values():
            self._custom_values.add(new)
        else:
            self._custom_values.discard(new)

        self.save()

    def remove_value(self, value: str) -> None:
        value = normalize_value_text(value)
        self._hidden_values.add(value)
        self._custom_values.discard(value)
        self.save()

    def entries_for_exercise(self, exercise: str) -> list[TrackEntry]:
        return [e for e in self._entries if e.exercise == exercise]

    def history_points(self, exercise: str) -> list[tuple[datetime, float]]:
        """Each logged entry is one chart point, positioned on its entry date."""
        entries = self.entries_for_exercise(exercise)
        entries.sort(key=lambda e: (e.entry_date, e.logged_at or ""))

        same_day: dict[str, int] = {}
        points: list[tuple[datetime, float]] = []
        for entry in entries:
            idx = same_day.get(entry.entry_date, 0)
            same_day[entry.entry_date] = idx + 1
            when = self._chart_datetime(entry.entry_date, idx)
            points.append((when, entry.volume))
        return points

    @staticmethod
    def _chart_datetime(entry_date: str, same_day_index: int = 0) -> datetime:
        base = datetime.strptime(entry_date, "%Y-%m-%d")
        return base.replace(hour=12, minute=0, second=0) + timedelta(minutes=same_day_index * 30)

    def _backfill_logged_at(self) -> bool:
        """Assign timestamps to older entries so each log is a distinct chart point."""
        changed = False
        counts: dict[tuple[str, str], int] = {}
        for entry in self._entries:
            if entry.logged_at:
                continue
            key = (entry.exercise, entry.entry_date)
            idx = counts.get(key, 0)
            counts[key] = idx + 1
            base = datetime.strptime(entry.entry_date, "%Y-%m-%d").replace(hour=8, minute=0)
            entry.logged_at = (base + timedelta(hours=idx * 2)).isoformat(timespec="seconds")
            changed = True
        return changed

    def _canonicalize_custom_lists(self) -> bool:
        """Fold custom label/value lists to canonical suggestion casing."""
        new_labels = {canonical_set_label(l) for l in self._custom_set_labels}
        new_values = {canonical_value_text(v) for v in self._custom_values}
        changed = new_labels != self._custom_set_labels or new_values != self._custom_values
        self._custom_set_labels = new_labels
        self._custom_values = new_values
        return changed
