import math
from typing import Dict, List, Tuple


class NumericalScaler:
    """
    Feature scaling component for numerical feature vectors.
    Scalers supported:
    - standard: (x - mean) / std_dev
    - minmax: (x - min) / (max - min)
    - robust: (x - median) / IQR
    """

    def __init__(self, mode: str = "standard") -> None:
        self.mode = mode.lower().strip()
        self.stats: Dict[str, Tuple[float, float]] = {}  # feature_name -> (stat1, stat2)

    def fit(self, feature_dicts: List[Dict[str, float]]) -> "NumericalScaler":
        if not feature_dicts:
            return self

        feature_names = feature_dicts[0].keys()
        for name in feature_names:
            vals = [fd.get(name, 0.0) for fd in feature_dicts]
            n = len(vals)
            if self.mode == "minmax":
                min_val = min(vals)
                max_val = max(vals)
                self.stats[name] = (min_val, max_val)
            elif self.mode == "robust":
                sorted_vals = sorted(vals)
                med = sorted_vals[n // 2]
                q1 = sorted_vals[int(0.25 * (n - 1))]
                q3 = sorted_vals[int(0.75 * (n - 1))]
                iqr = max(1e-5, q3 - q1)
                self.stats[name] = (med, iqr)
            else:
                # Default standard scaling
                mean_val = sum(vals) / n
                variance = sum((x - mean_val) ** 2 for x in vals) / n
                std_val = max(1e-5, math.sqrt(variance))
                self.stats[name] = (mean_val, std_val)

        return self

    def scale_single(self, feature_name: str, value: float) -> float:
        if feature_name not in self.stats:
            return value

        stat1, stat2 = self.stats[feature_name]

        if self.mode == "minmax":
            min_val, max_val = stat1, stat2
            if max_val - min_val < 1e-5:
                return 0.0
            return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))
        elif self.mode == "robust":
            med, iqr = stat1, stat2
            return (value - med) / iqr
        else:
            # Standard Z-score
            mean_val, std_val = stat1, stat2
            return (value - mean_val) / std_val

    def scale_dict(self, feature_dict: Dict[str, float]) -> Dict[str, float]:
        return {name: self.scale_single(name, val) for name, val in feature_dict.items()}
