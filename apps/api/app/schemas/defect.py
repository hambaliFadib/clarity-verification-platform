import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DefectCommentCreate(BaseModel):
    author: str = Field(..., min_length=2)
    initials: str = Field(..., min_length=1, max_length=5)
    text: str = Field(..., min_length=1)


class DefectCommentResponse(BaseModel):
    id: uuid.UUID
    author: str
    initials: str
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DefectCreate(BaseModel):
    title: str = Field(..., min_length=5)
    description: str | None = None
    severity: str = "Medium"
    status: str = "Open"
    type: str = "Bug"
    priority: str | None = None
    assigned_to: str | None = None
    reported_by: str | None = None
    test_case_id: uuid.UUID | None = None
    test_run_id: uuid.UUID | None = None
    environment: str | None = None
    browser: str | None = None
    steps_to_reproduce: str | None = None
    tags: list[str] | None = None


class DefectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    type: str | None = None
    priority: str | None = None
    assigned_to: str | None = None
    reported_by: str | None = None
    test_case_id: uuid.UUID | None = None
    test_run_id: uuid.UUID | None = None
    environment: str | None = None
    browser: str | None = None
    steps_to_reproduce: str | None = None
    tags: list[str] | None = None
    resolved_at: datetime | None = None


class DefectResponse(BaseModel):
    id: uuid.UUID
    display_id: str
    title: str
    description: str | None = None
    severity: str
    status: str
    type: str
    priority: str
    assigned_to: str | None = None
    reported_by: str | None = None
    test_case_id: uuid.UUID | None = None
    test_run_id: uuid.UUID | None = None
    environment: str | None = None
    browser: str | None = None
    steps_to_reproduce: str | None = None
    tags: list[str] | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    comments: list[DefectCommentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DefectListResponse(BaseModel):
    id: uuid.UUID
    display_id: str
    title: str
    description: str | None = None
    severity: str
    status: str
    type: str
    priority: str
    assigned_to: str | None = None
    reported_by: str | None = None
    test_case_id: uuid.UUID | None = None
    test_run_id: uuid.UUID | None = None
    environment: str | None = None
    browser: str | None = None
    tags: list[str] | None = None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
