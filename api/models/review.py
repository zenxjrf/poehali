from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 звёзд
    comment = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
