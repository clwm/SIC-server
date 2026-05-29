from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Stock, PriceChange

def add_stock(symbol: str):
    db: Session = SessionLocal()

    try:
        # 이미 존재하는지 확인
        existing_stock = db.query(Stock).filter_by(symbol=symbol).first()
        if existing_stock:
            print(f"{symbol} 이미 존재합니다.")
            return

        # 1. stocks 테이블에 주식 추가 (초기 가격 10000)
        new_stock = Stock(symbol=symbol, price=10000)

        # 2. price_changes 테이블에 변동률 추가 (초기 0)
        new_change = PriceChange(symbol=symbol, num=0)

        # DB에 추가
        db.add(new_stock)
        db.add(new_change)
        db.commit()
        print(f"{symbol} 추가 완료: 가격=10000, 변동률=0")

    except Exception as e:
        db.rollback()
        print("오류 발생:", e)

    finally:
        db.close()


for s in ["삼성", "LG", "SK", "마이크로소프트", "TSLA", "아마존", "현대", "메타"]:
    add_stock(s)