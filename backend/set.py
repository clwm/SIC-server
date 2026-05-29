from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User  # User 모델이 정의된 위치에 따라 경로 수정

# 데이터베이스 세션 생성
db: Session = SessionLocal()

# 모든 User의 balance를 500000.0으로 업데이트
db.query(User).update({User.balance: 500000.0})

# 변경 사항 커밋
db.commit()

# 세션 종료
db.close()