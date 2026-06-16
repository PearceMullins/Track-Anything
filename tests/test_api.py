"""Integration tests for the FastAPI layer."""

ENTRY_BODY = {
    "exercise": "Pushups",
    "entry_date": "2026-06-11",
    "rows": [
        {"label": "Set 1", "value": "10 reps"},
        {"label": "Set 2", "value": "5 reps"},
    ],
    "notes": "Morning session",
}


def test_bootstrap_empty(client):
    data = client.get("/api/bootstrap").json()
    assert data["entries"] == []
    assert data["history_rows"] == []
    assert "Calories" in data["dropdown_names"]
    assert "first set" in data["dropdown_set_labels"]
    assert "10 reps" in data["dropdown_values"]
    assert data["active_profile"] == "Default"
    assert "Default" in data["dropdown_profiles"]


def test_create_entry_returns_bootstrap(client):
    res = client.post("/api/entries", json=ENTRY_BODY)
    assert res.status_code == 200
    data = res.json()
    assert len(data["entries"]) == 1
    assert data["history_rows"][0]["name"] == "Pushups"
    assert data["history_rows"][0]["total"] == 15.0
    assert data["history_rows"][0]["labels"] == ["Set 1", "Set 2"]
    assert data["history_rows"][0]["values"] == ["10 reps", "5 reps"]


def test_create_entry_requires_label(client):
    res = client.post(
        "/api/entries",
        json={
            "exercise": "Test",
            "entry_date": "2026-06-11",
            "rows": [{"label": "", "value": "10"}],
        },
    )
    assert res.status_code == 400


def test_update_and_delete_entry(client):
    client.post("/api/entries", json=ENTRY_BODY)
    update_body = {**ENTRY_BODY, "rows": [{"label": "Set 1", "value": "20 reps"}]}
    res = client.put("/api/entries/0", json=update_body)
    assert res.status_code == 200
    assert res.json()["entries"][0]["volume"] == 20.0

    res = client.delete("/api/entries/0")
    assert res.status_code == 200
    assert res.json()["entries"] == []


def test_chart_points(client):
    client.post("/api/entries", json=ENTRY_BODY)
    res = client.get("/api/charts/Pushups")
    assert res.status_code == 200
    points = res.json()["points"]
    assert len(points) == 1
    assert points[0]["total"] == 15.0


def test_rename_name(client):
    client.post("/api/entries", json=ENTRY_BODY)
    res = client.post(
        "/api/names/rename",
        json={"old_value": "Pushups", "new_value": "Push Ups"},
    )
    assert res.status_code == 200
    assert res.json()["entries"][0]["exercise"] == "Push Ups"
