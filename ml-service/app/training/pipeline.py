from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.ensemble import IsolationForest

from app.feature_engineering import FeaturePipeline
from app.schemas import TransactionInput
from app.utils import SAMPLE_TRANSACTIONS


class DatasetLoader:
    def load_sample(self) -> list[TransactionInput]:
        return SAMPLE_TRANSACTIONS


class ModelTrainer:
    def train(self, transactions: list[TransactionInput]) -> tuple[IsolationForest, FeaturePipeline]:
        pipeline = FeaturePipeline()
        features = pipeline.fit_transform(transactions)
        model = IsolationForest(n_estimators=100, contamination=0.2, random_state=42)
        model.fit(features)
        return model, pipeline


class ModelEvaluator:
    def evaluate(self, model: IsolationForest, pipeline: FeaturePipeline, transactions: list[TransactionInput]) -> dict[str, int]:
        predictions = model.predict(pipeline.transform(transactions))
        return {
            "records": len(transactions),
            "normal": int((predictions == 1).sum()),
            "anomaly": int((predictions == -1).sum()),
        }


class TrainingService:
    def __init__(self, artifact_path: str | Path = "models/isolation_forest.joblib") -> None:
        self.artifact_path = Path(artifact_path)
        self.loader = DatasetLoader()
        self.trainer = ModelTrainer()
        self.evaluator = ModelEvaluator()

    def train_sample_model(self) -> dict[str, object]:
        transactions = self.loader.load_sample()
        model, pipeline = self.trainer.train(transactions)
        metrics = self.evaluator.evaluate(model, pipeline, transactions)
        self.artifact_path.parent.mkdir(parents=True, exist_ok=True)
        artifact = {
            "model": model,
            "pipeline": pipeline,
            "version": "isolation-forest-trained-v1",
            "trained_at": datetime.now(timezone.utc),
            "metrics": metrics,
        }
        joblib.dump(artifact, self.artifact_path)
        return {"artifactPath": str(self.artifact_path), "metrics": metrics}
