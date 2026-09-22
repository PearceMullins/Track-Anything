"""Unit tests for models.py."""

from datetime import date

from models import (
    TrackEntry,
    normalize_exercise_name,
    normalize_value_text,
    parse_numeric_value,
    resolve_numeric_value,
    formula_for_name,
    normalize_value_formulas,
    empty_value_formulas,
    set_default_formula,
    set_formula_for_name,
)


def test_parse_numeric_value_extracts_numbers():
    assert parse_numeric_value("10 reps") == 10.0
    assert parse_numeric_value("345 lbs") == 345.0
    assert parse_numeric_value("3.5 miles") == 3.5
    assert parse_numeric_value("no number") == 0.0


def test_resolve_numeric_value_presets():
    text = "2 sets of 5 and 10"
    assert resolve_numeric_value(text, "first_number") == 2.0
    assert resolve_numeric_value(text, "last_number") == 10.0
    assert resolve_numeric_value(text, "sum_numbers") == 17.0
    assert resolve_numeric_value(text, "product_numbers") == 100.0
    assert resolve_numeric_value(text, "max_number") == 10.0
    assert resolve_numeric_value(text, "min_number") == 2.0


def test_resolve_numeric_value_expr():
    assert resolve_numeric_value("3 x 4", {"expr": "a * b"}) == 12.0
    assert resolve_numeric_value("10 and 2", {"expr": "(a + b) / 2"}) == 6.0
    assert resolve_numeric_value("10", {"expr": "a; alert(1)"}) == 0.0


def test_resolve_numeric_value_builder_operators():
    assert resolve_numeric_value("2 5 10", {"expr": "a + b + c"}) == 17.0
    assert resolve_numeric_value("2 5 10", {"expr": "a * b - c"}) == 0.0
    assert resolve_numeric_value("2 4", {"expr": "a ^ b"}) == 16.0
    assert resolve_numeric_value("7 4", {"expr": "a % b"}) == 3.0
    assert resolve_numeric_value("1 0", {"expr": "a % b"}) == 0.0
    assert resolve_numeric_value("2 3 4", {"expr": "a + b * c"}) == 14.0
    assert resolve_numeric_value("2 3 4", {"expr": "(a + b) * c"}) == 20.0


def test_resolve_numeric_value_functions_and_constants():
    assert resolve_numeric_value("9", {"expr": "abs(-a)"}) == 9.0
    assert resolve_numeric_value("3 8 5", {"expr": "min(a, b, c)"}) == 3.0
    assert resolve_numeric_value("3 8 5", {"expr": "max(a b c)"}) == 8.0
    assert resolve_numeric_value("2 4 6", {"expr": "avg(a, b, c)"}) == 4.0
    assert resolve_numeric_value("2 4 6", {"expr": "sum()"}) == 12.0
    assert resolve_numeric_value("2.4 2.5", {"expr": "round(a) + round(b)"}) == 5.0
    assert resolve_numeric_value("-4 9", {"expr": "sqrt(a) + sqrt(b)"}) == 3.0
    assert resolve_numeric_value("8", {"expr": "a ^ (1 / 3)"}) == 2.0
    assert resolve_numeric_value("1", {"expr": "round(pi * 100)"}) == 314.0
    assert resolve_numeric_value("1 2", {"expr": "nope(a, b)"}) == 0.0
    assert resolve_numeric_value("1 2", {"expr": "min("}) == 0.0


def test_set_default_formula_prunes_matching_overrides():
    cfg = set_formula_for_name(empty_value_formulas(), "Pushups", "sum_numbers")
    cfg = set_formula_for_name(cfg, "Running", {"expr": "a * b"})
    cfg = set_default_formula(cfg, "sum_numbers")
    assert cfg["default"] == "sum_numbers"
    assert "Pushups" not in cfg["by_name"]
    assert cfg["by_name"]["Running"] == {"expr": "a * b"}
    cfg = set_default_formula(cfg, {"expr": "a * b"})
    assert "Running" not in cfg["by_name"]


def test_formula_for_name_defaults():
    cfg = normalize_value_formulas(
        {"default": "sum_numbers", "by_name": {"Running": "last_number"}}
    )
    assert formula_for_name(cfg, "Pushups") == "sum_numbers"
    assert formula_for_name(cfg, "Running") == "last_number"
    assert normalize_value_formulas(None) == empty_value_formulas()


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
