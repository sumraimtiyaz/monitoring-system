from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.schemas.schemas import MetricIngest, MetricOut
from app.services.metric_service import MetricService
from app.repositories.metric_repo import MetricRepository
from app.repositories.service_repo import ServiceRepository

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("", response_model=MetricOut, status_code=201)
def ingest_metric(payload: MetricIngest, db: Session = Depends(get_db)):
    """Accept a single metric data point. Service is auto-created on first ingest."""
    return MetricService(db).ingest(payload)


@router.get("/{service_id}/{metric_name}")
def get_metric_series(
    service_id: str,
    metric_name: str,
    window: str = Query("1h", pattern="^(5m|1h|24h)$"),
    db: Session = Depends(get_db),
):
    """Return time-series data for a service metric over a given window."""
    windows = {"5m": 5, "1h": 60, "24h": 1440}
    since = datetime.now(timezone.utc) - timedelta(minutes=windows[window])
    metrics = MetricRepository(db).get_series(service_id, metric_name, since)
    return [
        {"timestamp": m.timestamp.isoformat(), "value": m.value}
        for m in metrics
    ]


@router.get("/{service_id}/available/names")
def get_available_metrics(service_id: str, db: Session = Depends(get_db)):
    return MetricRepository(db).get_available_metrics(service_id)
