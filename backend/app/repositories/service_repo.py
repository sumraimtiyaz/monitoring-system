from sqlalchemy.orm import Session
from app.models.models import Service
import uuid


class ServiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: str) -> Service | None:
        return self.db.query(Service).filter(Service.name == name).first()

    def get_by_id(self, service_id: str) -> Service | None:
        return self.db.query(Service).filter(Service.id == service_id).first()

    def get_all(self) -> list[Service]:
        return self.db.query(Service).order_by(Service.name).all()

    def create(self, name: str) -> Service:
        service = Service(id=str(uuid.uuid4()), name=name)
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        return service

    def get_or_create(self, name: str) -> Service:
        service = self.get_by_name(name)
        if not service:
            service = self.create(name)
        return service
