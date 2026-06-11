import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ReleaseCreate(BaseModel):
    version: str = Field(..., min_length=1)
    name: str = Field(..., min_length=2)
    status: str = "Planning"
    start_date: date
    target_date: date
    release_date: date | None = None
    description: str | None = None
    total_test_cases: int = 0
    passed_test_cases: int = 0
    total_defects: int = 0
    open_defects: int = 0
    critical_defects: int = 0


class ReleaseUpdate(BaseModel):
    version: str | None = None
    name: str | None = None
    status: str | None = None
    start_date: date | None = None
    target_date: date | None = None
    release_date: date | None = None
    description: str | None = None
    total_test_cases: int | None = None
    passed_test_cases: int | None = None
    total_defects: int | None = None
    open_defects: int | None = None
    critical_defects: int | None = None


class ReleaseResponse(BaseModel):
    id: uuid.UUID | str
    version: str
    name: str
    status: str
    start_date: date
    target_date: date
    release_date: date | None = None
    description: str | None = None
    total_test_cases: int
    passed_test_cases: int
    total_defects: int
    open_defects: int
    critical_defects: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
