from fastapi import FastAPI
from routers import auth, password


app = FastAPI(
    title="Redpass",
    description="Сервис проверки стойкости паролей и их наличие в базах утечек",
    version="1.0.0"
)
app.include_router(auth.router)
app.include_router(password.router)


@app.get("/")
async def root():
    return {"message": "API is running. Welcome to Redpass!"}
