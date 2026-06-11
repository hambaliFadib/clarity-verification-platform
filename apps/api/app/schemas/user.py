import uuid
from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    avatar: str | None = None
    initials: str

    model_config = ConfigDict(from_attributes=True)
