from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import SavedDestination, User
from ..schemas import SavedDestinationPublic
from ..services.destinations import get_destination

router = APIRouter()


def _saved_response(record: SavedDestination) -> SavedDestinationPublic:
    destination = get_destination(record.destination_id)
    if destination is None:
        # Catalogue IDs are immutable; this protects responses if the curated set changes.
        raise HTTPException(status_code=404, detail="A saved destination is no longer available.")
    return SavedDestinationPublic(**destination.model_dump(), saved_at=record.created_at)


@router.get("/saved-destinations", response_model=list[SavedDestinationPublic])
def list_saved_destinations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.scalars(
        select(SavedDestination).where(SavedDestination.user_id == user.id).order_by(SavedDestination.created_at.desc())
    ).all()
    return [_saved_response(record) for record in records]


@router.post("/saved-destinations/{destination_id}", response_model=SavedDestinationPublic, status_code=status.HTTP_201_CREATED)
def save_destination(
    destination_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    destination = get_destination(destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found.")
    existing = db.scalar(
        select(SavedDestination).where(
            SavedDestination.user_id == user.id,
            SavedDestination.destination_id == destination.id,
        )
    )
    if existing:
        return SavedDestinationPublic(**destination.model_dump(), saved_at=existing.created_at)
    record = SavedDestination(user_id=user.id, destination_id=destination.id)
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        record = db.scalar(
            select(SavedDestination).where(
                SavedDestination.user_id == user.id,
                SavedDestination.destination_id == destination.id,
            )
        )
        if record is None:
            raise HTTPException(status_code=409, detail="Could not save this destination. Please try again.") from None
    return SavedDestinationPublic(**destination.model_dump(), saved_at=record.created_at)


@router.delete("/saved-destinations/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_destination(
    destination_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if get_destination(destination_id) is None:
        raise HTTPException(status_code=404, detail="Destination not found.")
    record = db.scalar(
        select(SavedDestination).where(
            SavedDestination.user_id == user.id,
            SavedDestination.destination_id == destination_id.casefold(),
        )
    )
    if record:
        db.delete(record)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
