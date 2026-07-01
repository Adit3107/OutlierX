import time

import numpy as np

from app.services.model_manager import ModelManager
from app.schemas import PredictionResponse, TransactionInput


class InferenceEngine:
    def __init__(self, model_manager: ModelManager) -> None:
        self.model_manager = model_manager

    def predict_one(self, transaction: TransactionInput) -> PredictionResponse:
        return self.predict_many([transaction])[0]

    def predict_many(self, transactions: list[TransactionInput]) -> list[PredictionResponse]:
        started = time.perf_counter()
        bundle = self.model_manager.get_bundle()
        features = bundle.pipeline.transform(transactions)
        raw_predictions = bundle.model.predict(features)
        decision_scores = bundle.model.decision_function(features)
        inference_ms = max(round((time.perf_counter() - started) * 1000), 1)

        return [
            self._response(transaction, int(prediction), float(score), bundle.version, inference_ms)
            for transaction, prediction, score in zip(transactions, raw_predictions, decision_scores)
        ]

    @staticmethod
    def _response(
        transaction: TransactionInput,
        raw_prediction: int,
        decision_score: float,
        model_version: str,
        inference_ms: int,
    ) -> PredictionResponse:
        anomaly_score = float(np.clip(1 / (1 + np.exp(12 * decision_score)), 0, 1))
        prediction = "ANOMALY" if raw_prediction == -1 else "NORMAL"
        confidence = anomaly_score if prediction == "ANOMALY" else 1 - anomaly_score

        return PredictionResponse(
            transactionId=transaction.id or transaction.transactionId,
            prediction=prediction,
            anomalyScore=round(anomaly_score, 6),
            confidence=round(float(np.clip(confidence, 0, 1)), 6),
            modelVersion=model_version,
            inferenceTimeMs=inference_ms,
        )
