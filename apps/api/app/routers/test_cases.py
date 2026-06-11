from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate, TestCaseResponse, TestCaseListResponse
from app.services import test_case as test_case_service

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])


@router.get("", response_model=list[TestCaseListResponse])
def read_test_cases(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db_session)
):
    items, total = test_case_service.get_test_cases(
        db, skip=skip, limit=limit, search=search, status=status, priority=priority, type_filter=type
    )
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_new_test_case(
    schema: TestCaseCreate,
    db: Session = Depends(get_db_session)
):
    return test_case_service.create_test_case(db, schema)


@router.get("/{display_id}", response_model=TestCaseResponse)
def read_test_case(display_id: str, db: Session = Depends(get_db_session)):
    item = test_case_service.get_test_case_by_id(db, display_id)
    if not item:
        raise HTTPException(status_code=404, detail="Test case not found")
    return item


@router.patch("/{display_id}", response_model=TestCaseResponse)
def update_existing_test_case(
    display_id: str,
    schema: TestCaseUpdate,
    db: Session = Depends(get_db_session)
):
    item = test_case_service.update_test_case(db, display_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Test case not found")
    return item


@router.delete("/{display_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_test_case(display_id: str, db: Session = Depends(get_db_session)):
    success = test_case_service.delete_test_case(db, display_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test case not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
