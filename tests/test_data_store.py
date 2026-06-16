"""Tests for data_store.TrackStore."""

from models import TrackEntry
from data_store import TrackStore


def _sample_entry(name: str = "Pushups", values: list[str] | None = None) -> TrackEntry:
    values = values or ["10 reps", "5 reps"]
    labels = [f"Set {i + 1}" for i in range(len(values))]
    return TrackEntry(
        exercise=name,
        entry_date="2026-06-11",
        set_values=values,
        set_labels=labels,
        notes="Test note",
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
    updated = _sample_entry(values=["20 reps"])
    updated.logged_at = ""
    store.update(0, updated)
    assert store.entries[0].logged_at == "2026-06-11T09:00:00"
    assert store.entries[0].set_values == ["20 reps"]


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
    store.add(_sample_entry(values=["42 widgets"]))
    assert "42 widgets" in store.dropdown_values()


def test_history_points_one_per_entry(store: TrackStore):
    store.add(_sample_entry("Running", ["3 miles"]))
    store.add(_sample_entry("Running", ["4 miles"]))
    points = store.history_points("Running")
    assert len(points) == 2
    assert points[0][1] == 3.0
    assert points[1][1] == 4.0
