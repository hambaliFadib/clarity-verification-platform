import uuid
from pydantic import BaseModel, ConfigDict, Field


class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: str | None = None
    is_system: bool = False


class RoleCreate(RoleBase):
    pass


class RoleResponse(RoleBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class PermissionBase(BaseModel):
    resource: str = Field(..., max_length=50)
    action: str = Field(..., max_length=50)
    description: str | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
