from pydantic import BaseModel, EmailStr

# Схема для регистрации (то, что мы ждем от юзера)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Схема для ответа (то, что мы показываем юзеру, скрывая пароль)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True

# Схема для токена авторизации
class Token(BaseModel):
    access_token: str
    token_type: str