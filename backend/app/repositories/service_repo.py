"""
Service Repository - handles database operations for services.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Service
from app.repositories.base import BaseRepository


class ServiceRepository(BaseRepository[Service]):
    """Repository for Service model operations."""
    
    def __init__(self, db: Session):
        super().__init__(db, Service)
    
    def get_by_name(self, name: str) -> Optional[Service]:
        """Get a service by its name."""
        return self.db.query(Service).filter(Service.name == name).first()
    
    def get_all_ordered(self) -> List[Service]:
        """Get all services ordered by name."""
        return self.db.query(Service).order_by(Service.name).all()
    
    def get_or_create(self, name: str) -> Service:
        """Get a service by name or create it if it doesn't exist."""
        service = self.get_by_name(name)
        if not service:
            service = self.create(id=self._generate_id(), name=name)
        return service
    
    def _generate_id(self) -> str:
        """Generate a unique ID for a new service."""
        import uuid
        return str(uuid.uuid4())
    
    # Override get_all to use ordered version by default
    def get_all(self) -> List[Service]:
        """Get all services ordered by name."""
        return self.get_all_ordered()
