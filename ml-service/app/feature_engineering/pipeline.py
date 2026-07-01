from datetime import datetime, timezone

import numpy as np

from app.preprocessing import CategoricalEncoder, NumericScaler, safe_datetime
from app.schemas import TransactionInput

FEATURE_VERSION = "features-v1"


class FeaturePipeline:
    def __init__(self) -> None:
        self.encoder = CategoricalEncoder()
        self.scaler = NumericScaler()
        self.feature_names = [
            "amount_scaled",
            "hour_sin",
            "hour_cos",
            "day_of_week",
            "merchant_frequency",
            "country_frequency",
            "payment_method_encoded",
            "currency_encoded",
            "transaction_age_days",
            "category_encoded",
            "missing_ratio",
        ]
        self.merchant_frequencies: dict[str, int] = {}
        self.country_frequencies: dict[str, int] = {}

    def fit(self, transactions: list[TransactionInput]) -> "FeaturePipeline":
        self.merchant_frequencies = self._frequencies([item.merchant for item in transactions])
        self.country_frequencies = self._frequencies([item.country for item in transactions])
        return self

    def transform(self, transactions: list[TransactionInput]) -> np.ndarray:
        return np.array([self._features(item) for item in transactions], dtype=float)

    def fit_transform(self, transactions: list[TransactionInput]) -> np.ndarray:
        self.fit(transactions)
        return self.transform(transactions)

    def _features(self, transaction: TransactionInput) -> list[float]:
        timestamp = safe_datetime(transaction.timestamp)
        age_days = max((datetime.now(timezone.utc) - timestamp).total_seconds() / 86400, 0)
        optional_values = [
            transaction.merchantCategory,
            transaction.accountNumber,
            transaction.country,
            transaction.city,
            transaction.paymentMethod,
            transaction.description,
            transaction.referenceNumber,
            transaction.customerId,
        ]
        missing_ratio = sum(1 for value in optional_values if not value) / len(optional_values)

        return [
            self.scaler.amount(transaction.amount),
            np.sin(2 * np.pi * timestamp.hour / 24),
            np.cos(2 * np.pi * timestamp.hour / 24),
            timestamp.weekday() / 6,
            self.scaler.frequency(transaction.merchant, self.merchant_frequencies),
            self.scaler.frequency(transaction.country, self.country_frequencies),
            self.encoder.encode(transaction.paymentMethod),
            self.encoder.encode(transaction.currency),
            min(age_days / 365, 10),
            self.encoder.encode(transaction.merchantCategory),
            missing_ratio,
        ]

    @staticmethod
    def _frequencies(values: list[str | None]) -> dict[str, int]:
        frequencies: dict[str, int] = {}
        for value in values:
            if not value:
                continue
            key = value.strip().lower()
            frequencies[key] = frequencies.get(key, 0) + 1
        return frequencies
