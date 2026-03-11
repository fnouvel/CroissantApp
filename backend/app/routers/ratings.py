from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.models import Bakery, Rating, User
from app.schemas.schemas import RatingCreate, RatingOut

router = APIRouter(prefix="/api/bakeries", tags=["ratings"])


@router.post("/{bakery_id}/ratings", response_model=RatingOut, status_code=201)
def create_rating(
    bakery_id: int,
    data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")
    rating = Rating(
        bakery_id=bakery_id,
        score=data.score,
        notes=data.notes,
        visited_at=data.visited_at or date.today(),
        user_id=current_user.id,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating
