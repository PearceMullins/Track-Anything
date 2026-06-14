"""Data models for tracked entries."""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict, field
from datetime import date, datetime, time
from typing import Any

NAME_SUGGESTIONS = ("Calories", "Body Weight", "Pushups", "Pullups", "Running")

LABEL_SUGGESTIONS = ("first set", "second set", "third set", "Morning", "Evening", "Warm-up")

VALUE_SUGGESTIONS = ("10 reps", "5 reps", "20 reps", "3 miles", "30 minutes", "200 lbs", "150 lbs")

DEFAULT_PROFILE = "Default"


@dataclass
class WorkoutEntry:
    """A single logged session for one tracked name."""

    exercise: str
    workout_date: str  # ISO format YYYY-MM-DD
    set_values: list[str]
    set_labels: list[str] = field(default_factory=list)
    notes: str = ""
    logged_at: str = ""
    unit: str = ""  # legacy; no longer used in the UI

    def __post_init__(self) -> None:
        self.set_values = [canonical_value_text(v) for v in self.set_values]
        aligned = align_set_labels(self.set_labels, len(self.set_values))
        self.set_labels = [canonical_set_label(label) for label in aligned]

    @property
    def volume(self) -> float:
        return sum(parse_numeric_value(v) for v in self.set_values)

    @property
    def set_count(self) -> int:
        return len(self.set_values)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "WorkoutEntry":
        unit = normalize_unit(data.get("unit", ""))
        set_values = [_coerce_value_text(v, unit) for v in data["set_values"]]
        raw_labels = data.get("set_labels")
        set_labels = (
            align_set_labels([str(label) for label in raw_labels], len(set_values))
            if raw_labels is not None
            else align_set_labels([], len(set_values))
        )
        return cls(
            exercise=data["exercise"],
            workout_date=data["workout_date"],
            set_values=set_values,
            set_labels=set_labels,
            notes=data.get("notes", ""),
            logged_at=data.get("logged_at", ""),
            unit=unit,
        )


def normalize_unit(unit: str) -> str:
    return " ".join(unit.strip().split())


def normalize_exercise_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_profile_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_set_label(label: str) -> str:
    return " ".join(label.strip().split())


def normalize_value_text(value: str) -> str:
    return " ".join(value.strip().split())


def canonical_set_label(label: str) -> str:
    """Match preset suggestions by case-insensitive text (e.g. First set → first set)."""
    normalized = normalize_set_label(label)
    lower = normalized.casefold()
    for suggestion in LABEL_SUGGESTIONS:
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


def align_set_labels(labels: list[str], count: int) -> list[str]:
    normalized = [normalize_set_label(label) for label in labels]
    while len(normalized) < count:
        normalized.append("")
    return normalized[:count]


def today_iso() -> str:
    return date.today().isoformat()


def logged_at_for_workout_date(workout_date: str) -> str:
    """Timestamp used for ordering entries that share the same date."""
    picked = date.fromisoformat(workout_date)
    now = datetime.now()
    if picked == date.today():
        return datetime.combine(picked, now.time().replace(microsecond=0)).isoformat()
    return datetime.combine(picked, time(12, 0)).isoformat()
