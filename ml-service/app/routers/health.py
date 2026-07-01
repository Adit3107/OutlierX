from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Diagnostics"])
async def get_health():
    return {
        "status": "UP",
        "service": "anomaly-detection-ml-service",
        "database": "NOT_APPLICABLE"
    }

@router.get("/version", tags=["Diagnostics"])
async def get_version():
    return {
        "version": "1.0.0",
        "name": "anomaly-detection-ml-service"
    }
