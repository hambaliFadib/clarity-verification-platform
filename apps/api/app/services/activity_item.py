from sqlalchemy.orm import Session

from app.models.activity_item import ActivityItem
from app.schemas.activity_item import ActivityItemCreate


def create_activity_item(db: Session, schema: ActivityItemCreate) -> ActivityItem:
    db_activity = ActivityItem(**schema.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def get_activity_items(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[ActivityItem], int]:
    query = db.query(ActivityItem)
    total = query.count()
    items = query.order_by(ActivityItem.created_at.desc()).offset(skip).limit(limit).all()
    return items, total
