from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(db: Session, schema: ProjectCreate) -> Project:
    db_project = Project(**schema.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_projects(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[Project], int]:
    query = db.query(Project).filter(Project.deleted_at.is_(None))
    total = query.count()
    items = query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_project(db: Session, project_id: str) -> Project | None:
    return db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at.is_(None),
    ).first()


def update_project(db: Session, project_id: str, schema: ProjectUpdate) -> Project | None:
    db_project = get_project(db, project_id)
    if not db_project:
        return None

    for key, value in schema.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)

    db_project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: str) -> bool:
    db_project = get_project(db, project_id)
    if not db_project:
        return False

    db_project.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
