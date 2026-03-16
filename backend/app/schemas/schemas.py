from __future__ import annotations

from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator


class BakeryCreate(BaseModel):
    name: str
    address: str


class RatingCreate(BaseModel):
    flakiness: int = Field(ge=1, le=5)
    butteriness: int = Field(ge=1, le=5)
    freshness: int = Field(ge=1, le=5)
    size_value: int = Field(ge=1, le=5)
    notes: str | None = None
    visited_at: date | None = None

    @field_validator("flakiness", "butteriness", "freshness", "size_value")
    @classmethod
    def score_in_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Score must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    id: int
    bakery_id: int
    flakiness: int
    butteriness: int
    freshness: int
    size_value: int
    overall_score: float
    notes: str | None
    price: float | None = None
    photo_url: str | None = None
    visited_at: date
    created_at: datetime
    username: str | None = None

    class Config:
        from_attributes = True


class RatingWithBakery(RatingOut):
    """Rating including bakery name, used for user history."""
    bakery_name: str


class BakeryAggregate(BaseModel):
    avg_flakiness: float | None = None
    avg_butteriness: float | None = None
    avg_freshness: float | None = None
    avg_size_value: float | None = None
    avg_overall: float | None = None
    avg_price: float | None = None
    rating_count: int = 0


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
    aggregate: BakeryAggregate | None = None


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
