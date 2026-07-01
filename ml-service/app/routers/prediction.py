from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import BatchPredictionRequest, BatchPredictionResponse, ModelInfoResponse, PredictionRequest, PredictionResponse
from app.services import ModelManager, PredictionService

router = APIRouter(tags=["ML Inference"])
model_manager = ModelManager(settings.model_path)
prediction_service = PredictionService(model_manager)


@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest) -> PredictionResponse:
    try:
        return prediction_service.predict(request)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Prediction failed: {error}") from error


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    try:
        return prediction_service.predict_batch(request.transactions)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Batch prediction failed: {error}") from error


@router.post("/reload-model", response_model=ModelInfoResponse)
async def reload_model() -> ModelInfoResponse:
    try:
        model_manager.reload_model()
        return model_manager.info()
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Model reload failed: {error}") from error


@router.get("/model/info", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    return model_manager.info()
