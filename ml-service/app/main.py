from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, prediction
from app.config import settings

app = FastAPI(
    title="Financial Anomaly Detection ML Service",
    description="Python FastAPI backend serving machine learning scoring models.",
    version="1.0.0"
)

# Configure CORS permissions to allow traffic from Express backend/NextJS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(prediction.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the AI Financial Anomaly Detection ML Service",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
