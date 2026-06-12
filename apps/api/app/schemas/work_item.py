import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkItemCreate(BaseModel):
    title: str = Field(..., min_length=2)
    type: str = "Task"
    status: str = "To Do"
    priority: str = "Medium"
    progress: int = Field(0, ge=0, le=100)
    scope: str | None = None
    assigned_to: str
    test_case_id: uuid.UUID | None = None
    defect_id: uuid.UUID | None = None
    due_in: str | None = None


class WorkItemUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    status: str | None = None
    priority: str | None = None
    progress: int | None = Field(None, ge=0, le=100)
    scope: str | None = None
    assigned_to: str | None = None
    test_case_id: uuid.UUID | None = None
    defect_id: uuid.UUID | None = None
    due_in: str | None = None


class WorkItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    status: str
    priority: str
    progress: int
    scope: str | None = None
    assigned_to: str
    test_case_id: uuid.UUID | None = None
    defect_id: uuid.UUID | None = None
    due_in: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
