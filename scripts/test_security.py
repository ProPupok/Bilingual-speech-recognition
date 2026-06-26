import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)


def test_unauthorized_get_request_is_blocked():
    """Проверяет блокировку GET-запроса к защищенному эндпоинту."""
    response = client.get("/api/v1/audio")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_unauthorized_post_request_is_blocked():
    """Проверяет блокировку POST-запроса без авторизационных заголовков."""
    response = client.post("/api/v1/audio", json={"theme": "dark"})

    assert response.status_code == 401
