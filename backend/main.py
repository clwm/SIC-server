# main.py - FastAPI 앱 실행 엔트리포인트
# 역할:
# - 앱 생성 및 라우터 등록
# - 미들웨어 설정 (VPN 차단, 속도 제한)
# - CORS 설정 (프론트엔드와 통신 허용)
# - lifespan 이벤트를 통한 비동기 주가 갱신 루프 실행

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, stock, trade, portfolio
from app.middlewares import RateLimitMiddleware
from dotenv import load_dotenv
import os
import asyncio
import logging
import traceback
from app.database import SessionLocal
from app.utils import update_stock_prices_based_on_trades, update_user_assets
from app.routers import user_info, stock_info, news, reload


# 로그 포맷 설정
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)


# FastAPI 최신 lifecycle 방식 적용
async def lifespan(app: FastAPI):
    logging.info("🚀 FastAPI lifespan 시작됨")
    asyncio.create_task(run_price_updater())  # 주가 자동 갱신 태스크 실행
    asyncio.create_task(run_assets_updater())  # 총자산 자동 계산 태스크 실행
    yield  # 앱 실행 중
    logging.info("🛑 FastAPI lifespan 종료됨")


# FastAPI 인스턴스 생성 (lifespan 적용)
app = FastAPI(lifespan=lifespan)


# 기본 라우트 - 서버가 살아있는지 확인용
@app.get("/")
def read_root():
    return {"message": "Hello World"}


# 라우터 등록
app.include_router(auth.router)
app.include_router(stock.router)
app.include_router(trade.router)
app.include_router(portfolio.router)
app.include_router(user_info.router)
app.include_router(stock_info.router)
app.include_router(news.router)
app.include_router(reload.router)

# 환경변수 로드 (.env)
load_dotenv()

origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")]
app.add_middleware(
    RateLimitMiddleware, window_seconds=3, max_requests=50, block_duration=5
)


# CORS 설정 (React 등 프론트에서 API 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 주가 갱신 루프 함수 (1분마다 실행)
async def run_price_updater():
    while True:
        db = SessionLocal()
        try:
            logging.info("📊 [AUTO] 주가 갱신 시작")
            update_stock_prices_based_on_trades(db)
            logging.info("✅ [AUTO] 주가 갱신 완료")
        except Exception:
            logging.error("❌ 주가 갱신 중 오류 발생:")
            traceback.print_exc()
        finally:
            db.close()
        await asyncio.sleep(60)

# 총자산 계산 루프 함수 (1분마다 실행)
async def run_assets_updater():
    while True:
        db = SessionLocal()
        try:
            logging.info("💰 [AUTO] 총자산 계산 시작")
            update_user_assets(db)
            logging.info("✅ [AUTO] 총자산 계산 완료")
        except Exception:
            logging.error("❌ 총자산 계산 중 오류 발생:")
            traceback.print_exc()
        finally:
            db.close()
        await asyncio.sleep(60)
