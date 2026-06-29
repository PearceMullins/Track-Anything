"""REST API for Track Anything — serves data and the React frontend."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from models import TrackEntry, logged_at_for_entry_date, normalize_exercise_name, normalize_value_text
from profile_manager import ProfileManager

profiles = ProfileManager()
DIST = Path(__file__).parent / "frontend" / "dist"

NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def _file_response(path: Path, *, cache: bool = False) -> FileResponse:
    headers = None if cache else NO_CACHE_HEADERS
    return FileResponse(path, headers=headers)

app = FastAPI(title="Track Anything API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class EntryInput(BaseModel):
    exercise: str
    entry_date: str = ""
    workout_date: str = ""  # legacy alias
    value: str = ""
    notes: str = ""
    logged_at: str = ""


class RenameInput(BaseModel):
    old_value: str
    new_value: str


class DeleteNamesInput(BaseModel):
    names: list[str] = Field(min_length=1)


class DeleteEntriesInput(BaseModel):
    indices: list[int] = Field(min_length=1)


class ProfileNameInput(BaseModel):
    name: str


def _store():
    return profiles.store


def _serialize_entry(index: int, entry: TrackEntry) -> dict:
    return {
        "index": index,
        **entry.to_dict(),
        "numeric_value": entry.numeric_value,
    }


def _history_rows() -> list[dict]:
    rows: list[dict] = []
    for index, entry in enumerate(_store().entries):
        rows.append(
            {
                "entry_index": index,
                "entry_date": entry.entry_date,
                "name": entry.exercise,
                "value": entry.value,
                "notes": entry.notes,
            }
        )
    return rows


def _bootstrap() -> dict:
    store = _store()
    return {
        "entries": [_serialize_entry(i, e) for i, e in enumerate(store.entries)],
        "history_rows": _history_rows(),
        "dropdown_names": store.dropdown_names(),
        "dropdown_values": store.dropdown_values(),
        "dropdown_notes": store.dropdown_notes(),
        "hidden_values": store.hidden_values(),
        "hidden_notes": store.hidden_notes(),
        "chart_names": store.exercise_names(),
        "active_profile": profiles.active_profile,
        "dropdown_profiles": profiles.dropdown_profiles(),
    }


def _entry_from_input(data: EntryInput) -> TrackEntry:
    exercise = normalize_exercise_name(data.exercise)
    if not exercise:
        raise HTTPException(400, "Name is required.")
    value = normalize_value_text(data.value)
    if not value:
        raise HTTPException(400, "Value is required.")
    entry_date = data.entry_date or data.workout_date
    if not entry_date:
        raise HTTPException(400, "Date is required.")
    logged_at = data.logged_at or logged_at_for_entry_date(entry_date)
    return TrackEntry(
        exercise=exercise,
        entry_date=entry_date,
        value=value,
        notes=data.notes.strip(),
        logged_at=logged_at,
    )


@app.get("/api/bootstrap")
def get_bootstrap() -> dict:
    return _bootstrap()


@app.post("/api/entries")
def create_entry(data: EntryInput) -> dict:
    entry = _entry_from_input(data)
    _store().add(entry)
    return _bootstrap()


@app.put("/api/entries/{index}")
def update_entry(index: int, data: EntryInput) -> dict:
    store = _store()
    if index < 0 or index >= len(store.entries):
        raise HTTPException(404, "Entry not found.")
    entry = _entry_from_input(data)
    entry.logged_at = data.logged_at or store.entries[index].logged_at
    store.update(index, entry)
    return _bootstrap()


@app.delete("/api/entries/{index}")
def delete_entry(index: int) -> dict:
    store = _store()
    if index < 0 or index >= len(store.entries):
        raise HTTPException(404, "Entry not found.")
    store.delete(index)
    return _bootstrap()


@app.post("/api/entries/delete-batch")
def delete_entries_batch(body: DeleteEntriesInput) -> dict:
    _store().delete_entries(body.indices)
    return _bootstrap()


@app.get("/api/charts/{name}")
def chart_points(name: str) -> dict:
    points = _store().history_points(name)
    return {
        "name": name,
        "points": [{"date": dt.isoformat(), "value": val} for dt, val in points],
    }


@app.post("/api/names/rename")
def rename_name(body: RenameInput) -> dict:
    try:
        _store().rename_name(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/names/remove")
def remove_name(body: dict) -> dict:
    _store().remove_name(body.get("name", ""))
    return _bootstrap()


@app.post("/api/names/delete-all")
def delete_names(body: DeleteNamesInput) -> dict:
    profiles.remove_names(body.names)
    return _bootstrap()


@app.post("/api/profiles/switch")
def switch_profile(body: ProfileNameInput) -> dict:
    try:
        profiles.switch_profile(body.name)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/profiles/rename")
def rename_profile(body: RenameInput) -> dict:
    try:
        profiles.rename_profile(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/profiles/remove")
def remove_profile(body: ProfileNameInput) -> dict:
    try:
        profiles.remove_profile(body.name)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/values/rename")
def rename_value(body: RenameInput) -> dict:
    try:
        _store().rename_value(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/values/remove")
def remove_value(body: dict) -> dict:
    _store().remove_value(body.get("name", ""))
    return _bootstrap()


@app.post("/api/values/remove-batch")
def remove_values_batch(body: DeleteNamesInput) -> dict:
    _store().remove_values(body.names)
    return _bootstrap()


@app.post("/api/values/show-batch")
def show_values_batch(body: DeleteNamesInput) -> dict:
    _store().restore_values(body.names)
    return _bootstrap()


@app.post("/api/notes/rename")
def rename_note(body: RenameInput) -> dict:
    try:
        _store().rename_note(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/notes/remove")
def remove_note(body: dict) -> dict:
    _store().remove_note(body.get("name", ""))
    return _bootstrap()


@app.post("/api/notes/remove-batch")
def remove_notes_batch(body: DeleteNamesInput) -> dict:
    _store().remove_notes(body.names)
    return _bootstrap()


@app.post("/api/notes/show-batch")
def show_notes_batch(body: DeleteNamesInput) -> dict:
    _store().restore_notes(body.names)
    return _bootstrap()


@app.get("/api/data/export")
def export_data() -> dict:
    return profiles.export_data()


@app.post("/api/data/import")
def import_data(body: dict) -> dict:
    try:
        profiles.import_data(body)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


if DIST.exists():

    @app.get("/assets/{asset_path:path}")
    def static_assets(asset_path: str) -> FileResponse:
        target = DIST / "assets" / asset_path
        if not target.is_file():
            raise HTTPException(404)
        return _file_response(target, cache=True)

    @app.get("/{full_path:path}")
    def spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(404)
        target = DIST / full_path
        if full_path and target.is_file():
            return _file_response(target)
        return _file_response(DIST / "index.html")
