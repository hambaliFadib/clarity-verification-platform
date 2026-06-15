"""Resource Optimization Router — Team capacity endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/resources", tags=["Resource Optimization"])


@router.get("/workload")
async def get_workload():
    """Get team workload analysis."""
    from app.services.resource_optimization import ResourceOptimization
    
    service = ResourceOptimization()
    return await service.analyze_workload()


@router.get("/capacity")
async def get_capacity():
    """Get team capacity overview."""
    return {
        "total_capacity": 40,
        "available_capacity": 12,
        "utilization_rate": 70.0,
        "bottlenecks": ["QA Engineering team"],
    }
