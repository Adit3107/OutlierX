from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelPrediction(BaseModel):
    """Standardized output schema for all anomaly detection models."""
    model_name: str
    model_version: str
    algorithm: str
    raw_score: float
    normalized_score: float = Field(..., description="Score normalized to 0.0 - 100.0 risk scale")
    confidence: float = Field(..., description="Model confidence 0.0 - 100.0")
    prediction: str = Field(..., description="ANOMALY or NORMAL")
    execution_time_ms: float
    inference_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    warnings: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ModelInfo(BaseModel):
    """Metadata schema for a registered model."""
    name: str
    version: str
    algorithm: str
    status: str = Field(default="ACTIVE")
    supported_features: List[str] = Field(default_factory=list)
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    accuracy: Optional[float] = None
    total_inferences: int = 0
    avg_latency_ms: float = 0.0
    last_used_at: Optional[str] = None


class ModelHealth(BaseModel):
    """Health check output for an individual model."""
    name: str
    algorithm: str
    status: str  # HEALTHY, DEGRADED, UNHEALTHY, DISABLED
    loaded: bool
    version: str
    details: Dict[str, Any] = Field(default_factory=dict)


class SinglePredictionRequest(BaseModel):
    feature_vector: Dict[str, float]
    transaction_id: Optional[str] = None
    organization_id: Optional[str] = None
    model_name: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    feature_vectors: List[Dict[str, float]]
    transaction_ids: Optional[List[str]] = None
    organization_id: Optional[str] = None
    model_name: Optional[str] = None
