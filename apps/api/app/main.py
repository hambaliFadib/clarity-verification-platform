from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import get_session_factory
from app.routers.health import router as health_router
from app.routers.users import router as users_router
from app.routers.test_cases import router as test_cases_router
from app.services.user import seed_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    session = get_session_factory()()
    try:
        seed_users(session)
    finally:
        session.close()
    yield


app = FastAPI(
    title="NexQA API",
    description="FastAPI service for the NexQA Clarity Platform.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(users_router, prefix="/api/v1")
app.include_router(test_cases_router, prefix="/api/v1")
