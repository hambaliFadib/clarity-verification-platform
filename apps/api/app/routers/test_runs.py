from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.test_run import TestRun
from app.schemas.test_run import TestRunCreate, TestRunResponse, TestRunUpdate
from app.services import test_run as test_run_service
import uuid
from typing import Any

router = APIRouter(prefix="/test-runs", tags=["Test Runs"])


@router.get("", response_model=list[TestRunResponse])
def read_test_runs(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    db: Session = Depends(get_db_session),
):
    items, total = test_run_service.get_test_runs(db, skip=skip, limit=limit, status=status)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=TestRunResponse, status_code=status.HTTP_201_CREATED)
def create_new_test_run(schema: TestRunCreate, db: Session = Depends(get_db_session)):
    return test_run_service.create_test_run(db, schema)


@router.get("/{display_id}", response_model=TestRunResponse)
def read_test_run(display_id: str, db: Session = Depends(get_db_session)):
    item = test_run_service.get_test_run_by_id(db, display_id)
    if not item:
        raise HTTPException(status_code=404, detail="Test run not found")
    return item


@router.patch("/{display_id}", response_model=TestRunResponse)
def update_existing_test_run(
    display_id: str,
    schema: TestRunUpdate,
    db: Session = Depends(get_db_session),
):
    item = test_run_service.update_test_run(db, display_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Test run not found")
    return item


@router.delete("/{display_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_test_run(display_id: str, db: Session = Depends(get_db_session)):
    success = test_run_service.delete_test_run(db, display_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test run not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{run_id}/start", response_model=TestRunResponse)
def start_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Start a test run."""
    from app.services.test_run import start_test_run
    run = start_test_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    return run


@router.post("/{run_id}/abort", response_model=TestRunResponse)
def abort_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Abort a test run."""
    from app.services.test_run import abort_test_run
    run = abort_test_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    return run


@router.post("/{run_id}/complete", response_model=TestRunResponse)
def complete_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Complete a test run."""
    from app.services.test_run import complete_test_run
    run = complete_test_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")
    return run


@router.post("/{run_id}/cases", status_code=status.HTTP_201_CREATED)
def add_cases(
    run_id: uuid.UUID,
    test_case_ids: list[uuid.UUID] = Body(...),
    db: Session = Depends(get_db_session),
) -> Any:
    """Add test cases to a run."""
    from app.services.test_run import add_test_cases_to_run
    run = db.get(TestRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found")

    cases = add_test_cases_to_run(db, run_id, test_case_ids)
    return {"message": f"Added {len(cases)} test cases"}


@router.post("/{run_id}/cases/{case_id}/execute")
def execute_case(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    status_value: str = Body(..., embed=True),
    actual_result: str | None = Body(None, embed=True),
    db: Session = Depends(get_db_session),
) -> Any:
    """Execute a single test case."""
    from app.services.test_run import execute_single_case
    case = execute_single_case(db, run_id, case_id, status_value, actual_result)
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return {"message": "Test case executed", "status": case.status}


@router.post("/{run_id}/evidence", status_code=status.HTTP_201_CREATED)
def add_evidence(
    run_id: uuid.UUID,
    payload: dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db_session),
) -> Any:
    """Upload evidence."""
    from app.services.test_run import upload_evidence
    test_run_test_case_id = payload.get("test_run_test_case_id") or payload.get("testRunTestCaseId")
    evidence_type = payload.get("evidence_type") or payload.get("type") or "Screenshot"
    file_url = payload.get("file_url") or payload.get("fileUrl")
    if not file_url:
        raise HTTPException(status_code=400, detail="file_url is required")
    if test_run_test_case_id:
        test_run_test_case_id = uuid.UUID(str(test_run_test_case_id))
    details = payload.get("details")
    evidence = upload_evidence(db, run_id, test_run_test_case_id, evidence_type, file_url, details)
    if not evidence:
        raise HTTPException(status_code=404, detail="Test run not found")
    return {"message": "Evidence uploaded", "id": str(evidence.id)}


@router.get("/{run_id}/report")
def get_report(
    run_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Get run report."""
    from app.services.test_run import get_run_report
    report = get_run_report(db, run_id)
    if not report:
        raise HTTPException(status_code=404, detail="Test run not found")
    return report
