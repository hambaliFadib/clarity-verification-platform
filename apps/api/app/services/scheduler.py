"""
Scheduler Service — Cron-based test run scheduling.
"""

import os
from datetime import datetime, timezone
from pydantic import BaseModel


class ScheduledRun(BaseModel):
    """Scheduled test run configuration."""
    id: str
    name: str
    cron_expression: str
    environment: str
    test_filter: dict | None = None
    is_active: bool = True
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None


class SchedulerService:
    """Manage scheduled test runs."""
    
    def __init__(self):
        self.schedules: dict[str, ScheduledRun] = {}
    
    def create_schedule(self, schedule: ScheduledRun) -> ScheduledRun:
        """Create a new scheduled run."""
        self.schedules[schedule.id] = schedule
        return schedule
    
    def get_schedules(self) -> list[ScheduledRun]:
        """Get all active schedules."""
        return [s for s in self.schedules.values() if s.is_active]
    
    def trigger_schedule(self, schedule_id: str) -> dict | None:
        """Manually trigger a scheduled run."""
        schedule = self.schedules.get(schedule_id)
        if not schedule:
            return None
        
        schedule.last_run_at = datetime.now(timezone.utc)
        return {
            "schedule_id": schedule_id,
            "triggered_at": schedule.last_run_at.isoformat(),
            "environment": schedule.environment,
        }
