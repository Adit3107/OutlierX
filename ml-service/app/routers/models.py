from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.model_manager import ModelManager
from app.models.schemas import (
    BatchPredictionRequest,
    ModelHealth,
    ModelInfo,
    ModelPrediction,
    SinglePredictionRequest,
)

router = APIRouter(prefix="/models", tags=["Multi-Model Engine"])
model_manager = ModelManager()


@router.get("/health")
async def get_models_health() -> Dict[str, Any]:
    """Returns real-time health checks across all registered anomaly detection algorithms."""
    health_list = model_manager.health_all()
    overall_status = "HEALTHY" if any(h.status == "HEALTHY" for h in health_list) else "UNHEALTHY"
    return {
        "status": "success",
        "overall": overall_status,
        "models": health_list,
    }


@router.get("/list")
async def list_registered_models() -> Dict[str, Any]:
    """Lists all loaded anomaly detection models and versions."""
    models_info = model_manager.list_models()
    return {
        "status": "success",
        "default_model": model_manager.default_model_name,
        "count": len(models_info),
        "models": models_info,
    }


@router.get("/stats")
async def get_model_stats() -> Dict[str, Any]:
    """Returns inference performance metrics and latency statistics per model."""
    models_info = model_manager.list_models()
    stats = [
        {
            "name": m.name,
            "algorithm": m.algorithm,
            "version": m.version,
            "status": m.status,
            "total_inferences": m.total_inferences,
            "avg_latency_ms": m.avg_latency_ms,
            "last_used_at": m.last_used_at,
        }
        for m in models_info
    ]
    return {"status": "success", "stats": stats}


@router.post("/predict")
async def predict_single(
    payload: SinglePredictionRequest,
    model_name: Optional[str] = Query(None, description="Optional target algorithm name"),
) -> Dict[str, Any]:
    """Performs anomaly scoring for a single feature vector."""
    try:
        target_model = model_name or payload.model_name
        prediction = model_manager.predict_single(
            feature_vector=payload.feature_vector,
            model_name=target_model,
        )
        return {"status": "success", "data": prediction}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/predict/batch")
async def predict_batch(
    payload: BatchPredictionRequest,
    model_name: Optional[str] = Query(None, description="Optional target algorithm name"),
) -> Dict[str, Any]:
    """Performs batch anomaly scoring for multiple feature vectors."""
    try:
        target_model = model_name or payload.model_name
        predictions = model_manager.predict_batch(
            feature_vectors=payload.feature_vectors,
            model_name=target_model,
        )
        return {
            "status": "success",
            "count": len(predictions),
            "data": predictions,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
