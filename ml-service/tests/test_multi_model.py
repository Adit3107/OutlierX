import pytest
import numpy as np
from app.models.isolation_forest import IsolationForestModel
from app.models.local_outlier_factor import LocalOutlierFactorModel
from app.models.one_class_svm import OneClassSVMModel
from app.models.model_manager import ModelManager


def test_isolation_forest_model():
    model = IsolationForestModel()
    assert model.name == "isolation_forest"
    assert model.is_loaded is True

    fv = {"transaction_amount": 500.0, "time_since_previous_tx": 120.0, "risk_score": 10.0}
    res = model.predict_single(fv)
    assert res.model_name == "isolation_forest"
    assert 0.0 <= res.normalized_score <= 100.0
    assert res.prediction in ("ANOMALY", "NORMAL")


def test_local_outlier_factor_model():
    model = LocalOutlierFactorModel()
    assert model.name == "local_outlier_factor"
    assert model.is_loaded is True

    fv = {"transaction_amount": 15000.0, "time_since_previous_tx": 2.0, "risk_score": 85.0}
    res = model.predict_single(fv)
    assert res.model_name == "local_outlier_factor"
    assert 0.0 <= res.normalized_score <= 100.0


def test_one_class_svm_model():
    model = OneClassSVMModel()
    assert model.name == "one_class_svm"
    assert model.is_loaded is True

    fv = {"transaction_amount": 10.0, "time_since_previous_tx": 3600.0, "risk_score": 0.0}
    res = model.predict_single(fv)
    assert res.model_name == "one_class_svm"
    assert 0.0 <= res.normalized_score <= 100.0


def test_model_manager_routing():
    manager = ModelManager()
    info_list = manager.list_models()
    assert len(info_list) >= 3

    fv = {"transaction_amount": 250.0, "risk_score": 5.0}
    # Predict using LOF specifically
    res_lof = manager.predict_single(fv, model_name="local_outlier_factor")
    assert res_lof.model_name == "local_outlier_factor"

    # Predict using SVM specifically
    res_svm = manager.predict_single(fv, model_name="one_class_svm")
    assert res_svm.model_name == "one_class_svm"


def test_model_manager_fallback():
    manager = ModelManager()
    fv = {"transaction_amount": 250.0}
    # Request non-existent model name -> should fallback seamlessly
    res = manager.predict_single(fv, model_name="non_existent_algorithm")
    assert res.model_name in ("isolation_forest", "local_outlier_factor", "one_class_svm")
    assert len(res.warnings) > 0
