import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.feature_engineering.amount import AmountFeatureExtractor
from app.feature_engineering.country import CountryFeatureExtractor
from app.feature_engineering.device import DeviceFeatureExtractor
from app.feature_engineering.encoder import CategoricalEncoder
from app.feature_engineering.geo import GeographicalFeatureExtractor
from app.feature_engineering.merchant import MerchantFeatureExtractor
from app.feature_engineering.risk import RiskFeatureExtractor
from app.feature_engineering.scaler import NumericalScaler
from app.feature_engineering.statistics import StatisticsFeatureExtractor
from app.feature_engineering.time import TimeFeatureExtractor
from app.feature_engineering.user_behavior import UserBehaviorFeatureExtractor
from app.feature_engineering.validators import FeatureVectorValidator
from app.feature_engineering.velocity import VelocityFeatureExtractor

PIPELINE_VERSION = "v1.0.0"
FEATURE_VERSION = "features-v2.1"
EXTRACTOR_VERSION = "extractors-v1"


class FeatureEngineeringPipeline:
    """
    Comprehensive Feature Engineering Pipeline for OutlierX ML service.
    Orchestrates 10 specialized feature extractors, numerical scaling, categorical encoding,
    and sanity validation. Supports single transaction, batch, and streaming inference.
    """

    def __init__(
        self,
        scaler_mode: str = "standard",
        encoder_mode: str = "frequency",
        enable_validation: bool = True,
    ) -> None:
        self.amount_extractor = AmountFeatureExtractor()
        self.time_extractor = TimeFeatureExtractor()
        self.merchant_extractor = MerchantFeatureExtractor()
        self.country_extractor = CountryFeatureExtractor()
        self.device_extractor = DeviceFeatureExtractor()
        self.user_behavior_extractor = UserBehaviorFeatureExtractor()
        self.velocity_extractor = VelocityFeatureExtractor()
        self.geo_extractor = GeographicalFeatureExtractor()
        self.statistics_extractor = StatisticsFeatureExtractor()
        self.risk_extractor = RiskFeatureExtractor()

        self.scaler = NumericalScaler(mode=scaler_mode)
        self.encoder = CategoricalEncoder(mode=encoder_mode)
        self.validator = FeatureVectorValidator()
        self.enable_validation = enable_validation

        # Performance tracking metrics
        self.total_extractions = 0
        self.failed_extractions = 0
        self.total_processing_time_ms = 0.0

    def extract_single(
        self,
        transaction: Dict[str, Any],
        user_history: Optional[List[Dict[str, Any]]] = None,
        global_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts a feature vector for a single transaction with metadata.
        Returns:
        {
            "transaction_id": str,
            "organization_id": str,
            "vector": Dict[str, float],
            "ordered_vector": List[float],
            "feature_names": List[str],
            "metadata": Dict[str, Any],
            "status": "VALIDATED" | "FAILED",
            "errors": List[str]
        }
        """
        start_time = time.perf_counter()
        
        # Run 10 feature extractors safely
        extracted_dict: Dict[str, float] = {}

        try:
            extracted_dict.update(self.amount_extractor.extract(transaction, user_history))
            extracted_dict.update(self.time_extractor.extract(transaction, user_history))
            extracted_dict.update(self.merchant_extractor.extract(transaction, global_history or user_history))
            extracted_dict.update(self.country_extractor.extract(transaction, user_history))
            extracted_dict.update(self.device_extractor.extract(transaction, user_history))
            extracted_dict.update(self.user_behavior_extractor.extract(transaction, user_history))
            extracted_dict.update(self.velocity_extractor.extract(transaction, user_history))
            extracted_dict.update(self.geo_extractor.extract(transaction, user_history))
            extracted_dict.update(self.statistics_extractor.extract(transaction, user_history))
            extracted_dict.update(self.risk_extractor.extract(transaction, user_history))
        except Exception as e:
            self.failed_extractions += 1
            raise RuntimeError(f"Feature extraction failed: {str(e)}") from e

        # Categorical encoding for raw category/payment method
        payment_encoded = self.encoder.encode(transaction.get("paymentMethod") or transaction.get("payment_method"))
        currency_encoded = self.encoder.encode(transaction.get("currency"))
        extracted_dict["payment_method_encoded"] = payment_encoded
        extracted_dict["currency_encoded"] = currency_encoded

        # Numerical scaling
        scaled_dict = self.scaler.scale_dict(extracted_dict)

        # Sanity validation
        is_valid = True
        validation_errors: List[str] = []
        if self.enable_validation:
            is_valid, validation_errors = self.validator.validate(scaled_dict)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        self.total_extractions += 1
        if not is_valid:
            self.failed_extractions += 1
        self.total_processing_time_ms += elapsed_ms

        sorted_keys = sorted(scaled_dict.keys())
        ordered_vector = [scaled_dict[k] for k in sorted_keys]

        return {
            "transaction_id": str(transaction.get("id") or transaction.get("transactionId") or "tx_unknown"),
            "organization_id": str(transaction.get("organizationId") or "org_unknown"),
            "vector": scaled_dict,
            "ordered_vector": ordered_vector,
            "feature_names": sorted_keys,
            "feature_count": len(sorted_keys),
            "status": "VALIDATED" if is_valid else "FAILED",
            "errors": validation_errors,
            "processing_time_ms": round(elapsed_ms, 2),
            "metadata": {
                "pipeline_version": PIPELINE_VERSION,
                "feature_version": FEATURE_VERSION,
                "extractor_version": EXTRACTOR_VERSION,
                "generated_timestamp": datetime.now(timezone.utc).isoformat(),
                "scaler_mode": self.scaler.mode,
                "encoder_mode": self.encoder.mode,
            },
        }

    def extract_batch(
        self,
        transactions: List[Dict[str, Any]],
        user_history_map: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    ) -> List[Dict[str, Any]]:
        """Batch extraction for a list of transactions."""
        results: List[Dict[str, Any]] = []
        user_history_map = user_history_map or {}

        for tx in transactions:
            acc_id = str(tx.get("accountNumber") or tx.get("customerId") or tx.get("organizationId") or "")
            u_history = user_history_map.get(acc_id)
            extracted = self.extract_single(tx, user_history=u_history, global_history=transactions)
            results.append(extracted)

        return results

    def get_metrics(self) -> Dict[str, Any]:
        """Returns execution performance metrics of the feature pipeline."""
        avg_time = (
            (self.total_processing_time_ms / self.total_extractions)
            if self.total_extractions > 0
            else 0.0
        )
        return {
            "pipeline_version": PIPELINE_VERSION,
            "feature_version": FEATURE_VERSION,
            "total_extractions": self.total_extractions,
            "failed_extractions": self.failed_extractions,
            "avg_processing_time_ms": round(avg_time, 2),
            "scaler_mode": self.scaler.mode,
            "encoder_mode": self.encoder.mode,
        }
