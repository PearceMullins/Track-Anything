"""REST API for Track Anything — serves data and the React frontend."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from data_store import WorkoutStore
from models import WorkoutEntry, logged_at_for_workout_date, normalize_exercise_name, normalize_value_text

store = WorkoutStore()
DIST = Path(__file__).parent / "frontend" / "dist"

app = FastAPI(title="Track Anything API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RowInput(BaseModel):
    label: str = ""
    value: str


class EntryInput(BaseModel):
    exercise: str
    workout_date: str
    rows: list[RowInput] = Field(min_length=1)
    notes: str = ""
    logged_at: str = ""


class RenameInput(BaseModel):
    old_value: str
    new_value: str


def _serialize_entry(index: int, entry: WorkoutEntry) -> dict:
    return {
        "index": index,
        **entry.to_dict(),
        "volume": entry.volume,
        "set_count": entry.set_count,
    }


def _format_total(volume: float) -> str:
    if volume == int(volume):
        return str(int(volume))
    return f"{volume:g}"


def _history_rows() -> list[dict]:
    rows: list[dict] = []
    for index, entry in enumerate(store.entries):
        labels = [label.strip() or "—" for label in entry.set_labels]
        rows.append(
            {
                "entry_index": index,
                "workout_date": entry.workout_date,
                "name": entry.exercise,
                "labels": labels,
                "values": list(entry.set_values),
                "notes": entry.notes,
                "total": entry.volume,
                "total_display": _format_total(entry.volume),
            }
        )
    return rows


def _bootstrap() -> dict:
    return {
        "entries": [_serialize_entry(i, e) for i, e in enumerate(store.entries)],
        "history_rows": _history_rows(),
        "dropdown_names": store.dropdown_names(),
        "dropdown_set_labels": store.dropdown_set_labels(),
        "dropdown_values": store.dropdown_values(),
        "chart_names": store.exercise_names(),
    }


def _entry_from_input(data: EntryInput) -> WorkoutEntry:
    exercise = normalize_exercise_name(data.exercise)
    if not exercise:
        raise HTTPException(400, "Name is required.")
    set_values = []
    set_labels = []
    for row in data.rows:
        value = normalize_value_text(row.value)
        label = row.label.strip()
        if not value:
            continue
        if not label:
            raise HTTPException(400, "Each row needs a label.")
        set_labels.append(label)
        set_values.append(value)
    if not set_values:
        raise HTTPException(400, "At least one value is required.")
    if any(not label for label in set_labels):
        raise HTTPException(400, "Each row needs a label.")
    logged_at = data.logged_at or logged_at_for_workout_date(data.workout_date)
    return WorkoutEntry(
        exercise=exercise,
        workout_date=data.workout_date,
        set_values=set_values,
        set_labels=set_labels,
        notes=data.notes.strip(),
        logged_at=logged_at,
        unit="",
    )


@app.get("/api/bootstrap")
def get_bootstrap() -> dict:
    return _bootstrap()


@app.post("/api/entries")
def create_entry(data: EntryInput) -> dict:
    entry = _entry_from_input(data)
    store.add(entry)
    return _bootstrap()


@app.put("/api/entries/{index}")
def update_entry(index: int, data: EntryInput) -> dict:
    if index < 0 or index >= len(store.entries):
        raise HTTPException(404, "Entry not found.")
    entry = _entry_from_input(data)
    entry.logged_at = data.logged_at or store.entries[index].logged_at
    store.update(index, entry)
    return _bootstrap()


@app.delete("/api/entries/{index}")
def delete_entry(index: int) -> dict:
    if index < 0 or index >= len(store.entries):
        raise HTTPException(404, "Entry not found.")
    store.delete(index)
    return _bootstrap()


@app.get("/api/charts/{name}")
def chart_points(name: str) -> dict:
    points = store.history_points(name)
    return {
        "name": name,
        "points": [{"date": dt.isoformat(), "total": vol} for dt, vol in points],
    }


@app.post("/api/names/rename")
def rename_name(body: RenameInput) -> dict:
    try:
        store.rename_name(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/names/remove")
def remove_name(body: dict) -> dict:
    store.remove_name(body.get("name", ""))
    return _bootstrap()


@app.post("/api/labels/rename")
def rename_label(body: RenameInput) -> dict:
    try:
        store.rename_set_label(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/labels/remove")
def remove_label(body: dict) -> dict:
    store.remove_set_label(body.get("name", ""))
    return _bootstrap()


@app.post("/api/values/rename")
def rename_value(body: RenameInput) -> dict:
    try:
        store.rename_value(body.old_value, body.new_value)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return _bootstrap()


@app.post("/api/values/remove")
def remove_value(body: dict) -> dict:
    store.remove_value(body.get("name", ""))
    return _bootstrap()


if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(404)
        target = DIST / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST / "index.html")
