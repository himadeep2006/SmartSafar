import json
from urllib.error import URLError

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.database import Base, get_db
from backend.routes import safety


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_db():
        db = sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as http:
        yield http, sessions
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def account(http, name):
    response = http.post("/api/auth/signup", json={"username": name, "email": f"{name}@example.com", "password": "Travel2026pass", "passwordConfirm": "Travel2026pass"})
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_profile_retrieval_update_validation_and_refresh(client):
    http, _ = client
    assert http.get("/api/profile").status_code == 401
    owner = account(http, "phase4profile")
    initial = http.get("/api/profile", headers=owner)
    assert initial.status_code == 200
    assert initial.json()["display_name"] == "phase4profile"
    assert "password_hash" not in initial.text
    saved = http.put("/api/profile", headers=owner, json={"display_name": "River Traveller", "email": "attacker@example.com", "username": "attacker", "preferred_language": "Tamil", "phone": "+91 98765 43210", "home_city": "Mysuru", "travel_interests": "Heritage"})
    assert saved.status_code == 200
    assert saved.json()["email"] == "phase4profile@example.com"
    assert saved.json()["username"] == "phase4profile"
    assert saved.json()["preferred_language"] == "Tamil"
    assert http.get("/api/profile", headers=owner).json()["home_city"] == "Mysuru"
    assert http.put("/api/profile", headers=owner, json={"display_name": " ", "preferred_language": "French"}).status_code == 422
    assert http.put("/api/profile", headers=owner, json={"display_name": "Valid", "phone": "bad", "preferred_language": "English"}).status_code == 422


def test_emergency_contacts_are_authenticated_validated_and_user_scoped(client):
    http, _ = client
    owner, other = account(http, "phase4contacta"), account(http, "phase4contactb")
    assert http.get("/api/safety/contacts").status_code == 401
    created = http.post("/api/safety/contacts", headers=owner, json={"name": "  Sam  ", "phone": "+91 98765 43210"})
    assert created.status_code == 201
    contact = created.json()
    assert contact["name"] == "Sam"
    assert http.get("/api/safety/contacts", headers=other).json() == []
    assert http.put(f"/api/safety/contacts/{contact['id']}", headers=other, json={"name": "Hijack", "phone": "9876543210"}).status_code == 404
    assert http.delete(f"/api/safety/contacts/{contact['id']}", headers=other).status_code == 404
    assert http.post("/api/safety/contacts", headers=owner, json={"name": "   ", "phone": "bad"}).status_code == 422
    assert http.put(f"/api/safety/contacts/{contact['id']}", headers=owner, json={"name": "Samira", "phone": "9876543210"}).json()["name"] == "Samira"
    assert http.delete(f"/api/safety/contacts/{contact['id']}", headers=owner).status_code == 204


def test_nearby_lookup_is_auth_validated_and_returns_source_attribution(client, monkeypatch):
    http, _ = client
    owner = account(http, "phase4nearby")
    assert http.post("/api/safety/nearby", json={"latitude": 12.9, "longitude": 77.6}).status_code == 401
    assert http.post("/api/safety/nearby", json={"latitude": 100, "longitude": 0}, headers=owner).status_code == 422
    payload = {"elements": [{"id": 44, "type": "node", "lat": 12.9, "lon": 77.6, "tags": {"amenity": "hospital", "name": "City Hospital"}}]}

    class Response:
        def __enter__(self): return self
        def __exit__(self, *_): pass
        def read(self): return json.dumps(payload).encode()

    monkeypatch.setattr(safety, "urlopen", lambda *_args, **_kwargs: Response())
    result = http.post("/api/safety/nearby", json={"latitude": 12.9, "longitude": 77.6}, headers=owner)
    assert result.status_code == 200
    assert result.json()["services"][0]["name"] == "City Hospital"
    assert result.json()["source"] == "OpenStreetMap / Overpass API"
    assert result.json()["retrieved_at"]


def test_cors_allows_frontend_origins_on_default_and_fallback_dev_ports(client):
    http, _ = client
    for origin in ("http://localhost:3000", "http://localhost:3001"):
        response = http.options("/api/profile", headers={"Origin": origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "authorization,content-type"})
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin
        assert "PUT" in response.headers["access-control-allow-methods"]


def test_nearby_lookup_returns_graceful_unavailable_error(client, monkeypatch):
    http, _ = client
    owner = account(http, "phase4outage")
    monkeypatch.setattr(safety, "urlopen", lambda *_args, **_kwargs: (_ for _ in ()).throw(URLError("offline")))
    response = http.post("/api/safety/nearby", json={"latitude": 12.9, "longitude": 77.6}, headers=owner)
    assert response.status_code == 503
    assert response.json()["detail"] == "OpenStreetMap nearby lookup is temporarily unavailable. Try again later."
