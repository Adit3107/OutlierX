# OutlierX - Financial Anomaly Detection SaaS

OutlierX is a multi-tenant SaaS foundation for financial anomaly detection. This phase provides the shared data layer, Clerk-backed authentication, organization model, RBAC, API key management, activity logging, and minimal protected frontend shell.

## Technology Stack

- Monorepo: npm workspaces
- Frontend: Next.js 15, TypeScript, TailwindCSS, Clerk, TanStack Query, Axios
- Backend API: Express, TypeScript, Prisma ORM, Neon PostgreSQL, Clerk Backend SDK
- ML service: FastAPI inference service with Isolation Forest anomaly prediction
- Shared package: common constants, types, schemas, and utilities

## Enterprise Phase 1 Completion

OutlierX now includes the enterprise SaaS surfaces required for production readiness while continuing to consume the existing authentication, organization, RBAC, upload, investigation, rules, ML, decision, analytics, and alert modules.

Frontend management surfaces:

- `/organization`: organization profile, logo URL, industry, website, timezone, default currency, language, usage summary, owner-only transfer ownership, and owner-only organization deletion.
- `/team`: invite placeholder, role changes, suspend/reactivate, remove, resend invitation placeholder, search, filters, and pagination.
- `/profile`: avatar, name, email, organization, role, joined date, recent activity, theme, language, timezone, and notification preferences.
- `/api-keys`: generate, copy-once raw key, rename, rotate, revoke, expiration, status, and last-used display.
- `/settings`: General, Appearance, Notifications, Security, Organization, API, Billing placeholder, Support, and About sections.
- `/subscription`: UI-only Free, Pro, and Enterprise plan comparison with disabled upgrade buttons. Stripe is intentionally not integrated.
- `/admin`: admin-only global dashboard for organizations, users, uploads, transactions, alerts, activity, API keys, and system health.
- `/system-health`: backend, ML service, database, storage, API version, model version, and environment status with one-minute polling.
- `/activity`: searchable and filterable audit logs with pagination.
- `/help`: in-app documentation for onboarding, uploads, scores, rules, ML, decisions, alerts, analytics, API keys, and FAQ.

Enterprise API additions:

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/system/health`
- `GET /api/v1/activity`
- `POST /api/v1/team/invite`
- `PATCH /api/v1/team/:id`
- `DELETE /api/v1/team/:id`
- `POST /api/v1/team/:id/resend-invitation`
- `PATCH /api/v1/api-keys/:id`
- `GET /api/v1/openapi.json`

Security posture:

- All enterprise endpoints are protected by Clerk authentication and RBAC.
- Owners can perform all management actions, including ownership transfer and organization deletion.
- Admins can manage the workspace except ownership transfer and organization deletion.
- Analysts receive read-oriented management access plus existing analyst operations.
- Viewers have no management write access.
- API keys are stored as SHA-256 hashes, and raw keys are returned only on creation or rotation.
- Administrative changes write activity logs for audit review.

Deployment readiness:

- Environment variables are validated at backend startup.
- Redis, Kafka, Docker, and Stripe are intentionally not introduced in Phase 1.
- OpenAPI documentation is exposed as generated JSON at `/api/v1/openapi.json`.
- Seed data creates multiple organizations, users across roles/statuses, API keys, uploads, transactions, ML predictions, decisions, alerts, and activity logs.
- Recommended verification before deployment:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run prisma:seed -w @anomaly/backend`

## Database Schema

The Prisma schema uses UUID primary keys, `createdAt`, `updatedAt`, relations, unique constraints, and indexes for production use.

Core models:

- `User`: Clerk identity, profile fields, status, current organization, memberships, uploads, API keys, alerts, activity logs.
- `Organization`: tenant record with slug, subscription fields, max users, memberships, uploads, API keys, alerts, activity logs.
- `Membership`: connects users to organizations with role and membership status.
- `ApiKey`: organization-scoped API keys storing only hashed key material.
- `Upload`: organization-scoped CSV upload tracking with file hash, storage key, lifecycle status, row counts, processing time, and bounded validation error summary.
- `Transaction`: normalized transaction rows imported from CSV uploads. Rows are scoped by organization and upload, indexed by transaction ID, timestamp, merchant, country, amount, and upload ID.
- `MlPrediction`: latest machine learning prediction for a transaction. ML scores are stored separately from deterministic rule results and are not final risk decisions.
- `Alert`: organization/user alert foundation.
- `ActivityLog`: organization-scoped audit trail with JSON metadata.

Important enums:

- `UserStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `Role`: `OWNER`, `ADMIN`, `ANALYST`, `MEMBER`, `VIEWER`
- `SubscriptionPlan`: `FREE`, `PRO`, `ENTERPRISE`
- `SubscriptionStatus`: `ACTIVE`, `TRIAL`, `PAST_DUE`, `CANCELLED`
- `UploadStatus`: `UPLOADING`, `UPLOADED`, `PARSING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `ProcessingStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `AlertSeverity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

## Data Ingestion

The ingestion module accepts CSV transaction files only. The backend stores the original file through a storage abstraction, creates an upload record, parses the CSV with a streaming parser, validates each row independently, persists valid transactions in batches, updates upload summary counters, and records activity logs.

The ingestion module stores transactions first, then triggers deterministic rule execution and best-effort ML prediction as separate follow-up workflows. Kafka, Redis, final risk scoring, and alert triggering are not part of this module.

CSV limits and validation:

- Maximum file size: `100 MB`
- Accepted extension: `.csv`
- Required columns: `transaction_id`, `timestamp`, `amount`, `currency`, `merchant`
- Optional columns: `merchant_category`, `account_number`, `country`, `city`, `payment_method`, `description`, `reference_number`, `customer_id`
- Invalid rows are collected in the upload error summary while valid rows continue processing.
- Missing transaction ID, timestamp, merchant, invalid amount, invalid currency, invalid date, and negative amounts reject only that row.

Normalization:

- String values are trimmed.
- Duplicate whitespace is collapsed.
- Currency codes are uppercased.
- Timestamps are persisted as PostgreSQL timestamps.
- Optional missing values are stored as `NULL`.

Storage:

- The backend uses a `StorageProvider` interface with `upload`, `delete`, and `getUrl`.
- Local storage is enabled by default and writes under `uploads/{organizationId}/`.
- Cloud storage stubs are present but disabled.
- API responses expose storage keys/URLs, never absolute server file paths.
- Duplicate uploads are prevented per organization by SHA-256 file hash.

## Transaction Investigation

The investigation module lets analysts explore imported transactions without ML predictions. It is an organization-scoped console for search, filtering, traceability, export, and record inspection; deterministic rule scoring is handled by the separate rule engine.

Architecture:

- Routes remain thin and delegate to controllers.
- Controllers read validated request data and call services.
- Services handle audit logging, export serialization, deletion checks, and response mapping.
- Repositories contain Prisma query logic only.
- React Query powers cached list/detail reads from the frontend.

Explorer:

- `/transactions` displays a compact analyst table with sticky headers, selectable rows, sortable columns, server-side pagination, active filter chips, and loading/empty/error states.
- `/transactions/[transactionId]` displays the dedicated transaction details page.
- Desktop row clicks open a right-side details drawer; mobile row clicks navigate to the details page.
- IDs, references, upload identifiers, account numbers, row numbers, and raw metadata use JetBrains Mono.

Filtering and search:

- Global search is server-side and covers transaction ID, merchant, description, reference number, customer ID, country, city, and account number.
- Filters can be combined for date range, country, merchant, merchant category, payment method, currency, amount range, upload source, and status.
- Sorting is server-side for timestamp, amount, merchant, country, created date, and transaction ID.
- Pagination is server-side with page, page size, total records, next/previous, and jump-to-page.

Traceability:

- Every transaction response includes upload filename, upload time, uploaded by, organization, and upload ID.
- Original CSV row number is preserved as `metadata.sourceRow` from ingestion and surfaced in details/export views.

Export and bulk actions:

- `GET /transactions/export` supports CSV and JSON.
- Export scopes are current page, filtered results, and selected rows.
- Admin/owner users can bulk delete transactions through `transactions:delete`.
- Bulk tag and bulk mark reviewed are placeholders that log audit events but do not mutate transaction records.

## Rule Engine

The rule engine evaluates transactions with deterministic, explainable rules. It does not call the Python ML service and does not use machine learning. Future ML scores can be merged later without changing the rule engine boundary.

Architecture:

- Backend rule code lives under `backend/src/modules/rules`.
- Controllers are transport-only and delegate to services.
- `RuleEngineService`, `RuleEvaluator`, `ConditionEvaluator`, `ScoreCalculator`, `ExplanationGenerator`, and `ExecutionRecorder` are isolated from Express.
- Prisma stores `Rule`, `RuleGroup`, `RuleCondition`, `RuleExecution`, and `RuleResult`.
- Nested conditions are persisted relationally but exposed to the frontend as a JSON condition tree.

Execution flow:

1. Enabled organization rules are loaded in priority order.
2. Each transaction is evaluated against every enabled rule.
3. Matching rules contribute their configured weight.
4. Total score is clamped to `0-100`.
5. Risk level is assigned as `LOW` `0-24`, `MEDIUM` `25-49`, `HIGH` `50-79`, and `CRITICAL` `80-100`.
6. Execution history and per-rule results are stored for persisted transaction evaluations.

Rules support configurable categories, severity, priority, weight, enabled state, nested `AND`/`OR` groups, and operators such as equality, comparisons, contains, list membership, missing/existence, and between.

Default rules are provisioned for the seeded demo organization and for new first-sign-in organizations. They include large transaction, foreign country, high-risk merchant, weekend/night activity, missing reference, duplicate/velocity placeholders, international transfer, and blacklist placeholder rules.

Frontend:

- `/rules` lists rules with search, filters, sorting, status toggles, duplicate, and delete actions.
- `/rules/new` provides a visual rule builder for conditions, groups, thresholds, priority, weight, and enabled state.
- `/rules/[id]` shows configuration, conditions, recent execution history, and edit/duplicate/delete actions.
- `/rules/playground` accepts pasted transaction JSON and returns triggered rules, score, risk level, explanations, and the raw evaluation result without creating transaction records.

Permissions:

- OWNER and ADMIN can create, update, delete, duplicate, reorder, enable, disable, test, and evaluate rules.
- ANALYST can read and test rules.
- VIEWER can read rules only.

## Decision Engine

The Decision Engine combines persisted Rule Engine results with persisted Machine Learning predictions into a final explainable risk assessment. It does not evaluate rules and does not call ML inference; it consumes the latest available upstream outputs and stores immutable decision history.

Architecture:

- Backend decision code lives under `backend/src/modules/decision-engine`.
- `DecisionService` orchestrates input lookup, calculation, persistence, and audit logging.
- `WeightStrategy`, `DecisionCalculator`, `ConfidenceCalculator`, `ExplanationGenerator`, and `RecommendationGenerator` each own one part of the decision pipeline.
- Prisma stores every `Decision` record with rule score, ML score, final score, confidence, risk level, strategy, version, explanation JSON, recommendation, and timestamps.

Decision lifecycle:

1. Upload processing stores transactions, then evaluates rules, then persists ML predictions.
2. The Decision Engine reuses the latest `RuleExecution` and current `MlPrediction`.
3. The default `weighted-rule-ml-v1` strategy combines Rule Engine score at 60% and ML score at 40%.
4. Final score is classified as `LOW` `0-39.99`, `MEDIUM` `40-69.99`, `HIGH` `70-89.99`, and `CRITICAL` `90-100`.
5. Recommendation thresholds map scores to Approve, Monitor, Manual Review, Escalate, or Block Transaction.
6. Recalculation creates a new history record and never overwrites previous decisions.

Explainability:

- Decision explanation JSON includes human-readable reasons, triggered rules, ML analysis, weighted calculations, thresholds used, timeline events, processing time, and recommendation rationale.
- Confidence combines rule confidence, ML confidence, and decision consistency into a `0-100%` value.
- Audit logs record generated and recalculated decisions, plus risk-level and recommendation changes.

Frontend:

- Transaction details show a Decision Summary card with final risk level, score, confidence, recommendation, strategy, decision time, triggered rules, ML analysis, explanation, timeline, and collapsible calculation details.
- Severity colors are reserved for risk-specific surfaces: decision badges, borders, banners, timeline markers, tables, and charts.

## Analytics, Monitoring, and Alert Center

The operational console turns stored decisions and transaction history into analyst-facing monitoring views. Dashboard, analytics, and alert APIs consume existing records only; they do not rerun the Rule Engine and do not call ML inference.

Backend architecture:

- Dashboard endpoints are `GET /api/v1/dashboard/summary`, `GET /api/v1/dashboard/charts`, and `GET /api/v1/dashboard/activity`.
- Alert Center endpoints are `GET /api/v1/alerts`, `GET /api/v1/alerts/:id`, `PATCH /api/v1/alerts/:id`, and `POST /api/v1/alerts/bulk`.
- Analytics is exposed through `GET /api/v1/analytics`, combining dashboard summary, chart data, and recent activity.
- `DashboardService`, `AnalyticsService`, `AlertService`, `MetricsCalculator`, `ChartBuilder`, and repository classes keep aggregation and lifecycle logic out of controllers.
- A `CacheProvider` abstraction is present with a no-op implementation, so Redis can later be introduced without changing controller or frontend contracts.

Alert lifecycle:

1. A stored Decision Engine result creates an alert.
2. Severity maps directly from decision risk level: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
3. The alert stores transaction linkage, risk score, confidence, triggered rules, recommendation, status, read state, and optional analyst assignment.
4. Analysts can mark read/unread, resolve, reopen, archive, and soft-delete alerts individually or in bulk.
5. Activity logs record alert creation, update, resolution, archive, delete, dashboard access, and analytics access.

Dashboard metrics and charts:

- Summary cards include transaction, upload, organization, alert severity, average risk, ML confidence, detection rate, false-positive placeholder, processing time, active rules, model version, and latest upload.
- Chart payloads include risk distribution, risk trend, transaction volume, country and merchant analysis, payment and currency distribution, risky merchants/countries, hourly heatmap, rule triggers, model predictions, upload trend, and alert trend.
- The frontend uses Recharts with responsive containers, tooltips, legends, hover states, dark mode tokens, and accessible surrounding tables/labels.

Realtime strategy:

- The frontend currently polls dashboard, analytics, and alert queries every 30 seconds through `frontend/hooks/use-dashboard-polling.ts`.
- Polling is isolated so Kafka or another event stream can replace it later without rewriting the dashboard widgets.
- Pulse Rail accepts anomaly events as props and currently falls back to mock events when no stream is connected.

## Machine Learning Service

The ML service is an independent FastAPI app under `ml-service`. It does not import Express code, access the database, call the rule engine, trigger alerts, or produce final risk levels. Its only responsibility is returning model predictions.

Inference pipeline:

1. A raw transaction is accepted through `POST /predict` or `POST /predict/batch`.
2. The reusable feature pipeline transforms it into numeric features.
3. Missing values, categorical encodings, frequency features, time fields, amount scaling, and transaction age are normalized.
4. The loaded Isolation Forest model returns an anomaly score and model prediction.
5. The response includes `prediction`, `anomalyScore`, `confidence`, `modelVersion`, and `inferenceTimeMs`.

FastAPI endpoints:

- `GET /health`
- `GET /version`
- `POST /predict`
- `POST /predict/batch`
- `POST /reload-model`
- `GET /model/info`

Feature engineering is shared by training and inference. The first feature version includes amount, hour of day, day of week, merchant frequency, country frequency, payment method encoding, currency encoding, transaction age, category encoding, and missing-value ratio.

Model lifecycle:

- `ModelManager` loads a cached model once and reuses it for requests.
- If `models/isolation_forest.joblib` is missing, the service trains an in-memory development baseline from bundled sample transactions.
- If an artifact is invalid or unavailable, the service exposes the error in model info and falls back to the development baseline instead of crashing.
- The training package includes `TrainingService`, `DatasetLoader`, `ModelTrainer`, and `ModelEvaluator` as script-ready architecture, without a UI.

Backend integration:

- Express calls the FastAPI batch endpoint through `MLClientService`.
- `PredictionService` persists results through `PredictionRepository` into `MlPrediction`.
- Upload-time prediction is automatic and best-effort after CSV rows are stored. ML timeouts or service outages are logged but never fail the upload or rule execution.
- Transaction list/detail responses include the latest `mlPrediction` object when available.

Frontend:

- Transaction details show an `AI Analysis` card with ML Prediction, Confidence, Model Version, Inference Time, and Processed At.
- ML prediction styling uses the accent color only. Severity colors and final risk badges are intentionally not shown.

## Authentication Flow

The frontend uses Clerk for session state and sends a Clerk session token to the Express API as a Bearer token. The backend verifies the token with Clerk, loads the Clerk user, then synchronizes the database foundation:

1. Upsert the `User` by `clerkUserId`.
2. Create a personal `Organization` on first sign-in.
3. Create an `OWNER` `Membership` for that organization.
4. Attach the authenticated user, organization, membership, role, and permissions to the request.

Returning users reuse existing records and do not create duplicates.

## RBAC Architecture

RBAC is centralized in the backend permissions config. Routes use reusable middleware:

- `requireAuth`
- `requireRole(...)`
- `requirePermission(permission)`

Permissions are mapped by role and consumed by services/controllers without hardcoding authorization decisions in controllers.

## API Endpoints

All routes are versioned under `/api/v1`.

Unauthenticated:

- `GET /health`
- `GET /status`
- `GET /version`

Authenticated:

- `GET /auth/me`
- `GET /organization`
- `PATCH /organization`
- `GET /members`
- `POST /members`
- `PATCH /members/:id`
- `DELETE /members/:id`
- `GET /api-keys`
- `POST /api-keys`
- `DELETE /api-keys/:id`
- `GET /activity`
- `POST /uploads`
- `GET /uploads`
- `GET /uploads/:id`
- `DELETE /uploads/:id`
- `GET /uploads/:id/transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `GET /transactions/export`
- `POST /transactions/bulk-actions`
- `DELETE /transactions/:id`
- `DELETE /transactions`

API responses use a standard shape:

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body validation failed",
    "details": []
  },
  "message": "Request body validation failed",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

## Development Commands

Install dependencies:

```bash
npm install
```

Run the full development stack:

```bash
npm run dev
```

Generate Prisma Client:

```bash
npx prisma generate --schema backend/prisma/schema.prisma
```

Run migrations:

```bash
npx prisma migrate dev --schema backend/prisma/schema.prisma
```

Seed the database:

```bash
npm run prisma:seed -w @anomaly/backend
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

The project uses the existing root `.env` values:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL`
- `ML_SERVICE_URL`
- `STORAGE_PROVIDER` optional, defaults to local-compatible `dummy`
- `STORAGE_LOCAL_ROOT` optional, defaults to `uploads`

Do not commit real credentials.
