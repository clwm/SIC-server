# \Sic2025\create_db.py
from backend.app.database import engine
from backend.app.models import Base

# 삭제
Base.metadata.drop_all(bind=engine)
print("❌ 테이블 삭제 완료")

# 재생성
Base.metadata.create_all(bind=engine)
print("✅ 테이블 재생성 완료")