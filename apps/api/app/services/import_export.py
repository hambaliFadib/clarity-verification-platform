from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.test_case import TestCase
from app.models.test_step import TestStep
from app.models.user import User
from app.schemas.import_export import (
    DuplicateAction,
    DuplicateRow,
    ImportError,
    ImportExecuteRequest,
    ImportResult,
    ImportStepRow,
    ParseResult,
    TestCaseImportRow,
)

MAX_IMPORT_ROWS = 500
MAX_STEP_COLUMNS = 20

REQUIRED_COLUMNS = {"title", "module", "type", "priority", "expected_result", "step_1_action"}

EXPORT_HEADER = [
    "display_id", "title", "description", "module", "type", "priority", "status",
    "complexity", "assigned_to_name", "requirement_id", "estimated_time", "tags",
    "environment", "automation_status", "preconditions", "expected_result", "notes",
]
for _n in range(1, MAX_STEP_COLUMNS + 1):
    EXPORT_HEADER.extend([f"step_{_n}_action", f"step_{_n}_expected_result", f"step_{_n}_test_data"])

VALID_TYPES = {"Functional", "Regression", "Smoke", "Integration", "UI", "Performance", "Security"}
VALID_PRIORITIES = {"Critical", "High", "Medium", "Low"}
VALID_STATUSES = {"Draft", "Ready", "In Review", "Approved", "Obsolete"}
VALID_COMPLEXITIES = {"Simple", "Medium", "Complex", None}
VALID_ENVIRONMENTS = {"Staging", "Production", "UAT", "Development", None}
VALID_AUTOMATION_STATUSES = {"Manual", "Automated", "Candidate to Automate", None}


def export_test_cases_xlsx(db: Session) -> bytes:
    cases = db.query(TestCase).filter(TestCase.deleted_at.is_(None)).order_by(TestCase.updated_at.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Test Cases"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(fill_type="solid", fgColor="1E293B")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for col_idx, header in enumerate(EXPORT_HEADER, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment

    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"

    for row_idx, tc in enumerate(cases, start=2):
        row_data = [
            tc.display_id,
            tc.title,
            tc.description,
            tc.module,
            tc.type,
            tc.priority,
            tc.status,
            tc.complexity,
            tc.assigned_to_name,
            tc.requirement_id,
            tc.estimated_time,
            ";".join(tc.tags) if tc.tags else None,
            tc.environment,
            tc.automation_status,
            tc.preconditions,
            tc.expected_result,
            tc.notes,
        ]

        for step_num in range(1, MAX_STEP_COLUMNS + 1):
            step = next((s for s in tc.steps if s.step_number == step_num), None)
            if step:
                row_data.extend([step.action, step.expected_result, step.test_data])
            else:
                row_data.extend([None, None, None])

        for col_idx, value in enumerate(row_data, start=1):
            ws.cell(row=row_idx, column=col_idx, value=value)

    ws.column_dimensions["A"].width = 14
    ws.column_dimensions["B"].width = 40
    ws.column_dimensions["C"].width = 30
    ws.column_dimensions["D"].width = 18
    ws.column_dimensions["E"].width = 16
    ws.column_dimensions["F"].width = 12
    ws.column_dimensions["G"].width = 14
    ws.column_dimensions["P"].width = 40

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


def _cell_str(cell) -> str | None:
    if cell is None:
        return None
    value = cell.value
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned if cleaned else None


def parse_xlsx_import(file_bytes: bytes, db: Session) -> ParseResult:
    try:
        wb = load_workbook(filename=io.BytesIO(file_bytes), data_only=True, read_only=True)
    except Exception:
        return ParseResult(
            total_parsed=0,
            valid_rows=[],
            duplicates=[],
            errors=[ImportError(row=0, field="file", message="Invalid or unreadable XLSX file")],
        )

    ws = wb.active
    rows = list(ws.iter_rows())
    if not rows:
        return ParseResult(
            total_parsed=0,
            valid_rows=[],
            duplicates=[],
            errors=[ImportError(row=0, field="file", message="Spreadsheet is empty")],
        )

    headers = [_cell_str(cell) for cell in rows[0]]

    missing = REQUIRED_COLUMNS - {h for h in headers if h}
    if missing:
        return ParseResult(
            total_parsed=0,
            valid_rows=[],
            duplicates=[],
            errors=[ImportError(row=0, field="header", message=f"Missing required columns: {', '.join(sorted(missing))}")],
        )

    header_map = {name: idx for idx, name in enumerate(headers) if name}

    data_rows = rows[1:]
    if len(data_rows) > MAX_IMPORT_ROWS:
        return ParseResult(
            total_parsed=len(data_rows),
            valid_rows=[],
            duplicates=[],
            errors=[ImportError(row=0, field="file", message=f"Too many rows: {len(data_rows)}. Maximum allowed is {MAX_IMPORT_ROWS}")],
        )

    existing_ids: set[str] = set()
    existing_map: dict[str, TestCase] = {}
    if "display_id" in header_map:
        candidate_ids = [
            _cell_str(data_rows[i][header_map["display_id"]])
            for i in range(len(data_rows))
            if _cell_str(data_rows[i][header_map["display_id"]])
        ]
        if candidate_ids:
            db_results = db.query(TestCase).filter(
                TestCase.display_id.in_(candidate_ids),
                TestCase.deleted_at.is_(None),
            ).all()
            existing_map = {tc.display_id: tc for tc in db_results}
            existing_ids = set(existing_map.keys())

    def get_cell(row, col_name: str) -> str | None:
        idx = header_map.get(col_name)
        if idx is None:
            return None
        return _cell_str(row[idx]) if idx < len(row) else None

    valid_rows: list[TestCaseImportRow] = []
    duplicates: list[DuplicateRow] = []
    errors: list[ImportError] = []

    for row_num, row in enumerate(data_rows, start=2):
        row_errors: list[ImportError] = []

        title = get_cell(row, "title")
        if not title:
            row_errors.append(ImportError(row=row_num, field="title", message="Required"))

        module = get_cell(row, "module")
        if not module:
            row_errors.append(ImportError(row=row_num, field="module", message="Required"))

        tc_type = get_cell(row, "type")
        if not tc_type:
            row_errors.append(ImportError(row=row_num, field="type", message="Required"))
        elif tc_type not in VALID_TYPES:
            row_errors.append(ImportError(row=row_num, field="type", message=f"Must be one of: {', '.join(sorted(VALID_TYPES))}"))

        priority = get_cell(row, "priority")
        if not priority:
            row_errors.append(ImportError(row=row_num, field="priority", message="Required"))
        elif priority not in VALID_PRIORITIES:
            row_errors.append(ImportError(row=row_num, field="priority", message=f"Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"))

        expected_result = get_cell(row, "expected_result")
        if not expected_result:
            row_errors.append(ImportError(row=row_num, field="expected_result", message="Required"))

        step_1_action = get_cell(row, "step_1_action")
        if not step_1_action:
            row_errors.append(ImportError(row=row_num, field="step_1_action", message="At least one step action is required"))

        if row_errors:
            errors.extend(row_errors)
            continue

        steps: list[ImportStepRow] = []
        for n in range(1, MAX_STEP_COLUMNS + 1):
            action = get_cell(row, f"step_{n}_action")
            if not action:
                break
            steps.append(ImportStepRow(
                action=action,
                expected_result=get_cell(row, f"step_{n}_expected_result"),
                test_data=get_cell(row, f"step_{n}_test_data"),
            ))

        status = get_cell(row, "status") or "Draft"
        if status not in VALID_STATUSES:
            status = "Draft"

        tags_raw = get_cell(row, "tags")
        tags = [t.strip() for t in tags_raw.split(";") if t.strip()] if tags_raw else None

        display_id = get_cell(row, "display_id")

        import_row = TestCaseImportRow(
            row_index=row_num,
            display_id=display_id,
            title=title,
            description=get_cell(row, "description"),
            module=module,
            type=tc_type,
            priority=priority,
            status=status,
            complexity=get_cell(row, "complexity"),
            assigned_to_name=get_cell(row, "assigned_to_name"),
            requirement_id=get_cell(row, "requirement_id"),
            estimated_time=get_cell(row, "estimated_time"),
            tags=tags,
            environment=get_cell(row, "environment"),
            automation_status=get_cell(row, "automation_status"),
            preconditions=get_cell(row, "preconditions"),
            expected_result=expected_result,
            notes=get_cell(row, "notes"),
            steps=steps,
        )

        if display_id and display_id in existing_ids:
            existing_tc = existing_map[display_id]
            duplicates.append(DuplicateRow(
                row_index=row_num,
                display_id=display_id,
                import_title=title,
                existing_title=existing_tc.title,
                existing_status=existing_tc.status,
            ))
            valid_rows.append(import_row)
        else:
            valid_rows.append(import_row)

    wb.close()

    return ParseResult(
        total_parsed=len(data_rows),
        valid_rows=valid_rows,
        duplicates=duplicates,
        errors=errors,
    )


def _generate_display_id(db: Session) -> str:
    result = db.execute(
        select(func.max(TestCase.display_id)).where(TestCase.display_id.like("CLR-TC-%"))
    ).scalar()
    if result:
        try:
            max_num = int(result.split("-")[-1])
        except (ValueError, IndexError):
            max_num = 0
    else:
        max_num = 0
    return f"CLR-TC-{max_num + 1:03d}"


def _resolve_user_id(db: Session, name: str | None) -> uuid.UUID | None:
    if not name:
        return None
    user = db.query(User).filter(User.name.ilike(name)).first()
    return user.id if user else None


def execute_import(db: Session, request: ImportExecuteRequest) -> ImportResult:
    action_map: dict[str, str] = {da.display_id: da.action for da in request.duplicate_actions}

    created = 0
    skipped = 0
    overwritten = 0
    errors: list[ImportError] = []

    now = datetime.now(timezone.utc)

    for import_row in request.rows:
        display_id = import_row.display_id
        is_duplicate = bool(display_id and display_id in action_map)
        duplicate_action = action_map.get(display_id, "skip") if is_duplicate else None

        if is_duplicate and duplicate_action == "skip":
            skipped += 1
            continue

        try:
            assignee_id = _resolve_user_id(db, import_row.assigned_to_name)

            if is_duplicate and duplicate_action == "overwrite":
                existing = db.query(TestCase).filter(
                    TestCase.display_id == display_id,
                    TestCase.deleted_at.is_(None),
                ).first()

                if not existing:
                    skipped += 1
                    continue

                existing.title = import_row.title
                existing.description = import_row.description
                existing.module = import_row.module
                existing.type = import_row.type
                existing.priority = import_row.priority
                existing.status = import_row.status
                existing.complexity = import_row.complexity
                existing.assigned_to = assignee_id
                existing.requirement_id = import_row.requirement_id
                existing.estimated_time = import_row.estimated_time
                existing.tags = import_row.tags
                existing.environment = import_row.environment
                existing.automation_status = import_row.automation_status
                existing.preconditions = import_row.preconditions
                existing.expected_result = import_row.expected_result
                existing.notes = import_row.notes
                existing.updated_at = now

                db.query(TestStep).filter(TestStep.test_case_id == existing.id).delete()

                for step_idx, step in enumerate(import_row.steps):
                    db.add(TestStep(
                        test_case_id=existing.id,
                        step_number=step_idx + 1,
                        action=step.action,
                        expected_result=step.expected_result,
                        test_data=step.test_data,
                        status="Not Run",
                    ))

                db.flush()
                overwritten += 1

            else:
                new_display_id = _generate_display_id(db)
                new_tc = TestCase(
                    display_id=new_display_id,
                    title=import_row.title,
                    description=import_row.description,
                    module=import_row.module,
                    type=import_row.type,
                    priority=import_row.priority,
                    status=import_row.status,
                    complexity=import_row.complexity,
                    assigned_to=assignee_id,
                    requirement_id=import_row.requirement_id,
                    estimated_time=import_row.estimated_time,
                    tags=import_row.tags,
                    environment=import_row.environment,
                    automation_status=import_row.automation_status,
                    preconditions=import_row.preconditions,
                    expected_result=import_row.expected_result,
                    notes=import_row.notes,
                    created_at=now,
                    updated_at=now,
                )
                db.add(new_tc)
                db.flush()

                for step_idx, step in enumerate(import_row.steps):
                    db.add(TestStep(
                        test_case_id=new_tc.id,
                        step_number=step_idx + 1,
                        action=step.action,
                        expected_result=step.expected_result,
                        test_data=step.test_data,
                        status="Not Run",
                    ))

                db.flush()
                created += 1

        except Exception as exc:
            errors.append(ImportError(
                row=import_row.row_index,
                field="__row__",
                message=str(exc),
            ))

    if not errors:
        db.commit()
    else:
        db.rollback()

    return ImportResult(created=created, skipped=skipped, overwritten=overwritten, errors=errors)
