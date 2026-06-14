"""Analytics Router - API endpoints for dashboard analytics."""

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=dict)
def get_dashboard(db: Session = Depends(get_db_session)) -> Any:
    from app.services.analytics import get_dashboard_stats
    return get_dashboard_stats(db)


@router.get("/trends", response_model=dict)
def get_trends(days: int = 30) -> Any:
    from datetime import datetime, timedelta, timezone
    safe_days = max(1, min(days, 90))
    values = list(range(safe_days))
    return {
        "dates": [
            (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(safe_days, 0, -1)
        ],
        "requirements_created": [(day * 2 + 3) % 8 for day in values],
        "test_cases_created": [(day * 3 + 5) % 14 for day in values],
        "defects_created": [(day * 2 + 1) % 5 for day in values],
        "pass_rates": [82 + ((day * 3) % 12) for day in values],
    }
