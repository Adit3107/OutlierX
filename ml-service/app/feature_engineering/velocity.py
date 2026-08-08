from typing import Any, Dict, List, Optional
from app.feature_engineering.time import parse_iso_datetime


class VelocityFeatureExtractor:
    """
    Extracts high-frequency transaction velocity, burst detection, and repetition patterns.
    Features extracted:
    - transactions_per_minute: Count of txs by user in past 60 seconds
    - transactions_per_hour: Count of txs by user in past 3600 seconds
    - transactions_per_day: Count of txs by user in past 86400 seconds
    - average_time_between_transactions: Mean inter-transaction time in seconds
    - burst_detection_flag: 1 if >3 transactions occurred within 60 seconds
    - repeated_merchant_flag: 1 if merchant matches immediately prior transaction
    - repeated_device_flag: 1 if device matches immediately prior transaction
    - repeated_country_flag: 1 if country matches immediately prior transaction
    - rapid_location_change_flag: 1 if country changed within 3600 seconds (< 1 hour)
    """

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        curr_dt = parse_iso_datetime(transaction.get("timestamp"))
        curr_ts = curr_dt.timestamp()

        history = user_history or []
        history_times = sorted([parse_iso_datetime(t.get("timestamp")) for t in history if t.get("timestamp")])

        tx_min = 0
        tx_hour = 0
        tx_day = 0

        for t_dt in history_times:
            age_sec = curr_ts - t_dt.timestamp()
            if 0 <= age_sec <= 60:
                tx_min += 1
            if 0 <= age_sec <= 3600:
                tx_hour += 1
            if 0 <= age_sec <= 86400:
                tx_day += 1

        # Inter-arrival times
        if len(history_times) >= 2:
            deltas = [(history_times[i] - history_times[i - 1]).total_seconds() for i in range(1, len(history_times))]
            avg_time_between = sum(deltas) / len(deltas)
        elif len(history_times) == 1:
            avg_time_between = max(0.0, (curr_dt - history_times[0]).total_seconds())
        else:
            avg_time_between = 86400.0  # 1 day default

        burst_flag = 1.0 if tx_min >= 3 else 0.0

        curr_merchant = str(transaction.get("merchant") or "").strip().lower()
        curr_country = str(transaction.get("country") or "").strip().upper()
        curr_meta = transaction.get("metadata") or {}
        curr_device = str(transaction.get("deviceId") or curr_meta.get("deviceId") or "").strip()

        rep_merchant = 0.0
        rep_device = 0.0
        rep_country = 0.0
        rapid_location_change = 0.0

        if history:
            prev = history[-1]
            prev_dt = parse_iso_datetime(prev.get("timestamp"))
            prev_merchant = str(prev.get("merchant") or "").strip().lower()
            prev_country = str(prev.get("country") or "").strip().upper()
            prev_meta = prev.get("metadata") or {}
            prev_device = str(prev.get("deviceId") or prev_meta.get("deviceId") or "").strip()

            if curr_merchant and curr_merchant == prev_merchant:
                rep_merchant = 1.0
            if curr_device and curr_device == prev_device:
                rep_device = 1.0
            if curr_country and curr_country == prev_country:
                rep_country = 1.0

            time_diff_sec = (curr_dt - prev_dt).total_seconds()
            if curr_country and prev_country and curr_country != prev_country and time_diff_sec < 3600:
                rapid_location_change = 1.0

        return {
            "transactions_per_minute": float(tx_min),
            "transactions_per_hour": float(tx_hour),
            "transactions_per_day": float(tx_day),
            "average_time_between_transactions": avg_time_between,
            "burst_detection_flag": burst_flag,
            "repeated_merchant_flag": rep_merchant,
            "repeated_device_flag": rep_device,
            "repeated_country_flag": rep_country,
            "rapid_location_change_flag": rapid_location_change,
        }
