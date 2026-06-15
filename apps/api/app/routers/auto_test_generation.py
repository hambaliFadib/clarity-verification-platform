"""Auto Test Generation Router — AI-powered test case generation."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db_session

router = APIRouter(prefix="/ai", tags=["AI Test Generation"])


class GenerationRequest(BaseModel):
    title: str
    description: str | None = None
    acceptance_criteria: str | None = None
    count: int = 5


@router.post("/generate-tests")
async def generate_tests(request: GenerationRequest):
    """Generate test cases from a requirement using AI."""
    from app.services.auto_test_generation import AutoTestGeneration
    
    generator = AutoTestGeneration()
    test_cases = await generator.generate_from_requirement(
        title=request.title,
        description=request.description,
        acceptance_criteria=request.acceptance_criteria,
    )
    
    return {
        "generated": len(test_cases),
        "test_cases": [tc.model_dump() for tc in test_cases[:request.count]],
    }
