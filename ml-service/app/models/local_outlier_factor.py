import time
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.neighbors import LocalOutlierFactor

from app.models.base_model import BaseModel
from app.models.schemas import ModelHealth, ModelPrediction


class LocalOutlierFactorModel(BaseModel):
    """
    Local Outlier Factor (LOF) Anomaly Detection Algorithm.
    Measures the local density deviation of a given data point with respect to its k-nearest neighbors.
    Detects samples that have a substantially lower density than their neighbors.
    """

    def __init__(self, name: str = "local_outlier_factor", version: str = "v1.0.0") -> None:
        super().__init__(name=name, version=version, algorithm="LocalOutlierFactor")
        self.model: Optional[LocalOutlierFactor] = None
        self.initialize()

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> None:
        cfg = config or {}
        self.hyperparameters = {
            "n_neighbors": cfg.get("n_neighbors", 20),
            "contamination": cfg.get("contamination", 0.1),
            "novelty": True,  # Enables predict/score_samples for new out-of-sample data
            "metric": cfg.get("metric", "minkowski"),
        }
        self.model = LocalOutlierFactor(**self.hyperparameters)

    def load() -> bool:
        try:
            # Fit synthetic baseline for initialization if un-fitted
            dummy_data = np.random.normal(loc=0.0, scale=1.0, size=(200, 10))
            self.model.fit(dummy_data)
            self.is_loaded = True
            return True
        except Exception as e:
            self.is_loaded = False
            return False

    def predict_single(self, feature_vector: Dict[str, float] | np.ndarray) -> ModelPrediction:
        return self.predict_batch([feature_vector] if isinstance(feature_vector, dict) else feature_vector)[0]

    def predict_batch(self, feature_vectors: List[Dict[str, float]] | np.ndarray) -> List[ModelPrediction]:
        start = time.perf_counter()
        if not self.is_loaded:
            self.load()

        if isinstance(feature_vectors, list) and len(feature_vectors) > 0 and isinstance(feature_vectors[0], dict):
            keys = sorted(feature_vectors[0].keys())
            self.supported_features = keys
            X = np.array([[fv.get(k, 0.0) for k in keys] for fv in feature_vectors], dtype=float)
        else:
            X = np.asarray(feature_vectors, dtype=float)

        raw_preds = self.model.predict(X)  # -1 for anomaly, 1 for normal
        decision_scores = self.model.decision_function(X)  # Shifts score centered around 0

        elapsed_ms = (time.perf_counter() - start) * 1000.0
        self._update_stats(elapsed_ms)

        results: List[ModelPrediction] = []
        for raw_pred, dec_score in zip(raw_preds, decision_scores):
            # Sigmoid mapping of decision score to 0 - 100 risk scale
            norm_score = float(np.clip(1.0 / (1.0 + np.exp(5.0 * dec_score)) * 100.0, 0.0, 100.0))
            prediction_label = "ANOMALY" if raw_pred == -1 else "NORMAL"
            
            confidence = norm_score if prediction_label == "ANOMALY" else (100.0 - norm_score)
            confidence = float(np.clip(confidence, 50.0, 99.9))

            results.append(
                ModelPrediction(
                    model_name=self.name,
                    model_version=self.version,
                    algorithm=self.algorithm,
                    raw_score=float(dec_score),
                    normalized_score=round(norm_score, 2),
                    confidence=round(confidence, 2),
                    prediction=prediction_label,
                    execution_time_ms=round(elapsed_ms / max(1, len(feature_vectors)), 2),
                    metadata={"n_neighbors": self.hyperparameters["n_neighbors"]},
                )
            )

        return results

    def health_check(self) -> ModelHealth:
        return ModelHealth(
            name=self.name,
            algorithm=self.algorithm,
            status="HEALTHY" if self.is_loaded else "UNHEALTHY",
            loaded=self.is_loaded,
            version=self.version,
            details={"hyperparameters": self.hyperparameters},
        )
