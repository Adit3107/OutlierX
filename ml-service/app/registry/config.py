import os

class RegistrySettings:
    ENABLED: bool = os.getenv("MODEL_REGISTRY_ENABLED", "true").lower() == "true"
    REGISTRY_PATH: str = os.getenv("MODEL_REGISTRY_PATH", "./registry")
    ACTIVE_MODEL: str = os.getenv("ACTIVE_MODEL", "isolation_forest")
    ACTIVE_MODEL_VERSION: str = os.getenv("ACTIVE_MODEL_VERSION", "v1.2.0")
    ENABLE_COMPARISON: bool = os.getenv("ENABLE_MODEL_COMPARISON", "true").lower() == "true"
    ENABLE_ROLLBACK: bool = os.getenv("ENABLE_MODEL_ROLLBACK", "true").lower() == "true"
    ENABLE_ARCHIVING: bool = os.getenv("ENABLE_MODEL_ARCHIVING", "true").lower() == "true"
    ENABLE_EVALUATION_HISTORY: bool = os.getenv("ENABLE_EVALUATION_HISTORY", "true").lower() == "true"
    ENABLE_DEPLOYMENT_HISTORY: bool = os.getenv("ENABLE_DEPLOYMENT_HISTORY", "true").lower() == "true"
    METADATA_CACHE: bool = os.getenv("MODEL_METADATA_CACHE", "true").lower() == "true"
    CACHE_TTL: int = int(os.getenv("MODEL_CACHE_TTL", "3600"))
    MAX_VERSIONS: int = int(os.getenv("MAX_MODEL_VERSIONS", "100"))
    ENABLE_METRICS: bool = os.getenv("ENABLE_MODEL_METRICS", "true").lower() == "true"
    EVALUATION_RETENTION_DAYS: int = int(os.getenv("EVALUATION_RETENTION_DAYS", "365"))
    METRICS_REFRESH_INTERVAL: int = int(os.getenv("METRICS_REFRESH_INTERVAL", "3600"))
    ENABLE_CONFUSION_MATRIX: bool = os.getenv("ENABLE_CONFUSION_MATRIX", "true").lower() == "true"
    LOG_LEVEL: str = os.getenv("MODEL_LOG_LEVEL", "info")

registry_config = RegistrySettings()
