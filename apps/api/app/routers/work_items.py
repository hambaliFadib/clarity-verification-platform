from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.work_item import WorkItemCreate, WorkItemResponse, WorkItemUpdate
from app.services import work_item as work_item_service

router = APIRouter(prefix="/work-items", tags=["Work Items"])


@router.get("", response_model=list[WorkItemResponse])
def read_work_items(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    assigned_to: str | None = None,
    db: Session = Depends(get_db_session),
):
    items, total = work_item_service.get_work_items(
        db,
        skip=skip,
        limit=limit,
        status=status,
        assigned_to=assigned_to,
    )
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=WorkItemResponse, status_code=status.HTTP_201_CREATED)
def create_new_work_item(schema: WorkItemCreate, db: Session = Depends(get_db_session)):
    return work_item_service.create_work_item(db, schema)


@router.get("/{work_item_id}", response_model=WorkItemResponse)
def read_work_item(work_item_id: str, db: Session = Depends(get_db_session)):
    item = work_item_service.get_work_item(db, work_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return item


@router.patch("/{work_item_id}", response_model=WorkItemResponse)
def update_existing_work_item(
    work_item_id: str,
    schema: WorkItemUpdate,
    db: Session = Depends(get_db_session),
):
    item = work_item_service.update_work_item(db, work_item_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return item


@router.delete("/{work_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_work_item(work_item_id: str, db: Session = Depends(get_db_session)):
    success = work_item_service.delete_work_item(db, work_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Work item not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
