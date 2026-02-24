from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import AlertRule, Alert, AlertStatus
from datetime import datetime, timezone
import uuid


class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── Rules ────────────────────────────────────────────────────────────────
    def create_rule(self, service_id: str, metric_name: str, operator: str,
                    threshold: float, consecutive_required: int = 3) -> AlertRule:
        rule = AlertRule(
            id=str(uuid.uuid4()),
            service_id=service_id,
            metric_name=metric_name,
            operator=operator,
            threshold=threshold,
            consecutive_required=consecutive_required,
        )
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def get_rules_for_service_metric(self, service_id: str, metric_name: str) -> list[AlertRule]:
        return (
            self.db.query(AlertRule)
            .filter(AlertRule.service_id == service_id, AlertRule.metric_name == metric_name, AlertRule.enabled == True)
            .all()
        )

    def get_all_rules(self, service_id: str | None = None) -> list[AlertRule]:
        q = self.db.query(AlertRule)
        if service_id:
            q = q.filter(AlertRule.service_id == service_id)
        return q.order_by(AlertRule.created_at.desc()).all()

    def update_rule_count(self, rule: AlertRule, count: int):
        rule.consecutive_count = count
        self.db.commit()

    def delete_rule(self, rule_id: str) -> bool:
        rule = self.db.query(AlertRule).filter(AlertRule.id == rule_id).first()
        if not rule:
            return False
        self.db.delete(rule)
        self.db.commit()
        return True

    # ── Alerts ───────────────────────────────────────────────────────────────
    def get_active_alert_for_rule(self, rule_id: str) -> Alert | None:
        return (
            self.db.query(Alert)
            .filter(Alert.rule_id == rule_id, Alert.status == AlertStatus.FIRING)
            .first()
        )

    def create_alert(self, rule_id: str, service_id: str, message: str) -> Alert:
        alert = Alert(
            id=str(uuid.uuid4()),
            rule_id=rule_id,
            service_id=service_id,
            status=AlertStatus.FIRING,
            message=message,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def resolve_alert(self, alert: Alert) -> Alert:
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_alerts_for_service(self, service_id: str, limit: int = 50) -> list[Alert]:
        return (
            self.db.query(Alert)
            .filter(Alert.service_id == service_id)
            .order_by(desc(Alert.fired_at))
            .limit(limit)
            .all()
        )

    def get_active_alerts(self, service_id: str | None = None) -> list[Alert]:
        q = self.db.query(Alert).filter(Alert.status == AlertStatus.FIRING)
        if service_id:
            q = q.filter(Alert.service_id == service_id)
        return q.order_by(desc(Alert.fired_at)).all()

    def get_all_active_alerts_count(self) -> int:
        return self.db.query(Alert).filter(Alert.status == AlertStatus.FIRING).count()
