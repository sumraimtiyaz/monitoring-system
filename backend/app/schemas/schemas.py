from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Metric ─────────────────────────────────────────────────────────────────
class MetricIngest(BaseModel):
    service: str
    name: str
    value: float
    timestamp: Optional[datetime] = None


class MetricOut(BaseModel):
    id: str
    service_id: str
    name: str
    value: float
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Service ─────────────────────────────────────────────────────────────────
class ServiceOut(BaseModel):
    id: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceHealth(BaseModel):
    id: str
    name: str
    status: str                          # Healthy | Degraded | Critical
    active_alerts: int
    latest_metrics: dict                 # {metric_name: value}
    created_at: datetime


# ── Alert Rules ──────────────────────────────────────────────────────────────
class AlertRuleCreate(BaseModel):
    service_id: str
    metric_name: str
    operator: str = Field(..., pattern="^[><]$")
    threshold: float
    consecutive_required: int = 3


class AlertRuleOut(BaseModel):
    id: str
    service_id: str
    metric_name: str
    operator: str
    threshold: float
    consecutive_required: int
    consecutive_count: int
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Alerts ───────────────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    rule_id: str
    service_id: str
    status: str
    message: str
    fired_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Dashboard ────────────────────────────────────────────────────────────────
class DashboardOverview(BaseModel):
    total_services: int
    total_active_alerts: int
    services: List[ServiceHealth]
