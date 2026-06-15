"""Approval Gate Schemas."""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GateCreate(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    gate_name: str
    from_status: str
    to_status: str


class GateDecision(BaseModel):
    user_id: uuid.UUID
    notes: str | None = None
    evidence_ids: list[str] | None = None


class GateResponse(BaseModel):
    id: uuid.UUID
    gate_id: str
    entity_type: str
    entity_id: uuid.UUID
    gate_name: str
    from_status: str
    to_status: str
    status: str
    decision_by: uuid.UUID | None = None
    decision_at: datetime | None = None
    decision_notes: str | None = None
    ai_recommendation: str | None = None
    ai_confidence: int | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditTrailResponse(BaseModel):
    id: uuid.UUID
    action: str
    entity_type: str
    entity_id: uuid.UUID
    user_id: uuid.UUID
    old_value: dict | None = None
    new_value: dict | None = None
    audit_metadata: dict | None = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
