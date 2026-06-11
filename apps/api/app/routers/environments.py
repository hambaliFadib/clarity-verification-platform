from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.environment import EnvironmentCreate, EnvironmentResponse, EnvironmentUpdate
from app.services import environment as environment_service

router = APIRouter(prefix="/environments", tags=["Environments"])


@router.get("", response_model=list[EnvironmentResponse])
def read_environments(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    db: Session = Depends(get_db_session),
):
    items, total = environment_service.get_environments(db, skip=skip, limit=limit, status=status)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=EnvironmentResponse, status_code=status.HTTP_201_CREATED)
def create_new_environment(schema: EnvironmentCreate, db: Session = Depends(get_db_session)):
    return environment_service.create_environment(db, schema)


@router.get("/{environment_id}", response_model=EnvironmentResponse)
def read_environment(environment_id: str, db: Session = Depends(get_db_session)):
    item = environment_service.get_environment(db, environment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Environment not found")
    return item


@router.patch("/{environment_id}", response_model=EnvironmentResponse)
def update_existing_environment(
    environment_id: str,
    schema: EnvironmentUpdate,
    db: Session = Depends(get_db_session),
):
    item = environment_service.update_environment(db, environment_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Environment not found")
    return item


@router.delete("/{environment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_environment(environment_id: str, db: Session = Depends(get_db_session)):
    success = environment_service.delete_environment(db, environment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Environment not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
