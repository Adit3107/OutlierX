# Anomalyze - AI-Powered Financial Anomaly Detection SaaS

Anomalyze is a production-ready software foundation for a multi-tenant Financial Anomaly Detection platform. It implements a modern modular architecture using npm workspaces, layering, type-safety validation boundaries, and an integrated Python FastAPI machine learning scoring service.

---

## 🛠️ Technology Stack

- **Monorepo**: npm workspaces
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, Framer Motion, TanStack Query, Axios, Sonner, Lucide
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM, Neon PostgreSQL, Clerk Auth SDK
- **ML microservice**: Python 3.12+, FastAPI, Uvicorn, Scikit-learn, Pandas, NumPy
- **Code Quality**: ESLint, Prettier, EditorConfig, Husky, lint-staged, commitlint

---

## 📂 Project Structure

```text
root/
├── .github/              # CI/CD Workflows
├── docker/               # Docker configurations placeholder (Phase 2)
├── tests/                # Automated tests placeholder
├── docs/                 # Architectural & installation documentation
│   ├── architecture.md   # Architectural design maps
│   ├── installation.md   # Setup procedures and requirements
│   ├── development.md    # Commands list and coding standards
│   └── environment.md    # Detailed environment configurations
├── frontend/             # Next.js 15 app router web application
│   ├── app/              # Router layout, pages, loading states, and 404
│   ├── components/       # Interface components layout
│   ├── providers/        # State context wrappers (Theme, Query, Toasts)
│   ├── lib/              # Client utilities (Axios API client)
│   └── tailwind.config.ts# Styling variables configuration
├── backend/              # Node Express API server workspace
│   ├── prisma/           # Prisma database settings (Neon PostgreSQL)
│   ├── src/
│   │   ├── config/       # Environment parsing & strict validator
│   │   ├── controllers/  # Transaction & health endpoints controllers
│   │   ├── middlewares/  # Validation, security, logs, error interceptors
│   │   ├── repositories/ # Repository pattern DB boundaries
│   │   ├── services/     # Core operational business services
│   │   └── utils/        # Custom Http exceptions & API response formatters
├── ml-service/           # FastAPI Python microservice
│   ├── app/
│   │   ├── main.py       # API bootstrap entry
│   │   ├── config.py     # Pydantic environment configurations
│   │   └── routers/      # ML routing (health, version, analysis)
└── packages/
    └── shared/           # Common TypeScript utilities, schemas, and types
```

---

## 🚀 Getting Started

Quick commands to bootstrap the development stack:

1. **Install workspace dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment settings**:
   Create a `.env` file at the root by following [Environment Setup Guide](file:///d:/Git%20projects/Fullstack/Phase%202/Fake-Transaction-detector/docs/environment.md).
3. **Launch the platform concurrently**:
   ```bash
   npm run dev
   ```

---

## 📖 Complete Guides

For detailed setup instructions and architecture profiles, refer to the following documents:
- 🗺️ **[System Architecture Map](file:///d:/Git%20projects/Fullstack/Phase%202/Fake-Transaction-detector/docs/architecture.md)**
- 📥 **[Installation Guidelines](file:///d:/Git%20projects/Fullstack/Phase%202/Fake-Transaction-detector/docs/installation.md)**
- 💻 **[Development Workflow & CLI Scripts](file:///d:/Git%20projects/Fullstack/Phase%202/Fake-Transaction-detector/docs/development.md)**
- 🔑 **[Environment Keys Configurations](file:///d:/Git%20projects/Fullstack/Phase%202/Fake-Transaction-detector/docs/environment.md)**
