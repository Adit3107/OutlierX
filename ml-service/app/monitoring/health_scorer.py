from typing import Dict, Any
from app.monitoring.config import monitoring_settings

def calculate_model_health(
    feature_drift_score: float, # PSI score 0.0 - 1.0
    prediction_drift_score: float, # PSI score 0.0 - 1.0
    data_quality_score: float, # Quality score 0 - 100
    p95_latency_ms: float,
    error_rate: float,
    avg_confidence: float,
    model_agreement: float
) -> Dict[str, Any]:
    """
    Computes a deterministic Model Health Score (0 - 100) and Health Status:
    HEALTHY (>= 70), WARNING (50 - 69), DEGRADED (30 - 49), CRITICAL (< 30)
    """
    # 1. Feature Drift Component (0-100 score, lower drift = higher score)
    feat_score = max(0.0, 100.0 - (feature_drift_score * 200.0))

    # 2. Prediction Drift Component (0-100 score)
    pred_score = max(0.0, 100.0 - (prediction_drift_score * 200.0))

    # 3. Data Quality Component (0-100)
    qual_score = min(100.0, max(0.0, data_quality_score))

    # 4. Latency & Performance Component (0-100)
    lat_penalty = max(0.0, (p95_latency_ms - 100.0) / 50.0) if p95_latency_ms > 100 else 0.0
    err_penalty = error_rate * 500.0
    perf_score = max(0.0, 100.0 - lat_penalty - err_penalty)

    # 5. Confidence & Agreement Component (0-100)
    conf_score = (avg_confidence * 50.0) + (model_agreement * 50.0)

    # Weighted Overall Score
    total_score = (
        (feat_score * monitoring_settings.WEIGHT_FEATURE_DRIFT) +
        (pred_score * monitoring_settings.WEIGHT_PREDICTION_DRIFT) +
        (qual_score * monitoring_settings.WEIGHT_DATA_QUALITY) +
        (perf_score * monitoring_settings.WEIGHT_LATENCY) +
        (conf_score * monitoring_settings.WEIGHT_CONFIDENCE)
    )

    final_health_score = round(float(min(100.0, max(0.0, total_score))), 1)

    if final_health_score >= monitoring_settings.HEALTH_WARNING_THRESHOLD:
        status = "HEALTHY"
    elif final_health_score >= monitoring_settings.HEALTH_DEGRADED_THRESHOLD:
        status = "WARNING"
    elif final_health_score >= monitoring_settings.HEALTH_CRITICAL_THRESHOLD:
        status = "DEGRADED"
    else:
        status = "CRITICAL"

    return {
        "healthScore": final_health_score,
        "healthStatus": status,
        "factors": {
            "featureDriftComponent": round(feat_score, 1),
            "predictionDriftComponent": round(pred_score, 1),
            "dataQualityComponent": round(qual_score, 1),
            "performanceComponent": round(perf_score, 1),
            "confidenceAgreementComponent": round(conf_score, 1)
        },
        "reason": f"Model evaluated with {status} status (score: {final_health_score}/100)"
    }
