import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import bakeries, ratings

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic — no create_all here
    yield


app = FastAPI(title="Croissant Club", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bakeries.router)
app.include_router(ratings.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
