from datetime import datetime, timedelta, timezone

import jwt
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.config import Settings, get_settings
from backend.database import Base, get_db
from backend.models import User


def test_settings_reject_the_example_jwt_secret():
    with pytest.raises(ValidationError):
        Settings(jwt_secret="replace-with-a-random-secret-at-least-32-characters")


@pytest.fixture()
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client, TestSession
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def test_signup_login_and_protected_current_user(client):
    http, sessions = client
    signup = http.post(
        "/api/auth/signup",
        json={
            "username": "Voyager_01",
            "email": "VOYAGER@example.com",
            "password": "Safar2026pass",
            "passwordConfirm": "Safar2026pass",
        },
    )
    assert signup.status_code == 201
    data = signup.json()
    assert data["user"]["username"] == "voyager_01"
    assert data["user"]["email"] == "voyager@example.com"
    assert "password" not in data and "password_hash" not in data
    assert http.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"}).json() == data["user"]

    with sessions() as db:
        user = db.query(User).filter_by(email="voyager@example.com").one()
        assert user.password_hash != "Safar2026pass"
        assert user.password_hash.startswith("$argon2")
        assert user.created_at is not None and user.updated_at is not None

    login = http.post("/api/auth/login", json={"email": "voyager@example.com", "password": "Safar2026pass"})
    assert login.status_code == 200
    assert login.json()["user"] == data["user"]
    username_login = http.post("/api/auth/login", json={"username": "VOYAGER_01", "password": "Safar2026pass"})
    assert username_login.status_code == 200
    assert http.get("/api/auth/me").status_code == 401
    assert http.get("/api/auth/me", headers={"Authorization": "Bearer malformed"}).status_code == 401


@pytest.mark.parametrize(
    ("payload", "status_code"),
    [
        ({"username": "voyager", "email": "bad-email", "password": "Safar2026pass", "passwordConfirm": "Safar2026pass"}, 422),
        ({"username": "voyager", "email": "valid@example.com", "password": "short", "passwordConfirm": "short"}, 422),
        ({"username": "voyager", "email": "valid@example.com", "password": "safarpass", "passwordConfirm": "safarpass"}, 422),
        ({"username": "voyager", "email": "valid@example.com", "password": "Safar2026pass", "passwordConfirm": "Safar2026pass!"}, 422),
    ],
)
def test_signup_validation_does_not_echo_password(client, payload, status_code):
    http, _ = client
    response = http.post("/api/auth/signup", json=payload)
    assert response.status_code == status_code
    assert payload["password"] not in response.text


def test_duplicate_username_email_invalid_login_and_expired_token(client):
    http, _ = client
    signup_payload = {
        "username": "tripmaker",
        "email": "tripmaker@example.com",
        "password": "TripMaker2026",
        "passwordConfirm": "TripMaker2026",
    }
    assert http.post("/api/auth/signup", json=signup_payload).status_code == 201
    duplicate_username = {**signup_payload, "email": "another@example.com"}
    assert http.post("/api/auth/signup", json=duplicate_username).status_code == 409
    duplicate_email = {**signup_payload, "username": "anotheruser"}
    assert http.post("/api/auth/signup", json=duplicate_email).status_code == 409
    assert http.post("/api/auth/login", json={"email": "tripmaker@example.com", "password": "wrong-password"}).status_code == 401
    expired = jwt.encode(
        {"sub": "1", "iat": datetime.now(timezone.utc) - timedelta(hours=2), "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        get_settings().jwt_secret.get_secret_value(),
        algorithm=get_settings().jwt_algorithm,
    )
    assert http.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401


def test_cors_allows_only_the_configured_react_origin(client):
    http, _ = client
    allowed = http.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"

    rejected = http.options(
        "/api/auth/login",
        headers={"Origin": "http://untrusted.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in rejected.headers
