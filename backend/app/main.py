from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables
from app.api import metrics, services, alerts

app = FastAPI(
    title="Cloud Monitoring System",
    description="Real-time monitoring: metrics ingestion, alerting, and health dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(services.router)
app.include_router(alerts.router)


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/health")
def health_check():
    return {"status": "ok"}
