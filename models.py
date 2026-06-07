"""Data models for fitness workout entries."""

from dataclasses import dataclass, asdict
from datetime import date, datetime, time
from typing import Any

UNIT_PRESETS = ("reps", "min", "mi", "lbs", "kg", "sec")


@dataclass
class WorkoutEntry:
    """A single logged workout session for one exercise."""

    exercise: str
    workout_date: str  # ISO format YYYY-MM-DD
    set_values: list[float]
    notes: str = ""
    logged_at: str = ""  # ISO datetime for chart ordering and history
    unit: str = "reps"  # reps, min, mi, lbs, etc.

    @property
    def volume(self) -> float:
        return sum(self.set_values)

    @property
    def set_count(self) -> int:
        return len(self.set_values)

    def format_value(self, value: float) -> str:
        text = str(int(value)) if value == int(value) else f"{value:g}"
        unit = normalize_unit(self.unit)
        return f"{text} {unit}" if unit else text

    @property
    def formatted_volume(self) -> str:
        return self.format_value(self.volume)

    @property
    def formatted_sets(self) -> str:
        return ", ".join(self.format_value(v) for v in self.set_values)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "WorkoutEntry":
        return cls(
            exercise=data["exercise"],
            workout_date=data["workout_date"],
            set_values=[float(v) for v in data["set_values"]],
            notes=data.get("notes", ""),
            logged_at=data.get("logged_at", ""),
            unit=data.get("unit", ""),
        )


def normalize_unit(unit: str) -> str:
    return " ".join(unit.strip().split())


def normalize_exercise_name(name: str) -> str:
    return " ".join(name.strip().split())


def today_iso() -> str:
    return date.today().isoformat()


def logged_at_for_workout_date(workout_date: str) -> str:
    """Timestamp used for ordering entries that share the same workout date."""
    picked = date.fromisoformat(workout_date)
    now = datetime.now()
    if picked == date.today():
        return datetime.combine(picked, now.time().replace(microsecond=0)).isoformat()
    return datetime.combine(picked, time(12, 0)).isoformat()
