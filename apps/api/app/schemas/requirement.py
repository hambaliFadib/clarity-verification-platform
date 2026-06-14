import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class RequirementBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = None
    acceptance_criteria: str | None = None
    business_rules: str | None = None
    module: str = Field(..., max_length=100)
    type: str = Field(..., max_length=50)
    priority: str = Field(..., max_length=20)


class RequirementCreate(RequirementBase):
    pass


class RequirementUpdate(RequirementBase):
    title: str | None = Field(None, max_length=200)
    module: str | None = Field(None, max_length=100)
    type: str | None = Field(None, max_length=50)
    priority: str | None = Field(None, max_length=20)
    status: str | None = Field(None, max_length=20)


class RequirementResponse(RequirementBase):
    id: uuid.UUID
    display_id: str
    status: str
    created_by_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
