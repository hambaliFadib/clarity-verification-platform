import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TestStepCreate(BaseModel):
    action: str
    status: str | None = "Not Run"
    actual_result: str | None = None


class TestStepResponse(BaseModel):
    id: uuid.UUID
    step_number: int
    action: str
    status: str | None = "Not Run"
    actual_result: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TestCaseCreate(BaseModel):
    title: str = Field(..., min_length=5)
    module: str
    type: str
    severity: str
    status: str = "Draft"
    description: str | None = None
    assigned_to: uuid.UUID | None = None
    requirement_id: str | None = None
    estimated_time: str | None = None
    tags: list[str] | None = None
    environment: str | None = None
    automation_status: str | None = None
    preconditions: str | None = None
    test_steps: list[TestStepCreate] = Field(..., min_length=1)
    expected_result: str = Field(..., min_length=10)
    notes: str | None = None


class TestCaseUpdate(BaseModel):
    title: str | None = None
    module: str | None = None
    type: str | None = None
    severity: str | None = None
    status: str | None = None
    description: str | None = None
    assigned_to: uuid.UUID | None = None
    requirement_id: str | None = None
    estimated_time: str | None = None
    tags: list[str] | None = None
    environment: str | None = None
    automation_status: str | None = None
    preconditions: str | None = None
    test_steps: list[TestStepCreate] | None = None
    expected_result: str | None = None
    notes: str | None = None


class TestCaseResponse(BaseModel):
    id: uuid.UUID
    display_id: str
    title: str
    description: str | None = None
    module: str
    type: str
    severity: str
    status: str
    assigned_to: uuid.UUID | None = None
    created_by: uuid.UUID | None = None
    requirement_id: str | None = None
    estimated_time: str | None = None
    tags: list[str] | None = None
    environment: str | None = None
    automation_status: str | None = None
    preconditions: str | None = None
    expected_result: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    steps: list[TestStepResponse]
    assigned_to_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TestCaseListResponse(BaseModel):
    id: uuid.UUID
    display_id: str
    title: str
    module: str
    severity: str
    status: str
    type: str
    assigned_to_name: str | None = None
    updated_at: datetime
    steps: list[TestStepResponse] = []

    model_config = ConfigDict(from_attributes=True)
