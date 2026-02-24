from sqlalchemy.orm import Session
from app.repositories.service_repo import ServiceRepository
from app.repositories.metric_repo import MetricRepository
from app.services.alert_service import AlertService
from app.schemas.schemas import MetricIngest, MetricOut
from app.models.models import Metric


class MetricService:
    def __init__(self, db: Session):
        self.db = db
        self.service_repo = ServiceRepository(db)
        self.metric_repo = MetricRepository(db)
        self.alert_service = AlertService(db)

    def ingest(self, payload: MetricIngest) -> MetricOut:
        # Auto-register service on first metric
        service = self.service_repo.get_or_create(payload.service)

        metric = self.metric_repo.insert(
            service_id=service.id,
            name=payload.name,
            value=payload.value,
            timestamp=payload.timestamp,
        )

        # Evaluate alert rules synchronously (async-ready via task queue in future)
        self.alert_service.evaluate(service.id, payload.name, payload.value)

        return MetricOut.model_validate(metric)
