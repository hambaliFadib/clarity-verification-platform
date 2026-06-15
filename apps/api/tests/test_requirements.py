"""Tests for Requirements API."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_requirements():
    """Test GET /requirements endpoint."""
    response = client.get("/api/v1/requirements/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_requirement():
    """Test POST /requirements endpoint."""
    data = {
        "title": "Test Requirement",
        "module": "Test Module",
        "type": "Functional",
        "priority": "Medium",
    }
    response = client.post("/api/v1/requirements/", json=data)
    assert response.status_code == 201
    assert response.json()["title"] == "Test Requirement"


def test_get_requirement_by_id():
    """Test GET /requirements/{id} endpoint."""
    # First create a requirement
    data = {
        "title": "Test for ID",
        "module": "Test",
        "type": "Functional",
        "priority": "Low",
    }
    create_response = client.post("/api/v1/requirements/", json=data)
    req_id = create_response.json()["id"]
    
    response = client.get(f"/api/v1/requirements/{req_id}")
    assert response.status_code == 200


def test_ai_analysis():
    """Test POST /ai/analyze-requirement endpoint."""
    data = {
        "title": "User Login Authentication",
        "description": "As a user, I want to login securely",
    }
    response = client.post("/api/v1/ai/analyze-requirement", json=data)
    assert response.status_code == 200
    assert "completeness_score" in response.json()
