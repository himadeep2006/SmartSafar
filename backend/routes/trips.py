from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Trip, User
from ..schemas import TripCreate, TripPlanRequest, TripPreferences, TripPublic, TripSummary, TripUpdate
from ..services.destinations import get_destination
from ..services.trip_planner import planner

router = APIRouter()


def _destination_or_404(destination_id):
    destination = get_destination(destination_id)
    if destination is None:
        raise HTTPException(status_code=422, detail="Choose a destination from the SmartSafar catalogue.")
    return destination


def _plan(prefs):
    destination = _destination_or_404(prefs.destination_id)
    return {"destination": destination.model_dump(), "preferences": prefs.model_dump(mode="json"), "itinerary": planner.generate(destination, prefs), "planner_label": planner.label}


def _owned_trip(db, user_id, trip_id):
    trip = db.scalar(select(Trip).where(Trip.id == trip_id, Trip.user_id == user_id))
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return trip


def _public(trip, summary=False):
    destination = _destination_or_404(trip.destination_id)
    values = {"id": trip.id, "destination_id": trip.destination_id, "destination": destination.model_dump(), "title": trip.title, "duration_days": trip.duration_days, "budget_inr": trip.budget_inr, "travel_style": trip.travel_style, "start_date": trip.start_date, "itinerary_stale": trip.itinerary_stale, "created_at": trip.created_at}
    if summary:
        return TripSummary(**values)
    values.update({"user_id": trip.user_id, "interests": trip.interests, "preferred_activities": trip.preferred_activities, "starting_location": trip.starting_location, "companions": trip.companions, "itinerary": trip.itinerary, "updated_at": trip.updated_at})
    return TripPublic(**values)


@router.post("/trip-plans/generate")
def generate_preview(payload: TripPlanRequest, _user: User = Depends(get_current_user)):
    return _plan(payload)


@router.post("/trips", response_model=TripPublic, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    destination = _destination_or_404(payload.destination_id)
    title = payload.title or f"{destination.name} · {payload.duration_days} day{'s' if payload.duration_days != 1 else ''}"
    trip = Trip(user_id=user.id, destination_id=destination.id, title=title, duration_days=payload.duration_days, budget_inr=payload.budget_inr, travel_style=payload.travel_style, interests=payload.interests, preferred_activities=payload.preferred_activities, starting_location=payload.starting_location, companions=payload.companions, start_date=payload.start_date, itinerary=planner.generate(destination, payload))
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _public(trip)


@router.get("/trips", response_model=list[TripSummary])
def list_trips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [_public(trip, summary=True) for trip in db.scalars(select(Trip).where(Trip.user_id == user.id).order_by(Trip.created_at.desc(), Trip.id.desc())).all()]


@router.get("/trips/{trip_id}", response_model=TripPublic)
def trip_detail(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _public(_owned_trip(db, user.id, trip_id))


@router.patch("/trips/{trip_id}", response_model=TripPublic)
def update_trip(trip_id: int, payload: TripUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = _owned_trip(db, user.id, trip_id)
    changes = payload.model_dump(exclude_unset=True)
    itinerary_changes = {"duration_days", "budget_inr", "travel_style", "interests", "preferred_activities"}
    changed_preferences = any(getattr(trip, key) != value for key, value in changes.items() if key in itinerary_changes)
    for key, value in changes.items():
        setattr(trip, key, value)
    if changed_preferences:
        trip.itinerary_stale = True
    trip.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trip)
    return _public(trip)


@router.post("/trips/{trip_id}/generate", response_model=TripPublic)
def regenerate_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = _owned_trip(db, user.id, trip_id)
    prefs = TripPreferences(destination_id=trip.destination_id, duration_days=trip.duration_days, budget_inr=trip.budget_inr, travel_style=trip.travel_style, interests=trip.interests, preferred_activities=trip.preferred_activities, starting_location=trip.starting_location, companions=trip.companions, start_date=trip.start_date)
    destination = _destination_or_404(trip.destination_id)
    trip.itinerary = planner.generate(destination, prefs)
    trip.itinerary_stale = False
    trip.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trip)
    return _public(trip)


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = _owned_trip(db, user.id, trip_id)
    db.delete(trip)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
