import math
from typing import Any, Dict, List, Optional, Tuple
from app.feature_engineering.time import parse_iso_datetime


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in km between two lat/lon coordinates."""
    r = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class GeographicalFeatureExtractor:
    """
    Extracts spatial, Haversine distance, travel velocity, and impossible travel metrics.
    Features extracted:
    - latitude: Geographical latitude (-90.0 to 90.0)
    - longitude: Geographical longitude (-180.0 to 180.0)
    - distance_between_transactions_km: Distance in km from previous transaction
    - travel_speed_kmh: Estimated travel speed in km/h between transactions
    - impossible_travel_flag: 1 if travel speed exceeds commercial flight physics (> 900 km/h)
    - geo_cluster_id: Discrete spatial cluster index (0 to 9)
    - known_location_flag: 1 if transaction location is within 50 km of user's past locations
    """

    # Default fallback coordinates for countries if exact lat/lon is missing
    DEFAULT_COORDS = {
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

    def __init__(self, impossible_speed_threshold_kmh: float = 900.0) -> None:
        self.impossible_speed_threshold = impossible_speed_threshold_kmh

    def extract(self, transaction: Dict[str, Any], user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, float]:
        lat, lon = self._resolve_coords(transaction)
        curr_dt = parse_iso_datetime(transaction.get("timestamp"))

        history = user_history or []
        
        distance_km = 0.0
        speed_kmh = 0.0
        impossible_travel = 0.0
        known_location = 0.0

        if history:
            # Check previous transaction location & time
            prev_tx = history[-1]
            prev_lat, prev_lon = self._resolve_coords(prev_tx)
            prev_dt = parse_iso_datetime(prev_tx.get("timestamp"))

            distance_km = haversine_km(prev_lat, prev_lon, lat, lon)
            time_hours = max((curr_dt - prev_dt).total_seconds() / 3600.0, 0.0001)
            speed_kmh = distance_km / time_hours

            if speed_kmh > self.impossible_speed_threshold and distance_km > 100.0:
                impossible_travel = 1.0

            # Check if current location is near any historical location (< 50 km)
            for t in history:
                h_lat, h_lon = self._resolve_coords(t)
                if haversine_km(h_lat, h_lon, lat, lon) <= 50.0:
                    known_location = 1.0
                    break
        else:
            known_location = 1.0  # First transaction is baseline location

        cluster_id = float(self._compute_cluster(lat, lon))

        return {
            "latitude": lat,
            "longitude": lon,
            "distance_between_transactions_km": distance_km,
            "travel_speed_kmh": speed_kmh,
            "impossible_travel_flag": impossible_travel,
            "geo_cluster_id": cluster_id,
            "known_location_flag": known_location,
        }

    def _resolve_coords(self, transaction: Dict[str, Any]) -> Tuple[float, float]:
        meta = transaction.get("metadata") or {}
        lat = transaction.get("latitude") or transaction.get("lat") or meta.get("latitude") or meta.get("lat")
        lon = transaction.get("longitude") or transaction.get("lng") or meta.get("longitude") or meta.get("lng")

        if lat is not None and lon is not None:
            try:
                return float(lat), float(lon)
            except Exception:
                pass

        country = str(transaction.get("country") or "US").strip().upper()
        return self.DEFAULT_COORDS.get(country, (37.0902, -95.7129))

    @staticmethod
    def _compute_cluster(lat: float, lon: float) -> int:
        # Simple spatial grid hashing to 10 clusters (0-9)
        cluster = int((abs(lat) * 3 + abs(lon) * 5) % 10)
        return max(0, min(9, cluster))
