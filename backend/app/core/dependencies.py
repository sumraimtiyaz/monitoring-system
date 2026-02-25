"""
Dependency injection container for FastAPI.
"""
from typing import Annotated
from functools import lru_cache
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.service_repo import ServiceRepository
from app.repositories.metric_repo import MetricRepository
from app.repositories.alert_repo import AlertRepository


# Repository dependencies with proper lifecycle management
def get_service_repository(db: Annotated[Session, Depends(get_db)]) -> ServiceRepository:
    """Dependency injection for ServiceRepository."""
    return ServiceRepository(db)


def get_metric_repository(db: Annotated[Session, Depends(get_db)]) -> MetricRepository:
    """Dependency injection for MetricRepository."""
    return MetricRepository(db)


def get_alert_repository(db: Annotated[Session, Depends(get_db)]) -> AlertRepository:
    """Dependency injection for AlertRepository."""
    return AlertRepository(db)


# Type aliases for cleaner dependency injection
ServiceRepo = Annotated[ServiceRepository, Depends(get_service_repository)]
MetricRepo = Annotated[MetricRepository, Depends(get_metric_repository)]
AlertRepo = Annotated[AlertRepository, Depends(get_alert_repository)]

# Import Depends for FastAPI
from fastapi import Depends
