import os
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv

from config.database import init_db, close_db
from config.limiter import limiter, HAS_RATE_LIMITER

try:
    from slowapi.errors import RateLimitExceeded
    from slowapi import _rate_limit_exceeded_handler
except ImportError:
    pass

# Load environment variables
load_dotenv()

# ── Logging Setup ──
logger = logging.getLogger("hirebyte")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(handler)

# ── Lifespan Context Manager ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    try:
        print("[...] Initializing database...")
        await init_db()
        print("[OK] Database initialized successfully")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        print(f"Error details: {type(e).__name__}")
        traceback.print_exc()
    
    yield
    
    # Shutdown: Close database connections
    try:
        print("[...] Closing database connections...")
        await close_db()
        print("[OK] Database connections closed")
    except Exception as e:
        print(f"[WARN] Error closing database: {e}")

# Initialize FastAPI
app = FastAPI(
    title="HireByte API",
    description="Mock Interview Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate Limiting Setup ──
if HAS_RATE_LIMITER:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("[OK] Rate limiting enabled (slowapi)")
else:
    logger.warning("[WARN] slowapi not installed — rate limiting disabled. Run: pip install slowapi")

# ── Security Headers Middleware ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled server errors, returning clean JSON with logging."""
    logger.error(f"Global exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please contact support or try again."}
    )

# ── CORS Middleware ──
_default_origins = [
    "http://localhost:5173", "http://localhost:3000", "http://localhost:9000",
    "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://127.0.0.1:9000",
]
_env_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Register Modular Routers ──
from routers.core import router as core_router
from routers.interview import router as interview_router
from routers.video import router as video_router
from routers.analytics import router as analytics_router

app.include_router(core_router)
app.include_router(interview_router)
app.include_router(video_router)
app.include_router(analytics_router)

if __name__ == "__main__":
    import uvicorn
    print("Starting HireByte Backend Server...")
    print("Server: http://127.0.0.1:9000")
    print("API Docs: http://127.0.0.1:9000/docs")
    print("Press CTRL+C to stop\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9000,
        log_level="info",
        reload=True
    )
