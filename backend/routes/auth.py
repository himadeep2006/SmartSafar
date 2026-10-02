from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AuthResponse, LoginRequest, SignupRequest, UserPublic
from ..security import create_access_token, hash_password, verify_password, verify_unknown_account

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    duplicate = db.scalar(
        select(User).where(or_(User.username == payload.username, User.email == payload.email))
    )
    if duplicate:
        if duplicate.username == payload.username:
            raise HTTPException(status_code=409, detail="That username is already in use.")
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password.get_secret_value()),
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with those details already exists.") from None

    return AuthResponse(access_token=create_access_token(user.id), user=UserPublic.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    identifier = payload.identifier
    field = User.email if "@" in identifier else User.username
    user = db.scalar(select(User).where(field == identifier))
    password = payload.password.get_secret_value()

    password_is_valid = verify_password(password, user.password_hash) if user else False
    if user is None:
        verify_unknown_account(password)
    if not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/username or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthResponse(access_token=create_access_token(user.id), user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def current_user(user: User = Depends(get_current_user)):
    return user
