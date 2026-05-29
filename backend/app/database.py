# \Sic2025\app\database.py


from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()  # ✅ .env 로드

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, poolclass=NullPool, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    # 트랜잭션이 끝나면 자동 커밋하지 않음 → 명시적 commit() 필요
    autoflush=False,
    # 객체 변경 시 자동으로 DB에 반영하지 않음 → 수동 flush/control 가능
    bind=engine,
    # 이 세션이 사용할 DB 연결(engine) 지정
)

Base = declarative_base()
# models.py의 Base와 동일한 베이스 클래스,
# 모든 ORM 모델이 이 클래스를 상속해야 함


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
