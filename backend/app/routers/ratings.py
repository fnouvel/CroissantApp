import os
import uuid
from datetime import date
from io import BytesIO

import pillow_heif
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.models import Bakery, Rating, User
from app.schemas.schemas import RatingOut, RatingWithBakery

router = APIRouter(prefix="/api", tags=["ratings"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
HEIC_TYPES = {"image/heic", "image/heif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

pillow_heif.register_heif_opener()


@router.post("/bakeries/{bakery_id}/ratings", response_model=RatingOut, status_code=201)
async def create_rating(
    bakery_id: int,
    flakiness: int = Form(...),
    butteriness: int = Form(...),
    freshness: int = Form(...),
    size_value: int = Form(...),
    notes: str | None = Form(None),
    price: float | None = Form(None),
    visited_at: date | None = Form(None),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")

    for field_name, val in [("flakiness", flakiness), ("butteriness", butteriness),
                            ("freshness", freshness), ("size_value", size_value)]:
        if not 1 <= val <= 5:
            raise HTTPException(status_code=422, detail=f"{field_name} must be between 1 and 5")

    photo_url = None
    if photo and photo.filename:
        if photo.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and HEIC images are allowed")
        contents = await photo.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Image must be under 5 MB")

        if photo.content_type in HEIC_TYPES:
            img = Image.open(BytesIO(contents))
            img = img.convert("RGB")
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=90)
            contents = buf.getvalue()
            ext = "jpg"
        else:
            ext = photo.filename.rsplit(".", 1)[-1].lower() if "." in photo.filename else "jpg"

        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        photo_url = f"/uploads/{filename}"

    overall = (flakiness + butteriness + freshness + size_value) / 4.0

    rating = Rating(
        bakery_id=bakery_id,
        flakiness=flakiness,
        butteriness=butteriness,
        freshness=freshness,
        size_value=size_value,
        score=overall,
        notes=notes,
        price=price,
        photo_url=photo_url,
        visited_at=visited_at or date.today(),
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
        price=rating.price,
        photo_url=rating.photo_url,
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
                price=r.price,
                photo_url=r.photo_url,
                visited_at=r.visited_at,
                created_at=r.created_at,
                username=current_user.username,
                bakery_name=bakery.name if bakery else "Unknown",
            )
        )
    return result


@router.delete("/ratings/{rating_id}", status_code=204)
def delete_rating(
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    if rating.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this rating")

    if rating.photo_url:
        photo_path = os.path.join(UPLOAD_DIR, os.path.basename(rating.photo_url))
        if os.path.exists(photo_path):
            os.remove(photo_path)

    db.delete(rating)
    db.commit()
