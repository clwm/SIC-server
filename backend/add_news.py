from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import NewsItem
from datetime import datetime
from zoneinfo import ZoneInfo  # Python 3.9+

def add_news(stock: str, headline: str, impact: float):
    db: Session = SessionLocal()

    try:
        news = NewsItem(
            stock=stock,
            headline=headline,
            impact=impact,
            timestamp=datetime.now(ZoneInfo("Asia/Seoul"))  # ✅ 한국시간
        )

        db.add(news)
        db.commit()

        print(f"✅ 뉴스 등록 완료: [{stock}] {headline} (영향도 {impact})")
    except Exception as e:
        db.rollback()
        print("❌ 오류 발생:", e)
    finally:
        db.close()


if __name__ == "__main__":
    add_news("메타", "10시 3분에 서버 끕니다 매도하세요", 0)