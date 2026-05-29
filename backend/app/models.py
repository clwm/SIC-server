# app/models.py - 데이터베이스 모델 정의

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
from zoneinfo import ZoneInfo


# ✅ 사용자 테이블
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False)
    balance = Column(Float, default=1000000.0)  # 💰 초기 잔액
    created_at = Column(DateTime, default=datetime.now(timezone.utc))  # 🕒 생성일

    trades = relationship("Trade", back_populates="user", cascade="all, delete")
    holdings = relationship("Holding", back_populates="user", cascade="all, delete")


# ✅ 주식 종목 테이블
class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, nullable=False)
    price = Column(Float, nullable=False)

    trades = relationship("Trade", back_populates="stock", cascade="all, delete")
    holdings = relationship("Holding", back_populates="stock", cascade="all, delete")


# ✅ 거래 기록 테이블
class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    quantity = Column(Integer, nullable=False)
    price_at_trade = Column(Float, nullable=False)
    trade_type = Column(String, nullable=False)  # 'buy' or 'sell'
    timestamp = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Seoul")))

    user = relationship("User", back_populates="trades")
    stock = relationship("Stock", back_populates="trades")


# ✅ 사용자 보유 종목 테이블
class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    quantity = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="holdings")
    stock = relationship("Stock", back_populates="holdings")


# ✅ 가격 히스토리 테이블
class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True)
    symbol = Column(String, index=True)
    price = Column(Float)
    timestamp = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Seoul")))


# ✅ 뉴스 테이블
class NewsItem(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    stock = Column(String, index=True)
    headline = Column(String)
    impact = Column(Float)
    timestamp = Column(DateTime, default=datetime.now(ZoneInfo("Asia/Seoul")))


# ✅ 자동 가격 변동률 테이블
class PriceChange(Base):
    __tablename__ = "price_changes"

    symbol = Column(String(10), primary_key=True)
    num = Column(Float, nullable=False)