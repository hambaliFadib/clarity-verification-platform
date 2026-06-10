from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.schemas.user import UserResponse
from app.services.user import get_users

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
def read_users(db: Session = Depends(get_db_session)):
    return get_users(db)
