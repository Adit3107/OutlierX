import math
from typing import Dict, List, Tuple


class FeatureVectorValidator:
    """
    Validates feature vectors for numerical integrity, range constraints, and missing mandatory values.
    """

    MANDATORY_FEATURES = [
        "transaction_amount",
        "transaction_hour",
        "time_since_previous_tx",
        "merchant_frequency",
        "country_frequency",
        "rule_score",
    ]

    def __init__(self, max_value: float = 1e12) -> None:
        self.max_value = max_value

    def validate(self, feature_dict: Dict[str, float]) -> Tuple[bool, List[str]]:
        errors: List[str] = []

        # Check mandatory features
        for key in self.MANDATORY_FEATURES:
            if key not in feature_dict:
                errors.push(f"Missing mandatory feature: {key}")

        # Check numerical sanity
        for key, val in feature_dict.items():
            if val is None or math.isnan(val):
                errors.append(f"Feature '{key}' contains NaN value")
            elif math.isinf(val):
                errors.append(f"Feature '{key}' contains Infinite value")
            elif abs(val) > self.max_value:
                errors.append(f"Feature '{key}' exceeded maximum threshold ({val} > {self.max_value})")

        # Range & domain rules
        if feature_dict.get("transaction_amount", 0.0) < 0:
            errors.append("transaction_amount cannot be negative")

        if feature_dict.get("time_since_previous_tx", 0.0) < 0:
            errors.append("time_since_previous_tx cannot be negative")

        is_valid = len(errors) == 0
        return is_valid, errors
