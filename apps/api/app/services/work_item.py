from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate


def create_work_item(db: Session, schema: WorkItemCreate) -> WorkItem:
    db_work_item = WorkItem(**schema.model_dump())
    db.add(db_work_item)
    db.commit()
    db.refresh(db_work_item)
    return db_work_item


def get_work_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    assigned_to: str | None = None,
) -> tuple[list[WorkItem], int]:
    query = db.query(WorkItem).filter(WorkItem.deleted_at.is_(None))
    if status and status.lower() != "all":
        query = query.filter(WorkItem.status.ilike(status))
    if assigned_to:
        query = query.filter(WorkItem.assigned_to.ilike(assigned_to))

    total = query.count()
    items = query.order_by(WorkItem.updated_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_work_item(db: Session, work_item_id: str) -> WorkItem | None:
    return db.query(WorkItem).filter(
        WorkItem.id == work_item_id,
        WorkItem.deleted_at.is_(None),
    ).first()


def update_work_item(db: Session, work_item_id: str, schema: WorkItemUpdate) -> WorkItem | None:
    db_work_item = get_work_item(db, work_item_id)
    if not db_work_item:
        return None

    for key, value in schema.model_dump(exclude_unset=True).items():
        setattr(db_work_item, key, value)

    db_work_item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_work_item)
    return db_work_item


def delete_work_item(db: Session, work_item_id: str) -> bool:
    db_work_item = get_work_item(db, work_item_id)
    if not db_work_item:
        return False

    db_work_item.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
