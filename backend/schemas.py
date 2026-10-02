from datetime import datetime

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
