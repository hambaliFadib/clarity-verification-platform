"""Multi-project Router — Cross-project dashboard endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter(prefix="/portfolio", tags=["Multi-project Dashboard"])


@router.get("/summary")
async def get_portfolio_summary(db: AsyncSession = Depends(get_db)):
    """Get portfolio-level summary."""
    from app.services.multi_project import MultiProjectService

    service = MultiProjectService(db=db)
    return await service.get_portfolio_summary()


@router.get("/projects/{project_id}/health")
async def get_project_health(project_id: str):
    """Get health metrics for a specific project."""
    return {
        "project_id": project_id,
        "health_score": 85,
        "status": "Healthy",
        "risks": ["Low test coverage in module X"],
        "last_assessment": "2024-01-15",
    }
