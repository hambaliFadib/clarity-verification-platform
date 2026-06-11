from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.test_run import TestRun
from app.schemas.test_run import TestRunCreate, TestRunUpdate


def generate_display_id(db: Session) -> str:
    result = db.execute(
        select(func.max(TestRun.display_id)).where(TestRun.display_id.like("CLR-TR-%"))
    ).scalar()

    if result:
        try:
            max_num = int(result.split("-")[-1])
        except (ValueError, IndexError):
            max_num = 0
    else:
        max_num = 0

    return f"CLR-TR-{max_num + 1:03d}"


def create_test_run(db: Session, schema: TestRunCreate) -> TestRun:
    db_test_run = TestRun(display_id=generate_display_id(db), **schema.model_dump())
    db.add(db_test_run)
    db.commit()
    db.refresh(db_test_run)
    return db_test_run


def get_test_runs(db: Session, skip: int = 0, limit: int = 100, status: str | None = None) -> tuple[list[TestRun], int]:
    query = db.query(TestRun).filter(TestRun.deleted_at.is_(None))
    if status and status.lower() != "all":
        query = query.filter(TestRun.status.ilike(status))

    total = query.count()
    items = query.order_by(TestRun.updated_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_test_run_by_id(db: Session, display_id: str) -> TestRun | None:
    return db.query(TestRun).filter(
        TestRun.display_id == display_id,
        TestRun.deleted_at.is_(None),
    ).first()


def update_test_run(db: Session, display_id: str, schema: TestRunUpdate) -> TestRun | None:
    db_test_run = get_test_run_by_id(db, display_id)
    if not db_test_run:
        return None

    for key, value in schema.model_dump(exclude_unset=True).items():
        setattr(db_test_run, key, value)

    db_test_run.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_test_run)
    return db_test_run


def delete_test_run(db: Session, display_id: str) -> bool:
    db_test_run = get_test_run_by_id(db, display_id)
    if not db_test_run:
        return False

    db_test_run.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
