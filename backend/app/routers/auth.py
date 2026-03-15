import os

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import auth as auth_utils
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=data.username,
        hashed_password=auth_utils.hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserCreate, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not auth_utils.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth_utils.create_access_token({"sub": str(user.id)})
    refresh_token = auth_utils.create_refresh_token({"sub": str(user.id)})

    debug = os.getenv("DEBUG", "false").lower() == "true"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=not debug,
        max_age=60 * 60 * 24 * 30,  # 30 days
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username},
    }


@router.post("/refresh", response_model=Token)
def refresh(
    response: Response,
    refresh_token: str = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = auth_utils.decode_token(refresh_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = auth_utils.create_access_token({"sub": str(user.id)})
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username},
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
