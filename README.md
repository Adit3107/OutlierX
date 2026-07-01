# Anomalyze - Financial Anomaly Detection SaaS

Anomalyze is a multi-tenant SaaS foundation for financial anomaly detection. This phase provides the shared data layer, Clerk-backed authentication, organization model, RBAC, API key management, activity logging, and minimal protected frontend shell.

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
- `Upload`: future upload tracking foundation without active upload endpoints in this phase.
- `Alert`: organization/user alert foundation.
- `ActivityLog`: organization-scoped audit trail with JSON metadata.

Important enums:

- `UserStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `Role`: `OWNER`, `ADMIN`, `ANALYST`, `MEMBER`, `VIEWER`
- `SubscriptionPlan`: `FREE`, `PRO`, `ENTERPRISE`
- `SubscriptionStatus`: `ACTIVE`, `TRIAL`, `PAST_DUE`, `CANCELLED`
- `UploadStatus`: `UPLOADING`, `UPLOADED`, `FAILED`
- `ProcessingStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `AlertSeverity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

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

Do not commit real credentials.
