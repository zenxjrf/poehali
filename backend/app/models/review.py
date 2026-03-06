from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    order_id = Column(Integer, nullable=True)  # Связь с заказом (опционально)

    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 звёзд
    comment = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", back_populates="reviews")

    __table_args__ = (
        Index('ix_reviews_rating', 'rating'),
        Index('ix_reviews_created_at', 'created_at'),
    )
