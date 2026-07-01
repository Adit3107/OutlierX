from datetime import datetime, timezone
from math import log1p


def safe_datetime(value: datetime | str | None) -> datetime:
    if isinstance(value, datetime):
        parsed = value
    elif value:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    else:
        parsed = datetime.now(timezone.utc)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


class CategoricalEncoder:
    def encode(self, value: str | None) -> float:
        if not value:
            return 0.0
        normalized = value.strip().lower()
        if not normalized:
            return 0.0
        return (sum(ord(char) for char in normalized) % 1000) / 1000


class NumericScaler:
    def amount(self, value: float | int | None) -> float:
        numeric = max(float(value or 0), 0.0)
        return log1p(numeric) / 12

    def frequency(self, value: str | None, frequencies: dict[str, int]) -> float:
        if not value:
            return 0.0
        count = frequencies.get(value.strip().lower(), 1)
        return min(log1p(count) / 6, 1.0)
