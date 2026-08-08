from typing import Any, Dict, List, Optional


class CategoricalEncoder:
    """
    Encoder for categorical transaction fields.
    Modes supported:
    - frequency: Maps category string to historical relative frequency (0.0 to 1.0)
    - label: Maps category string to integer index
    - onehot: Expands category into binary indicator dict
    """

    def __init__(self, mode: str = "frequency") -> None:
        self.mode = mode.lower().strip()
        self.label_vocab: Dict[str, int] = {}
        self.freq_vocab: Dict[str, float] = {}

    def fit(self, categories: List[str]) -> "CategoricalEncoder":
        clean_cats = [str(c).strip().lower() for c in categories if c]
        total = max(1, len(clean_cats))

        counts: Dict[str, int] = {}
        for cat in clean_cats:
            counts[cat] = counts.get(cat, 0) + 1

        self.freq_vocab = {cat: count / total for cat, count in counts.items()}
        self.label_vocab = {cat: i + 1 for i, cat in enumerate(sorted(counts.keys()))}
        return self

    def encode(self, category: Optional[str]) -> float:
        cat_key = str(category or "").strip().lower()
        if not cat_key:
            return 0.0

        if self.mode == "label":
            return float(self.label_vocab.get(cat_key, 0))
        else:
            # Default to frequency encoding
            return self.freq_vocab.get(cat_key, 0.01)

    def encode_onehot(self, category: Optional[str], known_categories: List[str]) -> Dict[str, float]:
        cat_key = str(category or "").strip().lower()
        res: Dict[str, float] = {}
        for known in known_categories:
            k_key = known.strip().lower()
            res[f"cat_is_{k_key}"] = 1.0 if cat_key == k_key else 0.0
        return res
