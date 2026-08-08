from typing import Any, Dict, List, Optional
from app.feature_engineering.time import parse_iso_datetime


class DeviceFeatureExtractor:
    """
    Extracts device fingerprinting and device switching metrics.
    Features extracted:
    - new_device_flag: 1 if device ID is newly seen for user
    - device_frequency: Number of txs associated with device ID
    - device_risk: Risk score for device (0.0 to 100.0)
    - known_device: 1 if device has been used by user at least once prior
    - device_age_days: Days since device was first seen
    - device_switch_count: Count of device changes in user history
    - previous_device_match: 1 if device matches previous transaction device
    """

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        metadata = transaction.get("metadata") or {}
        device_id = str(
            transaction.get("deviceId")
            or transaction.get("device_id")
            or metadata.get("deviceId")
            or metadata.get("device_id")
            or "unknown_device"
        ).strip()

        curr_dt = parse_iso_datetime(transaction.get("timestamp"))
        history = user_history or []

        user_device_txs: List[Dict[str, Any]] = []
        device_switches = 0
        last_device = None

        for t in history:
            t_meta = t.get("metadata") or {}
            t_dev = str(t.get("deviceId") or t.get("device_id") or t_meta.get("deviceId") or t_meta.get("device_id") or "").strip()
            if t_dev:
                if last_device and t_dev != last_device:
                    device_switches += 1
                last_device = t_dev
                if t_dev == device_id:
                    user_device_txs.append(t)

        device_freq = float(len(user_device_txs))
        is_known = 1.0 if device_freq > 0 else 0.0
        is_new = 1.0 if device_freq == 0 else 0.0

        prev_match = 0.0
        if history:
            prev_meta = history[-1].get("metadata") or {}
            prev_dev = str(history[-1].get("deviceId") or history[-1].get("device_id") or prev_meta.get("deviceId") or prev_meta.get("device_id") or "").strip()
            if prev_dev and prev_dev == device_id:
                prev_match = 1.0

        if user_device_txs:
            timestamps = [parse_iso_datetime(t.get("timestamp")) for t in user_device_txs]
            device_age = max(0.0, (curr_dt - min(timestamps)).total_seconds() / 86400.0)
        else:
            device_age = 0.0

        risk = 10.0
        if is_new > 0:
            risk += 35.0
        if device_switches > 3:
            risk += 25.0

        return {
            "new_device_flag": is_new,
            "device_frequency": device_freq,
            "device_risk": min(100.0, risk),
            "known_device": is_known,
            "device_age_days": device_age,
            "device_switch_count": float(device_switches),
            "previous_device_match": prev_match,
        }
