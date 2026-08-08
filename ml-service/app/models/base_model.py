from abc import ABC, abstractmethod
from typing import Any, Dict, List
import numpy as np

from app.models.schemas import ModelHealth, ModelInfo, ModelPrediction


class BaseModel(ABC):
    """
    Abstract Base Class for all OutlierX Anomaly Detection Models.
    Every algorithm (Isolation Forest, LOF, One-Class SVM, etc.) must inherit
    from this class and implement its uniform interface.
    """

    def __init__(self, name: str, version: str, algorithm: str) -> None:
        self.name = name
        self.version = version
        self.algorithm = algorithm
        self.is_loaded = False
        self.total_inferences = 0
        self.total_latency_ms = 0.0
        self.last_used_at: str | None = None
        self.hyperparameters: Dict[str, Any] = {}
        self.supported_features: List[str] = []

    @abstractmethod
    def initialize(self, config: Dict[str, Any] | None = None) -> None:
        """Configures hyperparameters and prepares model instance."""
        pass

    @abstractmethod
    def load(() -> bool:
        """Loads trained weights/artifacts or fits baseline parameters."""
        pass

    @abstractmethod
    def predict_single(self, feature_vector: Dict[str, float] | np.ndarray) -> ModelPrediction:
        """Performs inference on a single feature vector."""
        pass

    @abstractmethod
    def predict_batch(self, feature_vectors: List[Dict[str, float]] | np.ndarray) -> List[ModelPrediction]:
        """Performs batch inference on multiple feature vectors."""
        pass

    @abstractmethod
    def health_check(self) -> ModelHealth:
        """Returns health status of the model."""
        pass

    def metadata(self) -> ModelInfo:
        """Returns model metadata and performance stats."""
        avg_lat = (self.total_latency_ms / self.total_inferences) if self.total_inferences > 0 else 0.0
        return ModelInfo(
            name=self.name,
            version=self.version,
            algorithm=self.algorithm,
            status="ACTIVE" if self.is_loaded else "DISABLED",
            supported_features=self.supported_features,
            hyperparameters=self.hyperparameters,
            total_inferences=self.total_inferences,
            avg_latency_ms=round(avg_lat, 2),
            last_used_at=self.last_used_at,
        )

    def _update_stats(self, elapsed_ms: float) -> None:
        from datetime import datetime, timezone
        self.total_inferences += 1
        self.total_latency_ms += elapsed_ms
        self.last_used_at = datetime.now(timezone.utc).isoformat()
