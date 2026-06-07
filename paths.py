"""Application paths for development and packaged executables."""

import sys
from pathlib import Path


def app_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).parent


def data_file() -> Path:
    return app_dir() / "workout_data.json"
