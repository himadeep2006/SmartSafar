from sqlalchemy import ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    phone: Mapped[str | None] = mapped_column(String(20))
    home_city: Mapped[str | None] = mapped_column(String(80))
    preferred_language: Mapped[str] = mapped_column(String(24), nullable=False, default="English")
    travel_interests: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    travel_preferences: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
