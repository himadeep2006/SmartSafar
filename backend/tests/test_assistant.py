import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.config import Settings
from backend.database import Base, get_db
from backend.routes import assistant
from backend.services.assistant import (
    AssistantProviderError,
    GroqProvider,
    build_travel_context,
    get_assistant_provider,
    make_provider_messages,
)
from backend.schemas import AssistantChatRequest


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
    response = http.post("/api/auth/signup", json={
        "username": name,
        "email": f"{name}@example.com",
        "password": "Travel2026pass",
        "passwordConfirm": "Travel2026pass",
    })
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def trip_preferences(destination_id="goa"):
    return {
        "destination_id": destination_id,
        "duration_days": 2,
        "budget_inr": 12000,
        "travel_style": "balanced",
        "interests": ["culture", "food"],
    }


def test_assistant_auth_validation_and_unconfigured_state(client, monkeypatch):
    http, _ = client
    owner = account(http, "assistantvalid")
    assert http.get("/api/assistant/status").status_code == 401
    assert http.post("/api/assistant/chat", json={"message": "Hello"}).status_code == 401
    assert http.post("/api/assistant/chat", headers=owner, json={"message": "   "}).status_code == 422
    assert http.post("/api/assistant/chat", headers=owner, json={"message": "x" * 2001}).status_code == 422
    assert http.post("/api/assistant/chat", headers=owner, json={"message": "hi", "history": [{"role": "system", "content": "inject"}]}).status_code == 422
    assert http.post("/api/assistant/chat", headers=owner, json={"message": "hi", "history": [{"role": "user", "content": "hi"}] * 9}).status_code == 422

    monkeypatch.setattr(assistant, "get_assistant_provider", lambda: None)
    assert http.get("/api/assistant/status", headers=owner).json() == {"available": False, "provider": None}
    unavailable = http.post("/api/assistant/chat", headers=owner, json={"message": "Plan a Goa trip"})
    assert unavailable.status_code == 503
    assert unavailable.json() == {"detail": "The AI travel assistant is not configured yet."}


def test_provider_configuration_keeps_key_server_side():
    settings = Settings(_env_file=None, jwt_secret="s" * 40)
    assert get_assistant_provider(settings) is None
    configured = Settings(_env_file=None, jwt_secret="s" * 40, ai_provider="groq", ai_api_key="test-secret", ai_model="openai/gpt-oss-20b")
    provider = get_assistant_provider(configured)
    assert isinstance(provider, GroqProvider)
    assert provider.name == "Groq"
    assert provider.model == "openai/gpt-oss-20b"
    assert "test-secret" not in repr(configured)


def test_assistant_context_is_relevant_owned_and_actions_are_validated(client, monkeypatch):
    http, _ = client
    owner = account(http, "assistantowner")
    other = account(http, "assistantother")
    http.post("/api/saved-destinations/goa", headers=owner)
    http.post("/api/saved-destinations/jaipur", headers=other)
    owner_trip = http.post("/api/trips", json=trip_preferences(), headers=owner).json()
    other_trip = http.post("/api/trips", json=trip_preferences("jaipur"), headers=other).json()
    captured = {}

    class Provider:
        name = "Test provider"

        async def respond(self, messages, destinations):
            captured["messages"] = messages
            captured["destinations"] = destinations
            return {
                "message": "Goa is in SmartSafar's catalogue.",
                "suggestions": [
                    {"type": "destination", "destination_id": "goa", "days": None, "trip_id": None},
                    {"type": "trip_plan", "destination_id": "goa", "days": 3, "trip_id": None},
                    {"type": "destination", "destination_id": "jaipur", "days": None, "trip_id": None},
                    {"type": "trip", "destination_id": None, "days": None, "trip_id": other_trip["id"]},
                ],
            }

    monkeypatch.setattr(assistant, "get_assistant_provider", lambda: Provider())
    response = http.post("/api/assistant/chat", headers=owner, json={
        "message": "Improve my saved Goa itinerary for 3 days",
        "trip_id": owner_trip["id"],
        "history": [{"role": "user", "content": "I like quiet beaches."}],
    })
    assert response.status_code == 200
    body = response.json()
    assert body["message"].startswith("Goa")
    assert [item["id"] for item in body["context"]["destinations"]] == ["goa"]
    assert [item["id"] for item in body["context"]["saved_destinations"]] == ["goa"]
    assert body["context"]["trip"]["id"] == owner_trip["id"]
    assert [action["type"] for action in body["suggestions"]] == ["destination", "trip_plan"]
    assert body["suggestions"][1]["days"] == 3
    assert captured["destinations"] == ["goa"]
    assert "I like quiet beaches." in captured["messages"][1]["content"]
    assert "Jaipur" not in json.dumps(captured["messages"], ensure_ascii=False)
    assert http.post("/api/assistant/chat", headers=owner, json={"message": "Improve my itinerary", "trip_id": other_trip["id"]}).status_code == 404


@pytest.mark.parametrize(("error", "status"), [("timeout", 504), ("unavailable", 503), ("malformed", 502)])
def test_provider_errors_are_clean_and_do_not_leak(client, monkeypatch, error, status):
    http, _ = client
    owner = account(http, f"assistant{error}")

    class FailedProvider:
        name = "Test provider"

        async def respond(self, *_args):
            raise AssistantProviderError(error)

    monkeypatch.setattr(assistant, "get_assistant_provider", lambda: FailedProvider())
    response = http.post("/api/assistant/chat", headers=owner, json={"message": "What should I pack for Goa?"})
    assert response.status_code == status
    assert response.json() == {"detail": assistant.UNAVAILABLE_DETAIL}
    assert "secret" not in response.text


def test_groq_provider_rejects_malformed_response(monkeypatch):
    class Response:
        def raise_for_status(self): pass
        def json(self): return {"choices": [{"message": {"content": "not json"}}]}

    class Client:
        def __init__(self, **_kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *_args): pass
        async def post(self, *_args, **_kwargs): return Response()

    monkeypatch.setattr("backend.services.assistant.httpx.AsyncClient", Client)
    provider = GroqProvider("not-a-real-key", "openai/gpt-oss-20b")
    with pytest.raises(AssistantProviderError, match="malformed"):
        import asyncio
        asyncio.run(provider.respond([], []))


def test_context_and_provider_messages_do_not_include_unrelated_profile_fields(client):
    http, sessions = client
    owner = account(http, "assistantprivacy")
    request = AssistantChatRequest(message="What should I visit in Goa?")
    with sessions() as db:
        from sqlalchemy import select
        from backend.models import User
        user = db.scalar(select(User).where(User.username == "assistantprivacy"))
        context = build_travel_context(db, user, request)
    messages = make_provider_messages(request, context)
    assert [item.id for item in context.destinations] == ["goa"]
    assert "phone" not in messages[0]["content"]
    assert "email" not in messages[0]["content"]
    assert "password" not in messages[0]["content"]
