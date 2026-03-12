import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Bakery, Rating
from app.schemas.schemas import (
    BakeryAggregate,
    BakeryCreate,
    BakeryDetail,
    BakeryOut,
    RatingOut,
)

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


def _compute_aggregate(db: Session, bakery_id: int) -> BakeryAggregate:
    row = db.query(
        func.avg(Rating.flakiness),
        func.avg(Rating.butteriness),
        func.avg(Rating.freshness),
        func.avg(Rating.size_value),
        func.avg(Rating.score),
        func.count(Rating.id),
    ).filter(Rating.bakery_id == bakery_id).first()

    if not row or row[5] == 0:
        return BakeryAggregate()

    return BakeryAggregate(
        avg_flakiness=round(row[0], 2) if row[0] else None,
        avg_butteriness=round(row[1], 2) if row[1] else None,
        avg_freshness=round(row[2], 2) if row[2] else None,
        avg_size_value=round(row[3], 2) if row[3] else None,
        avg_overall=round(row[4], 2) if row[4] else None,
        rating_count=row[5],
    )


def _rating_to_out(r: Rating) -> RatingOut:
    username = r.user.username if r.user else None
    return RatingOut(
        id=r.id,
        bakery_id=r.bakery_id,
        flakiness=r.flakiness,
        butteriness=r.butteriness,
        freshness=r.freshness,
        size_value=r.size_value,
        overall_score=r.score,
        notes=r.notes,
        visited_at=r.visited_at,
        created_at=r.created_at,
        username=username,
    )


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
            avg_score=round(avg, 2) if avg else None,
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

    aggregate = _compute_aggregate(db, bakery.id)
    ratings_out = [_rating_to_out(r) for r in bakery.ratings]

    return BakeryDetail(
        id=bakery.id,
        name=bakery.name,
        address=bakery.address,
        latitude=bakery.latitude,
        longitude=bakery.longitude,
        avg_score=aggregate.avg_overall,
        created_at=bakery.created_at,
        ratings=ratings_out,
        aggregate=aggregate,
    )


@router.delete("/{bakery_id}", status_code=204)
def delete_bakery(bakery_id: int, db: Session = Depends(get_db)):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")
    db.delete(bakery)
    db.commit()
