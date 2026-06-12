from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import re

from app.db.session import get_db_session
from app.models.user import User

router = APIRouter(prefix="/users/oauth", tags=["Auth"])

class OAuthGoogleRequest(BaseModel):
    google_id: str
    email: str
    name: str
    avatar: str | None = None

@router.post("/google")
def sync_google_user(data: OAuthGoogleRequest, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        parts = data.name.split()
        initials = (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()
        initials = re.sub(r"[^A-Z]", "", initials)[:2]
        if not initials:
            initials = "U"

        user = User(
            name=data.name,
            email=data.email,
            role="Viewer",
            initials=initials,
            avatar=data.avatar,
            google_id=data.google_id,
            email_verified=True,
            is_active=True,
            last_login=datetime.now(timezone.utc),
        )
        db.add(user)
    else:
        if not user.google_id:
            user.google_id = data.google_id
        user.name = data.name or user.name
        user.avatar = data.avatar or user.avatar
        user.email_verified = True
        user.is_active = True
        user.last_login = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "initials": user.initials,
        "avatar": user.avatar
    }
