import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.database import Base, get_db
from backend.models import SavedDestination


@pytest.fixture()
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    sessions = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as http:
        yield http, sessions
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def signup(http, username):
    response = http.post("/api/auth/signup", json={
        "username": username,
        "email": f"{username}@example.com",
        "password": "Travel2026pass",
        "passwordConfirm": "Travel2026pass",
    })
    assert response.status_code == 201
    return response.json()


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_destination_catalogue_search_filters_details_and_validation(client):
    http, _ = client
    catalogue = http.get("/api/destinations")
    assert catalogue.status_code == 200
    destinations = catalogue.json()
    assert len(destinations) >= 12
    assert {"id", "name", "state", "latitude", "longitude", "best_time_to_visit", "estimated_budget", "tags"} <= destinations[0].keys()

    assert [item["id"] for item in http.get("/api/destinations?search=  ").json()] == [item["id"] for item in destinations]
    assert [item["id"] for item in http.get("/api/destinations?search=kerala").json()] == ["varkala", "alleppey", "kochi"]
    assert {item["id"] for item in http.get("/api/destinations?category=heritage").json()} == {"jaipur", "agra", "hampi"}
    assert {item["id"] for item in http.get("/api/destinations?state=goa").json()} == {"goa"}
    assert http.get("/api/destinations?category=unknown").status_code == 422
    assert http.get("/api/destinations?state=Atlantis").status_code == 422
    assert http.get("/api/destinations?search=" + ("x" * 101)).status_code == 422
    assert http.get("/api/destinations?search=unmatched-place").json() == []
    assert http.get("/api/destinations/goa").json()["name"] == "Goa"
    assert http.get("/api/destinations/not-a-destination").status_code == 404


def test_saved_destinations_require_auth_and_are_persistent_and_user_scoped(client):
    http, sessions = client
    assert http.get("/api/saved-destinations").status_code == 401
    assert http.post("/api/saved-destinations/goa").status_code == 401
    assert http.delete("/api/saved-destinations/goa").status_code == 401

    first = signup(http, "saver_one")
    second = signup(http, "saver_two")
    first_auth = auth(first["access_token"])
    second_auth = auth(second["access_token"])

    saved = http.post("/api/saved-destinations/goa", headers=first_auth)
    assert saved.status_code == 201
    assert saved.json()["id"] == "goa"
    assert saved.json()["saved_at"]
    # Repeated saves are safe and do not create duplicate rows.
    repeated = http.post("/api/saved-destinations/goa", headers=first_auth)
    assert repeated.status_code == 201
    with sessions() as db:
        assert len(db.scalars(select(SavedDestination)).all()) == 1

    # A new DB session represents a fresh request/reload; the record remains persisted.
    assert [item["id"] for item in http.get("/api/saved-destinations", headers=first_auth).json()] == ["goa"]
    relogin = http.post("/api/auth/login", json={"identifier": "saver_one", "password": "Travel2026pass"})
    assert relogin.status_code == 200
    assert [item["id"] for item in http.get("/api/saved-destinations", headers=auth(relogin.json()["access_token"])).json()] == ["goa"]

    # Each principal gets an isolated list, including when both save the same destination.
    assert http.get("/api/saved-destinations", headers=second_auth).json() == []
    assert http.post("/api/saved-destinations/jaipur", headers=second_auth).status_code == 201
    assert {item["id"] for item in http.get("/api/saved-destinations", headers=second_auth).json()} == {"jaipur"}
    assert http.delete("/api/saved-destinations/goa", headers=second_auth).status_code == 204
    assert [item["id"] for item in http.get("/api/saved-destinations", headers=first_auth).json()] == ["goa"]

    assert http.post("/api/saved-destinations/not-a-destination", headers=first_auth).status_code == 404
    assert http.delete("/api/saved-destinations/goa", headers=first_auth).status_code == 204
    assert http.get("/api/saved-destinations", headers=first_auth).json() == []
