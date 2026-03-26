from pydantic import BaseModel
from datetime import datetime


class PasswordCheckRequest(BaseModel):
    password: str


class PasswordCheckResponse(BaseModel):
    masked_password: str
    score: int
    crack_time: str
    is_leaked: bool
    leak_count: int


class CheckHistoryResponse(BaseModel):
    id: int
    masked_password: str
    score: int
    crack_time: str
    is_leaked: bool
    leak_count: int
    checked_at: datetime

    class Config:
        from_attributes = True
