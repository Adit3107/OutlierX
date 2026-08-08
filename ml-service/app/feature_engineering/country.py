from typing import Any, Dict, List, Optional
from app.feature_engineering.time import parse_iso_datetime


class CountryFeatureExtractor:
    """
    Extracts features for geographical country risk & movement patterns.
    Features extracted:
    - country_frequency: Count of transactions in this country
    - country_risk_score: Estimated country risk score (0.0 - 100.0)
    - country_first_seen_days: Days since country was first seen for user
    - country_last_seen_days: Days since country was last seen for user
    - country_changed_flag: 1 if country is different from immediately preceding transaction
    - new_country_flag: 1 if this is the user's first transaction in this country
    - cross_border_flag: 1 if country is different from home country (default 'US')
    - distance_from_previous_country: Approximate distance in km from previous transaction country centroid
    """

    HIGH_RISK_COUNTRIES = {"NG", "RU", "KP", "IR", "SY", "KY", "VG", "PA"}
    
    # Approximate country centroids (lat, lon) for common countries
    CENTROIDS = {
        "US": (37.0902, -95.7129),
        "CA": (56.1304, -106.3468),
        "GB": (55.3781, -3.4360),
        "DE": (51.1657, 10.4515),
        "FR": (46.2276, 2.2137),
        "NG": (9.0820, 8.6753),
        "RU": (61.5240, 105.3188),
        "CN": (35.8617, 104.1954),
        "JP": (36.2048, 138.2529),
        "IN": (20.5937, 78.9629),
        "BR": (-14.2350, -51.9253),
        "AU": (-25.2744, 133.7751),
        "MX": (23.6345, -102.5528),
    }

    def __init__(self, home_country: str = "US") -> None:
        self.home_country = home_country.upper()

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        country = str(transaction.get("country") or self.home_country).strip().upper()
        curr_dt = parse_iso_datetime(transaction.get("timestamp"))

        history = user_history or []
        country_history = [
            t for t in history if str(t.get("country") or "").strip().upper() == country
        ]

        country_frequency = float(len(country_history))
        new_country = 1.0 if country_frequency == 0 else 0.0
        cross_border = 1.0 if country != self.home_country else 0.0

        if history:
            prev_tx = history[-1]
            prev_country = str(prev_tx.get("country") or self.home_country).strip().upper()
            country_changed = 1.0 if country != prev_country else 0.0
            distance_from_prev = self._estimate_country_distance(country, prev_country)

            timestamps = [parse_iso_datetime(t.get("timestamp")) for t in country_history]
            if timestamps:
                first_seen_days = max(0.0, (curr_dt - min(timestamps)).total_seconds() / 86400.0)
                last_seen_days = max(0.0, (curr_dt - max(timestamps)).total_seconds() / 86400.0)
            else:
                first_seen_days = 0.0
                last_seen_days = 0.0
        else:
            country_changed = 0.0
            distance_from_prev = 0.0
            first_seen_days = 0.0
            last_seen_days = 0.0

        # Base country risk
        risk_score = 10.0
        if country in self.HIGH_RISK_COUNTRIES:
            risk_score += 50.0
        if cross_border > 0:
            risk_score += 15.0
        if new_country > 0:
            risk_score += 20.0

        return {
            "country_frequency": country_frequency,
            "country_risk_score": min(100.0, risk_score),
            "country_first_seen_days": first_seen_days,
            "country_last_seen_days": last_seen_days,
            "country_changed_flag": country_changed,
            "new_country_flag": new_country,
            "cross_border_flag": cross_border,
            "distance_from_previous_country": distance_from_prev,
        }

    def _estimate_country_distance(self, c1: str, c2: str) -> float:
        if c1 == c2:
            return 0.0
        p1 = self.CENTROIDS.get(c1, (30.0, 0.0))
        p2 = self.CENTROIDS.get(c2, (30.0, 0.0))
        
        # Approximate distance using Haversine formula
        import math
        lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
        lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return 6371.0 * c  # Earth radius in km
