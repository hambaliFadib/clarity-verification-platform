from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.release import ReleaseCreate, ReleaseResponse, ReleaseUpdate
from app.services import release as release_service

router = APIRouter(prefix="/releases", tags=["Releases"])


@router.get("", response_model=list[ReleaseResponse])
def read_releases(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    source: str = "readiness",
    db: Session = Depends(get_db_session),
):
    if source == "stored":
        items, total = release_service.get_stored_releases(db, skip=skip, limit=limit)
    else:
        items = release_service.get_release_readiness(db)
        total = len(items)

    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return items


@router.post("", response_model=ReleaseResponse, status_code=status.HTTP_201_CREATED)
def create_new_release(schema: ReleaseCreate, db: Session = Depends(get_db_session)):
    return release_service.create_release(db, schema)


@router.get("/{release_id}", response_model=ReleaseResponse)
def read_release(release_id: str, db: Session = Depends(get_db_session)):
    item = release_service.get_release(db, release_id)
    if not item:
        raise HTTPException(status_code=404, detail="Release not found")
    return item


@router.patch("/{release_id}", response_model=ReleaseResponse)
def update_existing_release(
    release_id: str,
    schema: ReleaseUpdate,
    db: Session = Depends(get_db_session),
):
    item = release_service.update_release(db, release_id, schema)
    if not item:
        raise HTTPException(status_code=404, detail="Release not found")
    return item


@router.delete("/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_release(release_id: str, db: Session = Depends(get_db_session)):
    success = release_service.delete_release(db, release_id)
    if not success:
        raise HTTPException(status_code=404, detail="Release not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
