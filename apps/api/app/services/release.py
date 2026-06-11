from datetime import date, datetime, timedelta, timezone

from sqlalchemy import false
from sqlalchemy.orm import Session

from app.models.defect import Defect
from app.models.release import Release
from app.models.test_case import TestCase
from app.schemas.release import ReleaseCreate, ReleaseUpdate


def create_release(db: Session, schema: ReleaseCreate) -> Release:
    db_release = Release(**schema.model_dump())
    db.add(db_release)
    db.commit()
    db.refresh(db_release)
    return db_release


def get_stored_releases(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[Release], int]:
    query = db.query(Release).filter(Release.deleted_at.is_(None))
    total = query.count()
    items = query.order_by(Release.target_date.asc()).offset(skip).limit(limit).all()
    return items, total


def get_release(db: Session, release_id: str) -> Release | None:
    return db.query(Release).filter(
        Release.id == release_id,
        Release.deleted_at.is_(None),
    ).first()


def update_release(db: Session, release_id: str, schema: ReleaseUpdate) -> Release | None:
    db_release = get_release(db, release_id)
    if not db_release:
        return None

    for key, value in schema.model_dump(exclude_unset=True).items():
        setattr(db_release, key, value)

    db_release.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_release)
    return db_release


def delete_release(db: Session, release_id: str) -> bool:
    db_release = get_release(db, release_id)
    if not db_release:
        return False

    db_release.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True


def get_release_readiness(db: Session) -> list[dict]:
    modules = [
        row[0]
        for row in db.query(TestCase.module)
        .filter(TestCase.deleted_at.is_(None))
        .distinct()
        .order_by(TestCase.module.asc())
        .all()
    ]
    today = date.today()
    start_date = today.replace(day=1)
    target_date = today + timedelta(days=30)
    readiness = []

    for index, module in enumerate(modules):
        module_tests = db.query(TestCase).filter(
            TestCase.module == module,
            TestCase.deleted_at.is_(None),
        ).all()
        test_ids = [item.display_id for item in module_tests]
        passed_tests = sum(1 for item in module_tests if item.status in {"Approved", "Ready"})

        defect_query = db.query(Defect).filter(Defect.deleted_at.is_(None))
        if test_ids:
            defect_query = defect_query.filter(Defect.linked_test_case.in_(test_ids))
        else:
            defect_query = defect_query.filter(false())
        module_defects = defect_query.all()

        open_defects = sum(1 for item in module_defects if item.status in {"Open", "In Progress", "Blocked", "Reopened"})
        critical_defects = sum(1 for item in module_defects if item.severity == "Critical")
        status = "Planning"
        if module_tests and passed_tests == len(module_tests):
            status = "Released"
        elif passed_tests > 0:
            status = "In Progress"

        readiness.append(
            {
                "id": f"module-{index + 1}",
                "version": f"{module[:3].upper()}-REL",
                "name": f"{module} Module",
                "status": status,
                "start_date": start_date,
                "target_date": target_date,
                "release_date": None,
                "description": f"Aggregated release readiness for the {module} module based on current test cases.",
                "total_test_cases": len(module_tests),
                "passed_test_cases": passed_tests,
                "total_defects": len(module_defects),
                "open_defects": open_defects,
                "critical_defects": critical_defects,
                "created_at": None,
                "updated_at": None,
            }
        )

    return sorted(readiness, key=lambda item: item["total_test_cases"], reverse=True)
