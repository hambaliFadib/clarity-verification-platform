import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EnvironmentCreate(BaseModel):
    name: str = Field(..., min_length=2)
    url: str = Field(..., min_length=8)
    type: str = "Development"
    status: str = "Active"
    last_deployed: datetime | None = None
    version: str | None = None
    description: str | None = None


class EnvironmentUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    type: str | None = None
    status: str | None = None
    last_deployed: datetime | None = None
    version: str | None = None
    description: str | None = None


class EnvironmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    url: str
    type: str
    status: str
    last_deployed: datetime | None = None
    version: str | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
