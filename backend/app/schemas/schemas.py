from datetime import date, datetime
from pydantic import BaseModel, Field


class BakeryCreate(BaseModel):
    name: str
    address: str


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    notes: str | None = None
    visited_at: date | None = None


class RatingOut(BaseModel):
    id: int
    bakery_id: int
    score: int
    notes: str | None
    visited_at: date
    created_at: datetime

    class Config:
        from_attributes = True


class BakeryOut(BaseModel):
    id: int
    name: str
    address: str
    latitude: float | None
    longitude: float | None
    avg_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class BakeryDetail(BakeryOut):
    ratings: list[RatingOut]
