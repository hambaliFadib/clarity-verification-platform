"""Reports Router — Generate and download reports."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    type: str  # quality, requirements, defects, release
    format: str = "excel"  # excel, pdf
    filters: dict | None = None


@router.post("/generate")
async def generate_report(request: ReportRequest):
    """Generate a report in the specified format."""
    from app.services.report_generation import ReportGeneration
    
    generator = ReportGeneration()
    
    # Get data based on type
    data = await _get_report_data(request.type, request.filters)
    
    if request.format == "excel":
        content = await generator.generate_excel(data, request.type)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"nexqa_{request.type}_report.xlsx"
    elif request.format == "pdf":
        content = await generator.generate_pdf(data, request.type)
        media_type = "application/pdf"
        filename = f"nexqa_{request.type}_report.pdf"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
    
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


async def _get_report_data(report_type: str, filters: dict | None) -> dict:
    """Get data for report generation."""
    # This would query the database in production
    return {
        "quality": {
            "test_coverage": 92.5,
            "pass_rate": 94.8,
            "open_defects": 3,
            "critical_defects": 0,
        },
        "requirements": {
            "requirements": [
                {"display_id": "REQ-001", "title": "User Login", "module": "Auth", "priority": "High", "status": "Approved", "type": "Functional"},
            ]
        },
        "defects": {
            "defects": [
                {"display_id": "DEF-001", "title": "Login button issue", "severity": "High", "status": "Open", "module": "UI", "created_at": "2024-01-15"},
            ]
        },
    }.get(report_type, {})
