# app/routers/trade.py - 사용자 주식 거래 API
# 기능:
# - 매수/매도 요청 처리
# - 잔액 및 보유량 검사
# - 거래 기록 저장 및 상태 반영

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.database import get_db
from app.dependencies import get_current_user
from datetime import datetime
import logging

router = APIRouter(prefix="/trade", tags=["trade"])


@router.post("/", response_model=schemas.TradeResponse)
def trade(
    trade_data: schemas.TradeCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # 🔒 거래 수량이 0 이하인 경우 예외 처리
    if trade_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive.")

    # ✅ 종목 확인
    stock = crud.get_stock_by_symbol(db, trade_data.symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    # 💰 거래 금액 계산
    total_price = stock.price * trade_data.quantity

    # 💸 매수 처리
    if trade_data.trade_type == "buy":
        if user.balance < total_price:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        user.balance -= total_price

    # 💵 매도 처리
    elif trade_data.trade_type == "sell":
        holding = (
            db.query(models.Holding)
            .filter_by(user_id=user.id, stock_id=stock.id)
            .first()
        )
        if not holding or holding.quantity < trade_data.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock to sell")
        
        # 수수료 5% 계산
        fee = total_price * 0.05
        net_income = total_price - fee  # 실제 유저에게 들어갈 금액
        
        user.balance += net_income

    else:
        raise HTTPException(status_code=400, detail="Invalid trade type")

    # 📈 변동률 누적값 업데이트
    price_change = db.query(models.PriceChange).filter_by(symbol=stock.symbol).first()
    if not price_change:
        raise HTTPException(status_code=400, detail="PriceChange not set for this stock")

    delta = trade_data.quantity * 0.01  # 거래 수량 기준 가격 영향 (0.01%)
    if trade_data.trade_type == "buy":
        price_change.num += delta
    else:  # sell
        price_change.num -= delta

    # 🛑 변동률 누적값 범위 제한 (음수/폭등 방지)
    price_change.num = min(max(price_change.num, -0.99), 0.99)

    # 💾 거래 기록 저장
    try:
        db_trade = crud.create_trade(
            db, user, stock, trade_data.quantity, trade_data.trade_type
        )
        db.commit()
        logging.info(
            f"📈 {user.username} {trade_data.trade_type.upper()} {trade_data.quantity} of {stock.symbol} at {stock.price}"
        )
    except Exception:
        db.rollback()
        logging.error("❌ 거래 처리 중 오류 발생", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # ✅ 더미 제거: 실제 거래 정보 반환
    return schemas.TradeResponse(
        id=db_trade.id,
        symbol=db_trade.stock.symbol,
        quantity=db_trade.quantity,
        price_at_trade=db_trade.price_at_trade,
        trade_type=db_trade.trade_type,
        timestamp=db_trade.timestamp,
    )


@router.get("/history", response_model=list[schemas.TradeResponse])
def get_trade_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # 🔁 로그인 사용자의 거래 기록 최신순으로 반환
    trades = (
        db.query(models.Trade)
        .filter(models.Trade.user_id == user.id)
        .order_by(models.Trade.timestamp.desc())
        .all()
    )
    return trades
