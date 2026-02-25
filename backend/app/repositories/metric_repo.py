"""
Metric Repository - handles database operations for metrics.
"""
from typing import List, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Metric
from app.repositories.base import BaseRepository


class MetricRepository(BaseRepository[Metric]):
    """Repository for Metric model operations."""
    
    def __init__(self, db: Session):
        super().__init__(db, Metric)
    
    def insert(self, service_id: str, name: str, value: float, 
               timestamp: datetime | None = None) -> Metric:
        """Insert a new metric data point."""
        import uuid
        metric = Metric(
            id=str(uuid.uuid4()),
            service_id=service_id,
            name=name,
            value=value,
            timestamp=timestamp or datetime.now(timezone.utc),
        )
        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)
        return metric
    
    def get_series(self, service_id: str, metric_name: str, 
                   since: datetime) -> List[Metric]:
        """Get time-series data for a service metric over a given window."""
        return (
            self.db.query(Metric)
            .filter(
                Metric.service_id == service_id,
                Metric.name == metric_name,
                Metric.timestamp >= since,
            )
            .order_by(Metric.timestamp.asc())
            .all()
        )
    
    def get_latest_per_metric(self, service_id: str) -> Dict[str, float]:
        """Return the most recent value for each metric of the given service."""
        subq = (
            self.db.query(Metric.name, func.max(Metric.timestamp).label("max_ts"))
            .filter(Metric.service_id == service_id)
            .group_by(Metric.name)
            .subquery()
        )
        rows = (
            self.db.query(Metric)
            .join(subq, (Metric.name == subq.c.name) & (Metric.timestamp == subq.c.max_ts))
            .filter(Metric.service_id == service_id)
            .all()
        )
        return {r.name: r.value for r in rows}
    
    def get_available_metrics(self, service_id: str) -> List[str]:
        """Get all available metric names for a service."""
        rows = (
            self.db.query(Metric.name)
            .filter(Metric.service_id == service_id)
            .distinct()
            .all()
        )
        return [r[0] for r in rows]
