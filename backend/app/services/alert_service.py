import logging
from sqlalchemy.orm import Session
from app.repositories.alert_repo import AlertRepository
from app.repositories.service_repo import ServiceRepository
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


class AlertService:
    """
    Core alert evaluation engine.

    For each incoming metric:
    1. Fetch all enabled rules matching (service, metric_name)
    2. Evaluate whether the metric value breaches the threshold
    3. Increment or reset consecutive breach counter
    4. Fire or resolve alerts accordingly
    5. Dispatch notifications
    """

    def __init__(self, db: Session):
        self.db = db
        self.alert_repo = AlertRepository(db)
        self.service_repo = ServiceRepository(db)

    def _breaches(self, value: float, operator: str, threshold: float) -> bool:
        if operator == ">":
            return value > threshold
        if operator == "<":
            return value < threshold
        return False

    def evaluate(self, service_id: str, metric_name: str, value: float):
        rules = self.alert_repo.get_rules_for_service_metric(service_id, metric_name)
        service = self.service_repo.get_by_id(service_id)
        service_name = service.name if service else service_id

        for rule in rules:
            is_breach = self._breaches(value, rule.operator, rule.threshold)
            active_alert = self.alert_repo.get_active_alert_for_rule(rule.id)

            if is_breach:
                new_count = rule.consecutive_count + 1
                self.alert_repo.update_rule_count(rule, new_count)
                logger.debug(f"Rule {rule.id}: breach {new_count}/{rule.consecutive_required}")

                if new_count >= rule.consecutive_required and not active_alert:
                    message = (
                        f"{service_name}: {metric_name} is {value} "
                        f"({rule.operator} {rule.threshold}) for "
                        f"{rule.consecutive_required} consecutive readings"
                    )
                    self.alert_repo.create_alert(rule.id, service_id, message)
                    notification_service.notify_alert_fired(
                        service_name, metric_name, rule.operator, rule.threshold, value
                    )
                    logger.warning(f"[ALERT FIRED] {message}")
            else:
                # Metric is healthy — reset counter
                self.alert_repo.update_rule_count(rule, 0)

                if active_alert:
                    self.alert_repo.resolve_alert(active_alert)
                    notification_service.notify_alert_resolved(
                        service_name, metric_name, rule.operator, rule.threshold, value
                    )
                    logger.info(f"[ALERT RESOLVED] {service_name}/{metric_name}")
