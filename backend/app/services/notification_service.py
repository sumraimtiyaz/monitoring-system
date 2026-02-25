"""
Notification Service - dispatches alerts through multiple channels.
"""
import smtplib
import logging
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationChannel(ABC):
    """Abstract base for notification channels — Slack, Webhooks, SMS can be added here."""
    
    @abstractmethod
    def send(self, subject: str, body: str) -> bool:
        """Send a notification. Returns True if successful, False otherwise."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the channel name for logging purposes."""
        pass


class SMTPNotificationChannel(NotificationChannel):
    """Email notification channel using SMTP."""
    
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.ALERT_FROM_EMAIL
        self.to_email = settings.ALERT_TO_EMAIL
    
    @property
    def name(self) -> str:
        return "SMTP"
    
    def send(self, subject: str, body: str) -> bool:
        """Send an email notification via SMTP."""
        if not self.user or not self.password:
            logger.info(f"[{self.name}] No credentials configured — skipping email. Subject: {subject}")
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
            
            logger.info(f"[{self.name}] Email sent: {subject}")
            return True
        except Exception as e:
            logger.error(f"[{self.name}] Failed to send email: {e}")
            return False


class LogNotificationChannel(NotificationChannel):
    """Always-on channel that logs alerts — useful when SMTP is not configured."""
    
    @property
    def name(self) -> str:
        return "Log"
    
    def send(self, subject: str, body: str) -> bool:
        """Log the notification."""
        logger.warning(f"[ALERT NOTIFICATION] {subject}\n{body}")
        return True


class WebhookNotificationChannel(NotificationChannel):
    """Webhook notification channel for generic HTTP callbacks."""
    
    def __init__(self, webhook_url: str = ""):
        self.webhook_url = webhook_url or settings.WEBHOOK_URL if hasattr(settings, 'WEBHOOK_URL') else ""
    
    @property
    def name(self) -> str:
        return "Webhook"
    
    def send(self, subject: str, body: str) -> bool:
        """Send a webhook notification."""
        if not self.webhook_url:
            logger.debug(f"[{self.name}] No webhook URL configured — skipping")
            return False
        
        # Placeholder for webhook implementation
        # In production, implement actual HTTP POST to webhook URL
        logger.info(f"[{self.name}] Would send: {subject}")
        return True


class NotificationService:
    """Dispatches alerts through all registered channels."""
    
    def __init__(self):
        self._channels: list[NotificationChannel] = [
            LogNotificationChannel(),
            SMTPNotificationChannel(),
        ]
    
    def add_channel(self, channel: NotificationChannel) -> None:
        """Add a new notification channel."""
        self._channels.append(channel)
    
    def remove_channel(self, channel_name: str) -> bool:
        """Remove a notification channel by name. Returns True if removed."""
        for i, channel in enumerate(self._channels):
            if channel.name == channel_name:
                self._channels.pop(i)
                return True
        return False
    
    def _dispatch(self, subject: str, body: str) -> None:
        """Dispatch a notification to all channels."""
        for channel in self._channels:
            try:
                channel.send(subject, body)
            except Exception as e:
                logger.error(f"[{channel.name}] Error sending notification: {e}")
    
    def notify_alert_fired(self, service_name: str, metric_name: str,
                           operator: str, threshold: float, current_value: float) -> None:
        """Send notification when an alert fires."""
        subject = f"[FIRING] {service_name} — {metric_name} {operator} {threshold}"
        body = self._format_alert_message(
            service_name=service_name,
            metric_name=metric_name,
            operator=operator,
            threshold=threshold,
            current_value=current_value,
            alert_type="fired"
        )
        self._dispatch(subject, body)

    def notify_alert_resolved(self, service_name: str, metric_name: str,
                              operator: str, threshold: float, current_value: float) -> None:
        """Send notification when an alert is resolved."""
        subject = f"[RESOLVED] {service_name} — {metric_name} back to normal"
        body = self._format_alert_message(
            service_name=service_name,
            metric_name=metric_name,
            operator=operator,
            threshold=threshold,
            current_value=current_value,
            alert_type="resolved"
        )
        self._dispatch(subject, body)
    
    @staticmethod
    def _format_alert_message(service_name: str, metric_name: str,
                              operator: str, threshold: float,
                              current_value: float, alert_type: str) -> str:
        """Format the alert message body."""
        return (
            f"Alert {alert_type} for service: {service_name}\n"
            f"Metric:    {metric_name}\n"
            f"Condition: {metric_name} {operator} {threshold}\n"
            f"Current:   {current_value}\n"
        )


# Singleton instance
notification_service = NotificationService()
