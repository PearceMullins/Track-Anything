"""Application paths for development and packaged executables."""

import sys
from pathlib import Path


def app_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).parent


def data_file() -> Path:
    return app_dir() / "track_anything_data.json"


def legacy_data_file() -> Path:
    return app_dir() / "workout_data.json"


def resolve_data_file() -> Path:
    """Prefer the current filename; fall back to the legacy desktop data file."""
    new_path = data_file()
    if new_path.exists():
        return new_path
    legacy = legacy_data_file()
    if legacy.exists():
        return legacy
    return new_path
