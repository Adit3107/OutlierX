import numpy as np
from typing import List, Union

def calculate_js_divergence(
    p_dist: Union[List[float], np.ndarray],
    q_dist: Union[List[float], np.ndarray],
    eps: float = 1e-6
) -> float:
    """
    Calculates Jensen-Shannon Divergence JSD(P || Q) between two discrete probability distributions.
    0.0 = identical, 1.0 = completely disjoint.
    """
    p = np.array(p_dist, dtype=float) + eps
    q = np.array(q_dist, dtype=float) + eps

    p /= p.sum()
    q /= q.sum()

    m = 0.5 * (p + q)

    kl_p_m = np.sum(p * np.log2(p / m))
    kl_q_m = np.sum(q * np.log2(q / m))

    jsd = 0.5 * (kl_p_m + kl_q_m)
    return round(float(np.sqrt(max(0.0, jsd))), 4)
