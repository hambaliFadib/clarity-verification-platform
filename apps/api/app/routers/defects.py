from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.defect import (
    DefectCommentCreate,
    DefectCommentResponse,
    DefectCreate,
    DefectListResponse,
    DefectResponse,
    DefectUpdate,
)
from app.services import defect as defect_service

router = APIRouter(prefix="/defects", tags=["Defects"])


@router.get("", response_model=list[DefectListResponse])
def read_defects(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    type: str | None = None,
    priority: str | None = None,
    db: Session = Depends(get_db_session),
):
    items, total = defect_service.get_defects(
        db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        severity=severity,
        type_filter=type,
        priority=priority,
    )
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=DefectResponse, status_code=status.HTTP_201_CREATED)
def create_new_defect(schema: DefectCreate, db: Session = Depends(get_db_session)):
    return defect_service.create_defect(db, schema)


@router.get("/{display_id}", response_model=DefectResponse)
def read_defect(display_id: str, db: Session = Depends(get_db_session)):
    item = defect_service.get_defect_by_id(db, display_id)
    if not item:
        raise HTTPException(status_code=404, detail="Defect not found")
    return item


@router.patch("/{display_id}", response_model=DefectResponse)
def update_existing_defect(
    display_id: str,
    schema: DefectUpdate,
    db: Session = Depends(get_db_session),
):
    item = defect_service.update_defect(db, display_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Defect not found")
    return item


@router.delete("/{display_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_defect(display_id: str, db: Session = Depends(get_db_session)):
    success = defect_service.delete_defect(db, display_id)
    if not success:
        raise HTTPException(status_code=404, detail="Defect not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{display_id}/comments", response_model=DefectCommentResponse, status_code=status.HTTP_201_CREATED)
def create_defect_comment(
    display_id: str,
    schema: DefectCommentCreate,
    db: Session = Depends(get_db_session),
):
    item = defect_service.create_comment(db, display_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Defect not found")
    return item
