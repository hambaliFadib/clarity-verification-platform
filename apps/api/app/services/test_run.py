from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.test_run import TestRun
from app.models.test_run_execution import (
    TestRunTestCase,
    TestRunExecution,
    TestRunEvidence,
)
from app.models.test_case import TestCase
from app.schemas.test_run import TestRunCreate, TestRunUpdate
import uuid


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


def sync_test_run_counters(db: Session, run: TestRun) -> None:
    test_cases = db.scalars(
        select(TestRunTestCase).where(TestRunTestCase.test_run_id == run.id)
    ).all()
    run.total_cases = len(test_cases)
    run.passed = len([tc for tc in test_cases if tc.status == "Passed"])
    run.failed = len([tc for tc in test_cases if tc.status == "Failed"])
    run.blocked = len([tc for tc in test_cases if tc.status == "Blocked"])
    run.not_run = len([tc for tc in test_cases if tc.status in {"Not Started", "Not Run"}])


def start_test_run(db: Session, run_id: uuid.UUID) -> TestRun | None:
    """Start a test run."""
    run = db.get(TestRun, run_id)
    if not run:
        return None

    now = datetime.now(timezone.utc)
    run.status = "Running"
    run.started_at = run.started_at or now
    run.completed_at = None
    run.updated_at = now
    db.commit()
    db.refresh(run)
    return run


def abort_test_run(db: Session, run_id: uuid.UUID) -> TestRun | None:
    """Abort a test run."""
    run = db.get(TestRun, run_id)
    if not run:
        return None

    now = datetime.now(timezone.utc)
    run.status = "Aborted"
    run.completed_at = now
    run.updated_at = now
    db.commit()
    db.refresh(run)
    return run


def complete_test_run(db: Session, run_id: uuid.UUID) -> TestRun | None:
    """Complete a test run and calculate pass rate."""
    run = db.get(TestRun, run_id)
    if not run:
        return None

    sync_test_run_counters(db, run)
    now = datetime.now(timezone.utc)
    run.status = "Completed"
    run.completed_at = now
    run.updated_at = now
    db.commit()
    db.refresh(run)
    return run


def add_test_cases_to_run(
    db: Session,
    run_id: uuid.UUID,
    test_case_ids: list[uuid.UUID],
) -> list[TestRunTestCase]:
    """Add test cases to a run."""
    existing = db.scalars(
        select(TestRunTestCase)
        .where(TestRunTestCase.test_run_id == run_id)
    ).all()
    existing_tc_ids = {tc.test_case_id for tc in existing}
    valid_tc_ids = set(
        db.scalars(select(TestCase.id).where(TestCase.id.in_(test_case_ids))).all()
    )
    next_order = max((tc.execution_order for tc in existing), default=0) + 1

    new_cases = []
    for i, tc_id in enumerate(test_case_ids):
        if tc_id in valid_tc_ids and tc_id not in existing_tc_ids:
            case = TestRunTestCase(
                test_run_id=run_id,
                test_case_id=tc_id,
                execution_order=next_order + i,
                status="Not Started",
            )
            db.add(case)
            new_cases.append(case)

    run = db.get(TestRun, run_id)
    if run:
        run.total_cases = len(existing) + len(new_cases)
        run.not_run = run.total_cases - run.passed - run.failed - run.blocked
        run.updated_at = datetime.now(timezone.utc)

    db.commit()
    return new_cases


def execute_single_case(
    db: Session,
    run_id: uuid.UUID,
    run_test_case_id: uuid.UUID,
    status: str,
    actual_result: str | None = None,
) -> TestRunTestCase | None:
    """Execute a single test case."""
    case = db.scalar(
        select(TestRunTestCase).where(
            TestRunTestCase.id == run_test_case_id,
            TestRunTestCase.test_run_id == run_id,
        )
    )
    if not case:
        return None

    now = datetime.now(timezone.utc)
    case.status = status
    case.actual_result = actual_result
    case.started_at = case.started_at or now
    case.completed_at = now

    if case.started_at and case.completed_at:
        duration = case.completed_at - case.started_at
        case.duration_ms = int(duration.total_seconds() * 1000)

    run = db.get(TestRun, run_id)
    if run:
        sync_test_run_counters(db, run)
        run.updated_at = now

    db.commit()
    db.refresh(case)
    return case


def record_step_result(
    db: Session,
    run_test_case_id: uuid.UUID,
    test_step_id: uuid.UUID,
    action: str,
    expected: str,
    actual: str | None,
    status: str,
) -> TestRunExecution:
    """Record result for a single step."""
    execution = TestRunExecution(
        test_run_test_case_id=run_test_case_id,
        test_step_id=test_step_id,
        action=action,
        expected=expected,
        actual=actual,
        status=status,
        executed_at=datetime.now(timezone.utc),
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution


def upload_evidence(
    db: Session,
    run_id: uuid.UUID,
    test_run_test_case_id: uuid.UUID | None,
    evidence_type: str,
    file_url: str,
    details: dict | None = None,
) -> TestRunEvidence | None:
    """Upload evidence for a test run."""
    if not db.get(TestRun, run_id):
        return None
    if test_run_test_case_id:
        run_case = db.scalar(
            select(TestRunTestCase).where(
                TestRunTestCase.id == test_run_test_case_id,
                TestRunTestCase.test_run_id == run_id,
            )
        )
        if not run_case:
            return None

    evidence = TestRunEvidence(
        test_run_id=run_id,
        test_run_test_case_id=test_run_test_case_id,
        type=evidence_type,
        file_url=file_url,
        details=details,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


def get_run_report(db: Session, run_id: uuid.UUID) -> dict | None:
    """Get detailed run report."""
    run = db.get(TestRun, run_id)
    if not run:
        return None

    # Get test cases with results
    test_cases = db.scalars(
        select(TestRunTestCase)
        .where(TestRunTestCase.test_run_id == run_id)
        .order_by(TestRunTestCase.execution_order)
    ).all()

    # Get evidence
    evidence = db.scalars(
        select(TestRunEvidence)
        .where(TestRunEvidence.test_run_id == run_id)
    ).all()

    passed = len([tc for tc in test_cases if tc.status == "Passed"])
    failed = len([tc for tc in test_cases if tc.status == "Failed"])
    blocked = len([tc for tc in test_cases if tc.status == "Blocked"])
    not_run = len([tc for tc in test_cases if tc.status in {"Not Started", "Not Run"}])
    duration_ms = None
    if run.started_at and run.completed_at:
        duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)

    return {
        "run": {
            "id": str(run.id),
            "displayId": run.display_id,
            "name": run.name,
            "status": run.status,
            "type": run.type,
            "environment": run.environment,
            "release": run.release,
            "startedAt": run.started_at.isoformat() if run.started_at else None,
            "completedAt": run.completed_at.isoformat() if run.completed_at else None,
            "durationMs": duration_ms,
            "totalCases": len(test_cases),
            "passed": passed,
            "failed": failed,
            "blocked": blocked,
            "notRun": not_run,
            "passRate": round(passed / len(test_cases) * 100, 2) if len(test_cases) > 0 else 0,
        },
        "testCases": [
            {
                "id": str(tc.id),
                "testCaseId": str(tc.test_case_id),
                "status": tc.status,
                "actualResult": tc.actual_result,
                "startedAt": tc.started_at.isoformat() if tc.started_at else None,
                "completedAt": tc.completed_at.isoformat() if tc.completed_at else None,
                "durationMs": tc.duration_ms,
            }
            for tc in test_cases
        ],
        "evidence": [
            {
                "id": str(e.id),
                "type": e.type,
                "fileUrl": e.file_url,
                "details": e.details,
                "createdAt": e.created_at.isoformat(),
            }
            for e in evidence
        ],
    }
