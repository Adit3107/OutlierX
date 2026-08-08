import math
from typing import Any, Dict, List, Optional
from app.feature_engineering.time import parse_iso_datetime


class UserBehaviorFeatureExtractor:
    """
    Extracts account historical baseline and behavioral metrics.
    Features extracted:
    - average_daily_spend: Mean total spend per day
    - average_weekly_spend: Mean total spend per week
    - average_monthly_spend: Mean total spend per month
    - transactions_today: Count of txs on current day
    - transactions_this_week: Count of txs in current 7-day window
    - transactions_this_month: Count of txs in current 30-day window
    - maximum_transaction: Historical maximum tx amount
    - minimum_transaction: Historical minimum tx amount
    - standard_deviation_amount: Std dev of historical amounts
    - previous_fraud_count: Count of past confirmed fraud incidents
    - previous_alert_count: Count of past generated alerts
    - previous_reject_count: Count of past blocked/rejected transactions
    - previous_review_count: Count of past manual review decisions
    """

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        curr_dt = parse_iso_datetime(transaction.get("timestamp"))
        curr_ts = curr_dt.timestamp()
        history = user_history or []

        amounts = [float(t.get("amount", 0.0) or 0.0) for t in history]

        if amounts:
            max_amount = max(amounts)
            min_amount = min(amounts)
            mean_amount = sum(amounts) / len(amounts)
            variance = sum((x - mean_amount) ** 2 for x in amounts) / len(amounts)
            std_dev = math.sqrt(variance)
        else:
            curr_amt = float(transaction.get("amount", 0.0) or 0.0)
            max_amount = curr_amt
            min_amount = curr_amt
            std_dev = 0.0

        # Windowed transaction counts & spend
        txs_today = 0
        txs_week = 0
        txs_month = 0
        spend_today = 0.0
        spend_week = 0.0
        spend_month = 0.0

        prev_fraud = 0
        prev_alert = 0
        prev_reject = 0
        prev_review = 0

        for t in history:
            t_dt = parse_iso_datetime(t.get("timestamp"))
            t_amt = float(t.get("amount", 0.0) or 0.0)
            age_sec = curr_ts - t_dt.timestamp()

            if 0 <= age_sec <= 86400:
                txs_today += 1
                spend_today += t_amt
            if 0 <= age_sec <= 604800:
                txs_week += 1
                spend_week += t_amt
            if 0 <= age_sec <= 2592000:
                txs_month += 1
                spend_month += t_amt

            # Check decision/status history
            status = str(t.get("status") or "").upper()
            decision = str(t.get("recommendation") or t.get("decision") or "").upper()

            if status == "FRAUD" or "BLOCK" in decision or "REJECT" in decision:
                prev_reject += 1
                if status == "FRAUD":
                    prev_fraud += 1
            if "REVIEW" in decision:
                prev_review += 1
            if t.get("alertId") or t.get("hasAlert"):
                prev_alert += 1

        avg_daily_spend = spend_month / 30.0 if spend_month > 0 else spend_today
        avg_weekly_spend = spend_month / 4.0 if spend_month > 0 else spend_week
        avg_monthly_spend = spend_month

        return {
            "average_daily_spend": avg_daily_spend,
            "average_weekly_spend": avg_weekly_spend,
            "average_monthly_spend": avg_monthly_spend,
            "transactions_today": float(txs_today),
            "transactions_this_week": float(txs_week),
            "transactions_this_month": float(txs_month),
            "maximum_transaction": max_amount,
            "minimum_transaction": min_amount,
            "standard_deviation_amount": std_dev,
            "previous_fraud_count": float(prev_fraud),
            "previous_alert_count": float(prev_alert),
            "previous_reject_count": float(prev_reject),
            "previous_review_count": float(prev_review),
        }
