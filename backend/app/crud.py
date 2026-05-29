# crud.py - 데이터베이스 조작 로직 모음
# 역할:
# - 사용자 생성 및 조회
# - 주식 생성, 조회, 가격 업데이트
# - 거래 기록 생성 및 가격 조정 로직 제거
# - 보유 주식량 조회 및 업데이트
# - 에러 및 트랜잭션 안정성 강화

from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas
from app.utils import hash_password
from datetime import datetime, timezone


# ✅ 사용자 생성
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        hashed_password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ✅ 사용자 조회 (by username)
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


# ✅ 주식 조회
def get_stock_by_symbol(db: Session, symbol: str):
    return db.query(models.Stock).filter(models.Stock.symbol == symbol).first()


# ✅ 주식 생성
def create_stock(db: Session, stock: schemas.StockCreate):
    db_stock = models.Stock(**stock.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


# ✅ 주가 수동 업데이트
def update_stock_price(db: Session, symbol: str, new_price: float):
    stock = get_stock_by_symbol(db, symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    stock.price = new_price
    db.commit()
    db.refresh(stock)
    return stock


# ✅ 거래 생성 (가격은 변경하지 않음, 단순 기록만)
def create_trade(
    db: Session,
    user: models.User,
    stock: models.Stock,
    quantity: int,
    trade_type: str
):
    if trade_type not in ["buy", "sell"]:
        raise HTTPException(status_code=400, detail="Invalid trade type")

    trade = models.Trade(
        user_id=user.id,
        stock_id=stock.id,
        quantity=quantity,
        price_at_trade=stock.price,
        trade_type=trade_type,
    )

    try:
        db.add(trade)
        update_holding(db, user, stock, quantity, trade_type)
        db.commit()
        db.refresh(trade)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to process trade")

    return trade


# ✅ 사용자 보유 종목 조회 (캐싱 테이블 기반)
def get_user_holdings(db: Session, user: models.User):
    holdings = db.query(models.Holding).filter_by(user_id=user.id).all()
    return [
        {"symbol": h.stock.symbol, "quantity": h.quantity}
        for h in holdings if h.quantity > 0
    ]


# ✅ 보유 종목 갱신 - 중복 없이 안전하게
def update_holding(
    db: Session,
    user: models.User,
    stock: models.Stock,
    quantity: int,
    trade_type: str
):
    holding = (
        db.query(models.Holding)
        .filter_by(user_id=user.id, stock_id=stock.id)
        .first()
    )

    if not holding:
        holding = models.Holding(user_id=user.id, stock_id=stock.id, quantity=0)
        db.add(holding)
        db.flush()  # 커밋 전 ID 확보

    delta = quantity if trade_type == "buy" else -quantity
    holding.quantity += delta

    if holding.quantity < 0:
        raise HTTPException(status_code=400, detail="보유 수량이 음수가 될 수 없습니다")