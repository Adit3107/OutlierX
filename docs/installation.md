# Installation & Quickstart Guide

Follow these steps to configure your local development workspace.

## Prerequisites

Ensure the following tools are globally installed:
1. **Node.js** (v20.x or higher recommended)
2. **npm** (v10.x or higher, comes with Node)
3. **Python** (v3.12 or higher)
4. **PostgreSQL** or access to a Neon PostgreSQL instance.

---

## Step 1: Workspace Installation

From the monorepo root, install all node dependencies across all packages:

```bash
npm install
```

This command automatically bootstraps all local workspace linkages (such as linking `@anomaly/shared` into `@anomaly/backend` and `@anomaly/frontend`).

---

## Step 2: Database Initialization

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Generate the Prisma database client:
   ```bash
   npm run prisma:generate
   ```

---

## Step 3: Python ML Service Installation

1. Navigate to the `ml-service` directory:
   ```bash
   cd ml-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install package requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
