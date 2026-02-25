"""
Metric Service - handles metric ingestion and retrieval.
"""
from sqlalchemy.orm import Session
from app.repositories.service_repo import ServiceRepository
from app.repositories.metric_repo import MetricRepository
from app.services.alert_service import AlertService
from app.schemas.schemas import MetricIngest, MetricOut
from app.services.notification_service import notification_service


class MetricService:
    """Service for handling metric operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.service_repo = ServiceRepository(db)
        self.metric_repo = MetricRepository(db)
        self.alert_service = AlertService(db, notification_service)

    def ingest(self, payload: MetricIngest) -> MetricOut:
        """
        Ingest a metric data point.
        
        - Auto-registers service on first metric
        - Stores the metric in the database
        - Evaluates alert rules synchronously
        """
        # Auto-register service on first metric
        service = self.service_repo.get_or_create(payload.service)

        # Insert the metric
        metric = self.metric_repo.insert(
            service_id=service.id,
            name=payload.name,
            value=payload.value,
            timestamp=payload.timestamp,
        )

        # Evaluate alert rules synchronously (async-ready via task queue in future)
        self.alert_service.evaluate(service.id, payload.name, payload.value)

        return MetricOut.model_validate(metric)
