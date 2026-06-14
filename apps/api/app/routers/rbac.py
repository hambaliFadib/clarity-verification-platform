import uuid
import os
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.rbac import Role, Permission, RolePermission, UserRole
from app.schemas.rbac import RoleCreate, RoleResponse, PermissionCreate, PermissionResponse

router = APIRouter(prefix="/rbac", tags=["RBAC"])


def require_rbac_admin_api_enabled() -> None:
    enabled = os.getenv("ENABLE_RBAC_ADMIN_API", "").lower() in {"1", "true", "yes"}
    if not enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="RBAC admin mutations are locked until authenticated RBAC enforcement is implemented.",
        )

@router.get("/roles", response_model=list[RoleResponse])
def get_roles(
    db: Session = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    roles = db.scalars(select(Role).offset(skip).limit(limit)).all()
    return roles

@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db_session),
) -> Any:
    require_rbac_admin_api_enabled()
    db_role = Role(**role_in.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@router.get("/permissions", response_model=list[PermissionResponse])
def get_permissions(
    db: Session = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    permissions = db.scalars(select(Permission).offset(skip).limit(limit)).all()
    return permissions

@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(
    perm_in: PermissionCreate,
    db: Session = Depends(get_db_session),
) -> Any:
    require_rbac_admin_api_enabled()
    db_perm = Permission(**perm_in.model_dump())
    db.add(db_perm)
    db.commit()
    db.refresh(db_perm)
    return db_perm


@router.post("/users/{user_id}/roles", status_code=status.HTTP_201_CREATED)
def assign_role_to_user(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Assign a role to a user."""
    require_rbac_admin_api_enabled()
    from app.services.rbac import assign_role_to_user
    if not db.get(Role, role_id):
        raise HTTPException(status_code=404, detail="Role not found")
    success = assign_role_to_user(db, user_id, role_id)
    if not success:
        raise HTTPException(status_code=409, detail="Role already assigned")
    return {"message": "Role assigned successfully"}


@router.delete("/users/{user_id}/roles/{role_id}")
def remove_role_from_user(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Remove a role from a user."""
    require_rbac_admin_api_enabled()
    from app.services.rbac import remove_role_from_user
    success = remove_role_from_user(db, user_id, role_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role assignment not found")
    return {"message": "Role removed successfully"}


@router.get("/users/{user_id}/roles", response_model=list[RoleResponse])
def get_user_roles(
    user_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Get all roles for a user."""
    from app.services.rbac import get_user_roles
    return get_user_roles(db, user_id)


@router.get("/users/{user_id}/permissions", response_model=list[PermissionResponse])
def get_user_permissions(
    user_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Get all permissions for a user."""
    from app.services.rbac import get_user_permissions
    return get_user_permissions(db, user_id)


@router.post("/roles/{role_id}/permissions", status_code=status.HTTP_201_CREATED)
def assign_permission_to_role(
    role_id: uuid.UUID,
    permission_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Assign a permission to a role."""
    require_rbac_admin_api_enabled()
    if not db.get(Role, role_id):
        raise HTTPException(status_code=404, detail="Role not found")
    if not db.get(Permission, permission_id):
        raise HTTPException(status_code=404, detail="Permission not found")
    # Check if already assigned
    existing = db.scalar(
        select(RolePermission)
        .where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Permission already assigned")
    
    role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
    db.add(role_permission)
    db.commit()
    
    return {"message": "Permission assigned successfully"}


@router.get("/check-permission")
def check_permission(
    user_id: uuid.UUID,
    resource: str,
    action: str,
    db: Session = Depends(get_db_session),
) -> Any:
    """Check if a user has a specific permission."""
    from app.services.rbac import user_has_permission
    has_permission = user_has_permission(db, user_id, resource, action)
    return {"hasPermission": has_permission}
