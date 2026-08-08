import numpy as np
from typing import List, Union, Tuple, Dict

def calculate_psi(
    ref_data: Union[List[float], np.ndarray],
    curr_data: Union[List[float], np.ndarray],
    num_bins: int = 10,
    eps: float = 1e-4
) -> Tuple[float, Dict[str, float]]:
    """
    Calculates Population Stability Index (PSI) between Reference and Current distributions.
    PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))
    """
    ref = np.array(ref_data, dtype=float)
    curr = np.array(curr_data, dtype=float)

    if len(ref) == 0 or len(curr) == 0:
        return 0.0, {}

    # Define bin breakpoints using reference distribution quantiles
    quantiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(ref, quantiles)
    bins = np.unique(bins)

    if len(bins) < 2:
        bins = np.array([min(ref.min(), curr.min()) - 1, max(ref.max(), curr.max()) + 1])

    ref_counts, _ = np.histogram(ref, bins=bins)
    curr_counts, _ = np.histogram(curr, bins=bins)

    ref_pct = (ref_counts / len(ref)) + eps
    curr_pct = (curr_counts / len(curr)) + eps

    # Normalize percentages to sum to 1
    ref_pct /= ref_pct.sum()
    curr_pct /= curr_pct.sum()

    psi_value = np.sum((curr_pct - ref_pct) * np.log(curr_pct / ref_pct))
    
    bin_details = {
        f"bin_{i}": round(float(val), 4)
        for i, val in enumerate(curr_pct - ref_pct)
    }

    return round(float(psi_value), 4), bin_details
