# Environment Setup Guide

This document describes all environment configurations required for running this SaaS platform.

## Variable Reference Table

| Variable Name | Required | Target Context | Description | Default / Example |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Backend | Neon PostgreSQL connection string with SSL mode set to require. | `postgresql://user:pass@ep-eg.neon.tech/anomalyze` |
| `PORT` / `BACKEND_PORT` | No | Backend | Express API server port. | `5000` |
| `FRONTEND_URL` / `NEXT_PUBLIC_APP_URL` | No | Backend, Frontend | Client-side origin address for CORS/redirects. | `http://localhost:3000` |
| `ML_SERVICE_URL` | Yes | Backend | Python FastAPI service base URL endpoint. | `http://localhost:8000` |
| `CLERK_SECRET_KEY` | Yes | Backend, Frontend | Authentication SDK secret key. | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Backend, Frontend | Authentication SDK public publishable key. | `pk_test_...` |
| `JWT_SECRET` | Yes | Backend | Fallback JWT sign/verify secret string. | `replace_with_random_string` |
| `STORAGE_PROVIDER` | No | Backend | Cloud Storage provider name (e.g. s3, gcs, local). | `dummy` |
| `STORAGE_BUCKET` | No | Backend | Storage container target name. | `dummy` |
| `EMAIL_PROVIDER` | No | Backend | Email transport API provider name. | `dummy` |
| `EMAIL_API_KEY` | No | Backend | Email provider API credentials. | `dummy` |

---

## Local Setup Workflow

1. Copy the root `.env.example` file to create your local configurations:
   ```bash
   cp .env.example .env
   ```
2. Also copy environment configuration templates for each service:
   - Backend: Copy `.env.example` -> `backend/.env`
   - Frontend: Copy `.env.example` -> `frontend/.env`
   - Python: Copy `.env.example` -> `ml-service/.env`
3. Edit the variable strings with mock test keys.
