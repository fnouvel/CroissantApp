import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Bakery, Rating
from app.schemas.schemas import BakeryCreate, BakeryOut, BakeryDetail

router = APIRouter(prefix="/api/bakeries", tags=["bakeries"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_address(address: str) -> tuple[float | None, float | None]:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                NOMINATIM_URL,
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": "FloreCroissant/1.0"},
                timeout=5.0,
            )
            results = resp.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None, None


@router.get("", response_model=list[BakeryOut])
def list_bakeries(db: Session = Depends(get_db)):
    bakeries = db.query(Bakery).all()
    result = []
    for b in bakeries:
        avg = db.query(func.avg(Rating.score)).filter(Rating.bakery_id == b.id).scalar()
        result.append(BakeryOut(
            id=b.id,
            name=b.name,
            address=b.address,
            latitude=b.latitude,
            longitude=b.longitude,
            avg_score=round(avg, 1) if avg else None,
            created_at=b.created_at,
        ))
    return result


@router.post("", response_model=BakeryOut, status_code=201)
async def create_bakery(data: BakeryCreate, db: Session = Depends(get_db)):
    lat, lon = await geocode_address(data.address)
    bakery = Bakery(name=data.name, address=data.address, latitude=lat, longitude=lon)
    db.add(bakery)
    db.commit()
    db.refresh(bakery)
    return BakeryOut(
        id=bakery.id,
        name=bakery.name,
        address=bakery.address,
        latitude=bakery.latitude,
        longitude=bakery.longitude,
        avg_score=None,
        created_at=bakery.created_at,
    )


@router.get("/{bakery_id}", response_model=BakeryDetail)
def get_bakery(bakery_id: int, db: Session = Depends(get_db)):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")
    avg = db.query(func.avg(Rating.score)).filter(Rating.bakery_id == bakery.id).scalar()
    return BakeryDetail(
        id=bakery.id,
        name=bakery.name,
        address=bakery.address,
        latitude=bakery.latitude,
        longitude=bakery.longitude,
        avg_score=round(avg, 1) if avg else None,
        created_at=bakery.created_at,
        ratings=[r for r in bakery.ratings],
    )


@router.delete("/{bakery_id}", status_code=204)
def delete_bakery(bakery_id: int, db: Session = Depends(get_db)):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")
    db.delete(bakery)
    db.commit()
