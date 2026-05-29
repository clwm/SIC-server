#\Sic2025\app\user_info.py

# app/routers/user_info.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/user_info", tags=["user"])


@router.get("/")
def get_user_info(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "balance": user.balance
    }
