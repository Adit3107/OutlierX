from typing import Dict, Any, List
from app.registry.schemas import ModelVersionSchema, ModelComparisonMetricDiff, ModelComparisonResponse

def compare_model_versions(version_a: ModelVersionSchema, version_b: ModelVersionSchema) -> ModelComparisonResponse:
    metrics_a = version_a.metrics
    metrics_b = version_b.metrics

    diffs: List[ModelComparisonMetricDiff] = []

    # Precision
    val_a = metrics_a.precision if metrics_a else 0.0
    val_b = metrics_b.precision if metrics_b else 0.0
    winner = "A" if val_a > val_b else ("B" if val_b > val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="precision",
        label="Precision",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 4),
        winner=winner
    ))

    # Recall
    val_a = metrics_a.recall if metrics_a else 0.0
    val_b = metrics_b.recall if metrics_b else 0.0
    winner = "A" if val_a > val_b else ("B" if val_b > val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="recall",
        label="Recall",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 4),
        winner=winner
    ))

    # F1 Score
    val_a = metrics_a.f1Score if metrics_a else 0.0
    val_b = metrics_b.f1Score if metrics_b else 0.0
    winner = "A" if val_a > val_b else ("B" if val_b > val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="f1Score",
        label="F1 Score",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 4),
        winner=winner
    ))

    # ROC AUC
    val_a = metrics_a.rocAuc if metrics_a else 0.0
    val_b = metrics_b.rocAuc if metrics_b else 0.0
    winner = "A" if val_a > val_b else ("B" if val_b > val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="rocAuc",
        label="ROC AUC",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 4),
        winner=winner
    ))

    # Latency (Lower is better)
    val_a = metrics_a.latencyMs if metrics_a else 0.0
    val_b = metrics_b.latencyMs if metrics_b else 0.0
    winner = "A" if val_a < val_b else ("B" if val_b < val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="latencyMs",
        label="Inference Latency (ms)",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 2),
        winner=winner
    ))

    # Memory Usage (Lower is better)
    val_a = metrics_a.memoryMb if metrics_a else 0.0
    val_b = metrics_b.memoryMb if metrics_b else 0.0
    winner = "A" if val_a < val_b else ("B" if val_b < val_a else "EQUAL")
    diffs.append(ModelComparisonMetricDiff(
        metric="memoryMb",
        label="Memory Usage (MB)",
        valueA=val_a,
        valueB=val_b,
        diff=round(val_a - val_b, 2),
        winner=winner
    ))

    score_a = sum(1 for d in diffs if d.winner == "A")
    score_b = sum(1 for d in diffs if d.winner == "B")
    overall_winner = version_a.version if score_a >= score_b else version_b.version

    summary = f"Version {version_a.version} scored higher in {score_a} metric(s), while Version {version_b.version} scored higher in {score_b} metric(s)."

    return ModelComparisonResponse(
        versionA=version_a,
        versionB=version_b,
        diffs=diffs,
        summary=summary,
        winnerVersion=overall_winner
    )
