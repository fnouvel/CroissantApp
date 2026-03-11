from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Bakery(Base):
    __tablename__ = "bakeries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ratings = relationship("Rating", back_populates="bakery", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    bakery_id = Column(Integer, ForeignKey("bakeries.id"), nullable=False)
    score = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    visited_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    bakery = relationship("Bakery", back_populates="ratings")
