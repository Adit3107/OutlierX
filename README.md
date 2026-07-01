# OutlierX - Financial Anomaly Detection SaaS

OutlierX is a multi-tenant SaaS foundation for financial anomaly detection. This phase provides the shared data layer, Clerk-backed authentication, organization model, RBAC, API key management, activity logging, and minimal protected frontend shell.

## Technology Stack

- Monorepo: npm workspaces
- Frontend: Next.js 15, TypeScript, TailwindCSS, Clerk, TanStack Query, Axios
- Backend API: Express, TypeScript, Prisma ORM, Neon PostgreSQL, Clerk Backend SDK
- ML service: FastAPI scaffold retained for later phases
- Shared package: common constants, types, schemas, and utilities

## Database Schema

The Prisma schema uses UUID primary keys, `createdAt`, `updatedAt`, relations, unique constraints, and indexes for production use.

Core models:

- `User`: Clerk identity, profile fields, status, current organization, memberships, uploads, API keys, alerts, activity logs.
- `Organization`: tenant record with slug, subscription fields, max users, memberships, uploads, API keys, alerts, activity logs.
- `Membership`: connects users to organizations with role and membership status.
- `ApiKey`: organization-scoped API keys storing only hashed key material.
- `Upload`: organization-scoped CSV upload tracking with file hash, storage key, lifecycle status, row counts, processing time, and bounded validation error summary.
- `Transaction`: normalized transaction rows imported from CSV uploads. Rows are scoped by organization and upload, indexed by transaction ID, timestamp, merchant, country, amount, and upload ID.
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

No anomaly detection, risk scoring, ML calls, Kafka, Redis, or rule engine behavior is part of this module.

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

The investigation module lets analysts explore imported transactions without anomaly detection, rule scoring, ML predictions, risk levels, or severity indicators. It is an organization-scoped console for search, filtering, traceability, export, and record inspection.

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
