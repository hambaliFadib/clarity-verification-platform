import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.models.test_case import TestCase
from app.models.test_step import TestStep
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate


def generate_display_id(db: Session) -> str:
    result = db.execute(
        select(func.max(TestCase.display_id)).where(
            TestCase.display_id.like("CLR-TC-%")
        )
    ).scalar()
    
    if result:
        try:
            max_num = int(result.split("-")[-1])
        except (ValueError, IndexError):
            max_num = 0
    else:
        max_num = 0
        
    return f"CLR-TC-{max_num + 1:03d}"


def create_test_case(db: Session, schema: TestCaseCreate, creator_id: uuid.UUID | None = None) -> TestCase:
    display_id = generate_display_id(db)
    
    db_tc = TestCase(
        display_id=display_id,
        title=schema.title,
        description=schema.description,
        module=schema.module,
        type=schema.type,
        severity=schema.severity,
        status=schema.status,
        assigned_to=schema.assigned_to,
        created_by=creator_id,
        requirement_id=schema.requirement_id,
        estimated_time=schema.estimated_time,
        tags=schema.tags,
        environment=schema.environment,
        automation_status=schema.automation_status,
        preconditions=schema.preconditions,
        expected_result=schema.expected_result,
        notes=schema.notes,
    )
    
    db.add(db_tc)
    db.flush()

    for idx, step_schema in enumerate(schema.test_steps):
        db_step = TestStep(
            test_case_id=db_tc.id,
            step_number=idx + 1,
            action=step_schema.action,
            status=step_schema.status or "Not Run",
            actual_result=step_schema.actual_result,
        )
        db.add(db_step)

    db.commit()
    db.refresh(db_tc)
    return db_tc


def get_test_cases(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    type_filter: str | None = None,
) -> tuple[list[TestCase], int]:
    query = db.query(TestCase).filter(TestCase.deleted_at.is_(None))
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                TestCase.title.ilike(search_filter),
                TestCase.module.ilike(search_filter),
                TestCase.display_id.ilike(search_filter)
            )
        )
        
    if status and status.lower() != "all":
        query = query.filter(TestCase.status.ilike(status))
        
    if severity:
        query = query.filter(TestCase.severity.ilike(severity))
        
    if type_filter:
        query = query.filter(TestCase.type.ilike(type_filter))
        
    total = query.count()
    items = query.order_by(TestCase.updated_at.desc()).offset(skip).limit(limit).all()
    
    return items, total


def get_test_case_by_id(db: Session, display_id: str) -> TestCase | None:
    return db.query(TestCase).filter(
        TestCase.display_id == display_id,
        TestCase.deleted_at.is_(None)
    ).first()


def update_test_case(db: Session, display_id: str, schema: TestCaseUpdate) -> TestCase | None:
    db_tc = db.query(TestCase).filter(
        TestCase.display_id == display_id,
        TestCase.deleted_at.is_(None)
    ).first()
    
    if not db_tc:
        return None
        
    update_data = schema.model_dump(exclude_unset=True)
    
    if "test_steps" in update_data:
        steps_data = update_data.pop("test_steps")
        db.query(TestStep).filter(TestStep.test_case_id == db_tc.id).delete()
        
        if steps_data:
            for idx, step_schema in enumerate(steps_data):
                db_step = TestStep(
                    test_case_id=db_tc.id,
                    step_number=idx + 1,
                    action=step_schema["action"],
                    status=step_schema.get("status") or "Not Run",
                    actual_result=step_schema.get("actual_result"),
                )
                db.add(db_step)
                
    for key, value in update_data.items():
        setattr(db_tc, key, value)
        
    db_tc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_tc)
    
    return db_tc


def delete_test_case(db: Session, display_id: str) -> bool:
    db_tc = db.query(TestCase).filter(
        TestCase.display_id == display_id,
        TestCase.deleted_at.is_(None)
    ).first()
    
    if not db_tc:
        return False
        
    db_tc.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
