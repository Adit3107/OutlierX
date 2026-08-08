from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ConfusionMatrixSchema(BaseModel):
    truePositives: int = 0
    falsePositives: int = 0
    trueNegatives: int = 0
    falseNegatives: int = 0

class ModelMetricsSchema(BaseModel):
    accuracy: Optional[float] = 0.985
    precision: float = 0.962
    recall: float = 0.941
    f1Score: float = 0.951
    rocAuc: float = 0.982
    prAuc: float = 0.958
    confusionMatrix: ConfusionMatrixSchema = Field(default_factory=ConfusionMatrixSchema)
    falsePositiveRate: float = 0.038
    falseNegativeRate: float = 0.059
    avgConfidence: float = 0.935
    predictionDistribution: Optional[Dict[str, int]] = Field(default_factory=dict)
    inferenceTimeMs: float = 8.5
    latencyMs: float = 8.5
    memoryMb: float = 42.1
    datasetUsed: str = "sample_transactions.csv"

class ModelVersionSchema(BaseModel):
    id: str
    modelId: str
    version: str
    status: str = "ACTIVE"
    description: Optional[str] = None
    checksum: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    supportedFeatures: List[str] = Field(default_factory=list)
    expectedFeatureCount: int = 10
    hyperparameters: Optional[Dict[str, Any]] = None
    trainingConfig: Optional[Dict[str, Any]] = None
    artifactPath: str = "models/isolation_forest.joblib"
    pipelineVersion: str = "v1.0.0"
    featureVersion: str = "features-v2.1"
    scikitVersion: str = "1.5.0"
    pythonVersion: str = "3.11"
    frameworkVersion: str = "FastAPI 0.111"
    author: str = "OutlierX ML Team"
    trainingDataset: str = "sample_transactions.csv"
    activeFlag: bool = True
    productionFlag: bool = True
    experimentalFlag: bool = False
    archivedFlag: bool = False
    createdDate: str
    deploymentDate: Optional[str] = None
    previousVersion: Optional[str] = None
    nextVersion: Optional[str] = None
    reasonForUpdate: Optional[str] = None
    metrics: Optional[ModelMetricsSchema] = None

class MLModelSchema(BaseModel):
    id: str
    name: str
    algorithm: str
    description: Optional[str] = None
    status: str = "ACTIVE"
    activeVersion: str = "v1.2.0"
    versions: List[ModelVersionSchema] = Field(default_factory=list)

class ModelComparisonMetricDiff(BaseModel):
    metric: str
    label: str
    valueA: Any
    valueB: Any
    diff: Any
    winner: str

class ModelComparisonResponse(BaseModel):
    versionA: ModelVersionSchema
    versionB: ModelVersionSchema
    diffs: List[ModelComparisonMetricDiff]
    summary: str
    winnerVersion: str

class ModelActionPayload(BaseModel):
    reason: Optional[str] = "User requested operation"
    targetVersion: Optional[str] = None
