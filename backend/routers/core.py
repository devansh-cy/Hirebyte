from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {
        "message": "HireByte API is running!",
        "status": "healthy",
        "docs": "/docs"
    }

@router.get("/health")
async def health_check():
    return {"status": "ok", "database": "connected"}
