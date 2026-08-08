import math
from typing import Any, Dict, List, Optional


class StatisticsFeatureExtractor:
    """
    Extracts distribution and dispersion metrics across transaction amounts.
    Features extracted:
    - mean_amount: Population arithmetic mean
    - median_amount: Population median
    - variance_amount: Population variance
    - std_dev_amount: Standard deviation
    - coeff_variation: Coefficient of variation (StdDev / Mean)
    - z_score_stat: Standardized Z-score of transaction amount
    - percentile_stat: Percentile rank of current transaction (0.0 - 1.0)
    - iqr_amount: Interquartile range (Q3 - Q1)
    - outlier_flag: 1 if amount exceeds upper Tukey fence (Q3 + 1.5 * IQR)
    """

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        amount = float(transaction.get("amount", 0.0) or 0.0)
        history = user_history or []
        history_amounts = [float(t.get("amount", 0.0) or 0.0) for t in history] + [amount]

        n = len(history_amounts)
        sorted_amounts = sorted(history_amounts)

        mean_amt = sum(history_amounts) / n
        median_amt = (sorted_amounts[n // 2] if n % 2 != 0 else (sorted_amounts[n // 2 - 1] + sorted_amounts[n // 2]) / 2.0)

        variance = sum((x - mean_amt) ** 2 for x in history_amounts) / n
        std_dev = math.sqrt(variance)

        coeff_var = (std_dev / mean_amt) if mean_amt > 0 else 0.0
        z_score = (amount - mean_amt) / std_dev if std_dev > 0.0001 else 0.0

        # Percentile rank
        rank = sum(1 for x in history_amounts if x <= amount)
        percentile = rank / float(n)

        # Quartiles & IQR
        q1_idx = int(0.25 * (n - 1))
        q3_idx = int(0.75 * (n - 1))
        q1 = sorted_amounts[q1_idx]
        q3 = sorted_amounts[q3_idx]
        iqr = max(0.0, q3 - q1)

        upper_fence = q3 + 1.5 * iqr
        outlier_flag = 1.0 if (amount > upper_fence and n >= 4) else 0.0

        return {
            "mean_amount": mean_amt,
            "median_amount": median_amt,
            "variance_amount": variance,
            "std_dev_amount": std_dev,
            "coeff_variation": coeff_var,
            "z_score_stat": z_score,
            "percentile_stat": percentile,
            "iqr_amount": iqr,
            "outlier_flag": outlier_flag,
        }
