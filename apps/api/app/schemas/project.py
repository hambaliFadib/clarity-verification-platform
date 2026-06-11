import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2)
    prefix: str = Field(..., min_length=2, max_length=12)
    description: str | None = None
    default_priority: str = "Medium"


class ProjectUpdate(BaseModel):
    name: str | None = None
    prefix: str | None = None
    description: str | None = None
    default_priority: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    description: str | None = None
    default_priority: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
