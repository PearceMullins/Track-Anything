"""Shared fixtures for Track Anything tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import api
from data_store import WorkoutStore
from profile_manager import ProfileManager


@pytest.fixture
def data_path(tmp_path: Path) -> Path:
    return tmp_path / "workout_data.json"


@pytest.fixture
def store(data_path: Path) -> WorkoutStore:
    return WorkoutStore(data_path)


@pytest.fixture
def client(data_path: Path):
    api.profiles = ProfileManager(data_path)
    with TestClient(api.app) as test_client:
        yield test_client
