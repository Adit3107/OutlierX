from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.registry.config import registry_config
from app.registry.registry import model_registry_service
from app.registry.comparison import compare_model_versions
from app.registry.schemas import (
    MLModelSchema,
    ModelVersionSchema,
    ModelComparisonResponse,
    ModelActionPayload
)

router = APIRouter(prefix="/registry", tags=["Model Registry"])

@router.get("/status")
async def get_registry_status():
    models = model_registry_service.get_registered_models()
    active_mod = model_registry_service.get_model(registry_config.ACTIVE_MODEL)
    return {
        "registryEnabled": registry_config.ENABLED,
        "totalModels": len(models),
        "activeModelsCount": sum(1 for m in models if m.status == "ACTIVE"),
        "totalVersions": sum(len(m.versions) for m in models),
        "activeModel": registry_config.ACTIVE_MODEL,
        "activeVersion": active_mod.activeVersion if active_mod else registry_config.ACTIVE_MODEL_VERSION,
        "activeAlgorithm": active_mod.algorithm if active_mod else "IsolationForest",
        "environment": "development"
    }

@router.get("/models", response_model=List[MLModelSchema])
async def list_registered_models():
    return model_registry_service.get_registered_models()

@router.get("/models/{model_name}", response_model=MLModelSchema)
async def get_registered_model(model_name: str):
    model = model_registry_service.get_model(model_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found in registry")
    return model

@router.get("/models/{model_name}/versions", response_model=List[ModelVersionSchema])
async def list_model_versions(model_name: str):
    model = model_registry_service.get_model(model_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found in registry")
    return model.versions

@router.get("/models/{model_name}/versions/{version_str}", response_model=ModelVersionSchema)
async def get_model_version(model_name: str, version_str: str):
    version = model_registry_service.get_version(model_name, version_str)
    if not version:
        raise HTTPException(status_code=404, detail=f"Version '{version_str}' not found for model '{model_name}'")
    return version

@router.post("/compare", response_model=ModelComparisonResponse)
async def compare_versions(
    version_a_id: str = Query(..., alias="versionA"),
    version_b_id: str = Query(..., alias="versionB"),
    model_name: str = Query("isolation_forest")
):
    version_a = model_registry_service.get_version(model_name, version_a_id)
    version_b = model_registry_service.get_version(model_name, version_b_id)
    if not version_a or not version_b:
        raise HTTPException(status_code=404, detail="One or both model versions were not found")
    return compare_model_versions(version_a, version_b)

@router.post("/models/{model_name}/activate/{version_str}", response_model=ModelVersionSchema)
async def activate_version(model_name: str, version_str: str, payload: Optional[ModelActionPayload] = None):
    reason = payload.reason if payload else "User activated version"
    activated = model_registry_service.activate_version(model_name, version_str, reason=reason)
    if not activated:
        raise HTTPException(status_code=404, detail=f"Could not activate version '{version_str}' for '{model_name}'")
    return activated

@router.post("/models/{model_name}/rollback", response_model=ModelVersionSchema)
async def rollback_version(model_name: str, payload: Optional[ModelActionPayload] = None):
    target_version = payload.targetVersion if payload else None
    reason = payload.reason if payload else "User triggered rollback"
    rolled_back = model_registry_service.rollback_version(model_name, target_version_str=target_version, reason=reason)
    if not rolled_back:
        raise HTTPException(status_code=400, detail=f"Rollback failed for model '{model_name}'")
    return rolled_back

@router.post("/models/{model_name}/archive/{version_str}", response_model=ModelVersionSchema)
async def archive_version(model_name: str, version_str: str, payload: Optional[ModelActionPayload] = None):
    reason = payload.reason if payload else "Archived version"
    archived = model_registry_service.archive_version(model_name, version_str, reason=reason)
    if not archived:
        raise HTTPException(status_code=400, detail=f"Cannot archive version '{version_str}' (active version cannot be archived)")
    return archived
