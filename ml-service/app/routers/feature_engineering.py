from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.feature_engineering.pipeline import FeatureEngineeringPipeline

router = APIRouter(prefix="/features", tags=["Feature Engineering"])
pipeline = FeatureEngineeringPipeline()


class FeatureExtractionRequest(BaseModel):
    transaction: Dict[str, Any]
    user_history: Optional[List[Dict[str, Any]]] = None
    global_history: Optional[List[Dict[str, Any]]] = None


class BatchFeatureExtractionRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    user_history_map: Optional[Dict[str, List[Dict[str, Any]]]] = None


@router.post("/extract")
async def extract_features(payload: FeatureExtractionRequest) -> Dict[str, Any]:
    """Extracts a feature vector for a single transaction."""
    try:
        result = pipeline.extract_single(
            transaction=payload.transaction,
            user_history=payload.user_history,
            global_history=payload.global_history,
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/extract/batch")
async def extract_features_batch(payload: BatchFeatureExtractionRequest) -> Dict[str, Any]:
    """Extracts feature vectors for a batch of transactions."""
    try:
        results = pipeline.extract_batch(
            transactions=payload.transactions,
            user_history_map=payload.user_history_map,
        )
        return {"status": "success", "count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/metrics")
async def get_feature_metrics() -> Dict[str, Any]:
    """Returns real-time operational metrics for the Feature Engineering Pipeline."""
    return {"status": "success", "data": pipeline.get_metrics()}
