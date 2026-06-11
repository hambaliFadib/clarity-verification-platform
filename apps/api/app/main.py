from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers.activity_items import router as activity_items_router
from app.routers.defects import router as defects_router
from app.routers.environments import router as environments_router
from app.routers.health import router as health_router
from app.routers.projects import router as projects_router
from app.routers.releases import router as releases_router
from app.routers.test_cases import router as test_cases_router
from app.routers.test_runs import router as test_runs_router
from app.routers.users import router as users_router
from app.routers.work_items import router as work_items_router


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
app.include_router(projects_router, prefix="/api/v1")
app.include_router(releases_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(test_cases_router, prefix="/api/v1")
app.include_router(test_runs_router, prefix="/api/v1")
app.include_router(work_items_router, prefix="/api/v1")
