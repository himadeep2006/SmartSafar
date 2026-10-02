from fastapi import APIRouter, HTTPException, Query

from ..schemas import DestinationPublic
from ..services.destinations import CATEGORIES, DESTINATIONS, STATES, get_destination, list_destinations

router = APIRouter()


@router.get("/destinations", response_model=list[DestinationPublic])
def destinations(
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=32),
    state: str | None = Query(default=None, max_length=64),
):
    category = category.strip() or None if category else None
    state = state.strip() or None if state else None
    if category and category.strip().casefold() not in {value.casefold() for value in CATEGORIES}:
        raise HTTPException(status_code=422, detail="Choose a supported destination category.")
    if state and state.strip().casefold() not in {value.casefold() for value in STATES}:
        raise HTTPException(status_code=422, detail="Choose a supported Indian state or union territory.")
    return list_destinations(search, category, state)


@router.get("/destinations/{destination_id}", response_model=DestinationPublic)
def destination_detail(destination_id: str):
    destination = get_destination(destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found.")
    return destination
