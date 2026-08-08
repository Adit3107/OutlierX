from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.monitoring.config import monitoring_settings
from app.monitoring.feature_drift import analyze_feature_drift
from app.monitoring.prediction_drift import analyze_prediction_drift
from app.monitoring.data_quality import evaluate_data_quality
from app.monitoring.health_scorer import calculate_model_health
from app.monitoring.schemas import FeatureDriftRequest, PredictionDriftRequest, ModelHealthRequest

router = APIRouter(prefix="/monitoring", tags=["ML Monitoring & Drift"])

@router.get("/status")
async def get_monitoring_status():
    return {
        "monitoringEnabled": monitoring_settings.ENABLED,
        "intervalMinutes": monitoring_settings.INTERVAL_MINUTES,
        "thresholds": {
            "psiLow": monitoring_settings.PSI_LOW_THRESHOLD,
            "psiMedium": monitoring_settings.PSI_MEDIUM_THRESHOLD,
            "psiHigh": monitoring_settings.PSI_HIGH_THRESHOLD,
            "ksPValue": monitoring_settings.KS_P_VALUE_THRESHOLD,
            "predictionDrift": monitoring_settings.PREDICTION_DRIFT_THRESHOLD,
            "confidenceDrop": monitoring_settings.CONFIDENCE_DROP_THRESHOLD,
            "dataQuality": monitoring_settings.DATA_QUALITY_THRESHOLD,
            "healthWarning": monitoring_settings.HEALTH_WARNING_THRESHOLD,
            "healthCritical": monitoring_settings.HEALTH_CRITICAL_THRESHOLD,
        }
    }

@router.post("/feature-drift")
async def compute_feature_drift(payload: FeatureDriftRequest):
    return analyze_feature_drift(payload.featureName, payload.refValues, payload.currValues)

@router.post("/prediction-drift")
async def compute_prediction_drift(payload: PredictionDriftRequest):
    return analyze_prediction_drift(
        payload.refScores,
        payload.currScores,
        payload.refConfidences,
        payload.currConfidences
    )

@router.post("/data-quality")
async def compute_data_quality(transactions: List[Dict[str, Any]]):
    return evaluate_data_quality(transactions)

@router.post("/health-score")
async def compute_health_score(payload: ModelHealthRequest):
    return calculate_model_health(
        payload.featureDriftScore,
        payload.predictionDriftScore,
        payload.dataQualityScore,
        payload.p95LatencyMs,
        payload.errorRate,
        payload.avgConfidence,
        payload.modelAgreement
    )
