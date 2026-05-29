# app/routers/auth.py - 사용자 인증 및 JWT 발급 라우터

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app import schemas, crud, utils
from app.database import get_db
from fastapi.security import OAuth2PasswordRequestForm
import logging
import os
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


# ✅ 환경변수에서 만료시간 로드
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))


# ✅ 회원가입
# 쓰지 말것
@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 비밀번호 길이 제한 추가
    if len(user.password) < 8:
        raise HTTPException(
            status_code=400, detail="비밀번호는 최소 8자 이상이어야 합니다."
        )

    existing = crud.get_user_by_username(db, user.username)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    new_user = crud.create_user(db, user)
    return new_user

# ✅ 로그인
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, form_data.username)

    # 로그인 시도 로그 남기기
    logging.info(f"🔐 Login attempt: {form_data.username}")

    if not user:
        logging.warning(f"❌ 로그인 실패 - 사용자 없음: {form_data.username}")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not utils.verify_password(form_data.password, user.hashed_password):
        logging.warning(f"❌ 로그인 실패 - 비밀번호 불일치: {form_data.username}")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # JWT 생성 (만료 시간 설정 포함)
    token = utils.create_access_token(
    {"sub": user.username},
    expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),#utils.datetime -> datatime.timedelta 로 수정
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "balance": user.balance,
    }



# ✅ 로그아웃 (클라이언트 토큰 삭제 유도)
@router.post("/logout")
def logout(response: Response):
    return {"message": "Logged out. Please delete your token on the client side."}