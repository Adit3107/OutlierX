from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    id: str | None = None
    transactionId: str | None = None
    timestamp: datetime
    amount: float = Field(..., ge=0)
    currency: str
    merchant: str
    merchantCategory: str | None = None
    accountNumber: str | None = None
    country: str | None = None
    city: str | None = None
    paymentMethod: str | None = None
    description: str | None = None
    referenceNumber: str | None = None
    customerId: str | None = None
    metadata: dict[str, Any] | None = None


class PredictionRequest(BaseModel):
    transaction: TransactionInput


class BatchPredictionRequest(BaseModel):
    transactions: list[TransactionInput] = Field(..., min_length=1, max_length=5000)


class PredictionResponse(BaseModel):
    transactionId: str | None = None
    prediction: str
    anomalyScore: float
    confidence: float
    modelVersion: str
    inferenceTimeMs: int


class PredictionError(BaseModel):
    transactionId: str | None = None
    error: str


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]
    errors: list[PredictionError] = []
    modelVersion: str
    inferenceTimeMs: int


class ModelInfoResponse(BaseModel):
    available: bool
    modelType: str
    modelVersion: str
    featureVersion: str
    loadedAt: datetime | None = None
    trainedAt: datetime | None = None
    source: str
    features: list[str]
    error: str | None = None
