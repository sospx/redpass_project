from fastapi import FastAPI
from routes import auth


app = FastAPI(
    title="Redpass",
    description="Сервис проверки стойкости паролей и их наличие в базах утечек",
    version="1.0.0"
)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {"message": "API is running. Welcome to Redpass!"}
