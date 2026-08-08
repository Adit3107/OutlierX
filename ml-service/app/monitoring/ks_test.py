import numpy as np
from typing import List, Union, Tuple

def calculate_ks_test(
    ref_data: Union[List[float], np.ndarray],
    curr_data: Union[List[float], np.ndarray]
) -> Tuple[float, float]:
    """
    Performs Kolmogorov-Smirnov 2-sample test for numerical feature distributions.
    Returns (statistic, p_value).
    """
    ref = np.sort(np.array(ref_data, dtype=float))
    curr = np.sort(np.array(curr_data, dtype=float))

    if len(ref) == 0 or len(curr) == 0:
        return 0.0, 1.0

    n1 = len(ref)
    n2 = len(curr)

    data_all = np.concatenate([ref, curr])
    cdf1 = np.searchsorted(ref, data_all, side='right') / n1
    cdf2 = np.searchsorted(curr, data_all, side='right') / n2

    d_stat = float(np.max(np.abs(cdf1 - cdf2)))

    # Approximate asymptotic p-value for 2-sample KS test
    en = np.sqrt(n1 * n2 / (n1 + n2))
    lambda_val = (en + 0.12 + 0.11 / en) * d_stat
    
    # Asymptotic Kolmogorov distribution survival function approximation
    if lambda_val <= 0:
        p_val = 1.0
    else:
        p_val = 2.0 * np.sum([((-1) ** (k - 1)) * np.exp(-2 * (k * lambda_val) ** 2) for k in range(1, 101)])
        p_val = max(0.0, min(1.0, float(p_val)))

    return round(d_stat, 4), round(p_val, 4)
