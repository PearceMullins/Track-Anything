"""Integration tests for the FastAPI layer."""

ENTRY_BODY = {
    "exercise": "Pushups",
    "entry_date": "2026-06-11",
    "value": "10 reps",
    "notes": "Morning session",
}


def test_bootstrap_empty(client):
    data = client.get("/api/bootstrap").json()
    assert data["entries"] == []
    assert data["history_rows"] == []
    assert "Calories" in data["dropdown_names"]
    assert "10 reps" in data["dropdown_values"]
    assert "Morning" in data["dropdown_notes"]
    assert data["hidden_values"] == []
    assert data["hidden_notes"] == []
    assert data["active_profile"] == "Default"
    assert "Default" in data["dropdown_profiles"]


def test_create_entry_returns_bootstrap(client):
    res = client.post("/api/entries", json=ENTRY_BODY)
    assert res.status_code == 200
    data = res.json()
    assert len(data["entries"]) == 1
    assert data["history_rows"][0]["name"] == "Pushups"
    assert data["history_rows"][0]["value"] == "10 reps"
    assert data["history_rows"][0]["notes"] == "Morning session"


def test_create_entry_requires_value(client):
    res = client.post(
        "/api/entries",
        json={
            "exercise": "Test",
            "entry_date": "2026-06-11",
            "value": "",
        },
    )
    assert res.status_code == 400


def test_update_and_delete_entry(client):
    client.post("/api/entries", json=ENTRY_BODY)
    update_body = {**ENTRY_BODY, "value": "20 reps"}
    res = client.put("/api/entries/0", json=update_body)
    assert res.status_code == 200
    assert res.json()["entries"][0]["numeric_value"] == 20.0

    res = client.delete("/api/entries/0")
    assert res.status_code == 200
    assert res.json()["entries"] == []


def test_chart_points(client):
    client.post("/api/entries", json=ENTRY_BODY)
    res = client.get("/api/charts/Pushups")
    assert res.status_code == 200
    points = res.json()["points"]
    assert len(points) == 1
    assert points[0]["value"] == 10.0


def test_rename_name(client):
    client.post("/api/entries", json=ENTRY_BODY)
    res = client.post(
        "/api/names/rename",
        json={"old_value": "Pushups", "new_value": "Push Ups"},
    )
    assert res.status_code == 200
    assert res.json()["entries"][0]["exercise"] == "Push Ups"


def test_permanent_delete_values_and_notes(client):
    client.post("/api/entries", json=ENTRY_BODY)

    res = client.post("/api/values/remove-batch", json={"names": ["10 reps"]})
    assert res.status_code == 200
    assert "10 reps" not in res.json()["dropdown_values"]
    assert len(res.json()["entries"]) == 0

    client.post("/api/entries", json=ENTRY_BODY)

    res = client.post("/api/notes/remove-batch", json={"names": ["Morning session"]})
    assert res.status_code == 200
    assert "Morning session" not in res.json()["dropdown_notes"]
    assert len(res.json()["entries"]) == 1
    assert res.json()["entries"][0]["notes"] == ""


def test_export_and_import_data(client):
    client.post("/api/entries", json=ENTRY_BODY)
    exported = client.get("/api/data/export").json()
    assert exported["profiles"]["Default"]["entries"][0]["exercise"] == "Pushups"

    imported = {
        **exported,
        "profiles": {
            "Default": {
                "entries": [
                    {
                        "exercise": "Running",
                        "entry_date": "2026-06-12",
                        "value": "3 miles",
                        "notes": "",
                        "logged_at": "2026-06-12T09:00:00",
                    }
                ],
                "hidden_names": [],
                "custom_names": [],
                "hidden_values": [],
                "custom_values": [],
                "hidden_notes": [],
                "custom_notes": [],
            }
        },
    }

    res = client.post("/api/data/import", json=imported)
    assert res.status_code == 200
    assert res.json()["entries"][0]["exercise"] == "Running"
