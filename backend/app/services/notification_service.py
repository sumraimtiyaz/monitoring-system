import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from abc import ABC, abstractmethod
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationChannel(ABC):
    """Abstract base for notification channels — Slack, Webhooks, SMS can be added here."""

    @abstractmethod
    def send(self, subject: str, body: str) -> bool:
        ...


class SMTPNotificationChannel(NotificationChannel):
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.ALERT_FROM_EMAIL
        self.to_email = settings.ALERT_TO_EMAIL

    def send(self, subject: str, body: str) -> bool:
        if not self.user or not self.password:
            logger.info(f"[SMTP] No credentials configured — skipping email. Subject: {subject}")
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = self.to_email
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.host, self.port) as server:
                server.ehlo()
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.from_email, self.to_email, msg.as_string())
            logger.info(f"[SMTP] Email sent: {subject}")
            return True
        except Exception as e:
            logger.error(f"[SMTP] Failed to send email: {e}")
            return False


class LogNotificationChannel(NotificationChannel):
    """Always-on channel that logs alerts — useful when SMTP is not configured."""

    def send(self, subject: str, body: str) -> bool:
        logger.warning(f"[ALERT NOTIFICATION] {subject}\n{body}")
        return True


class NotificationService:
    """Dispatches alerts through all registered channels."""

    def __init__(self):
        self._channels: list[NotificationChannel] = [
            LogNotificationChannel(),
            SMTPNotificationChannel(),
        ]

    def add_channel(self, channel: NotificationChannel):
        self._channels.append(channel)

    def notify_alert_fired(self, service_name: str, metric_name: str,
                           operator: str, threshold: float, current_value: float):
        subject = f"[FIRING] {service_name} — {metric_name} {operator} {threshold}"
        body = (
            f"Alert fired for service: {service_name}\n"
            f"Metric:    {metric_name}\n"
            f"Condition: {metric_name} {operator} {threshold}\n"
            f"Current:   {current_value}\n"
        )
        for channel in self._channels:
            channel.send(subject, body)

    def notify_alert_resolved(self, service_name: str, metric_name: str,
                              operator: str, threshold: float, current_value: float):
        subject = f"[RESOLVED] {service_name} — {metric_name} back to normal"
        body = (
            f"Alert resolved for service: {service_name}\n"
            f"Metric:    {metric_name}\n"
            f"Condition: {metric_name} {operator} {threshold}\n"
            f"Current:   {current_value}\n"
        )
        for channel in self._channels:
            channel.send(subject, body)


# Singleton
notification_service = NotificationService()
