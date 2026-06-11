from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.test_run import TestRunCreate, TestRunResponse, TestRunUpdate
from app.services import test_run as test_run_service

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
