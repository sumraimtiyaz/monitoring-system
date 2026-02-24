from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import AlertRuleCreate, AlertRuleOut, AlertOut
from app.repositories.alert_repo import AlertRepository
from app.repositories.service_repo import ServiceRepository

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/rules", response_model=AlertRuleOut, status_code=201)
def create_alert_rule(payload: AlertRuleCreate, db: Session = Depends(get_db)):
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
def list_alert_rules(service_id: str | None = None, db: Session = Depends(get_db)):
    return AlertRepository(db).get_all_rules(service_id)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_alert_rule(rule_id: str, db: Session = Depends(get_db)):
    deleted = AlertRepository(db).delete_rule(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")


@router.get("", response_model=list[AlertOut])
def list_active_alerts(service_id: str | None = None, db: Session = Depends(get_db)):
    return AlertRepository(db).get_active_alerts(service_id)


@router.get("/{service_id}/history", response_model=list[AlertOut])
def alert_history(service_id: str, limit: int = 50, db: Session = Depends(get_db)):
    return AlertRepository(db).get_alerts_for_service(service_id, limit)
