from typing import Any, Dict, List, Optional

SEVERITY_WEIGHTS = {"NONE": 0.0, "LOW": 1.0, "MEDIUM": 2.0, "HIGH": 3.0, "CRITICAL": 4.0}
DECISION_CODES = {"APPROVE": 0.0, "MONITOR": 1.0, "MANUAL_REVIEW": 2.0, "BLOCK_TRANSACTION": 3.0, "BLOCK": 3.0, "ESCALATE": 4.0}


class RiskFeatureExtractor:
    """
    Extracts features for rule engine outputs, historical risk profiles, and alert history.
    Features extracted:
    - rule_score: Combined score from deterministic rule triggers
    - triggered_rules_count: Number of rules that fired for transaction
    - highest_rule_severity: Maximum severity level (0=NONE to 4=CRITICAL)
    - historical_risk_score: Account historical average risk score
    - historical_ml_score: Account historical average ML model score
    - previous_decision_code: Encoded decision from preceding transaction (0-4)
    - previous_confidence: Model confidence from preceding transaction (0.0-1.0)
    - alert_history_count: Total alerts associated with this user
    """

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        rule_score = float(transaction.get("ruleScore") or transaction.get("rule_score") or 0.0)
        triggered_rules = transaction.get("triggeredRules") or transaction.get("triggered_rules") or []
        
        triggered_count = float(len(triggered_rules))
        highest_severity_num = 0.0

        for r in triggered_rules:
            sev = str(r.get("severity") if isinstance(r, dict) else getattr(r, "severity", "NONE")).upper()
            val = SEVERITY_WEIGHTS.get(sev, 0.0)
            if val > highest_severity_num:
                highest_severity_num = val

        history = user_history or []
        
        if history:
            hist_risks = [float(t.get("riskScore") or t.get("finalScore") or 0.0) for t in history]
            hist_ml_scores = [float(t.get("mlScore") or 0.0) for t in history if t.get("mlScore") is not None]

            avg_hist_risk = sum(hist_risks) / len(hist_risks) if hist_risks else 0.0
            avg_hist_ml = sum(hist_ml_scores) / len(hist_ml_scores) if hist_ml_scores else 0.0

            prev_tx = history[-1]
            prev_dec_str = str(prev_tx.get("recommendation") or prev_tx.get("decision") or "APPROVE").upper()
            prev_dec_code = DECISION_CODES.get(prev_dec_str, 0.0)
            prev_conf = float(prev_tx.get("confidence") or 0.85)

            alert_count = float(sum(1 for t in history if t.get("hasAlert") or t.get("alertId")))
        else:
            avg_hist_risk = rule_score
            avg_hist_ml = 0.0
            prev_dec_code = 0.0
            prev_conf = 0.85
            alert_count = 0.0

        return {
            "rule_score": rule_score,
            "triggered_rules_count": triggered_count,
            "highest_rule_severity": highest_severity_num,
            "historical_risk_score": avg_hist_risk,
            "historical_ml_score": avg_hist_ml,
            "previous_decision_code": prev_dec_code,
            "previous_confidence": prev_conf,
            "alert_history_count": alert_count,
        }
