from datetime import date, datetime
import re
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator, model_validator


class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_-]+$")
    email: EmailStr
    password: SecretStr = Field(min_length=8, max_length=128)
    password_confirm: SecretStr = Field(
        validation_alias=AliasChoices("passwordConfirm", "password_confirm")
    )

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if not any(char.isalpha() for char in password) or not any(char.isdigit() for char in password):
            raise ValueError("Password must include at least one letter and one number.")
        return value

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password.get_secret_value() != self.password_confirm.get_secret_value():
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=1,
        max_length=254,
        validation_alias=AliasChoices("identifier", "email", "username"),
    )
    password: SecretStr = Field(min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()


class DestinationPublic(BaseModel):
    id: str
    name: str
    state: str
    country: str = "India"
    short_description: str
    description: str
    category: str
    image: str | None = None
    latitude: float
    longitude: float
    best_time_to_visit: str
    estimated_budget: str
    tags: list[str]


class SavedDestinationPublic(DestinationPublic):
    saved_at: datetime


SUPPORTED_LANGUAGES = ("English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi")


class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    phone: str | None = Field(default=None, max_length=20)
    home_city: str | None = Field(default=None, max_length=80)
    preferred_language: Literal["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi"] = "English"
    travel_interests: str = Field(default="", max_length=500)
    travel_preferences: dict[str, bool] = Field(default_factory=dict)

    @field_validator("display_name", "home_city", "travel_interests")
    @classmethod
    def trim_profile_text(cls, value):
        if value is None:
            return value
        return value.strip()

    @field_validator("display_name")
    @classmethod
    def require_name(cls, value):
        if not value.strip():
            raise ValueError("Display name is required.")
        return value.strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if value is None or not value.strip():
            return None
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9 ()-]{6,18}[0-9]", normalized):
            raise ValueError("Enter a valid phone number.")
        return normalized


class ProfilePublic(ProfileUpdate):
    email: EmailStr
    username: str


class EmergencyContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=8, max_length=20)

    @field_validator("name")
    @classmethod
    def valid_contact_name(cls, value):
        if not value.strip():
            raise ValueError("Contact name is required.")
        return value.strip()

    @field_validator("phone")
    @classmethod
    def valid_contact_phone(cls, value):
        value = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9 ()-]{6,18}[0-9]", value):
            raise ValueError("Enter a valid phone number.")
        return value


class EmergencyContactPublic(EmergencyContactCreate):
    id: int


class NearbyServicesRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


TRANSLATION_LANGUAGE_CODES = ("en", "hi", "ta", "te", "kn", "ml", "bn", "mr")


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    source_language: Literal["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"]
    target_language: Literal["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"]

    @field_validator("text")
    @classmethod
    def trim_translation_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter text to translate.")
        return value

    @model_validator(mode="after")
    def require_different_languages(self):
        if self.source_language == self.target_language:
            raise ValueError("Choose two different languages.")
        return self


class TranslationResponse(BaseModel):
    translation: str
    source_language: str
    target_language: str
    provider: str


class AssistantHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)

    @field_validator("content")
    @classmethod
    def trim_history_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Conversation messages cannot be blank.")
        return value


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantHistoryMessage] = Field(default_factory=list, max_length=8)
    trip_id: int | None = Field(default=None, ge=1)

    @field_validator("message")
    @classmethod
    def trim_assistant_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter a travel question to continue.")
        return value


class AssistantSuggestion(BaseModel):
    type: Literal["destination", "trip_plan", "trip"]
    destination_id: str | None = Field(default=None, max_length=64)
    days: int | None = Field(default=None, ge=1, le=14)
    trip_id: int | None = Field(default=None, ge=1)


class AssistantTripContext(BaseModel):
    id: int
    destination_id: str
    title: str
    duration_days: int
    start_date: date | None
    itinerary: list[dict]
    itinerary_stale: bool


class AssistantContext(BaseModel):
    destinations: list[DestinationPublic] = Field(default_factory=list)
    saved_destinations: list[DestinationPublic] = Field(default_factory=list)
    trip: AssistantTripContext | None = None
    preferred_language: str | None = None


class AssistantChatResponse(BaseModel):
    message: str
    suggestions: list[AssistantSuggestion] = Field(default_factory=list, max_length=4)
    context: AssistantContext


class AssistantStatus(BaseModel):
    available: bool
    provider: str | None = None


from datetime import date
from typing import Literal
from pydantic import model_validator

TRAVEL_STYLES = ("balanced", "relaxed", "adventure", "culture", "food", "budget")
TRIP_INTERESTS = ("heritage", "nature", "food", "culture", "adventure", "wellness", "photography", "shopping")
TRIP_ACTIVITIES = ("walking", "museums", "local food", "markets", "outdoors", "temples", "relaxation", "wildlife")


class TripPreferences(BaseModel):
    destination_id: str = Field(min_length=1, max_length=64)
    duration_days: int = Field(ge=1, le=14)
    budget_inr: int = Field(ge=1000, le=10000000)
    travel_style: Literal["balanced", "relaxed", "adventure", "culture", "food", "budget"] = "balanced"
    interests: list[Literal["heritage", "nature", "food", "culture", "adventure", "wellness", "photography", "shopping"]] = Field(min_length=1, max_length=8)
    preferred_activities: list[Literal["walking", "museums", "local food", "markets", "outdoors", "temples", "relaxation", "wildlife"]] = Field(default_factory=list, max_length=8)
    starting_location: str | None = Field(default=None, max_length=100)
    companions: int = Field(default=1, ge=1, le=20)
    start_date: date | None = None

    @field_validator("destination_id", "starting_location")
    @classmethod
    def trim_optional_text(cls, value):
        return value.strip() if value else value

    @field_validator("interests", "preferred_activities")
    @classmethod
    def unique_choices(cls, value):
        if len({item.casefold() for item in value}) != len(value):
            raise ValueError("Remove duplicate selections.")
        return value


class TripPlanRequest(TripPreferences):
    pass


class TripCreate(TripPreferences):
    title: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("title")
    @classmethod
    def trim_title(cls, value):
        return value.strip() if value else value


class TripUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    duration_days: int | None = Field(default=None, ge=1, le=14)
    budget_inr: int | None = Field(default=None, ge=1000, le=10000000)
    travel_style: Literal["balanced", "relaxed", "adventure", "culture", "food", "budget"] | None = None
    interests: list[Literal["heritage", "nature", "food", "culture", "adventure", "wellness", "photography", "shopping"]] | None = Field(default=None, min_length=1, max_length=8)
    preferred_activities: list[Literal["walking", "museums", "local food", "markets", "outdoors", "temples", "relaxation", "wildlife"]] | None = Field(default=None, max_length=8)
    start_date: date | None = None

    @field_validator("title")
    @classmethod
    def valid_title(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Trip title cannot be blank.")
        return value.strip() if value else value

    @model_validator(mode="after")
    def unique_interests(self):
        for field in ("interests", "preferred_activities"):
            values = getattr(self, field)
            if values is not None and len(set(values)) != len(values):
                raise ValueError("Remove duplicate selections.")
        return self


class TripPublic(BaseModel):
    id: int
    user_id: int
    destination_id: str
    destination: DestinationPublic
    title: str
    duration_days: int
    budget_inr: int
    travel_style: str
    interests: list[str]
    preferred_activities: list[str]
    starting_location: str | None
    companions: int
    start_date: date | None
    itinerary: list[dict]
    itinerary_stale: bool
    planner_label: str = "Smart itinerary generated from your preferences"
    created_at: datetime
    updated_at: datetime


class TripSummary(BaseModel):
    id: int
    destination_id: str
    destination: DestinationPublic
    title: str
    duration_days: int
    budget_inr: int
    travel_style: str
    start_date: date | None
    itinerary_stale: bool
    created_at: datetime
