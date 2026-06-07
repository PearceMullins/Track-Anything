"""JSON file persistence for workout history."""

import json
from datetime import datetime, timedelta
from pathlib import Path

from models import WorkoutEntry
from paths import data_file

DEFAULT_DATA_FILE = data_file()


class WorkoutStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or DEFAULT_DATA_FILE
        self._entries: list[WorkoutEntry] = []
        self.load()

    def load(self) -> None:
        if not self.path.exists():
            self._entries = []
            return
        with open(self.path, encoding="utf-8") as f:
            raw = json.load(f)
        self._entries = [WorkoutEntry.from_dict(item) for item in raw.get("entries", [])]
        if self._backfill_logged_at():
            self.save()

    def save(self) -> None:
        payload = {"entries": [e.to_dict() for e in self._entries]}
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    @property
    def entries(self) -> list[WorkoutEntry]:
        return list(self._entries)

    def add(self, entry: WorkoutEntry) -> None:
        self._entries.append(entry)
        self.save()

    def delete(self, index: int) -> None:
        if 0 <= index < len(self._entries):
            del self._entries[index]
            self.save()

    def exercise_names(self) -> list[str]:
        names = {e.exercise for e in self._entries}
        return sorted(names, key=str.lower)

    def entries_for_exercise(self, exercise: str) -> list[WorkoutEntry]:
        return [e for e in self._entries if e.exercise == exercise]

    def history_points(self, exercise: str) -> list[tuple[datetime, float]]:
        """Each logged entry is one chart point, positioned on its workout date."""
        entries = self.entries_for_exercise(exercise)
        entries.sort(key=lambda e: (e.workout_date, e.logged_at or ""))

        same_day: dict[str, int] = {}
        points: list[tuple[datetime, float]] = []
        for entry in entries:
            idx = same_day.get(entry.workout_date, 0)
            same_day[entry.workout_date] = idx + 1
            when = self._chart_datetime(entry.workout_date, idx)
            points.append((when, entry.volume))
        return points

    @staticmethod
    def _chart_datetime(workout_date: str, same_day_index: int = 0) -> datetime:
        base = datetime.strptime(workout_date, "%Y-%m-%d")
        return base.replace(hour=12, minute=0, second=0) + timedelta(minutes=same_day_index * 30)

    def _backfill_logged_at(self) -> bool:
        """Assign timestamps to older entries so each log is a distinct chart point."""
        changed = False
        counts: dict[tuple[str, str], int] = {}
        for entry in self._entries:
            if entry.logged_at:
                continue
            key = (entry.exercise, entry.workout_date)
            idx = counts.get(key, 0)
            counts[key] = idx + 1
            base = datetime.strptime(entry.workout_date, "%Y-%m-%d").replace(hour=8, minute=0)
            entry.logged_at = (base + timedelta(hours=idx * 2)).isoformat(timespec="seconds")
            changed = True
        return changed
