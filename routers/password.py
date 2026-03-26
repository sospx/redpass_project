from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import async_session_maker
from db.models import User
from schemas.password import PasswordCheckRequest, PasswordCheckResponse
from core.checker import analyze_strength, check_leaks, mask_password
from core.security import SECRET_KEY, ALGORITHM
from routers.auth import get_db


router = APIRouter(prefix="/password", tags=["Password Check"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Функция-зависимость для проверки токена и получения текущего юзера
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Расшифровываем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Ищем пользователя в БД
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/check", response_model=PasswordCheckResponse)
async def check_password(
        request: PasswordCheckRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Принимает пароль, оценивает его стойкость и проверяет по базам утечек.
    Доступно только авторизованным пользователям.
    """
    strength_data = analyze_strength(request.password)
    leak_count = await check_leaks(request.password)
    masked = mask_password(request.password)

    return PasswordCheckResponse(
        masked_password=masked,
        score=strength_data["score"],
        crack_time=strength_data["crack_time"],
        is_leaked=leak_count > 0,
        leak_count=leak_count
    )
