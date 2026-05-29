# app/middlewares/rate_limit.py

import time
from collections import defaultdict, deque
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import logging


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, window_seconds=3, max_requests=5, block_duration=5):
        super().__init__(app)
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.block_duration = block_duration

        self.request_log = defaultdict(deque)  # {ip: deque[timestamps]}
        self.blocked_until = {}  # {ip: block_expiry_time}

    async def dispatch(self, request: Request, call_next):
        if request.method != "GET":
            return await call_next(request)

        client_ip = request.headers.get("x-forwarded-for", request.client.host)
        now = time.time()

        # 차단된 IP는 거부
        if client_ip in self.blocked_until and now < self.blocked_until[client_ip]:
            return JSONResponse(
                {"detail": "You are temporarily blocked. Try again later."},
                status_code=429,
            )

        # 요청 로그 유지: 최신 window_seconds 내 요청만 보관
        timestamps = self.request_log[client_ip]
        while timestamps and now - timestamps[0] > self.window_seconds:
            timestamps.popleft()
        timestamps.append(now)

        logging.info(f"[RateLimit] IP: {client_ip} | 요청 수: {len(timestamps)}")

        # 요청 횟수 초과 → 차단 설정
        if len(timestamps) > self.max_requests:
            self.blocked_until[client_ip] = now + self.block_duration
            self.request_log[client_ip].clear()  # 초기화
            logging.warning(
                f"🚫 IP {client_ip} blocked for {self.block_duration} seconds"
            )
            return JSONResponse(
                {
                    "detail": f"Too many requests. Blocked for {self.block_duration} seconds."
                },
                status_code=429,
            )

        return await call_next(request)
