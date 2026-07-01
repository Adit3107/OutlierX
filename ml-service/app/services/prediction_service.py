import time

from app.inference import InferenceEngine
from app.schemas import (
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.model_manager import ModelManager


class PredictionService:
    def __init__(self, model_manager: ModelManager) -> None:
        self.model_manager = model_manager
        self.engine = InferenceEngine(model_manager)

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        return self.engine.predict_one(request.transaction)

    def predict_batch(self, transactions: list) -> BatchPredictionResponse:
        started = time.perf_counter()
        predictions = self.engine.predict_many(transactions)
        inference_ms = max(round((time.perf_counter() - started) * 1000), 1)
        return BatchPredictionResponse(
            predictions=predictions,
            errors=[],
            modelVersion=self.model_manager.get_bundle().version,
            inferenceTimeMs=inference_ms,
        )
