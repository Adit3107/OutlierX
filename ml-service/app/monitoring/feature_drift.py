import numpy as np
from typing import List, Dict, Any
from app.monitoring.psi import calculate_psi
from app.monitoring.ks_test import calculate_ks_test
from app.monitoring.js_divergence import calculate_js_divergence
from app.monitoring.config import monitoring_settings

def classify_drift_severity(psi_score: float) -> str:
    if psi_score < monitoring_settings.PSI_LOW_THRESHOLD:
        return "NO_DRIFT"
    elif psi_score < monitoring_settings.PSI_MEDIUM_THRESHOLD:
        return "LOW"
    elif psi_score < monitoring_settings.PSI_HIGH_THRESHOLD:
        return "MEDIUM"
    elif psi_score < 0.40:
        return "HIGH"
    else:
        return "CRITICAL"

def analyze_feature_drift(
    feature_name: str,
    ref_values: List[float],
    curr_values: List[float]
) -> Dict[str, Any]:
    ref = np.array(ref_values, dtype=float) if ref_values else np.array([0.0])
    curr = np.array(curr_values, dtype=float) if curr_values else np.array([0.0])

    mean_ref = float(np.mean(ref))
    mean_curr = float(np.mean(curr))
    std_ref = float(np.std(ref))
    std_curr = float(np.std(curr))

    null_ref = float(np.isnan(ref).mean()) if len(ref) > 0 else 0.0
    null_curr = float(np.isnan(curr).mean()) if len(curr) > 0 else 0.0

    psi_score, _ = calculate_psi(ref, curr)
    ks_stat, ks_pval = calculate_ks_test(ref, curr)
    
    # Calculate simple histogram bins for JS divergence
    ref_hist, _ = np.histogram(ref, bins=10, density=True)
    curr_hist, _ = np.histogram(curr, bins=10, density=True)
    js_div = calculate_js_divergence(ref_hist, curr_hist)

    severity = classify_drift_severity(psi_score)

    return {
        "featureName": feature_name,
        "meanRef": round(mean_ref, 2),
        "meanCurr": round(mean_curr, 2),
        "stdRef": round(std_ref, 2),
        "stdCurr": round(std_curr, 2),
        "nullRateRef": round(null_ref, 4),
        "nullRateCurr": round(null_curr, 4),
        "psiScore": psi_score,
        "ksPValue": ks_pval,
        "jsDivergence": js_div,
        "severity": severity,
        "distributionRef": {"p25": round(float(np.percentile(ref, 25)), 2), "p50": round(float(np.median(ref)), 2), "p75": round(float(np.percentile(ref, 75)), 2)},
        "distributionCurr": {"p25": round(float(np.percentile(curr, 25)), 2), "p50": round(float(np.median(curr)), 2), "p75": round(float(np.percentile(curr, 75)), 2)},
    }
