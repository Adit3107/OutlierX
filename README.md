# Anomalyze

## Getting Started

Follow these steps to set up the project locally. This guide assumes you have **Node.js** and **Docker** installed.

### 1. Prerequisites

- **Docker Desktop** (Make sure it's running)
- **Node.js** (v18+)
- **ngrok** CLI installed (`brew install ngrok/ngrok/ngrok` or via npm)

### 2. Environment Setup

Ensure you have the `.env` files created in the following directories (ask the team for the secrets):
- `backend/.env`
- `backend/services/auth-service/.env`
- `backend/services/subscription-service/.env`
- `backend/services/ingestion-service/.env`
- `backend/services/analytics-service/.env`
- `frontend/.env`

### 3. Shared Ngrok Tunnel Setup (Crucial for Webhooks)

To ensure everyone on the team uses the **same webhook URL** (so Clerk/Razorpay works for everyone without config changes), we use a shared static domain.

**Step 3.1: Configure Ngrok with the Team Token**
Run this command ONCE to log in to the shared account:
```bash
ngrok config add-authtoken 32pYlvdJ4qeuCIDfTLJSN95QLWy_3vF5jBytTkffag6zDS4Yd
```

**Step 3.2: Start the Tunnel**
Run this command in a separate terminal window:
```bash
npx ngrok http --domain=acrosporous-rikki-superinfinitely.ngrok-free.app 3002
```
> **Note:** Only one person can run this tunnel at a time! Coordinate with the team.

### 4. Running the Backend

Open a terminal in the `backend` directory:

```bash
cd backend
docker compose up --build
```

Wait until all services are healthy. You can check `auth-service` and `subscription-service` logs specifically to ensure connection.

### 5. Running the Frontend

Open a NEW terminal in the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Access the app at `http://localhost:5173`.

### 6. Troubleshooting

**"User not found" / Webhook Issues**
- Ensure your `ngrok` tunnel is running with the EXACT domain above.
- Check the Clerk Dashboard Webhook Logs.
- Verify that `CLERK_WEBHOOK_SECRET` in `auth-service/.env` matches the one in Clerk.

**Database Issues**
- If you see "Column does not exist", run:
  ```bash
  cd backend
  npx prisma db push
  ```
- Restart the services after a schema push.
