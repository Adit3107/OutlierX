import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set


def parse_iso_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


class TimeFeatureExtractor:
    """
    Extracts cyclical, temporal, and velocity time metrics.
    Features extracted:
    - transaction_hour: 0-23
    - transaction_minute: 0-59
    - transaction_second: 0-59
    - transaction_day: 1-31
    - transaction_weekday: 0-6 (0=Mon)
    - transaction_month: 1-12
    - transaction_quarter: 1-4
    - weekend_flag: 1 if Saturday or Sunday
    - night_flag: 1 if between 23:00 and 05:00
    - business_hours_flag: 1 if Mon-Fri between 08:00 and 18:00
    - holiday_flag: 1 if transaction date matches holiday list
    - time_since_previous_tx: seconds elapsed since user's previous transaction
    - tx_count_last_hour: number of txs by user in past 3600 seconds
    - tx_count_last_day: number of txs by user in past 86400 seconds
    - tx_count_last_week: number of txs by user in past 604800 seconds
    """

    def __init__(self, holidays: Optional[Set[str]] = None) -> None:
        # Holidays in format 'YYYY-MM-DD' or 'MM-DD'
        self.holidays = holidays or {"01-01", "07-04", "12-25", "12-31"}

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        current_dt = parse_iso_datetime(transaction.get("timestamp"))

        hour = current_dt.hour
        minute = current_dt.minute
        second = current_dt.second
        day = current_dt.day
        weekday = current_dt.weekday()
        month = current_dt.month
        quarter = (month - 1) // 3 + 1

        is_weekend = 1.0 if weekday >= 5 else 0.0
        is_night = 1.0 if (hour >= 23 or hour < 5) else 0.0
        is_business = 1.0 if (weekday < 5 and 8 <= hour < 18) else 0.0

        date_str = current_dt.strftime("%Y-%m-%d")
        short_date = current_dt.strftime("%m-%d")
        is_holiday = 1.0 if (date_str in self.holidays or short_date in self.holidays) else 0.0

        # Calculate time delta and rolling counts from history
        prev_deltas: List[float] = []
        if user_history:
            history_times = sorted([parse_iso_datetime(t.get("timestamp")) for t in user_history if t.get("timestamp")])
            # Time since previous
            if history_times:
                last_time = history_times[-1]
                time_since_prev = max(0.0, (current_dt - last_time).total_seconds())
            else:
                time_since_prev = 86400.0  # Default 1 day

            curr_timestamp = current_dt.timestamp()
            tx_last_hour = sum(1 for t in history_times if 0 <= (curr_timestamp - t.timestamp()) <= 3600)
            tx_last_day = sum(1 for t in history_times if 0 <= (curr_timestamp - t.timestamp()) <= 86400)
            tx_last_week = sum(1 for t in history_times if 0 <= (curr_timestamp - t.timestamp()) <= 604800)
        else:
            time_since_prev = 86400.0
            tx_last_hour = 0
            tx_last_day = 0
            tx_last_week = 0

        return {
            "transaction_hour": float(hour),
            "transaction_minute": float(minute),
            "transaction_second": float(second),
            "transaction_day": float(day),
            "transaction_weekday": float(weekday),
            "transaction_month": float(month),
            "transaction_quarter": float(quarter),
            "weekend_flag": is_weekend,
            "night_flag": is_night,
            "business_hours_flag": is_business,
            "holiday_flag": is_holiday,
            "time_since_previous_tx": time_since_prev,
            "tx_count_last_hour": float(tx_last_hour),
            "tx_count_last_day": float(tx_last_day),
            "tx_count_last_week": float(tx_last_week),
        }
