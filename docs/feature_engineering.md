# OutlierX Feature Engineering & ML Data Pipeline Documentation

This document explains the production Feature Engineering Pipeline designed for OutlierX. Raw financial transaction data is never passed directly to machine learning scoring models. Instead, every transaction passes through this deterministic 10-category extraction pipeline.

---

## Architecture Overview

```
CSV Upload / Streaming Ingestion
               ↓
    Store Raw Transaction
               ↓
 Feature Engineering Pipeline
   ├── AmountExtractor (14 features)
   ├── TimeExtractor (14 features)
   ├── MerchantExtractor (8 features)
   ├── CountryExtractor (8 features)
   ├── DeviceExtractor (7 features)
   ├── UserBehaviorExtractor (13 features)
   ├── VelocityExtractor (9 features)
   ├── GeographicalExtractor (7 features)
   ├── StatisticsExtractor (9 features)
   └── RiskExtractor (8 features)
               ↓
 Numerical Scaler & Categorical Encoder
               ↓
  Sanity Validation (NaN / Inf Check)
               ↓
   Persist FeatureVector to Postgres
               ↓
ML Scoring Models (Isolation Forest)
```

---

## 1. Feature Categories & Feature Dictionary

### 1. Amount Features (`amount.py`)
- **`transaction_amount`**: Raw numerical amount in base account currency. Range: `[0.0, ∞)`.
- **`log_amount`**: Natural logarithm $\ln(1 + \text{amount})$ to compress right-skewed transaction distributions. Range: `[0.0, ∞)`.
- **`amount_bucket`**: Categorical ordinal bucket (`0: micro`, `1: low`, `2: mid`, `3: high`, `4: ultra`).
- **`amount_percentile`**: Percentile rank of amount relative to account history. Range: `[0.0, 1.0]`.
- **`relative_amount`**: Ratio of current transaction amount to historical user mean $\frac{\text{amount}}{\mu_{\text{user}}}$. Range: `[0.0, ∞)`.
- **`average_user_amount`**: User's historical arithmetic mean spend.
- **`median_user_amount`**: User's historical median spend.
- **`rolling_average_amount`**: Short-term rolling mean over last 5 transactions.
- **`rolling_median_amount`**: Short-term rolling median over last 5 transactions.
- **`amount_difference`**: Absolute deviation $\text{amount} - \mu_{\text{user}}$.
- **`amount_ratio`**: Ratio of amount to median spend $\frac{\text{amount}}{\text{median}}$.
- **`amount_z_score`**: Standardized Z-score $Z = \frac{\text{amount} - \mu}{\sigma}$. Detects statistical anomalies ($Z > 3.0$).
- **`high_value_flag`**: Binary flag (`1.0` if amount $\ge \$10,000$).
- **`large_cash_flag`**: Binary flag (`1.0` if cash/ATM transaction $\ge \$5,000$).

### 2. Time Features (`time.py`)
- **`transaction_hour`**: Hour of day `[0.0, 23.0]`.
- **`transaction_minute`**: Minute `[0.0, 59.0]`.
- **`transaction_second`**: Second `[0.0, 59.0]`.
- **`transaction_day`**: Day of month `[1.0, 31.0]`.
- **`transaction_weekday`**: Day of week `[0.0, 6.0]` (0 = Monday).
- **`transaction_month`**: Month `[1.0, 12.0]`.
- **`transaction_quarter`**: Quarter `[1.0, 4.0]`.
- **`weekend_flag`**: `1.0` if Saturday or Sunday.
- **`night_flag`**: `1.0` if transaction occurred between 23:00 and 05:00.
- **`business_hours_flag`**: `1.0` if Mon-Fri between 08:00 and 18:00.
- **`holiday_flag`**: Configurable holiday flag (`1.0` if transaction falls on bank holiday).
- **`time_since_previous_tx`**: Seconds elapsed since user's preceding transaction.
- **`tx_count_last_hour`**: Transaction count in 3,600s rolling window.
- **`tx_count_last_day`**: Transaction count in 86,400s rolling window.
- **`tx_count_last_week`**: Transaction count in 604,800s rolling window.

### 3. Merchant Features (`merchant.py`)
- **`merchant_frequency`**: Global frequency count of merchant across system.
- **`merchant_average_amount`**: Average transaction amount at this specific merchant.
- **`merchant_risk_score`**: Categorical risk score `[0.0, 100.0]` incorporating high-risk MCC codes (crypto, gambling, wire transfers).
- **`merchant_first_seen_days`**: Days since merchant was first encountered.
- **`merchant_last_seen_days`**: Days since merchant was last encountered.
- **`merchant_transaction_count`**: Total historical transaction volume at merchant.
- **`merchant_velocity_24h`**: Total transactions at merchant in rolling 24 hours.
- **`merchant_category_frequency`**: Total volume in merchant category.

### 4. Country Features (`country.py`)
- **`country_frequency`**: Occurrences in this country code.
- **`country_risk_score`**: Baseline risk score `[0.0, 100.0]` for country (incorporates FATF high-risk jurisdictions).
- **`country_first_seen_days`**: Days since user first transacted in country.
- **`country_last_seen_days`**: Days since user last transacted in country.
- **`country_changed_flag`**: `1.0` if country is different from immediately preceding transaction.
- **`new_country_flag`**: `1.0` if country has never been visited by user before.
- **`cross_border_flag`**: `1.0` if transaction country is outside account home country.
- **`distance_from_previous_country`**: Centroid Haversine distance in km from preceding transaction country.

### 5. Device Features (`device.py`)
- **`new_device_flag`**: `1.0` if device fingerprint has never been seen for account.
- **`device_frequency`**: Transaction count from device ID.
- **`device_risk`**: Device risk score `[0.0, 100.0]`.
- **`known_device`**: `1.0` if device has prior successful transactions.
- **`device_age_days`**: Days elapsed since device was first registered.
- **`device_switch_count`**: Number of distinct device switches in account history.
- **`previous_device_match`**: `1.0` if device matches preceding transaction.

### 6. User Behavior Features (`user_behavior.py`)
- **`average_daily_spend`**: Baseline daily total spend.
- **`average_weekly_spend`**: Baseline weekly total spend.
- **`average_monthly_spend`**: Baseline monthly total spend.
- **`transactions_today`**: Transaction count on current UTC day.
- **`transactions_this_week`**: Transaction count in 7-day rolling window.
- **`transactions_this_month`**: Transaction count in 30-day rolling window.
- **`maximum_transaction`**: Historical maximum amount spent by account.
- **`minimum_transaction`**: Historical minimum amount spent by account.
- **`standard_deviation_amount`**: Standard deviation $\sigma$ of user amounts.
- **`previous_fraud_count`**: Count of confirmed historical fraud incidents.
- **`previous_alert_count`**: Count of historical generated alerts.
- **`previous_reject_count`**: Count of historical blocked transactions.
- **`previous_review_count`**: Count of historical manual review decisions.

### 7. Velocity Features (`velocity.py`)
- **`transactions_per_minute`**: Rapid rolling count in 60 seconds.
- **`transactions_per_hour`**: Rolling count in 3,600 seconds.
- **`transactions_per_day`**: Rolling count in 86,400 seconds.
- **`average_time_between_transactions`**: Mean inter-arrival time in seconds.
- **`burst_detection_flag`**: `1.0` if $> 3$ transactions occur within 60 seconds.
- **`repeated_merchant_flag`**: `1.0` if merchant matches preceding transaction.
- **`repeated_device_flag`**: `1.0` if device matches preceding transaction.
- **`repeated_country_flag`**: `1.0` if country matches preceding transaction.
- **`rapid_location_change_flag`**: `1.0` if country changed in $< 3,600$ seconds.

### 8. Geographical Features (`geo.py`)
- **`latitude`**: Latitude coordinate `[-90.0, 90.0]`.
- **`longitude`**: Longitude coordinate `[-180.0, 180.0]`.
- **`distance_between_transactions_km`**: Exact Haversine distance in km from preceding transaction.
- **`travel_speed_kmh`**: Speed estimate $v = \frac{d}{\Delta t}$ in km/h.
- **`impossible_travel_flag`**: `1.0` if travel speed $v > 900$ km/h (exceeds commercial flight capabilities).
- **`geo_cluster_id`**: Spatial grid cluster index `[0, 9]`.
- **`known_location_flag`**: `1.0` if location is within 50 km of user's past transaction locations.

### 9. Statistical Features (`statistics.py`)
- **`mean_amount`**: Population mean amount.
- **`median_amount`**: Population median amount.
- **`variance_amount`**: Population variance.
- **`std_dev_amount`**: Population standard deviation.
- **`coeff_variation`**: Coefficient of variation $\frac{\sigma}{\mu}$.
- **`z_score_stat`**: Z-score of transaction amount.
- **`percentile_stat`**: Percentile rank of amount.
- **`iqr_amount`**: Interquartile range $IQR = Q_3 - Q_1$.
- **`outlier_flag`**: `1.0` if $\text{amount} > Q_3 + 1.5 \times IQR$ (Tukey's fence).

### 10. Risk Features (`risk.py`)
- **`rule_score`**: Summed score from active deterministic rules.
- **`triggered_rules_count`**: Count of rules fired for transaction.
- **`highest_rule_severity`**: Maximum rule severity level (`0: NONE`, `1: LOW`, `2: MEDIUM`, `3: HIGH`, `4: CRITICAL`).
- **`historical_risk_score`**: Historical average risk score of user.
- **`historical_ml_score`**: Historical average ML prediction score.
- **`previous_decision_code`**: Encoded decision from preceding transaction (`0-4`).
- **`previous_confidence`**: Model confidence from preceding transaction.
- **`alert_history_count`**: Count of alerts associated with user.

---

## 2. Configuration Options

Set in `.env` / Environment Variables:

```env
PIPELINE_VERSION=v1.0.0
FEATURE_VERSION=features-v2.1
FEATURE_SCALER=standard        # standard | minmax | robust
FEATURE_ENCODER=frequency       # frequency | label | onehot
FEATURE_STORE_ENABLED=true
```
