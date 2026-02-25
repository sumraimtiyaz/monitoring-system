"""
Alert Service - Core alert evaluation engine.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.alert_repo import AlertRepository
from app.repositories.service_repo import ServiceRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AlertService:
    """
    Core alert evaluation engine.
    
    Responsibilities:
    1. Fetch all enabled rules matching (service, metric_name)
    2. Evaluate whether the metric value breaches the threshold
    3. Increment or reset consecutive breach counter
    4. Fire or resolve alerts accordingly
    5. Dispatch notifications
    """

    def __init__(self, db: Session, notification_service: Optional[NotificationService] = None):
        self.db = db
        self.alert_repo = AlertRepository(db)
        self.service_repo = ServiceRepository(db)
        self.notification_service = notification_service

    @staticmethod
    def evaluate_condition(value: float, operator: str, threshold: float) -> bool:
        """Evaluate if a value breaches a threshold based on the operator."""
        if operator == ">":
            return value > threshold
        if operator == "<":
            return value < threshold
        return False

    def evaluate(self, service_id: str, metric_name: str, value: float) -> None:
        """Evaluate a metric against all applicable alert rules."""
        rules = self.alert_repo.get_rules_for_service_metric(service_id, metric_name)
        service = self.service_repo.get_by_id(service_id)
        service_name = service.name if service else service_id

        for rule in rules:
            self._evaluate_rule(rule, metric_name, value, service_name)

    def _evaluate_rule(self, rule, metric_name: str, value: float, service_name: str) -> None:
        """Evaluate a single alert rule."""
        is_breach = self.evaluate_condition(value, rule.operator, rule.threshold)
        active_alert = self.alert_repo.get_active_alert_for_rule(rule.id)

        if is_breach:
            self._handle_breach(rule, metric_name, value, service_name, active_alert)
        else:
            self._handle_healthy(rule, metric_name, value, service_name, active_alert)

    def _handle_breach(self, rule, metric_name: str, value: float, 
                       service_name: str, active_alert) -> None:
        """Handle a threshold breach."""
        new_count = rule.consecutive_count + 1
        self.alert_repo.update_rule_count(rule, new_count)
        logger.debug(f"Rule {rule.id}: breach {new_count}/{rule.consecutive_required}")

        if new_count >= rule.consecutive_required and not active_alert:
            message = (
                f"{service_name}: {metric_name} is {value} "
                f"({rule.operator} {rule.threshold}) for "
                f"{rule.consecutive_required} consecutive readings"
            )
            self.alert_repo.create_alert(rule.id, service_id=rule.service_id, message=message)
            self._send_fired_notification(service_name, metric_name, rule.operator, 
                                          rule.threshold, value)
            logger.warning(f"[ALERT FIRED] {message}")

    def _handle_healthy(self, rule, metric_name: str, value: float,
                        service_name: str, active_alert) -> None:
        """Handle a healthy metric (no breach)."""
        # Reset counter when metric is healthy
        self.alert_repo.update_rule_count(rule, 0)

        if active_alert:
            self.alert_repo.resolve_alert(active_alert)
            self._send_resolved_notification(service_name, metric_name, rule.operator,
                                            rule.threshold, value)
            logger.info(f"[ALERT RESOLVED] {service_name}/{metric_name}")

    def _send_fired_notification(self, service_name: str, metric_name: str,
                                  operator: str, threshold: float, current_value: float) -> None:
        """Send notification when an alert fires."""
        if self.notification_service:
            self.notification_service.notify_alert_fired(
                service_name, metric_name, operator, threshold, current_value
            )

    def _send_resolved_notification(self, service_name: str, metric_name: str,
                                    operator: str, threshold: float, current_value: float) -> None:
        """Send notification when an alert is resolved."""
        if self.notification_service:
            self.notification_service.notify_alert_resolved(
                service_name, metric_name, operator, threshold, current_value
            )
