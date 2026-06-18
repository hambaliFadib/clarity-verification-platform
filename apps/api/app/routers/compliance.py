"""Compliance Router — Compliance tracking endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/compliance", tags=["Compliance Tracking"])


@router.get("/report")
async def get_compliance_report():
    """Get compliance report."""
    from app.services.compliance import ComplianceTracking

    service = ComplianceTracking()
    return await service.get_compliance_report()


@router.get("/status")
async def get_compliance_status():
    """Get quick compliance status."""
    return {
        "overall_status": "Compliant",
        "score": 95,
        "last_audit": "2024-01-15",
        "next_audit": "2024-02-15",
    }
