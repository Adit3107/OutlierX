import os

class MonitoringConfig:
    ENABLED: bool = os.getenv("ML_MONITORING_ENABLED", "true").lower() == "true"
    INTERVAL_MINUTES: int = int(os.getenv("ML_MONITORING_INTERVAL_MINUTES", "60"))
    
    # Statistical Drift Thresholds (Configurable starting defaults)
    PSI_LOW_THRESHOLD: float = float(os.getenv("PSI_LOW_THRESHOLD", "0.10"))
    PSI_MEDIUM_THRESHOLD: float = float(os.getenv("PSI_MEDIUM_THRESHOLD", "0.20"))
    PSI_HIGH_THRESHOLD: float = float(os.getenv("PSI_HIGH_THRESHOLD", "0.30"))
    
    KS_P_VALUE_THRESHOLD: float = float(os.getenv("KS_P_VALUE_THRESHOLD", "0.05"))
    PREDICTION_DRIFT_THRESHOLD: float = float(os.getenv("PREDICTION_DRIFT_THRESHOLD", "0.20"))
    CONFIDENCE_DROP_THRESHOLD: float = float(os.getenv("CONFIDENCE_DROP_THRESHOLD", "0.15"))
    
    # Performance & Quality Thresholds
    MODEL_ERROR_RATE_THRESHOLD: float = float(os.getenv("MODEL_ERROR_RATE_THRESHOLD", "0.05"))
    MODEL_P95_LATENCY_MS: float = float(os.getenv("MODEL_P95_LATENCY_MS", "5000"))
    DATA_QUALITY_THRESHOLD: float = float(os.getenv("DATA_QUALITY_THRESHOLD", "0.95"))
    
    # Model Health Score Thresholds (0-100)
    HEALTH_WARNING_THRESHOLD: float = float(os.getenv("ML_HEALTH_WARNING_THRESHOLD", "70"))
    HEALTH_DEGRADED_THRESHOLD: float = float(os.getenv("ML_HEALTH_DEGRADED_THRESHOLD", "50"))
    HEALTH_CRITICAL_THRESHOLD: float = float(os.getenv("ML_HEALTH_CRITICAL_THRESHOLD", "30"))
    
    # Health Calculation Weights (Must sum to 1.0)
    WEIGHT_FEATURE_DRIFT: float = 0.25
    WEIGHT_PREDICTION_DRIFT: float = 0.25
    WEIGHT_DATA_QUALITY: float = 0.20
    WEIGHT_LATENCY: float = 0.15
    WEIGHT_CONFIDENCE: float = 0.15

monitoring_settings = MonitoringConfig()
