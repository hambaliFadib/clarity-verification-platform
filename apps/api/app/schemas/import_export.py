from __future__ import annotations

from typing import Literal
from pydantic import BaseModel


class ImportStepRow(BaseModel):
    action: str
    expected_result: str | None = None
    test_data: str | None = None


class TestCaseImportRow(BaseModel):
    row_index: int
    display_id: str | None = None
    title: str
    description: str | None = None
    module: str
    type: str
    severity: str
    status: str = "Draft"
    assigned_to_name: str | None = None
    requirement_id: str | None = None
    estimated_time: str | None = None
    environment: str | None = None
    automation_status: str | None = None
    preconditions: str | None = None
    expected_result: str
    notes: str | None = None
    steps: list[ImportStepRow]


class DuplicateRow(BaseModel):
    row_index: int
    display_id: str
    import_title: str
    existing_title: str
    existing_status: str


class ImportError(BaseModel):
    row: int
    field: str
    message: str


class ParseResult(BaseModel):
    total_parsed: int
    valid_rows: list[TestCaseImportRow]
    duplicates: list[DuplicateRow]
    errors: list[ImportError]


class DuplicateAction(BaseModel):
    display_id: str
    action: Literal["skip", "overwrite"]


class ImportExecuteRequest(BaseModel):
    rows: list[TestCaseImportRow]
    duplicate_actions: list[DuplicateAction] = []


class ImportResult(BaseModel):
    created: int
    skipped: int
    overwritten: int
    errors: list[ImportError]
