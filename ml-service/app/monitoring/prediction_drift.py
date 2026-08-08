import numpy as np
from typing import List, Dict, Any
from app.monitoring.psi import calculate_psi
from app.monitoring.feature_drift import classify_drift_severity

def analyze_prediction_drift(
    ref_scores: List[float],
    curr_scores: List[float],
    ref_confidences: List[float],
    curr_confidences: List[float],
    anomaly_threshold: float = 0.50
) -> Dict[str, Any]:
    ref_s = np.array(ref_scores, dtype=float) if ref_scores else np.array([0.1])
    curr_s = np.array(curr_scores, dtype=float) if curr_scores else np.array([0.1])
    
    ref_c = np.array(ref_confidences, dtype=float) if ref_confidences else np.array([0.95])
    curr_c = np.array(curr_confidences, dtype=float) if curr_confidences else np.array([0.95])

    anomaly_ref = float((ref_s >= anomaly_threshold).mean())
    anomaly_curr = float((curr_s >= anomaly_threshold).mean())

    avg_score_ref = float(np.mean(ref_s))
    avg_score_curr = float(np.mean(curr_s))

    avg_conf_ref = float(np.mean(ref_c))
    avg_conf_curr = float(np.mean(curr_c))

    psi_score, _ = calculate_psi(ref_s, curr_s)
    severity = classify_drift_severity(psi_score)

    return {
        "anomalyRateRef": round(anomaly_ref, 4),
        "anomalyRateCurr": round(anomaly_curr, 4),
        "avgScoreRef": round(avg_score_ref, 4),
        "avgScoreCurr": round(avg_score_curr, 4),
        "confidenceRef": round(avg_conf_ref, 4),
        "confidenceCurr": round(avg_conf_curr, 4),
        "psiScore": psi_score,
        "severity": severity,
        "scoreDistribution": {
            "low_risk": int((curr_s < 0.33).sum()),
            "med_risk": int(((curr_s >= 0.33) & (curr_s < 0.66)).sum()),
            "high_risk": int((curr_s >= 0.66).sum())
        }
    }
