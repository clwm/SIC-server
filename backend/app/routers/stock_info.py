#\sic2025\app\stock_info.py

# app/routers/stock_info.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/stock_info", tags=["stock"])


@router.get("/")
def get_stock_info(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    return [
        {"symbol": stock.symbol, "price": stock.price}
        for stock in stocks
    ]
