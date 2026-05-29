# app/utils.py - 보안 유틸리티 및 주가 자동 갱신 로직

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from collections import defaultdict
from app import models
from app.models import PriceHistory
from dotenv import load_dotenv
from zoneinfo import ZoneInfo
import logging
import os

# ✅ .env 환경변수 로드
load_dotenv()

# ✅ 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ JWT 관련 상수
SECRET_KEY = os.getenv("SECRET_KEY")  # 환경변수에서 불러오기
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ✅ 비밀번호 해시 함수
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ✅ 비밀번호 검증 함수
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ✅ JWT 토큰 생성 함수
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now_utc = datetime.now(tz=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Seoul"))
    expire = now_utc + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ✅ JWT 토큰 검증 함수
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise JWTError()
        return username
    except JWTError:
        return None


# ✅ 과거 로직 (현재 사용 안함): 거래량 기반 즉시 가격 계산
def calculate_price_change(current_price, buy_qty, sell_qty):
    if buy_qty == sell_qty or (buy_qty + sell_qty == 0):
        return current_price

    strength = abs(buy_qty - sell_qty) / (buy_qty + sell_qty)
    factor = 1 + (strength * 0.02)  # 최대 ±2% 변동
    return (
        round(current_price * factor, 2)
        if buy_qty > sell_qty
        else round(current_price / factor, 2)
    )


# ✅ 주기적으로 주가 갱신 (5분 간격)
def update_stock_prices_based_on_trades(db: Session):
    now = datetime.now(tz=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Seoul"))
    past = now - timedelta(minutes=5)

    logging.info(f"📊 [AUTO] 주가 갱신 시작 ({now.isoformat()})")

    try:
        updated_count = 0

        # 1️⃣ 모든 종목에 대해 PriceChange 기준으로 주가 갱신
        for stock in db.query(models.Stock).all():
            symbol = stock.symbol

            # 2️⃣ 변동률(num) 불러오기. 없으면 기본값 사용
            price_change = db.query(models.PriceChange).filter_by(symbol=symbol).first()
            base_factor = price_change.num if price_change else 0.01

            if not price_change:
                logging.warning(f"🔍 {symbol}에 대한 변동률 정보 없음. 기본값 사용 (0.01)")

            # 3️⃣ 변동률이 너무 크거나 음수가 되지 않도록 제한
            base_factor = min(max(base_factor, -0.99), 10)  # 최소 -99%, 최대 +1000%

            if base_factor < 0:
                base_factor *= 0.1

            # 4️⃣ 새로운 가격 계산
            factor = 1 + base_factor
            new_price = round(stock.price * factor, 0)

            # 5️⃣ 음수 또는 0 방지: 최소 1000원
            if new_price < 1000:
                logging.warning(f"❗ {symbol} 가격이 1000원 이하로 변경됨. 1000원으로 조정됨.")
                new_price = 1000

            # 6️⃣ 가격 변경 기록 추가
            db.add(PriceHistory(symbol=symbol, price=new_price, timestamp=now))

            # 7️⃣ 실제 가격 반영
            if new_price != stock.price:
                logging.info(f"📈 {symbol}: {stock.price} → {new_price}")
                stock.price = new_price
                updated_count += 1
            else:
                logging.debug(f"⏸ {symbol}: 가격 변화 없음 ({stock.price})")

        # 8️⃣ 모든 변동률 초기화 (다음 라운드 대비)
        db.query(models.PriceChange).update({models.PriceChange.num: 0})
        db.commit()

        logging.info("🔄 모든 종목의 변동률을 0으로 초기화 완료")
        logging.info(f"✅ 주가 갱신 완료. 반영된 종목 수: {updated_count}")

    except Exception as e:
        db.rollback()
        logging.error("❌ 주가 갱신 중 예외 발생:", exc_info=True)