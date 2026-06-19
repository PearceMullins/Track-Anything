"""Data models for tracked entries."""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from datetime import date, datetime, time
from typing import Any

NAME_SUGGESTIONS = ("Calories", "Body Weight", "Pushups", "Pullups", "Running")

VALUE_SUGGESTIONS = ("10 reps", "5 reps", "20 reps", "3 miles", "30 minutes", "200 lbs", "150 lbs")

NOTE_SUGGESTIONS = ("Morning", "Evening", "Felt good", "PR day")

DEFAULT_PROFILE = "Default"


@dataclass
class TrackEntry:
    """A single logged session for one tracked name."""

    exercise: str
    entry_date: str  # ISO format YYYY-MM-DD
    value: str
    notes: str = ""
    logged_at: str = ""

    def __post_init__(self) -> None:
        self.value = canonical_value_text(self.value)

    @property
    def numeric_value(self) -> float:
        return parse_numeric_value(self.value)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TrackEntry":
        entry_date = data.get("entry_date") or data.get("workout_date")
        if not entry_date:
            raise KeyError("entry_date")
        if data.get("value"):
            return cls(
                exercise=data["exercise"],
                entry_date=entry_date,
                value=str(data["value"]),
                notes=data.get("notes", ""),
                logged_at=data.get("logged_at", ""),
            )
        if data.get("set_values"):
            return _migrate_legacy_entry(data, entry_date)
        return cls(
            exercise=data["exercise"],
            entry_date=entry_date,
            value="",
            notes=data.get("notes", ""),
            logged_at=data.get("logged_at", ""),
        )


def _migrate_legacy_entry(data: dict[str, Any], entry_date: str) -> "TrackEntry":
    unit = normalize_unit(data.get("unit", ""))
    set_values = [_coerce_value_text(v, unit) for v in data["set_values"]]
    set_labels = [str(label) for label in data.get("set_labels") or []]
    value = canonical_value_text(set_values[0]) if set_values else ""
    notes = str(data.get("notes", ""))
    if len(set_values) > 1:
        extra_parts = []
        for i, row_value in enumerate(set_values[1:], start=2):
            label = set_labels[i - 1].strip() if i - 1 < len(set_labels) and set_labels[i - 1].strip() else f"Row {i}"
            extra_parts.append(f"{label}: {row_value}")
        extra = "; ".join(extra_parts)
        notes = f"{notes}\n{extra}".strip() if notes else extra
    return TrackEntry(
        exercise=data["exercise"],
        entry_date=entry_date,
        value=value,
        notes=notes,
        logged_at=data.get("logged_at", ""),
    )


def normalize_unit(unit: str) -> str:
    return " ".join(unit.strip().split())


def normalize_exercise_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_profile_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_value_text(value: str) -> str:
    return " ".join(value.strip().split())


def normalize_note_text(note: str) -> str:
    return note.strip()


def canonical_note_text(note: str) -> str:
    normalized = normalize_note_text(note)
    lower = normalized.casefold()
    for suggestion in NOTE_SUGGESTIONS:
        if suggestion.casefold() == lower:
            return suggestion
    return normalized


def canonical_value_text(value: str) -> str:
    normalized = normalize_value_text(value)
    lower = normalized.casefold()
    for suggestion in VALUE_SUGGESTIONS:
        if suggestion.casefold() == lower:
            return suggestion
    return normalized


def parse_numeric_value(text: str) -> float:
    match = re.search(r"[-+]?\d*\.?\d+", text)
    if not match:
        return 0.0
    try:
        return float(match.group())
    except ValueError:
        return 0.0


def _coerce_value_text(raw: Any, unit: str) -> str:
    if isinstance(raw, str):
        return normalize_value_text(raw)
    number = float(raw)
    text = str(int(number)) if number == int(number) else f"{number:g}"
    if unit:
        return f"{text} {unit}"
    return text


def today_iso() -> str:
    return date.today().isoformat()


def logged_at_for_entry_date(entry_date: str) -> str:
    """Timestamp used for ordering entries that share the same date."""
    picked = date.fromisoformat(entry_date)
    now = datetime.now()
    if picked == date.today():
        return datetime.combine(picked, now.time().replace(microsecond=0)).isoformat()
    return datetime.combine(picked, time(12, 0)).isoformat()
