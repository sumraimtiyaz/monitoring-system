"""
Alerts API - endpoints for alert rules and alerts.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import AlertRuleCreate, AlertRuleOut, AlertOut
from app.repositories.alert_repo import AlertRepository
from app.repositories.service_repo import ServiceRepository

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/rules", response_model=AlertRuleOut, status_code=201)
def create_alert_rule(payload: AlertRuleCreate, db: Session = Depends(get_db)):
    """Create a new alert rule for a service."""
    service = ServiceRepository(db).get_by_id(payload.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    rule = AlertRepository(db).create_rule(
        service_id=payload.service_id,
        metric_name=payload.metric_name,
        operator=payload.operator,
        threshold=payload.threshold,
        consecutive_required=payload.consecutive_required,
    )
    return rule


@router.get("/rules", response_model=list[AlertRuleOut])
def list_alert_rules(service_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all alert rules, optionally filtered by service."""
    return AlertRepository(db).get_all_rules(service_id)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_alert_rule(rule_id: str, db: Session = Depends(get_db)):
    """Delete an alert rule."""
    deleted = AlertRepository(db).delete_rule(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")


@router.get("", response_model=list[AlertOut])
def list_active_alerts(service_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all active (FIRING) alerts, optionally filtered by service."""
    return AlertRepository(db).get_active_alerts(service_id)


@router.get("/{service_id}/history", response_model=list[AlertOut])
def alert_history(service_id: str, limit: int = Query(50, ge=1, le=500), db: Session = Depends(get_db)):
    """Get alert history for a specific service."""
    return AlertRepository(db).get_alerts_for_service(service_id, limit)
