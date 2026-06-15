"""Predictive Analytics Router — AI-powered forecasting endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["Predictive Analytics"])


class ForecastRequest(BaseModel):
    release_id: str
    total_test_cases: int = 0
    passed_test_cases: int = 0
    open_defects: int = 0
    critical_defects: int = 0
    days_elapsed: int = 0
    total_days: int = 30


@router.post("/forecast")
async def forecast_release(request: ForecastRequest):
    """Forecast release readiness."""
    from app.services.predictive_analytics import PredictiveAnalytics
    
    analytics = PredictiveAnalytics()
    result = await analytics.forecast_release(
        release_id=request.release_id,
        total_test_cases=request.total_test_cases,
        passed_test_cases=request.passed_test_cases,
        open_defects=request.open_defects,
        critical_defects=request.critical_defects,
        days_elapsed=request.days_elapsed,
        total_days=request.total_days,
    )
    return result


@router.get("/trends")
async def get_quality_trends(days: int = 30):
    """Get quality trend analysis."""
    from app.services.predictive_analytics import PredictiveAnalytics
    
    analytics = PredictiveAnalytics()
    return await analytics.analyze_quality_trends(days)
