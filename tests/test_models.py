"""Unit tests for models.py."""

from datetime import date

from models import (
    TrackEntry,
    normalize_exercise_name,
    normalize_value_text,
    parse_numeric_value,
)


def test_parse_numeric_value_extracts_numbers():
    assert parse_numeric_value("10 reps") == 10.0
    assert parse_numeric_value("345 lbs") == 345.0
    assert parse_numeric_value("3.5 miles") == 3.5
    assert parse_numeric_value("no number") == 0.0


def test_track_entry_numeric_value():
    entry = TrackEntry(
        exercise="Pushups",
        entry_date="2026-06-11",
        value="10 reps",
    )
    assert entry.numeric_value == 10.0


def test_track_entry_migrates_legacy_workout_date():
    entry = TrackEntry.from_dict(
        {
            "exercise": "Pages read",
            "workout_date": "2026-01-15",
            "set_values": ["20 pages"],
        }
    )
    assert entry.entry_date == "2026-01-15"
    assert entry.value == "20 pages"


def test_track_entry_migrates_legacy_rows():
    entry = TrackEntry.from_dict(
        {
            "exercise": "Bench",
            "entry_date": "2026-01-01",
            "set_values": ["10 reps", "12.5 reps"],
            "set_labels": ["Set 1", "Set 2"],
            "notes": "Good day",
        }
    )
    assert entry.value == "10 reps"
    assert "Set 2" in entry.notes


def test_track_entry_migrates_legacy_numeric_values():
    entry = TrackEntry.from_dict(
        {
            "exercise": "Bench",
            "entry_date": "2026-01-01",
            "set_values": [10],
            "unit": "reps",
        }
    )
    assert entry.value == "10 reps"


def test_normalize_strips_extra_whitespace():
    assert normalize_exercise_name("  Pushups  ") == "Pushups"
    assert normalize_value_text("  10   reps ") == "10 reps"


def test_track_entry_round_trip_dict():
    original = TrackEntry(
        exercise="Running",
        entry_date=date.today().isoformat(),
        value="3.1 miles",
        notes="Felt good",
        logged_at="2026-06-11T08:00:00",
    )
    restored = TrackEntry.from_dict(original.to_dict())
    assert restored.exercise == original.exercise
    assert restored.value == original.value
    assert restored.notes == original.notes
