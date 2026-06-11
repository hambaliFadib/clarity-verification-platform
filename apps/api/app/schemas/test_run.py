import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestRunCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str | None = None
    status: str = "Not Started"
    environment: str
    release: str | None = None
    assigned_to: str
    total_cases: int = 0
    passed: int = 0
    failed: int = 0
    blocked: int = 0
    not_run: int = 0
    started_at: datetime | None = None
    completed_at: datetime | None = None


class TestRunUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    environment: str | None = None
    release: str | None = None
    assigned_to: str | None = None
    total_cases: int | None = None
    passed: int | None = None
    failed: int | None = None
    blocked: int | None = None
    not_run: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class TestRunResponse(BaseModel):
    id: uuid.UUID
    display_id: str
    name: str
    description: str | None = None
    status: str
    environment: str
    release: str | None = None
    assigned_to: str
    total_cases: int
    passed: int
    failed: int
    blocked: int
    not_run: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
