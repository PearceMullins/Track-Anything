"""Tests for data_store.TrackStore."""

import pytest

from models import TrackEntry
from data_store import TrackStore


def _sample_entry(name: str = "Pushups", value: str = "10 reps", notes: str = "Test note") -> TrackEntry:
    return TrackEntry(
        exercise=name,
        entry_date="2026-06-11",
        value=value,
        notes=notes,
        logged_at="2026-06-11T09:00:00",
    )


def test_add_and_persist(store: TrackStore, data_path):
    store.add(_sample_entry())
    assert len(store.entries) == 1
    reloaded = TrackStore(data_path)
    assert len(reloaded.entries) == 1
    assert reloaded.entries[0].exercise == "Pushups"


def test_delete_entry(store: TrackStore):
    store.add(_sample_entry())
    store.delete(0)
    assert store.entries == []


def test_update_preserves_logged_at_when_empty(store: TrackStore):
    store.add(_sample_entry())
    updated = _sample_entry(value="20 reps")
    updated.logged_at = ""
    store.update(0, updated)
    assert store.entries[0].logged_at == "2026-06-11T09:00:00"
    assert store.entries[0].value == "20 reps"


def test_rename_name_updates_entries(store: TrackStore):
    store.add(_sample_entry("Old Name"))
    store.rename_name("Old Name", "New Name")
    assert store.entries[0].exercise == "New Name"
    assert "New Name" in store.dropdown_names()


def test_remove_name_deletes_matching_entries(store: TrackStore):
    store.add(_sample_entry("Keep"))
    store.add(_sample_entry("Remove"))
    deleted = store.remove_name("Remove")
    assert deleted == 1
    assert len(store.entries) == 1
    assert store.entries[0].exercise == "Keep"


def test_dropdown_values_includes_used_and_custom(store: TrackStore):
    store.add(_sample_entry(value="42 widgets"))
    assert "42 widgets" in store.dropdown_values()


def test_dropdown_notes_includes_used_notes(store: TrackStore):
    store.add(_sample_entry(notes="Morning session"))
    assert "Morning session" in store.dropdown_notes()


def test_permanent_delete_values_and_notes(store: TrackStore):
    store.add(_sample_entry(value="42 widgets", notes="Morning session"))

    store.remove_values(["42 widgets"])
    assert "42 widgets" not in store.dropdown_values()
    assert len(store.entries) == 0

    store.add(_sample_entry(value="42 widgets", notes="Morning session"))

    store.remove_notes(["Morning session"])
    assert "Morning session" not in store.dropdown_notes()
    assert len(store.entries) == 1
    assert store.entries[0].notes == ""


def test_history_points_one_per_entry(store: TrackStore):
    store.add(_sample_entry("Running", "3 miles"))
    store.add(_sample_entry("Running", "4 miles"))
    points = store.history_points("Running")
    assert len(points) == 2
    assert points[0][1] == 3.0
    assert points[1][1] == 4.0


def test_value_formulas_persist_and_affect_history(store: TrackStore, data_path):
    store.add(_sample_entry("Pushups", "2 sets of 10"))
    assert store.value_formulas()["default"] == "first_number"
    assert store.history_points("Pushups")[0][1] == 2.0

    store.set_value_formula("Pushups", "sum_numbers")
    assert store.value_formulas()["by_name"]["Pushups"] == "sum_numbers"
    assert store.history_points("Pushups")[0][1] == 12.0

    reloaded = TrackStore(data_path)
    assert reloaded.value_formulas()["by_name"]["Pushups"] == "sum_numbers"
    assert reloaded.history_points("Pushups")[0][1] == 12.0


def test_default_value_formula_applies_to_every_name(store: TrackStore, data_path):
    store.add(_sample_entry("Pushups", "2 sets of 10"))
    store.add(_sample_entry("Situps", "4 sets of 10"))

    store.set_default_value_formula({"expr": "a * b"})
    assert store.value_formulas()["default"] == {"expr": "a * b"}
    assert store.history_points("Pushups")[0][1] == 20.0
    assert store.history_points("Situps")[0][1] == 40.0

    store.set_value_formula("Situps", "sum_numbers")
    assert store.value_formulas()["by_name"]["Situps"] == "sum_numbers"
    assert store.history_points("Situps")[0][1] == 14.0

    store.set_default_value_formula("sum_numbers")
    assert "Situps" not in store.value_formulas()["by_name"]
    assert TrackStore(data_path).value_formulas()["default"] == "sum_numbers"

    with pytest.raises(ValueError):
        store.set_default_value_formula("not_a_formula")


def test_saved_equations_persist(store: TrackStore, data_path):
    assert store.saved_equations() == []

    store.save_equation("Volume", {"expr": "a * b * c"})
    store.save_equation("Average", {"expr": "avg(a, b)"})
    assert [item["label"] for item in store.saved_equations()] == ["Volume", "Average"]

    reloaded = TrackStore(data_path)
    assert reloaded.saved_equations()[0] == {"label": "Volume", "spec": {"expr": "a * b * c"}}

    store.remove_saved_equation("Volume")
    assert [item["label"] for item in store.saved_equations()] == ["Average"]
    assert TrackStore(data_path).saved_equations() == [
        {"label": "Average", "spec": {"expr": "avg(a, b)"}}
    ]
