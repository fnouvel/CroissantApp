import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.dependencies import get_current_user
from app.routers import bakeries, ratings
from app.routers import auth as auth_router

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

# Auth router is public — no auth dependency
app.include_router(auth_router.router)

# Bakeries and ratings are protected — require a valid Bearer token
app.include_router(bakeries.router, dependencies=[Depends(get_current_user)])
app.include_router(ratings.router, dependencies=[Depends(get_current_user)])


@app.get("/api/health")
def health():
    return {"status": "ok"}
