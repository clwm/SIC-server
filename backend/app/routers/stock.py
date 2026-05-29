# app/routers/stock.py - 주식 종목 관련 API 라우터
# 기능:
# - 종목 생성, 조회, 가격 수정
# - 가격 히스토리 조회

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud
from app.database import get_db
from app.dependencies import get_current_user
from app import models
import logging
from app.schemas import AllPriceHistoryResponse

router = APIRouter(prefix="/stock", tags=["stock"])


# ✅ 종목 생성
@router.post("/", response_model=schemas.StockResponse)
def create_stock(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    existing = crud.get_stock_by_symbol(db, stock.symbol)
    if existing:
        raise HTTPException(status_code=400, detail="Stock already exists")

    new_stock = crud.create_stock(db, stock)
    logging.info(f"🆕 종목 생성: {new_stock.symbol}")
    return new_stock


# ✅ 종목 단일 조회
@router.get("/{symbol}", response_model=schemas.StockResponse)
def get_stock(symbol: str, db: Session = Depends(get_db)):
    stock = crud.get_stock_by_symbol(db, symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


# ✅ 종목 가격 수정 (관리자만 허용)
@router.put("/{symbol}", response_model=schemas.StockResponse)
def update_stock(
    symbol: str,
    price: float,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not getattr(user, "is_admin", False):
        raise HTTPException(
            status_code=403, detail="관리자만 가격을 수정할 수 있습니다."
        )

    stock = crud.update_stock_price(db, symbol, price)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    logging.info(f"💲 종목 {symbol} 가격 수정: {price}")
    return stock



# ✅ 가격 히스토리 전체 조회
@router.get("/history/all", response_model=dict[str, list[schemas.PriceHistoryResponse]])
def get_all_price_histories(db: Session = Depends(get_db)):
    symbols = db.query(models.PriceHistory.symbol).distinct().all()
    symbol_list = [s[0] for s in symbols]

    result = {}

    for symbol in symbol_list:
        history = (
            db.query(models.PriceHistory)
            .filter_by(symbol=symbol)
            .order_by(models.PriceHistory.timestamp.desc())
            .limit(10)
            .all()
        )
        result[symbol] = history

    return result

# ✅ 가격 히스토리 조회
@router.get("/history/{symbol}", response_model=list[schemas.PriceHistoryResponse])
def get_price_history(symbol: str, db: Session = Depends(get_db)):
    return (
        db.query(models.PriceHistory)
        .filter_by(symbol=symbol)
        .order_by(models.PriceHistory.timestamp.desc())
        .limit(10)
        .all()
    )