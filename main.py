from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.responses import FileResponse
from routers import auth, password

app = FastAPI(
    title="Redpass",
    description="Сервис проверки стойкости паролей и их наличие в базах утечек",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(password.router)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/generator", response_class=HTMLResponse)
async def generator_page():
    with open("static/generator.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
