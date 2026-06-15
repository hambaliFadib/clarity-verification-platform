"""
Predictive Analytics Service — Forecast release readiness and quality trends.
"""

from datetime import datetime, timedelta, timezone
from pydantic import BaseModel


class ReleaseForecast(BaseModel):
    """Release readiness forecast."""
    release_id: str
    release_name: str
    current_readiness: int  # 0-100
    estimated_ready_date: str
    confidence: int
    risk_factors: list[str]
    recommendations: list[str]
    historical_trend: list[dict]


class QualityTrend(BaseModel):
    """Quality trend analysis."""
    period: str
    metric: str
    current_value: float
    previous_value: float
    trend: str  # improving, declining, stable
    change_percent: float


class PredictiveAnalytics:
    """AI-powered predictive analytics."""
    
    async def forecast_release(
        self,
        release_id: str,
        total_test_cases: int,
        passed_test_cases: int,
        open_defects: int,
        critical_defects: int,
        days_elapsed: int,
        total_days: int,
    ) -> ReleaseForecast:
        """Forecast release readiness."""
        
        # Calculate current readiness
        test_coverage = (passed_test_cases / total_test_cases * 100) if total_test_cases > 0 else 0
        defect_score = max(0, 100 - (critical_defects * 20) - (open_defects * 5))
        current_readiness = round((test_coverage * 0.6 + defect_score * 0.4))
        
        # Estimate ready date
        progress_rate = current_readiness / days_elapsed if days_elapsed > 0 else 0
        remaining = 100 - current_readiness
        days_needed = round(remaining / progress_rate) if progress_rate > 0 else 30
        estimated_date = datetime.now(timezone.utc) + timedelta(days=days_needed)
        
        # Risk factors
        risk_factors = []
        if critical_defects > 0:
            risk_factors.append(f"{critical_defects} critical defect(s) open")
        if test_coverage < 80:
            risk_factors.append("Test coverage below 80%")
        if days_elapsed > total_days * 0.8:
            risk_factors.append("Timeline nearly exhausted")
        
        # Recommendations
        recommendations = []
        if critical_defects > 0:
            recommendations.append("Prioritize critical defect resolution")
        if test_coverage < 90:
            recommendations.append("Increase test coverage to 90%+")
        if progress_rate < 2:
            recommendations.append("Accelerate development pace")
        
        return ReleaseForecast(
            release_id=release_id,
            release_name=f"Release {release_id}",
            current_readiness=current_readiness,
            estimated_ready_date=estimated_date.strftime("%Y-%m-%d"),
            confidence=min(95, max(50, current_readiness + 10)),
            risk_factors=risk_factors,
            recommendations=recommendations,
            historical_trend=[
                {"date": (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d"), "score": max(0, current_readiness - i * 3)}
                for i in range(7, 0, -1)
            ],
        )
    
    async def analyze_quality_trends(self, days: int = 30) -> list[QualityTrend]:
        """Analyze quality trends over time."""
        # Mock trend data for demo
        return [
            QualityTrend(
                period="Last 7 days",
                metric="Test Coverage",
                current_value=92.5,
                previous_value=88.3,
                trend="improving",
                change_percent=4.8,
            ),
            QualityTrend(
                period="Last 7 days",
                metric="Defect Rate",
                current_value=3.2,
                previous_value=5.1,
                trend="improving",
                change_percent=-37.3,
            ),
            QualityTrend(
                period="Last 30 days",
                metric="Pass Rate",
                current_value=94.8,
                previous_value=91.2,
                trend="improving",
                change_percent=4.0,
            ),
        ]
