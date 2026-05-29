# app/routers/portfolio.py - 로그인된 사용자의 보유 종목 조회 API

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas, crud
from app.database import get_db
from app.dependencies import get_current_user
import logging

router = APIRouter(prefix="/me", tags=["portfolio"])


# ✅ 사용자 포트폴리오 조회
@router.get("/portfolio", response_model=list[schemas.HoldingResponse])
def get_portfolio(db: Session = Depends(get_db), user=Depends(get_current_user)):
    logging.info(f"📊 {user.username} 포트폴리오 조회 요청")
    holdings = crud.get_user_holdings(db, user)
    # 🔹 수량 내림차순으로 정렬
    sorted_holdings = sorted(holdings, key=lambda h: h["quantity"], reverse=True)
    return sorted_holdings
