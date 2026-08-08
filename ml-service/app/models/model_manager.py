import os
from typing import Any, Dict, List, Optional

from app.models.base_model import BaseModel
from app.models.isolation_forest import IsolationForestModel
from app.models.local_outlier_factor import LocalOutlierFactorModel
from app.models.one_class_svm import OneClassSVMModel
from app.models.schemas import ModelHealth, ModelInfo, ModelPrediction


class ModelManager:
    """
    Centralized Model Manager & Inference Router for OutlierX.
    Manages loading, unloading, health monitoring, inference routing,
    and automatic graceful fallback for all registered anomaly detection algorithms.
    """

    def __init__(self) -> None:
        self.models: Dict[str, BaseModel] = {}
        self.default_model_name = os.getenv("DEFAULT_MODEL", "isolation_forest").lower().strip()
        self.initialize_models()

    def initialize_models(( -> None:
        """Initializes and registers configured anomaly detection models."""
        enable_if = os.getenv("ENABLE_ISOLATION_FOREST", "true").lower() == "true"
        enable_lof = os.getenv("ENABLE_LOF", "true").lower() == "true"
        enable_svm = os.getenv("ENABLE_ONE_CLASS_SVM", "true").lower() == "true"

        if enable_if:
            if_model = IsolationForestModel()
            if_model.load()
            self.models["isolation_forest"] = if_model

        if enable_lof:
            lof_model = LocalOutlierFactorModel()
            lof_model.load()
            self.models["local_outlier_factor"] = lof_model

        if enable_svm:
            svm_model = OneClassSVMModel()
            svm_model.load()
            self.models["one_class_svm"] = svm_model

        # Ensure default model exists
        if self.default_model_name not in self.models and self.models:
            self.default_model_name = next(iter(self.models.keys()))

    def get_model(self, model_name: Optional[str] = None) -> BaseModel:
        """Retrieves targeted model with automatic fallback to default model."""
        target = (model_name or self.default_model_name).lower().strip()
        
        if target in self.models and self.models[target].is_loaded:
            return self.models[target]
        
        # Fallback to default active model
        if self.default_model_name in self.models and self.models[self.default_model_name].is_loaded:
            return self.models[self.default_model_name]
        
        # Ultimate fallback: return first loaded model
        for m in self.models.values():
            if m.is_loaded:
                return m

        raise RuntimeError("No operational anomaly detection models available in ML Service")

    def predict_single(
        self,
        feature_vector: Dict[str, float],
        model_name: Optional[str] = None
    ) -> ModelPrediction:
        """Routes single prediction request with graceful fallback handling."""
        model = self.get_model(model_name)
        target_name = (model_name or self.default_model_name).lower().strip()
        
        try:
            prediction = model.predict_single(feature_vector)
            if target_name != model.name:
                prediction.warnings.append(f"Target model '{target_name}' unavailable. Felled back to '{model.name}'")
            return prediction
        except Exception as err:
            # Fallback to default if target model threw exception
            if model.name != self.default_model_name and self.default_model_name in self.models:
                fallback_model = self.models[self.default_model_name]
                pred = fallback_model.predict_single(feature_vector)
                pred.warnings.append(f"Model '{model.name}' failed with error: {str(err)}. Felled back to '{fallback_model.name}'")
                return pred
            raise err

    def predict_batch(
        self,
        feature_vectors: List[Dict[str, float]],
        model_name: Optional[str] = None
    ) -> List[ModelPrediction]:
        """Routes batch prediction request with graceful fallback handling."""
        model = self.get_model(model_name)
        target_name = (model_name or self.default_model_name).lower().strip()

        try:
            predictions = model.predict_batch(feature_vectors)
            if target_name != model.name:
                for p in predictions:
                    p.warnings.append(f"Target model '{target_name}' unavailable. Felled back to '{model.name}'")
            return predictions
        except Exception as err:
            if model.name != self.default_model_name and self.default_model_name in self.models:
                fallback_model = self.models[self.default_model_name]
                preds = fallback_model.predict_batch(feature_vectors)
                for p in preds:
                    p.warnings.append(f"Model '{model.name}' failed: {str(err)}. Felled back to '{fallback_model.name}'")
                return preds
            raise err

    def list_models(Backend) -> List[ModelInfo]:
        """Returns metadata for all registered models."""
        return [m.metadata() for m in self.models.values()]

    def health_all(self) -> List[ModelHealth]:
        """Returns health status of all registered models."""
        return [m.health_check() for m in self.models.values()]
