import random
import string
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext

# 비밀번호 해시용
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 사용자 ID 생성 함수
def generate_username(db: Session):
    while True:
        username = "user" + "".join(random.choices(string.digits, k=3))
        existing_user = db.query(User).filter(User.username == username).first()
        if not existing_user:
            return username

# 복잡한 8자리 비밀번호 생성
def generate_password(length=8):
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(random.choices(chars, k=length))

# 사용자 추가 함수
def add_user(file):
    db: Session = SessionLocal()

    try:
        username = generate_username(db)
        raw_password = generate_password()
        hashed_password = pwd_context.hash(raw_password)

        new_user = User(
            username=username,
            hashed_password=hashed_password,
            is_admin=False,
            balance=500000,  # 초기 자산 50만원
            created_at=datetime.now(timezone.utc)
        )

        db.add(new_user)
        db.commit()

        # 파일에 저장
        file.write(f"{username},{raw_password}\n")

        print(f"✅ 사용자 생성 완료: {username}")
    except Exception as e:
        db.rollback()
        print("❌ 오류 발생:", e)
    finally:
        db.close()

if __name__ == "__main__":
    with open("user_credentials.txt", "w", encoding="utf-8") as f:
        for _ in range(10):
            add_user(f)