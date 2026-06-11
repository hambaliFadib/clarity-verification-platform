import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.import_export import ImportExecuteRequest, ImportResult, ParseResult
from app.services import import_export as import_export_service

router = APIRouter(prefix="/test-cases", tags=["Test Cases Import/Export"])

MAX_FILE_SIZE = 5 * 1024 * 1024


@router.get("/export/xlsx")
def export_xlsx(db: Session = Depends(get_db_session)):
    xlsx_bytes = import_export_service.export_test_cases_xlsx(db)
    filename = f"test-cases-{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.post("/import/parse", response_model=ParseResult)
async def parse_import(file: UploadFile = File(...), db: Session = Depends(get_db_session)):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only .xlsx files are accepted",
        )
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds 5MB limit",
        )
    return import_export_service.parse_xlsx_import(file_bytes, db)


@router.post("/import/execute", response_model=ImportResult)
def execute_import(request: ImportExecuteRequest, db: Session = Depends(get_db_session)):
    return import_export_service.execute_import(db, request)
