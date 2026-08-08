# OutlierX Ensemble Decision Engine & Risk Scoring Documentation

This document explains the production Ensemble Decision Engine designed for OutlierX. Individual models or rule checks never independently decide whether a transaction is fraudulent. Instead, every transaction undergoes multi-signal ensemble scoring before reaching a single, deterministic decision.

---

## Architecture Overview

```
Transaction Record
       ↓
Feature Engineering
       ↓
 ┌───────────────────────────────────────┐
 │      Multi-Signal Ensemble Data       │
 ├───────────────────┬───────────────────┤
 │ 1. Rule Engine    │ 60% Overall Weight│
 ├───────────────────┼───────────────────┤
 │ 2. ML Suite       │ 40% Overall Weight│
 │    • Isolation F. │  • 40% of ML      │
 │    • LOF Density  │  • 30% of ML      │
 │    • One-Class SVM│  • 30% of ML      │
 └───────────────────┴───────────────────┘
       ↓
 Historical Behavior Adjuster
       ↓
 Confidence Engine (0–100%)
       ↓
 Final Risk Score & Outcome Assignment
   ├── ALLOW_TRANSACTION
   ├── FLAG_FOR_REVIEW
   ├── MANUAL_INVESTIGATION
   └── REJECT_TRANSACTION
       ↓
 Structured Explanation & 8-Stage Execution Timeline
```

---

## 1. Ensemble Weight Distribution Formula

$$\text{FinalScore} = w_{\text{rule}} \times S_{\text{rule}} + w_{\text{ml}} \times \left( w_{\text{IF}} S_{\text{IF}} + w_{\text{LOF}} S_{\text{LOF}} + w_{\text{SVM}} S_{\text{SVM}} \right) + \Delta_{\text{hist}}$$

Where:
- $w_{\text{rule}} = 0.60$ (60% Rule Engine contribution)
- $w_{\text{ml}} = 0.40$ (40% ML Suite contribution)
- $w_{\text{IF}} = 0.40$, $w_{\text{LOF}} = 0.30$, $w_{\text{SVM}} = 0.30$
- $\Delta_{\text{hist}}$ = Historical behavior adjustment (+ penalty for past fraud/alerts, - discount for verified device/merchant).

---

## 2. Risk Categories & Thresholds

| Risk Category | Normalized Score Range | Decision Outcome | Action |
|---|---|---|---|
| **SAFE** | $0.0 – 15.0$ | `ALLOW_TRANSACTION` | Instant approval |
| **LOW** | $15.1 – 35.0$ | `ALLOW_TRANSACTION` | Approved with logging |
| **MEDIUM** | $35.1 – 60.0$ | `FLAG_FOR_REVIEW` | Flagged for automated background review |
| **HIGH** | $60.1 – 85.0$ | `MANUAL_INVESTIGATION` | Assigned to risk analyst queue |
| **CRITICAL** | $85.1 – 100.0$ | `REJECT_TRANSACTION` | Blocked immediately & high-priority alert |

---

## 3. Confidence Engine Calculation

Confidence score ($0.0 – 100.0\%$) measures decision reliability and is computed deterministically from:
1. **Model Agreement**: Variance across Isolation Forest, LOF, and SVM predictions. Low variance $=$ High Agreement ($+40\%$).
2. **Rule Consistency**: Consistency between Rule severity and ML risk score ($+30\%$).
3. **Historical User Behavior**: Historical transaction count and account age ($+30\%$).

---

## 4. Configuration Variables

```env
RULE_ENGINE_WEIGHT=0.60
ML_ENGINE_WEIGHT=0.40
ISOLATION_FOREST_WEIGHT=0.40
LOF_WEIGHT=0.30
ONE_CLASS_SVM_WEIGHT=0.30
LOW_RISK_THRESHOLD=20
MEDIUM_RISK_THRESHOLD=45
HIGH_RISK_THRESHOLD=70
CRITICAL_RISK_THRESHOLD=90
CONFIDENCE_MINIMUM=60
ENABLE_HISTORICAL_SCORING=true
ENABLE_RULE_SCORING=true
ENABLE_MODEL_AGREEMENT=true
```
