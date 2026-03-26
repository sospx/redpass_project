from pydantic import BaseModel


class PasswordCheckRequest(BaseModel):
    password: str


class PasswordCheckResponse(BaseModel):
    masked_password: str
    score: int
    crack_time: str
    is_leaked: bool
    leak_count: int
