from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services import project as project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectResponse])
def read_projects(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    items, total = project_service.get_projects(db, skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_new_project(schema: ProjectCreate, db: Session = Depends(get_db_session)):
    return project_service.create_project(db, schema)


@router.get("/{project_id}", response_model=ProjectResponse)
def read_project(project_id: str, db: Session = Depends(get_db_session)):
    item = project_service.get_project(db, project_id)
    if not item:
        raise HTTPException(status_code=404, detail="Project not found")
    return item


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_existing_project(
    project_id: str,
    schema: ProjectUpdate,
    db: Session = Depends(get_db_session),
):
    item = project_service.update_project(db, project_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Project not found")
    return item


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_project(project_id: str, db: Session = Depends(get_db_session)):
    success = project_service.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
