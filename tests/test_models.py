"""Unit tests for models.py."""

from datetime import date

import pytest

from models import (
    TrackEntry,
    align_set_labels,
    normalize_exercise_name,
    normalize_value_text,
    parse_numeric_value,
)


def test_parse_numeric_value_extracts_numbers():
    assert parse_numeric_value("10 reps") == 10.0
    assert parse_numeric_value("345 lbs") == 345.0
    assert parse_numeric_value("3.5 miles") == 3.5
    assert parse_numeric_value("no number") == 0.0


def test_track_entry_volume_sums_values():
    entry = TrackEntry(
        exercise="Pushups",
        entry_date="2026-06-11",
        set_values=["10 reps", "5 reps"],
        set_labels=["Set A", "Set B"],
    )
    assert entry.volume == 15.0
    assert entry.set_count == 2


def test_track_entry_migrates_legacy_workout_date():
    entry = TrackEntry.from_dict(
        {
            "exercise": "Pages read",
            "workout_date": "2026-01-15",
            "set_values": ["20 pages"],
        }
    )
    assert entry.entry_date == "2026-01-15"


def test_track_entry_migrates_legacy_numeric_values():
    entry = TrackEntry.from_dict(
        {
            "exercise": "Bench",
            "entry_date": "2026-01-01",
            "set_values": [10, 12.5],
            "unit": "reps",
        }
    )
    assert entry.set_values == ["10 reps", "12.5 reps"]


def test_align_set_labels_pads_and_trims():
    assert align_set_labels(["A"], 3) == ["A", "", ""]
    assert align_set_labels(["A", "B", "C", "D"], 2) == ["A", "B"]


def test_normalize_strips_extra_whitespace():
    assert normalize_exercise_name("  Pushups  ") == "Pushups"
    assert normalize_value_text("  10   reps ") == "10 reps"


def test_track_entry_round_trip_dict():
    original = TrackEntry(
        exercise="Running",
        entry_date=date.today().isoformat(),
        set_values=["3.1 miles"],
        set_labels=["Morning"],
        notes="Felt good",
        logged_at="2026-06-11T08:00:00",
    )
    restored = TrackEntry.from_dict(original.to_dict())
    assert restored.exercise == original.exercise
    assert restored.set_values == original.set_values
    assert restored.notes == original.notes


def test_track_entry_empty_values_have_zero_volume():
    entry = TrackEntry(
        exercise="Test",
        entry_date="2026-06-11",
        set_values=[],
    )
    assert entry.volume == 0.0
    assert entry.set_count == 0
