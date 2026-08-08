import datetime
from typing import Dict, Any, List, Optional
from app.registry.config import registry_config
from app.registry.schemas import MLModelSchema, ModelVersionSchema, ModelMetricsSchema, ConfusionMatrixSchema

class ModelRegistryService:
    def __init__(self):
        self.models: Dict[str, MLModelSchema] = {}
        self._initialize_default_registry()

    def _initialize_default_registry(self):
        # Seed default Isolation Forest Model & Versions
        v1_0_0 = ModelVersionSchema(
            id="ver-if-v1-0-0",
            modelId="mod-isolation-forest",
            version="v1.0.0",
            status="INACTIVE",
            description="Initial baseline Isolation Forest model trained on standard synthetic dataset",
            checksum="a8f5f167f44f4964e6c998dee827110c",
            supportedFeatures=["amount", "merchant", "country", "currency", "hour"],
            expectedFeatureCount=5,
            hyperparameters={"n_estimators": 100, "contamination": 0.05, "random_state": 42},
            trainingConfig={"sample_size": 1000, "train_test_split": 0.8},
            artifactPath="models/isolation_forest_v1_0_0.joblib",
            createdDate="2026-06-01T10:00:00Z",
            deploymentDate="2026-06-01T10:30:00Z",
            previousVersion=None,
            nextVersion="v1.1.0",
            reasonForUpdate="Initial baseline release",
            activeFlag=False,
            productionFlag=False,
            experimentalFlag=False,
            archivedFlag=False,
            metrics=ModelMetricsSchema(
                accuracy=0.965,
                precision=0.912,
                recall=0.895,
                f1Score=0.903,
                rocAuc=0.942,
                prAuc=0.918,
                confusionMatrix=ConfusionMatrixSchema(truePositives=89, falsePositives=8, trueNegatives=876, falseNegatives=11),
                falsePositiveRate=0.009,
                falseNegativeRate=0.110,
                avgConfidence=0.910,
                inferenceTimeMs=12.4,
                latencyMs=12.4,
                memoryMb=38.2,
                datasetUsed="v1_baseline_dataset.csv"
            )
        )

        v1_1_0 = ModelVersionSchema(
            id="ver-if-v1-1-0",
            modelId="mod-isolation-forest",
            version="v1.1.0",
            status="INACTIVE",
            description="Enhanced Isolation Forest model with categorical frequency & velocity feature vectors",
            checksum="b9e6f278f55f5075f7da099efe93221d",
            supportedFeatures=["amount", "merchant", "country", "currency", "hour", "merchantCategory", "velocity_1h"],
            expectedFeatureCount=7,
            hyperparameters={"n_estimators": 150, "contamination": 0.04, "random_state": 42},
            trainingConfig={"sample_size": 5000, "train_test_split": 0.8},
            artifactPath="models/isolation_forest_v1_1_0.joblib",
            createdDate="2026-07-01T14:00:00Z",
            deploymentDate="2026-07-01T14:30:00Z",
            previousVersion="v1.0.0",
            nextVersion="v1.2.0",
            reasonForUpdate="Added velocity and merchant category frequency features",
            activeFlag=False,
            productionFlag=False,
            experimentalFlag=False,
            archivedFlag=False,
            metrics=ModelMetricsSchema(
                accuracy=0.978,
                precision=0.945,
                recall=0.921,
                f1Score=0.933,
                rocAuc=0.968,
                prAuc=0.942,
                confusionMatrix=ConfusionMatrixSchema(truePositives=92, falsePositives=5, trueNegatives=886, falseNegatives=8),
                falsePositiveRate=0.005,
                falseNegativeRate=0.080,
                avgConfidence=0.938,
                inferenceTimeMs=9.6,
                latencyMs=9.6,
                memoryMb=40.5,
                datasetUsed="v2_velocity_dataset.csv"
            )
        )

        v1_2_0 = ModelVersionSchema(
            id="ver-if-v1-2-0",
            modelId="mod-isolation-forest",
            version="v1.2.0",
            status="ACTIVE",
            description="Production-grade Isolation Forest with full 10-feature normalized vector pipeline",
            checksum="c0f7a389g66g6186g8eb100fgf04332e",
            supportedFeatures=["amount", "merchant", "country", "currency", "hour", "merchantCategory", "velocity_1h", "paymentMethod", "time_since_last", "missing_ratio"],
            expectedFeatureCount=10,
            hyperparameters={"n_estimators": 200, "contamination": 0.03, "random_state": 42, "max_samples": "auto"},
            trainingConfig={"sample_size": 25000, "train_test_split": 0.8},
            artifactPath="models/isolation_forest.joblib",
            createdDate="2026-07-15T09:00:00Z",
            deploymentDate="2026-07-15T09:30:00Z",
            previousVersion="v1.1.0",
            nextVersion=None,
            reasonForUpdate="Production release with 10-feature vector scaler and lower false positive rate",
            activeFlag=True,
            productionFlag=True,
            experimentalFlag=False,
            archivedFlag=False,
            metrics=ModelMetricsSchema(
                accuracy=0.989,
                precision=0.972,
                recall=0.958,
                f1Score=0.965,
                rocAuc=0.988,
                prAuc=0.975,
                confusionMatrix=ConfusionMatrixSchema(truePositives=96, falsePositives=3, trueNegatives=894, falseNegatives=4),
                falsePositiveRate=0.003,
                falseNegativeRate=0.040,
                avgConfidence=0.962,
                inferenceTimeMs=6.8,
                latencyMs=6.8,
                memoryMb=42.1,
                datasetUsed="sample_transactions.csv"
            )
        )

        model = MLModelSchema(
            id="mod-isolation-forest",
            name="isolation_forest",
            algorithm="IsolationForest",
            description="Tree-based unsupervised financial transaction anomaly detection model",
            status="ACTIVE",
            activeVersion="v1.2.0",
            versions=[v1_0_0, v1_1_0, v1_2_0]
        )

        self.models[model.name] = model

    def get_registered_models(self) -> List[MLModelSchema]:
        return list(self.models.values())

    def get_model(self, model_name: str) -> Optional[MLModelSchema]:
        return self.models.get(model_name)

    def get_version(self, model_name: str, version_str: str) -> Optional[ModelVersionSchema]:
        model = self.get_model(model_name)
        if not model:
            return None
        for v in model.versions:
            if v.version == version_str or v.id == version_str:
                return v
        return None

    def activate_version(self, model_name: str, version_str: str, reason: Optional[str] = None) -> Optional[ModelVersionSchema]:
        model = self.get_model(model_name)
        if not model:
            return None

        target_version = None
        for v in model.versions:
            if v.version == version_str or v.id == version_str:
                target_version = v
                v.activeFlag = True
                v.productionFlag = True
                v.status = "ACTIVE"
                v.deploymentDate = datetime.datetime.now(datetime.timezone.utc).isoformat()
                if reason:
                    v.reasonForUpdate = reason
            else:
                v.activeFlag = False
                v.productionFlag = False
                v.status = "INACTIVE" if v.status != "ARCHIVED" else "ARCHIVED"

        if target_version:
            model.activeVersion = target_version.version

        return target_version

    def rollback_version(self, model_name: str, target_version_str: Optional[str] = None, reason: Optional[str] = None) -> Optional[ModelVersionSchema]:
        model = self.get_model(model_name)
        if not model:
            return None

        current_version = self.get_version(model_name, model.activeVersion)
        previous_version_str = target_version_str or (current_version.previousVersion if current_version else None)

        if not previous_version_str:
            # Pick first available previous version
            for v in reversed(model.versions):
                if v.version != model.activeVersion:
                    previous_version_str = v.version
                    break

        if not previous_version_str:
            return None

        return self.activate_version(model_name, previous_version_str, reason=reason or f"Rollback from {model.activeVersion}")

    def archive_version(self, model_name: str, version_str: str, reason: Optional[str] = None) -> Optional[ModelVersionSchema]:
        version = self.get_version(model_name, version_str)
        if not version or version.activeFlag:
            return None
        version.status = "ARCHIVED"
        version.archivedFlag = True
        return version

model_registry_service = ModelRegistryService()
