from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.models import Bakery, Rating, User
from app.schemas.schemas import RatingCreate, RatingOut, RatingWithBakery

router = APIRouter(prefix="/api", tags=["ratings"])


@router.post("/bakeries/{bakery_id}/ratings", response_model=RatingOut, status_code=201)
def create_rating(
    bakery_id: int,
    data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")

    overall = (data.flakiness + data.butteriness + data.freshness + data.size_value) / 4.0

    rating = Rating(
        bakery_id=bakery_id,
        flakiness=data.flakiness,
        butteriness=data.butteriness,
        freshness=data.freshness,
        size_value=data.size_value,
        score=overall,
        notes=data.notes,
        visited_at=data.visited_at or date.today(),
        user_id=current_user.id,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    return RatingOut(
        id=rating.id,
        bakery_id=rating.bakery_id,
        flakiness=rating.flakiness,
        butteriness=rating.butteriness,
        freshness=rating.freshness,
        size_value=rating.size_value,
        overall_score=rating.score,
        notes=rating.notes,
        visited_at=rating.visited_at,
        created_at=rating.created_at,
        username=current_user.username,
    )


@router.get("/ratings/me", response_model=list[RatingWithBakery])
def my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ratings = (
        db.query(Rating)
        .filter(Rating.user_id == current_user.id)
        .order_by(Rating.created_at.desc())
        .all()
    )
    result = []
    for r in ratings:
        bakery = db.query(Bakery).filter(Bakery.id == r.bakery_id).first()
        result.append(
            RatingWithBakery(
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
                username=current_user.username,
                bakery_name=bakery.name if bakery else "Unknown",
            )
        )
    return result
