from app.database import SessionLocal
from app.utils import hash_password
from app import models

db = SessionLocal()

for i in range(1, 9):
    user = models.User(
        username=f"user{i}",
        hashed_password=hash_password("user"),
        balance=0
    )
    db.add(user)
    print(f"✅ 사용자 등록 준비: user{i}")

db.commit()

# 사용자 ID 확인
for i in range(1, 9):
    user = db.query(models.User).filter_by(username=f"user{i}").first()
    print("✅ 사용자 등록 완료:", user.username)

db.close()
