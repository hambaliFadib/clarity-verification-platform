"""
AI Analysis Router - API endpoints for AI-powered requirement analysis.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_analysis import analyze_requirement, AIAnalysisResult

router = APIRouter(prefix="/ai", tags=["AI Analysis"])


class AnalysisRequest(BaseModel):
    """Request body for requirement analysis."""
    title: str
    description: str | None = None
    acceptance_criteria: str | None = None
    business_rules: str | None = None
    module: str | None = None
    type: str | None = None
    priority: str | None = None


@router.post("/analyze-requirement", response_model=AIAnalysisResult)
async def analyze(request: AnalysisRequest):
    """Analyze a requirement using AI."""
    try:
        result = await analyze_requirement(
            title=request.title,
            description=request.description,
            acceptance_criteria=request.acceptance_criteria,
            business_rules=request.business_rules,
            module=request.module,
            type=request.type,
            priority=request.priority,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
