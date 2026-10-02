import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.database import Base, get_db
from backend.models import Trip


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


def preferences(**overrides):
    return {"destination_id": "jaipur", "duration_days": 2, "budget_inr": 12000, "travel_style": "culture", "interests": ["heritage", "food"], "preferred_activities": ["markets"], **overrides}


def test_trip_preview_validation_save_persistence_and_explicit_regeneration(client):
    http, sessions = client
    assert http.post("/api/trip-plans/generate", json=preferences()).status_code == 401
    headers = account(http, "planner_one")
    preview = http.post("/api/trip-plans/generate", json=preferences(destination_id="varanasi"), headers=headers)
    assert preview.status_code == 200
    assert preview.json()["planner_label"] == "Smart itinerary generated from your preferences"
    assert len(preview.json()["itinerary"]) == 2
    assert "Dashashwamedh Ghat" in preview.json()["itinerary"][0]["morning"]["place"]
    assert "Sarnath" not in preview.json()["itinerary"][0]["afternoon"]["place"]
    assert http.get("/api/trips", headers=headers).json() == []  # Preview never saves.
    assert http.post("/api/trip-plans/generate", json=preferences(duration_days=0), headers=headers).status_code == 422
    assert http.post("/api/trip-plans/generate", json=preferences(destination_id="unknown"), headers=headers).status_code == 422

    created = http.post("/api/trips", json=preferences(), headers=headers)
    assert created.status_code == 201
    trip = created.json()
    assert trip["title"] == "Jaipur · 2 days"
    with sessions() as db:
        assert len(db.scalars(select(Trip)).all()) == 1

    updated = http.patch(f"/api/trips/{trip['id']}", json={"duration_days": 3, "title": "Jaipur heritage weekend"}, headers=headers)
    assert updated.status_code == 200
    assert updated.json()["itinerary_stale"] is True
    assert len(updated.json()["itinerary"]) == 2  # Preserved until explicit replacement.
    regenerated = http.post(f"/api/trips/{trip['id']}/generate", headers=headers)
    assert regenerated.status_code == 200
    assert regenerated.json()["itinerary_stale"] is False
    assert len(regenerated.json()["itinerary"]) == 3
    assert http.get("/api/trips/{trip_id}".format(trip_id=trip["id"]), headers=headers).status_code == 200


def test_trip_crud_is_authenticated_and_user_scoped(client):
    http, _ = client
    owner = account(http, "trip_owner")
    other = account(http, "trip_other")
    created = http.post("/api/trips", json=preferences(), headers=owner).json()
    trip_id = created["id"]
    assert http.get("/api/trips").status_code == 401
    for method, path, kwargs in [
        (http.get, f"/api/trips/{trip_id}", {}),
        (http.patch, f"/api/trips/{trip_id}", {"json": {"title": "Stolen"}}),
        (http.post, f"/api/trips/{trip_id}/generate", {}),
        (http.delete, f"/api/trips/{trip_id}", {}),
    ]:
        assert method(path, headers=other, **kwargs).status_code == 404
    assert http.patch(f"/api/trips/{trip_id}", json={"title": "   "}, headers=owner).status_code == 422
    assert http.delete(f"/api/trips/{trip_id}", headers=owner).status_code == 204
    assert http.get(f"/api/trips/{trip_id}", headers=owner).status_code == 404
