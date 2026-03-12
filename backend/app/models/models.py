from datetime import datetime, date

from sqlalchemy import Boolean, Column, Integer, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Bakery(Base):
    __tablename__ = "bakeries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    ratings = relationship("Rating", back_populates="bakery", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    bakery_id = Column(Integer, ForeignKey("bakeries.id"), nullable=False)
    flakiness = Column(Integer, nullable=False)
    butteriness = Column(Integer, nullable=False)
    freshness = Column(Integer, nullable=False)
    size_value = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    visited_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    bakery = relationship("Bakery", back_populates="ratings")
    user = relationship("User")
