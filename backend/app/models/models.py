from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class AlertStatus(str, enum.Enum):
    FIRING = "FIRING"
    RESOLVED = "RESOLVED"


class AlertOperator(str, enum.Enum):
    GT = ">"
    LT = "<"


class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    metrics = relationship("Metric", back_populates="service", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="service", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="service", cascade="all, delete-orphan")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True, default=gen_uuid)
    service_id = Column(String, ForeignKey("services.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    service = relationship("Service", back_populates="metrics")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String, primary_key=True, default=gen_uuid)
    service_id = Column(String, ForeignKey("services.id"), nullable=False, index=True)
    metric_name = Column(String, nullable=False)
    operator = Column(String, nullable=False)   # ">" or "<"
    threshold = Column(Float, nullable=False)
    consecutive_required = Column(Integer, default=3)
    consecutive_count = Column(Integer, default=0)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    service = relationship("Service", back_populates="alert_rules")
    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    rule_id = Column(String, ForeignKey("alert_rules.id"), nullable=False, index=True)
    service_id = Column(String, ForeignKey("services.id"), nullable=False, index=True)
    status = Column(String, default=AlertStatus.FIRING)
    message = Column(Text, nullable=False)
    fired_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    rule = relationship("AlertRule", back_populates="alerts")
    service = relationship("Service", back_populates="alerts")
