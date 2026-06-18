"""
Multi-project Dashboard Service — Cross-project quality view.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.models.project import Project
from app.models.requirement import Requirement
from app.models.test_case import TestCase
from app.models.defect import Defect


class ProjectSummary(BaseModel):
    """Summary for a single project."""
    id: str
    name: str
    prefix: str
    status: str
    quality_score: int
    total_requirements: int
    total_test_cases: int
    total_defects: int
    open_defects: int
    last_updated: str


class PortfolioSummary(BaseModel):
    """Portfolio-level summary."""
    total_projects: int
    active_projects: int
    overall_quality_score: int
    projects: list[ProjectSummary]


class MultiProjectService:
    """Manage multi-project dashboards."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_portfolio_summary(self) -> PortfolioSummary:
        """Get portfolio-level summary across all projects."""

        # 1. Fetch all projects
        projects_query = await self.db.execute(select(Project))
        projects = projects_query.scalars().all()

        summaries = []

        for project in projects:
            # Requirements count
            req_query = await self.db.execute(
                select(func.count(Requirement.id)).where(Requirement.project_id == project.id)
            )
            req_count = req_query.scalar_one_or_none() or 0

            # Test Cases count
            tc_query = await self.db.execute(
                select(func.count(TestCase.id)).where(TestCase.project_id == project.id)
            )
            tc_count = tc_query.scalar_one_or_none() or 0

            # Defects count (Total)
            defect_query = await self.db.execute(
                select(func.count(Defect.id)).where(Defect.project_id == project.id)
            )
            defect_count = defect_query.scalar_one_or_none() or 0

            # Open Defects count
            open_defect_query = await self.db.execute(
                select(func.count(Defect.id)).where(
                    Defect.project_id == project.id,
                    Defect.status.in_(["New", "Open", "In Progress", "Reopened"])
                )
            )
            open_defect_count = open_defect_query.scalar_one_or_none() or 0

            # Calculate mock quality score based on actual counts
            # (Higher test cases and lower open defects = higher score)
            base_score = 70
            if req_count > 0 and tc_count >= req_count:
                base_score += 15
            elif tc_count > 0:
                base_score += 10

            # Penalty for open defects
            quality_score = max(0, min(100, base_score - (open_defect_count * 2)))
            if tc_count == 0 and req_count == 0:
                quality_score = 0  # No data = 0 score

            summaries.append(ProjectSummary(
                id=str(project.id),
                name=project.name,
                prefix=project.prefix,
                status="Active",  # Project doesn't have status, defaulting to Active
                quality_score=quality_score,
                total_requirements=req_count,
                total_test_cases=tc_count,
                total_defects=defect_count,
                open_defects=open_defect_count,
                last_updated=project.updated_at.strftime("%Y-%m-%d") if project.updated_at else "2024-01-01",
            ))

        active = len([p for p in summaries if p.status == "Active"])
        avg_quality = round(sum(p.quality_score for p in summaries) / len(summaries)) if summaries else 0

        return PortfolioSummary(
            total_projects=len(summaries),
            active_projects=active,
            overall_quality_score=avg_quality,
            projects=summaries,
        )
