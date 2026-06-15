"""
CI/CD Integration Service — Connect with GitHub Actions, GitLab CI.
"""

import os
import hmac
import hashlib
from datetime import datetime, timezone
from pydantic import BaseModel


class CICDWebhook(BaseModel):
    """Webhook payload from CI/CD system."""
    event: str  # push, pull_request, workflow_run
    repository: str
    branch: str
    commit_sha: str
    commit_message: str
    author: str
    status: str | None = None  # success, failure, pending
    workflow_url: str | None = None


class CICDIntegration:
    """Handle CI/CD webhook events."""
    
    def __init__(self):
        self.webhook_secret = os.getenv("CICD_WEBHOOK_SECRET", "")
    
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature for security."""
        if not self.webhook_secret:
            return True  # Skip if no secret configured
        
        expected = hmac.new(
            self.webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)
    
    async def handle_github_webhook(self, event: str, payload: dict) -> dict:
        """Handle GitHub webhook events."""
        if event == "push":
            return await self._handle_push(payload)
        elif event == "pull_request":
            return await self._handle_pr(payload)
        elif event == "workflow_run":
            return await self._handle_workflow(payload)
        return {"status": "ignored"}
    
    async def _handle_push(self, payload: dict) -> dict:
        """Handle push event — auto-run smoke tests."""
        branch = payload.get("ref", "").replace("refs/heads/", "")
        commit_sha = payload.get("after", "")
        
        # Trigger smoke tests on main/develop branches
        if branch in ["main", "develop"]:
            return {
                "action": "trigger_tests",
                "test_type": "smoke",
                "branch": branch,
                "commit": commit_sha,
            }
        return {"status": "ignored"}
    
    async def _handle_pr(self, payload: dict) -> dict:
        """Handle pull request event."""
        action = payload.get("action")
        pr = payload.get("pull_request", {})
        
        if action == "opened" or action == "synchronize":
            return {
                "action": "trigger_tests",
                "test_type": "regression",
                "branch": pr.get("head", {}).get("ref"),
                "pr_number": pr.get("number"),
            }
        return {"status": "ignored"}
    
    async def _handle_workflow(self, payload: dict) -> dict:
        """Handle workflow run event — sync status to NexQA."""
        workflow_run = payload.get("workflow_run", {})
        return {
            "action": "sync_status",
            "workflow_id": workflow_run.get("id"),
            "status": workflow_run.get("conclusion"),
            "url": workflow_run.get("html_url"),
        }
