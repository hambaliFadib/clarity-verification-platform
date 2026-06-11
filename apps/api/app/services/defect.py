from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.defect import Defect
from app.models.defect_comment import DefectComment
from app.schemas.defect import DefectCommentCreate, DefectCreate, DefectUpdate


def generate_display_id(db: Session) -> str:
    result = db.execute(
        select(func.max(Defect.display_id)).where(Defect.display_id.like("CLR-DEF-%"))
    ).scalar()

    if result:
        try:
            max_num = int(result.split("-")[-1])
        except (ValueError, IndexError):
            max_num = 0
    else:
        max_num = 0

    return f"CLR-DEF-{max_num + 1:03d}"


def create_defect(db: Session, schema: DefectCreate) -> Defect:
    now = datetime.now(timezone.utc)
    db_defect = Defect(
        display_id=generate_display_id(db),
        title=schema.title,
        description=schema.description,
        severity=schema.severity,
        status=schema.status,
        type=schema.type,
        priority=schema.priority or schema.severity,
        assigned_to=schema.assigned_to,
        reported_by=schema.reported_by,
        linked_test_case=schema.linked_test_case,
        linked_test_run=schema.linked_test_run,
        environment=schema.environment,
        browser=schema.browser,
        steps_to_reproduce=schema.steps_to_reproduce,
        tags=schema.tags,
        resolved_at=now if schema.status in {"Resolved", "Closed"} else None,
    )

    db.add(db_defect)
    db.commit()
    db.refresh(db_defect)
    return db_defect


def get_defects(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    type_filter: str | None = None,
    priority: str | None = None,
) -> tuple[list[Defect], int]:
    query = db.query(Defect).filter(Defect.deleted_at.is_(None))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Defect.title.ilike(search_filter),
                Defect.description.ilike(search_filter),
                Defect.display_id.ilike(search_filter),
            )
        )

    if status and status.lower() != "all":
        query = query.filter(Defect.status.ilike(status))
    if severity:
        query = query.filter(Defect.severity.ilike(severity))
    if type_filter:
        query = query.filter(Defect.type.ilike(type_filter))
    if priority:
        query = query.filter(Defect.priority.ilike(priority))

    total = query.count()
    items = query.order_by(Defect.updated_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_defect_by_id(db: Session, display_id: str) -> Defect | None:
    return db.query(Defect).filter(
        Defect.display_id == display_id,
        Defect.deleted_at.is_(None),
    ).first()


def update_defect(db: Session, display_id: str, schema: DefectUpdate) -> Defect | None:
    db_defect = get_defect_by_id(db, display_id)
    if not db_defect:
        return None

    update_data = schema.model_dump(exclude_unset=True)
    next_status = update_data.get("status")
    if next_status in {"Resolved", "Closed"} and not update_data.get("resolved_at") and not db_defect.resolved_at:
        update_data["resolved_at"] = datetime.now(timezone.utc)
    elif next_status and next_status not in {"Resolved", "Closed"}:
        update_data["resolved_at"] = None

    for key, value in update_data.items():
        setattr(db_defect, key, value)

    db_defect.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_defect)
    return db_defect


def delete_defect(db: Session, display_id: str) -> bool:
    db_defect = get_defect_by_id(db, display_id)
    if not db_defect:
        return False

    db_defect.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True


def create_comment(db: Session, display_id: str, schema: DefectCommentCreate) -> DefectComment | None:
    db_defect = get_defect_by_id(db, display_id)
    if not db_defect:
        return None

    db_comment = DefectComment(
        defect_id=db_defect.id,
        author=schema.author,
        initials=schema.initials,
        text=schema.text,
    )
    db.add(db_comment)
    db_defect.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_comment)
    return db_comment
