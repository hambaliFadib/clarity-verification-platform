"""
Resource Optimization Service — Team capacity and allocation.
"""

from pydantic import BaseModel


class TeamMemberWorkload(BaseModel):
    """Team member workload."""
    user_id: str
    name: str
    role: str
    assigned_tasks: int
    capacity: int
    utilization: float  # percentage
    status: str  # available, busy, overloaded


class ResourceAllocation(BaseModel):
    """Resource allocation summary."""
    team_members: list[TeamMemberWorkload]
    total_capacity: int
    total_assigned: int
    overall_utilization: float
    recommendations: list[str]


class ResourceOptimization:
    """Optimize resource allocation."""

    async def analyze_workload(self) -> ResourceAllocation:
        """Analyze team workload and suggest optimizations."""
        members = [
            TeamMemberWorkload(user_id="u1", name="Alice Chen", role="QA Lead", assigned_tasks=8, capacity=10, utilization=80.0, status="available"),
            TeamMemberWorkload(user_id="u2", name="Bob Smith", role="QA Engineer", assigned_tasks=12, capacity=10, utilization=120.0, status="overloaded"),
            TeamMemberWorkload(user_id="u3", name="Carol White", role="Developer", assigned_tasks=6, capacity=10, utilization=60.0, status="available"),
            TeamMemberWorkload(user_id="u4", name="David Lee", role="Developer", assigned_tasks=10, capacity=10, utilization=100.0, status="busy"),
        ]

        total_capacity = sum(m.capacity for m in members)
        total_assigned = sum(m.assigned_tasks for m in members)
        overall_utilization = round((total_assigned / total_capacity) * 100, 1) if total_capacity > 0 else 0

        recommendations = []
        overloaded = [m for m in members if m.utilization > 100]
        underutilized = [m for m in members if m.utilization < 70]

        if overloaded:
            recommendations.append(f"Reassign tasks from {overloaded[0].name} (overloaded at {overloaded[0].utilization}%)")
        if underutilized:
            recommendations.append(f"Assign more tasks to {underutilized[0].name} (at {underutilized[0].utilization}% capacity)")
        if overall_utilization > 90:
            recommendations.append("Consider adding team members or extending timeline")

        return ResourceAllocation(
            team_members=members,
            total_capacity=total_capacity,
            total_assigned=total_assigned,
            overall_utilization=overall_utilization,
            recommendations=recommendations,
        )
