from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.environment import Environment
from app.schemas.environment import EnvironmentCreate, EnvironmentUpdate


def create_environment(db: Session, schema: EnvironmentCreate) -> Environment:
    db_environment = Environment(**schema.model_dump())
    db.add(db_environment)
    db.commit()
    db.refresh(db_environment)
    return db_environment


def get_environments(db: Session, skip: int = 0, limit: int = 100, status: str | None = None) -> tuple[list[Environment], int]:
    query = db.query(Environment).filter(Environment.deleted_at.is_(None))
    if status and status.lower() != "all":
        query = query.filter(Environment.status.ilike(status))

    total = query.count()
    items = query.order_by(Environment.name.asc()).offset(skip).limit(limit).all()
    return items, total


def get_environment(db: Session, environment_id: str) -> Environment | None:
    return db.query(Environment).filter(
        Environment.id == environment_id,
        Environment.deleted_at.is_(None),
    ).first()


def update_environment(db: Session, environment_id: str, schema: EnvironmentUpdate) -> Environment | None:
    db_environment = get_environment(db, environment_id)
    if not db_environment:
        return None

    for key, value in schema.model_dump(exclude_unset=True).items():
        setattr(db_environment, key, value)

    db_environment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_environment)
    return db_environment


def delete_environment(db: Session, environment_id: str) -> bool:
    db_environment = get_environment(db, environment_id)
    if not db_environment:
        return False

    db_environment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
