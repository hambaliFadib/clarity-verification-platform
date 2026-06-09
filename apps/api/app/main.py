from fastapi import FastAPI

from app.routers.health import router as health_router

app = FastAPI(
    title="NexQA API",
    description="FastAPI service for the NexQA Clarity Platform.",
    version="0.1.0",
)

app.include_router(health_router)
