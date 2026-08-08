from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.feature_engineering.time import parse_iso_datetime


class MerchantFeatureExtractor:
    """
    Extracts features for merchant profile and risk.
    Features extracted:
    - merchant_frequency: Occurrence count of merchant
    - merchant_average_amount: Avg amount spent at this merchant
    - merchant_risk_score: Estimated risk score (0.0 to 100.0) based on merchant category & history
    - merchant_first_seen_days: Days since merchant was first encountered
    - merchant_last_seen_days: Days since merchant was last encountered
    - merchant_transaction_count: Total tx count at merchant
    - merchant_velocity_24h: Tx count at merchant in last 24 hours
    - merchant_category_frequency: Frequency count of merchant category
    """

    HIGH_RISK_CATEGORIES = {"crypto", "gambling", "pawn", "wire_transfer", "money_service", "casino"}

    def extract(self, transaction: Dict[str, Any], global_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        merchant = str(transaction.get("merchant") or "unknown").strip().lower()
        category = str(transaction.get("merchantCategory") or transaction.get("merchant_category") or "unknown").strip().lower()
        curr_dt = parse_iso_datetime(transaction.get("timestamp"))

        history = global_history or []
        merchant_txs = [
            t for t in history
            if str(t.get("merchant") or "").strip().lower() == merchant
        ]

        category_txs = [
            t for t in history
            if str(t.get("merchantCategory") or t.get("merchant_category") or "").strip().lower() == category
        ]

        merchant_frequency = float(len(merchant_txs))
        category_frequency = float(len(category_txs))

        if merchant_txs:
            amounts = [float(t.get("amount", 0.0) or 0.0) for t in merchant_txs]
            merchant_avg_amount = sum(amounts) / max(1, len(amounts))

            timestamps = [parse_iso_datetime(t.get("timestamp")) for t in merchant_txs]
            first_seen_days = max(0.0, (curr_dt - min(timestamps)).total_seconds() / 86400.0)
            last_seen_days = max(0.0, (curr_dt - max(timestamps)).total_seconds() / 86400.0)

            curr_ts = curr_dt.timestamp()
            velocity_24h = float(sum(1 for ts in timestamps if 0 <= (curr_ts - ts.timestamp()) <= 86400))
        else:
            merchant_avg_amount = float(transaction.get("amount", 0.0) or 0.0)
            first_seen_days = 0.0
            last_seen_days = 0.0
            velocity_24h = 1.0

        # Base risk score calculation
        risk_score = 15.0
        if any(cat in category for cat in self.HIGH_RISK_CATEGORIES):
            risk_score += 45.0
        if merchant_frequency <= 1:
            risk_score += 20.0
        if velocity_24h > 10:
            risk_score += 20.0

        return {
            "merchant_frequency": merchant_frequency,
            "merchant_average_amount": merchant_avg_amount,
            "merchant_risk_score": min(100.0, risk_score),
            "merchant_first_seen_days": first_seen_days,
            "merchant_last_seen_days": last_seen_days,
            "merchant_transaction_count": merchant_frequency,
            "merchant_velocity_24h": velocity_24h,
            "merchant_category_frequency": category_frequency,
        }
