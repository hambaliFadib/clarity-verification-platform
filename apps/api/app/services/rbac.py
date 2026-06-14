import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rbac import Role, Permission, RolePermission, UserRole


def check_permission(
    db: Session,
    role_id: uuid.UUID,
    resource: str,
    action: str,
) -> bool:
    """Check if a role has a specific permission."""
    permission = db.scalar(
        select(Permission)
        .where(Permission.resource == resource, Permission.action == action)
    )
    if not permission:
        return False
    
    role_permission = db.scalar(
        select(RolePermission)
        .where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission.id,
        )
    )
    return role_permission is not None


def assign_role_to_user(
    db: Session,
    user_id: uuid.UUID,
    role_id: uuid.UUID,
) -> bool:
    """Assign a role to a user."""
    # Check if already assigned
    existing = db.scalar(
        select(UserRole)
        .where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    )
    if existing:
        return False
    
    user_role = UserRole(user_id=user_id, role_id=role_id)
    db.add(user_role)
    db.commit()
    return True


def remove_role_from_user(
    db: Session,
    user_id: uuid.UUID,
    role_id: uuid.UUID,
) -> bool:
    """Remove a role from a user."""
    user_role = db.scalar(
        select(UserRole)
        .where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    )
    if not user_role:
        return False
    
    db.delete(user_role)
    db.commit()
    return True


def get_user_roles(
    db: Session,
    user_id: uuid.UUID,
) -> list[Role]:
    """Get all roles for a user."""
    return list(
        db.scalars(
            select(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
        ).all()
    )


def get_user_permissions(
    db: Session,
    user_id: uuid.UUID,
) -> list[Permission]:
    """Get all permissions for a user."""
    return list(
        db.scalars(
            select(Permission)
            .join(RolePermission)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
        ).all()
    )


def user_has_permission(
    db: Session,
    user_id: uuid.UUID,
    resource: str,
    action: str,
) -> bool:
    """Check if a user has a specific permission."""
    permissions = get_user_permissions(db, user_id)
    return any(p.resource == resource and p.action == action for p in permissions)
