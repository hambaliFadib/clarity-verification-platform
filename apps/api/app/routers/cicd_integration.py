"""CI/CD Integration Router — Webhook endpoints."""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import os
from app.services.cicd_integration import CICDIntegration

router = APIRouter(prefix="/cicd", tags=["CI/CD Integration"])
integration = CICDIntegration()


@router.post("/webhook/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None),
    x_github_event: Optional[str] = Header(None),
):
    """Handle GitHub webhook events."""
    body = await request.body()
    
    # Verify signature
    if x_hub_signature_256 and not integration.verify_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    result = await integration.handle_github_webhook(x_github_event or "push", payload)
    
    return {"received": True, "result": result}


@router.post("/webhook/gitlab")
async def gitlab_webhook(request: Request, x_gitlab_event: Optional[str] = Header(None)):
    """Handle GitLab webhook events."""
    payload = await request.json()
    # Process GitLab events
    return {"received": True, "event": x_gitlab_event}


@router.get("/status")
def get_cicd_status():
    """Get CI/CD integration status."""
    return {
        "github": {"configured": bool(os.getenv("GITHUB_TOKEN")), "webhook_url": "/api/v1/cicd/webhook/github"},
        "gitlab": {"configured": bool(os.getenv("GITLAB_TOKEN")), "webhook_url": "/api/v1/cicd/webhook/gitlab"},
    }
