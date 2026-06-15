from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers.activity_items import router as activity_items_router
from app.routers.defects import router as defects_router
from app.routers.environments import router as environments_router
from app.routers.health import router as health_router
from app.routers.import_export import router as import_export_router
from app.routers.projects import router as projects_router
from app.routers.releases import router as releases_router
from app.routers.test_cases import router as test_cases_router
from app.routers.test_runs import router as test_runs_router
from app.routers.users import router as users_router
from app.routers.work_items import router as work_items_router
from app.routers.oauth import router as oauth_router
from app.routers.requirements import router as requirements_router
from app.routers.rbac import router as rbac_router
from app.routers.ai_analysis import router as ai_analysis_router
from app.routers.approval_gate import router as approval_gate_router
from app.routers.analytics import router as analytics_router
from app.routers.cicd_integration import router as cicd_integration_router
from app.routers.auto_test_generation import router as auto_test_generation_router
from app.routers.predictive_analytics import router as predictive_analytics_router
from app.routers.reports import router as reports_router
from app.routers.multi_project import router as multi_project_router
from app.routers.resource_optimization import router as resource_optimization_router
from app.routers.compliance import router as compliance_router


app = FastAPI(
    title="NexQA API",
    description="FastAPI service for the NexQA Clarity Platform.",
    version="0.1.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(activity_items_router, prefix="/api/v1")
app.include_router(defects_router, prefix="/api/v1")
app.include_router(environments_router, prefix="/api/v1")
app.include_router(import_export_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(releases_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(oauth_router, prefix="/api/v1")
app.include_router(test_cases_router, prefix="/api/v1")
app.include_router(test_runs_router, prefix="/api/v1")
app.include_router(work_items_router, prefix="/api/v1")
app.include_router(requirements_router, prefix="/api/v1")
app.include_router(rbac_router, prefix="/api/v1")
app.include_router(ai_analysis_router, prefix="/api/v1")
app.include_router(approval_gate_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(cicd_integration_router, prefix="/api/v1")
app.include_router(auto_test_generation_router, prefix="/api/v1")
app.include_router(predictive_analytics_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(multi_project_router, prefix="/api/v1")
app.include_router(resource_optimization_router, prefix="/api/v1")
app.include_router(compliance_router, prefix="/api/v1")
