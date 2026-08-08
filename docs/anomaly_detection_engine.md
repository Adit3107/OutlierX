# OutlierX Multi-Model Anomaly Detection Engine Documentation

This document explains the production Multi-Model Anomaly Detection Engine designed for OutlierX. All anomaly detection algorithms implement a unified abstract model interface (`BaseModel`) and report standardized prediction outputs (`ModelPrediction`).

---

## Architecture Overview

```
Transaction & Feature Vector Input
               ↓
    Centralized ModelManager
               ↓
 ┌───────────────────────────────────────────────────────────┐
 │                  Pluggable Model Suite                    │
 ├─────────────────────────┬─────────────────────────────────┤
 │  1. Isolation Forest    │ Tree-based global isolation     │
 │  2. Local Outlier Factor│ Density-based local variation   │
 │  3. One-Class SVM       │ Hyper-boundary separation       │
 └─────────────────────────┴─────────────────────────────────┘
               ↓
       Normalized Risk Score (0.0 – 100.0) & Confidence %
               ↓
      Persist MlPrediction to Postgres & Model Registry
               ↓
               Decision Engine
```

---

## 1. Algorithm Comparison Matrix

| Algorithm | Model Class | Best For | Advantages | Limitations | Expected Latency |
|---|---|---|---|---|---|
| **Isolation Forest** | Tree Ensemble | Global high-dimensional feature anomalies | High scalability ($O(n \log n)$), linear memory efficiency | Does not capture localized density variations well | $< 5$ ms |
| **Local Outlier Factor (LOF)** | K-Nearest Neighbors | Sub-cluster anomalies & variable density clusters | Detects local outliers surrounded by normal samples | Higher distance computation overhead ($O(k \cdot n)$) | $< 15$ ms |
| **One-Class SVM** | Kernel Hyperplane | Non-linear complex decision boundaries | Robust in high-dimensional feature spaces | Sensitive to hyperparameters ($\nu, \gamma$) | $< 10$ ms |

---

## 2. Algorithm Details & Mathematical Intuition

### 1. Isolation Forest (`isolation_forest.py`)
- **Mathematical Intuition**: Anomalies are few and different, meaning they require fewer random hyper-plane splits to isolate in a binary tree. The average path length $h(x)$ across $N$ trees measures anomaly severity.
- **Normalization Formula**:
  $$S(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
  Sigmoid mapping translates raw decision scores to normalized $0.0 - 100.0$ risk scores.
- **When to Use**: Default primary model for high-throughput batch CSV processing.

### 2. Local Outlier Factor (`local_outlier_factor.py`)
- **Mathematical Intuition**: Measures local density $lrd(x)$ of point $x$ relative to its $k$-nearest neighbors $N_k(x)$:
  $$LOF_k(x) = \frac{\sum_{o \in N_k(x)} \frac{lrd(o)}{lrd(x)}}{|N_k(x)|}$$
  Points with $LOF \gg 1$ have significantly lower density than surrounding neighbors.
- **When to Use**: Detecting subtle localized fraud rings or account takeover attempts in dense user behavior clusters.

### 3. One-Class SVM (`one_class_svm.py`)
- **Mathematical Intuition**: Maps feature vectors into high-dimensional Hilbert space via RBF kernel $\Phi(x) = \exp(-\gamma \|x - x'\|^2)$ and finds the optimal decision hyperplane separating normal samples from origin with margin $\nu$.
- **When to Use**: High-risk financial transactions requiring tight non-linear boundary constraints.

---

## 3. Configuration & Environment Variables

Set in `.env`:

```env
# ML Service Multi-Model Engine
DEFAULT_MODEL=isolation_forest
ENABLE_ISOLATION_FOREST=true
ENABLE_LOF=true
ENABLE_ONE_CLASS_SVM=true
MODEL_CACHE_ENABLED=true
MAX_BATCH_SIZE=1000
MODEL_TIMEOUT_MS=10000
PREDICTION_LOG_LEVEL=info
MODEL_REGISTRY_ENABLED=true
```
