import pytest
from app.feature_engineering.amount import AmountFeatureExtractor
from app.feature_engineering.time import TimeFeatureExtractor
from app.feature_engineering.merchant import MerchantFeatureExtractor
from app.feature_engineering.country import CountryFeatureExtractor
from app.feature_engineering.device import DeviceFeatureExtractor
from app.feature_engineering.geo import GeographicalFeatureExtractor
from app.feature_engineering.pipeline import FeatureEngineeringPipeline
from app.feature_engineering.validators import FeatureVectorValidator


def test_amount_extractor():
    extractor = AmountFeatureExtractor()
    tx = {"amount": 1500.0, "paymentMethod": "Credit Card"}
    res = extractor.extract(tx)
    assert res["transaction_amount"] == 1500.0
    assert res["amount_bucket"] == 3.0  # High
    assert res["high_value_flag"] == 0.0

    tx_high = {"amount": 12000.0, "paymentMethod": "Cash Withdrawal"}
    res_high = extractor.extract(tx_high)
    assert res_high["high_value_flag"] == 1.0
    assert res_high["large_cash_flag"] == 1.0


def test_time_extractor():
    extractor = TimeFeatureExtractor()
    tx = {"timestamp": "2026-08-02T14:30:00Z"}
    res = extractor.extract(tx)
    assert res["transaction_hour"] == 14.0
    assert res["weekend_flag"] == 1.0  # Aug 2, 2026 was Sunday
    assert res["night_flag"] == 0.0


def test_country_extractor():
    extractor = CountryFeatureExtractor(home_country="US")
    tx = {"country": "NG"}
    res = extractor.extract(tx)
    assert res["cross_border_flag"] == 1.0
    assert res["country_risk_score"] > 50.0


def test_geo_extractor():
    extractor = GeographicalFeatureExtractor()
    history = [{"latitude": 40.7128, "longitude": -74.0060, "timestamp": "2026-08-02T12:00:00Z"}]
    tx = {"latitude": 51.5074, "longitude": -0.1278, "timestamp": "2026-08-02T12:30:00Z"}  # London 30 mins later
    res = extractor.extract(tx, user_history=history)
    assert res["impossible_travel_flag"] == 1.0  # > 5000 km in 30 mins


def test_validator():
    validator = FeatureVectorValidator()
    valid_vec = {
        "transaction_amount": 100.0,
        "transaction_hour": 12.0,
        "time_since_previous_tx": 300.0,
        "merchant_frequency": 5.0,
        "country_frequency": 10.0,
        "rule_score": 0.0,
    }
    is_valid, errors = validator.validate(valid_vec)
    assert is_valid is True
    assert len(errors) == 0


def test_pipeline_extraction():
    pipeline = FeatureEngineeringPipeline()
    tx = {
        "id": "tx_test_1",
        "organizationId": "org_test",
        "amount": 250.0,
        "currency": "USD",
        "timestamp": "2026-08-02T10:00:00Z",
        "merchant": "Acme Store",
        "country": "US",
    }
    result = pipeline.extract_single(tx)
    assert result["transaction_id"] == "tx_test_1"
    assert result["status"] == "VALIDATED"
    assert result["feature_count"] > 50
    assert "log_amount" in result["vector"]
