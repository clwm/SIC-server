# app/schemas.py - API 요청 및 응답 데이터 스키마 정의

from pydantic import BaseModel, RootModel
from datetime import datetime


# ✅ 사용자 회원가입 요청
class UserCreate(BaseModel):
    username: str
    password: str


# ✅ 사용자 응답
class UserResponse(BaseModel):
    username: str
    balance: float
    is_admin: bool  # 🔹 관리자 여부 포함 (프론트에서 조건 분기 가능)
    model_config = {"from_attributes": True}


# ✅ 종목 생성 요청
class StockCreate(BaseModel):
    symbol: str
    price: float


# ✅ 종목 응답
class StockResponse(BaseModel):
    id: int
    symbol: str
    price: float
    model_config = {"from_attributes": True}


# ✅ 거래 요청
class TradeCreate(BaseModel):
    symbol: str
    quantity: int
    trade_type: str  # 'buy' or 'sell'


# ✅ 거래 응답
class TradeResponse(BaseModel):
    id: int
    symbol: str
    quantity: int
    price_at_trade: float
    trade_type: str
    timestamp: datetime
    model_config = {"from_attributes": True}


# ✅ 사용자 보유 종목 응답
class HoldingResponse(BaseModel):
    symbol: str
    quantity: int
    model_config = {"from_attributes": True}


# ✅ 가격 히스토리 응답
class PriceHistoryResponse(BaseModel):
    symbol: str
    price: float
    timestamp: datetime
    model_config = {"from_attributes": True}

class AllPriceHistoryResponse(BaseModel):
    data: dict[str, list[PriceHistoryResponse]]


# ✅ 뉴스 응답
class NewsResponse(BaseModel):
    id: int
    stock: str
    headline: str
    impact: float
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }