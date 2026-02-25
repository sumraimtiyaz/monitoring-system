"""
Metrics API - endpoints for metric ingestion and retrieval.
"""
from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.schemas.schemas import MetricIngest, MetricOut
from app.services.metric_service import MetricService
from app.repositories.metric_repo import MetricRepository

router = APIRouter(prefix="/metrics", tags=["metrics"])

# Valid time windows for metrics queries
TIME_WINDOWS = Literal["5m", "1h", "24h"]
WINDOW_MINUTES = {"5m": 5, "1h": 60, "24h": 1440}


@router.post("", response_model=MetricOut, status_code=201)
def ingest_metric(payload: MetricIngest, db: Session = Depends(get_db)):
    """
    Accept a single metric data point.
    
    Service is auto-created on first metric ingest.
    """
    return MetricService(db).ingest(payload)


@router.get("/{service_id}/{metric_name}")
def get_metric_series(
    service_id: str,
    metric_name: str,
    window: TIME_WINDOWS = Query("1h", description="Time window: 5m, 1h, or 24h"),
    db: Session = Depends(get_db),
):
    """
    Return time-series data for a service metric over a given window.
    
    - 5m: Last 5 minutes
    - 1h: Last 1 hour
    - 24h: Last 24 hours
    """
    since = datetime.now(timezone.utc) - timedelta(minutes=WINDOW_MINUTES[window])
    metrics = MetricRepository(db).get_series(service_id, metric_name, since)
    return [
        {"timestamp": m.timestamp.isoformat(), "value": m.value}
        for m in metrics
    ]


@router.get("/{service_id}/available/names")
def get_available_metrics(service_id: str, db: Session = Depends(get_db)):
    """Get all available metric names for a service."""
    return MetricRepository(db).get_available_metrics(service_id)
