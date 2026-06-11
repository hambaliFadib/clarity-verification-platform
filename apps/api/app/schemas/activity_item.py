import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ActivityItemCreate(BaseModel):
    user: str = Field(..., min_length=2)
    user_initials: str = Field(..., min_length=1, max_length=5)
    action: str
    target_type: str
    target_id: str
    target_title: str | None = None
    detail: str | None = None


class ActivityItemResponse(BaseModel):
    id: uuid.UUID
    user: str
    user_initials: str
    action: str
    target_type: str
    target_id: str
    target_title: str | None = None
    detail: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
