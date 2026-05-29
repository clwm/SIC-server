from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging

from app import schemas, models, crud
from app.dependencies import get_db, get_current_user

router = APIRouter()


@router.get("/reload")
def reload_all_data(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # 🔹 사용자 정보
    user_info = {
        "id": user.id,
        "username": user.username,
        "balance": user.balance
    }

    # 🔹 포트폴리오 (수량 내림차순 정렬)
    holdings = crud.get_user_holdings(db, user)
    sorted_holdings = sorted(holdings, key=lambda h: h["quantity"], reverse=True)

    # 🔹 주식 정보
    stocks = db.query(models.Stock).all()
    stock_info = [{"symbol": stock.symbol, "price": stock.price} for stock in stocks]

    # 🔹 가격 히스토리
    symbols = db.query(models.PriceHistory.symbol).distinct().all()
    symbol_list = [s[0] for s in symbols]

    price_history = {}
    for symbol in symbol_list:
        history = (
            db.query(models.PriceHistory)
            .filter_by(symbol=symbol)
            .order_by(models.PriceHistory.timestamp.desc())
            .limit(10)
            .all()
        )
        price_history[symbol] = history

    # 🔹 뉴스 정보
    news_items = db.query(models.NewsItem).order_by(models.NewsItem.timestamp.desc()).limit(100).all()

    return {
        "user": user_info,
        "portfolio": sorted_holdings,
        "stocks": stock_info,
        "price_history": price_history,
        "news": news_items,
    }
