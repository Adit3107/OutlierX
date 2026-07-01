# Development Guide

This guide describes how to run services locally and add features to the monorepo workspace.

## Running Services in Development Mode

Run the complete stack (backend, frontend, ml-service) concurrently from the root directory:

```bash
npm run dev
```

This launches:
- **Shared Package compiler**: Re-compiles types and schemas inside `packages/shared` on change.
- **Backend Express Server**: Runs at `http://localhost:5000` with hot reloading.
- **Frontend App Client**: Next.js 15 dev server running at `http://localhost:3000`.
- **Python ML Service**: FastAPI server listening on `http://localhost:8000`.

---

## Workspace Directory Scripts

Commands can be run targeting specific packages by using `--workspace` or `-w`:

### Frontend Client
- Dev Server: `npm run dev -w @anomaly/frontend`
- Build Client: `npm run build -w @anomaly/frontend`
- Typecheck: `npm run typecheck -w @anomaly/frontend`

### Backend Server
- Dev Server: `npm run dev -w @anomaly/backend`
- Build Assets: `npm run build -w @anomaly/backend`
- Run DB Migration: `npm run prisma:migrate -w @anomaly/backend`
- Run DB Seed: `npm run prisma:seed -w @anomaly/backend`

### ML Python Service
- Dev Server: `npm run dev -w @anomaly/ml-service`

---

## Quality Controls & Formatting

To enforce styling consistency, the project employs ESLint, Prettier, and husky git-hooks:

- **Format Code**: `npm run format`
- **Lint Code**: `npm run lint`
- **Run Type Checks**: `npm run typecheck`

---

## Adding New Shared Features

If you need to share new validations or data schemas (e.g. `UserUpdateSchema`):
1. Write the Zod schema inside `packages/shared/src/schemas/index.ts`.
2. Export it from `packages/shared/src/index.ts`.
3. Compile the shared workspace using `npm run build -w @anomaly/shared` (or have it watch changes via `npm run dev`).
4. Import and validate directly within frontend page hooks or backend controller handlers.
