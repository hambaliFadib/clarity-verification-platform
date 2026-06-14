import uuid
from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.services.rbac import user_has_permission


class PermissionChecker:
    """Dependency for checking user permissions."""
    
    def __init__(self, resource: str, action: str):
        self.resource = resource
        self.action = action
    
    def __call__(
        self,
        user_id: uuid.UUID,
        db: Session = Depends(get_db_session),
    ) -> bool:
        if not user_has_permission(db, user_id, self.resource, self.action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.resource}:{self.action}",
            )
        return True


# Pre-defined permission checkers
require_requirement_create = PermissionChecker("requirements", "create")
require_requirement_read = PermissionChecker("requirements", "read")
require_requirement_update = PermissionChecker("requirements", "update")
require_requirement_delete = PermissionChecker("requirements", "delete")
require_requirement_approve = PermissionChecker("requirements", "approve")

require_test_run_create = PermissionChecker("test_runs", "create")
require_test_run_execute = PermissionChecker("test_runs", "execute")
require_test_run_approve = PermissionChecker("test_runs", "approve")

require_defect_create = PermissionChecker("defects", "create")
require_defect_update = PermissionChecker("defects", "update")
require_defect_resolve = PermissionChecker("defects", "resolve")

require_rbac_manage = PermissionChecker("rbac", "manage")
