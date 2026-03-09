from fastapi import FastAPI


app = FastAPI(
    title="Redpass",
    description="Сервис проверки стойкости паролей и их наличие в базах утечек",
    version="1.0.0"
)


@app.get("/")
async def root():
    return {"message": "API is running. Welcome to Redpass!"}
