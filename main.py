from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from starlette.responses import FileResponse
from routers import auth, password
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis.asyncio as redis
import os

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Redpass",
    description="Сервис проверки стойкости паролей и их наличие в базах утечек",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(password.router)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
async def startup_event():
    # Проверка соединения с Redis при старте
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    app.state.redis = redis.from_url(REDIS_URL)


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/generator", response_class=HTMLResponse)
async def generator_page():
    with open("static/generator.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/about")
def get_about():
    return FileResponse("static/about.html")


@app.get("/support")
def get_support():
    return FileResponse("static/support.html")


@app.get("/faq")
def get_faq():
    return FileResponse("static/faq.html")


@app.get("/privacy")
def get_privacy():
    return FileResponse("static/privacy.html")
