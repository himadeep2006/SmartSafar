import json
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import EmergencyContact, User
from ..schemas import EmergencyContactCreate, EmergencyContactPublic, NearbyServicesRequest

router = APIRouter()


@router.get("/safety/contacts", response_model=list[EmergencyContactPublic])
def list_contacts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(db.scalars(select(EmergencyContact).where(EmergencyContact.user_id == user.id).order_by(EmergencyContact.id)))


@router.post("/safety/contacts", response_model=EmergencyContactPublic, status_code=201)
def create_contact(payload: EmergencyContactCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = EmergencyContact(user_id=user.id, **payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/safety/contacts/{contact_id}", response_model=EmergencyContactPublic)
def update_contact(contact_id: int, payload: EmergencyContactCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = db.scalar(select(EmergencyContact).where(EmergencyContact.id == contact_id, EmergencyContact.user_id == user.id))
    if contact is None:
        raise HTTPException(status_code=404, detail="Emergency contact not found.")
    contact.name, contact.phone = payload.name, payload.phone
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/safety/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = db.scalar(select(EmergencyContact).where(EmergencyContact.id == contact_id, EmergencyContact.user_id == user.id))
    if contact is None:
        raise HTTPException(status_code=404, detail="Emergency contact not found.")
    db.delete(contact)
    db.commit()


@router.post("/safety/nearby")
def nearby_services(payload: NearbyServicesRequest, user: User = Depends(get_current_user)):
    # Explicit one-shot coordinates only; OpenStreetMap Overpass is free and no location is stored.
    query = f"[out:json][timeout:8];(nwr(around:5000,{payload.latitude},{payload.longitude})[amenity~\"^(hospital|clinic|doctors|police|fire_station)$\"];);out center tags;"
    req = Request("https://overpass-api.de/api/interpreter", data=urlencode({"data": query}).encode(), headers={"User-Agent": "SmartSafar/1.0 (nearby emergency lookup)"})
    try:
        with urlopen(req, timeout=10) as response:
            elements = json.load(response).get("elements", [])
    except (URLError, TimeoutError, OSError, ValueError):
        raise HTTPException(status_code=503, detail="OpenStreetMap nearby lookup is temporarily unavailable. Try again later.") from None
    results = []
    for element in elements:
        tags = element.get("tags", {})
        point = element.get("center", element)
        kind = tags.get("amenity")
        if kind and "lat" in point and "lon" in point:
            results.append({"id": str(element.get("id")), "name": tags.get("name") or {"hospital": "Unnamed hospital/clinic", "clinic": "Unnamed clinic", "doctors": "Unnamed medical practice", "police": "Unnamed police service", "fire_station": "Unnamed fire station"}.get(kind, "Emergency service"), "kind": kind, "latitude": point["lat"], "longitude": point["lon"], "source": "OpenStreetMap"})
    return {"services": results[:100], "source": "OpenStreetMap / Overpass API", "radius_meters": 5000, "retrieved_at": datetime.now(timezone.utc)}
