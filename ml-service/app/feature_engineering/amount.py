import math
from typing import Any, Dict, List, Optional


class AmountFeatureExtractor:
    """
    Extracts numerical and categorical indicators from transaction monetary amounts.
    Features extracted:
    - transaction_amount: Raw amount in base currency
    - log_amount: Logarithm log1p(amount) for skew reduction
    - amount_bucket: Discrete bucket index (0: micro, 1: low, 2: mid, 3: high, 4: ultra)
    - amount_percentile: Normalized percentile rank (0.0 to 1.0)
    - relative_amount: Ratio of amount to user's average spend
    - average_user_amount: Historical average spend of the account/user
    - median_user_amount: Historical median spend of the account/user
    - rolling_average_amount: Short-term rolling average amount
    - rolling_median_amount: Short-term rolling median amount
    - amount_difference: Absolute difference from historical average
    - amount_ratio: Ratio of amount to historical median
    - amount_z_score: Standardized Z-score of transaction amount
    - high_value_flag: Binary flag (1 if amount > $10,000)
    - large_cash_flag: Binary flag (1 if cash/withdrawal & amount >= $5,000)
    """

    def __init__(self, high_value_threshold: float = 10000.0, large_cash_threshold: float = 5000.0) -> None:
        self.high_value_threshold = high_value_threshold
        self.large_cash_threshold = large_cash_threshold

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        amount = float(transaction.get("amount", 0.0) or 0.0)
        amount = max(0.0, amount)

        log_amount = math.log1p(amount)
        amount_bucket = self._get_amount_bucket(amount)

        # Historical user amounts
        history_amounts = [float(t.get("amount", 0.0) or 0.0) for t in (user_history or []) if t.get("amount") is not None]
        
        if history_amounts:
            avg_user_amount = sum(history_amounts) / len(history_amounts)
            sorted_amounts = sorted(history_amounts)
            n = len(sorted_amounts)
            median_user_amount = (sorted_amounts[n // 2] if n % 2 != 0 else (sorted_amounts[n // 2 - 1] + sorted_amounts[n // 2]) / 2.0)
            
            # StdDev for Z-score
            variance = sum((x - avg_user_amount) ** 2 for x in history_amounts) / max(1, len(history_amounts))
            std_dev = math.sqrt(variance)
            z_score = (amount - avg_user_amount) / std_dev if std_dev > 0.0001 else 0.0

            # Rolling stats (last 5 transactions)
            rolling_amounts = history_amounts[-5:]
            rolling_avg = sum(rolling_amounts) / len(rolling_amounts)
            sorted_rolling = sorted(rolling_amounts)
            m = len(sorted_rolling)
            rolling_med = (sorted_rolling[m // 2] if m % 2 != 0 else (sorted_rolling[m // 2 - 1] + sorted_rolling[m // 2]) / 2.0)

            # Percentile rank within user history
            rank = sum(1 for x in history_amounts if x <= amount)
            percentile = rank / float(len(history_amounts))
        else:
            avg_user_amount = amount
            median_user_amount = amount
            rolling_avg = amount
            rolling_med = amount
            z_score = 0.0
            percentile = 0.5

        relative_amount = amount / avg_user_amount if avg_user_amount > 0 else 1.0
        amount_diff = amount - avg_user_amount
        amount_ratio = amount / median_user_amount if median_user_amount > 0 else 1.0

        payment_method = str(transaction.get("paymentMethod") or transaction.get("payment_method") or "").lower()
        is_cash = "cash" in payment_method or "atm" in payment_method or "withdrawal" in payment_method

        return {
            "transaction_amount": amount,
            "log_amount": log_amount,
            "amount_bucket": float(amount_bucket),
            "amount_percentile": percentile,
            "relative_amount": relative_amount,
            "average_user_amount": avg_user_amount,
            "median_user_amount": median_user_amount,
            "rolling_average_amount": rolling_avg,
            "rolling_median_amount": rolling_med,
            "amount_difference": amount_diff,
            "amount_ratio": amount_ratio,
            "amount_z_score": z_score,
            "high_value_flag": 1.0 if amount >= self.high_value_threshold else 0.0,
            "large_cash_flag": 1.0 if (is_cash and amount >= self.large_cash_threshold) else 0.0,
        }

    @staticmethod
    def _get_amount_bucket(amount: float) -> int:
        if amount < 20.0:
            return 0  # Micro
        elif amount < 200.0:
            return 1  # Low
        elif amount < 1000.0:
            return 2  # Mid
        elif amount < 5000.0:
            return 3  # High
        else:
            return 4  # Ultra
