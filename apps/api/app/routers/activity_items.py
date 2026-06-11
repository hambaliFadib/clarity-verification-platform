from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.activity_item import ActivityItemCreate, ActivityItemResponse
from app.services import activity_item as activity_item_service

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=list[ActivityItemResponse])
def read_activity_items(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    items, total = activity_item_service.get_activity_items(db, skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=ActivityItemResponse, status_code=status.HTTP_201_CREATED)
def create_new_activity_item(schema: ActivityItemCreate, db: Session = Depends(get_db_session)):
    return activity_item_service.create_activity_item(db, schema)
