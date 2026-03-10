import datetime
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    history = relationship("CheckHistory", back_populates="user")


class CheckHistory(Base):
    __tablename__ = "check_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True) # Может быть анонимным
    masked_password: Mapped[str] = mapped_column(String) # Например: P******3
    score: Mapped[int] = mapped_column(Integer) # Оценка zxcvbn (0-4)
    is_leaked: Mapped[bool] = mapped_column(Boolean, default=False)
    leak_count: Mapped[int] = mapped_column(Integer, default=0)
    checked_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="history")