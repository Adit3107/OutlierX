from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FeatureDriftRequest(BaseModel):
    featureName: str
    refValues: List[float] = Field(default_factory=list)
    currValues: List[float] = Field(default_factory=list)

class PredictionDriftRequest(BaseModel):
    refScores: List[float] = Field(default_factory=list)
    currScores: List[float] = Field(default_factory=list)
    refConfidences: List[float] = Field(default_factory=list)
    currConfidences: List[float] = Field(default_factory=list)

class ModelHealthRequest(BaseModel):
    featureDriftScore: float = 0.05
    predictionDriftScore: float = 0.05
    dataQualityScore: float = 98.5
    p95LatencyMs: float = 12.5
    errorRate: float = 0.0
    avgConfidence: float = 0.95
    modelAgreement: float = 0.90
