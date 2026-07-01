from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from sklearn.ensemble import IsolationForest

from app.feature_engineering import FEATURE_VERSION, FeaturePipeline
from app.schemas import ModelInfoResponse, TransactionInput
from app.utils import SAMPLE_TRANSACTIONS


@dataclass
class ModelBundle:
    model: IsolationForest
    pipeline: FeaturePipeline
    version: str
    trained_at: datetime | None
    loaded_at: datetime
    source: str


class ModelManager:
    def __init__(self, artifact_path: str | Path | None = None) -> None:
        self.artifact_path = Path(artifact_path or "models/isolation_forest.joblib")
        self.bundle: ModelBundle | None = None
        self.last_error: str | None = None
        self.load_model()

    def load_model(self) -> ModelBundle:
        try:
            if self.artifact_path.exists():
                self.bundle = self._load_artifact(self.artifact_path)
            else:
                self.bundle = self._build_fallback_model()
            self.last_error = None
        except Exception as error:  # pragma: no cover - defensive fallback
            self.last_error = str(error)
            self.bundle = self._build_fallback_model(source="fallback_after_error")
        return self.bundle

    def reload_model(self) -> ModelBundle:
        return self.load_model()

    def get_bundle(self) -> ModelBundle:
        if not self.bundle:
            return self.load_model()
        return self.bundle

    def info(self) -> ModelInfoResponse:
        bundle = self.get_bundle()
        return ModelInfoResponse(
            available=True,
            modelType="IsolationForest",
            modelVersion=bundle.version,
            featureVersion=FEATURE_VERSION,
            loadedAt=bundle.loaded_at,
            trainedAt=bundle.trained_at,
            source=bundle.source,
            features=bundle.pipeline.feature_names,
            error=self.last_error,
        )

    def _load_artifact(self, path: Path) -> ModelBundle:
        artifact: dict[str, Any] = joblib.load(path)
        model = artifact["model"]
        pipeline = artifact["pipeline"]
        if not hasattr(model, "predict") or not hasattr(model, "score_samples"):
            raise ValueError("Model artifact does not expose Isolation Forest prediction methods")
        if not isinstance(pipeline, FeaturePipeline):
            raise ValueError("Model artifact has an invalid feature pipeline")

        return ModelBundle(
            model=model,
            pipeline=pipeline,
            version=str(artifact.get("version", "isolation-forest-v1")),
            trained_at=artifact.get("trained_at"),
            loaded_at=datetime.now(timezone.utc),
            source=str(path),
        )

    def _build_fallback_model(self, source: str = "in_memory_sample") -> ModelBundle:
        pipeline = FeaturePipeline()
        training_data: list[TransactionInput] = SAMPLE_TRANSACTIONS
        features = pipeline.fit_transform(training_data)
        model = IsolationForest(
            n_estimators=100,
            contamination=0.2,
            random_state=42,
        )
        model.fit(features)
        trained_at = datetime.now(timezone.utc)
        return ModelBundle(
            model=model,
            pipeline=pipeline,
            version="isolation-forest-dev-sample-v1",
            trained_at=trained_at,
            loaded_at=trained_at,
            source=source,
        )
