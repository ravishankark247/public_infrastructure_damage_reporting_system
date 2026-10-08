import sqlite3

import pytest
from fastapi.testclient import TestClient

import app
import database


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "pidr_test.sqlite"
    monkeypatch.setattr(database, "DB_PATH", str(db_path))
    database.init_db()
    with TestClient(app.app) as test_client:
        yield test_client


def test_homepage_serves_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "CivicPulse PIDR" in response.text


def test_meta_endpoint_returns_data(client):
    response = client.get("/api/v1/meta")

    assert response.status_code == 200
    payload = response.json()
    assert "departments" in payload
    assert "wards" in payload
    assert "categories" in payload
    assert len(payload["departments"]) >= 4
    assert len(payload["wards"]) >= 6


def test_create_issue_endpoint_success(client):
    response = client.post(
        "/api/v1/issues",
        data={
            "category": "Pothole",
            "severity": "High",
            "title": "Test Pothole at Gate 3",
            "description": "Test pothole created during automated validation.",
            "address_text": "Test Address, New Delhi",
            "latitude": "28.61",
            "longitude": "77.21",
            "ward_id": "1",
            "reporter_name": "Test User",
            "reporter_phone": "+91 99999 99999",
            "reporter_email": "test@example.com",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["ticket_number"].startswith("PIDR-")

    with sqlite3.connect(database.DB_PATH) as conn:
        count = conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0]
        assert count >= 5


def test_authority_update_status_endpoint(client):
    response = client.patch(
        "/api/v1/authority/issues/PIDR-2026-0001/status",
        data={
            "status": "In Progress",
            "assigned_engineer": "Er. Test Engineer",
            "resolution_notes": "Inspection completed and work order created.",
            "updated_by": "Test Dispatcher",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["new_status"] == "In Progress"

    detail = client.get("/api/v1/issues/PIDR-2026-0001")
    assert detail.status_code == 200
    issue = detail.json()
    assert issue["status"] == "In Progress"
    assert issue["assigned_engineer"] == "Er. Test Engineer"
