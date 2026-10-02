from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, UserProfile
from ..schemas import ProfilePublic, ProfileUpdate

router = APIRouter()


def profile_for(db: Session, user: User) -> UserProfile:
    profile = db.get(UserProfile, user.id)
    if profile is None:
        profile = UserProfile(user_id=user.id, display_name=user.username, preferred_language="English", travel_preferences={})
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def response(profile: UserProfile, user: User) -> ProfilePublic:
    return ProfilePublic(
        display_name=profile.display_name, email=user.email, username=user.username, phone=profile.phone,
        home_city=profile.home_city, preferred_language=profile.preferred_language,
        travel_interests=profile.travel_interests, travel_preferences=profile.travel_preferences or {},
    )


@router.get("/profile", response_model=ProfilePublic)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return response(profile_for(db, user), user)


@router.put("/profile", response_model=ProfilePublic)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = profile_for(db, user)
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return response(profile, user)
