from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ServiceOut, ServiceHealth, DashboardOverview
from app.repositories.service_repo import ServiceRepository
from app.repositories.metric_repo import MetricRepository
from app.repositories.alert_repo import AlertRepository

router = APIRouter(prefix="/services", tags=["services"])


def _build_service_health(service, metric_repo: MetricRepository, alert_repo: AlertRepository) -> ServiceHealth:
    active_alerts = alert_repo.get_active_alerts(service.id)
    latest_metrics = metric_repo.get_latest_per_metric(service.id)

    if len(active_alerts) > 0:
        status = "Critical"
    else:
        status = "Healthy"

    return ServiceHealth(
        id=service.id,
        name=service.name,
        status=status,
        active_alerts=len(active_alerts),
        latest_metrics=latest_metrics,
        created_at=service.created_at,
    )


@router.get("", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return ServiceRepository(db).get_all()


@router.get("/dashboard", response_model=DashboardOverview)
def dashboard_overview(db: Session = Depends(get_db)):
    """Global overview: service count, active alerts, per-service health."""
    service_repo = ServiceRepository(db)
    metric_repo = MetricRepository(db)
    alert_repo = AlertRepository(db)

    services = service_repo.get_all()
    total_active = alert_repo.get_all_active_alerts_count()

    health_list = [_build_service_health(s, metric_repo, alert_repo) for s in services]

    return DashboardOverview(
        total_services=len(services),
        total_active_alerts=total_active,
        services=health_list,
    )


@router.get("/{service_id}", response_model=ServiceHealth)
def get_service_health(service_id: str, db: Session = Depends(get_db)):
    service = ServiceRepository(db).get_by_id(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return _build_service_health(service, MetricRepository(db), AlertRepository(db))
