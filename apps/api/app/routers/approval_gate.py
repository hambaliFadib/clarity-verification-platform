"""Approval Gate Router - API endpoints for approval workflow."""

import uuid
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.approval_gate import ApprovalGate
from app.schemas.approval_gate import GateCreate, GateDecision, GateResponse, AuditTrailResponse

router = APIRouter(prefix="/approval-gates", tags=["Approval Gates"])


def require_approval_mutations_enabled() -> None:
    enabled = os.getenv("ENABLE_APPROVAL_GATE_MUTATIONS", "").lower() in {"1", "true", "yes"}
    if not enabled:
        raise HTTPException(
            status_code=403,
            detail="Approval gate mutations are locked until authenticated approval workflow enforcement is implemented.",
        )


@router.post("", response_model=GateResponse, status_code=201)
def create_gate_endpoint(schema: GateCreate, db: Session = Depends(get_db_session)) -> Any:
    from app.services.approval_gate import create_gate

    require_approval_mutations_enabled()
    return create_gate(
        db,
        schema.entity_type,
        schema.entity_id,
        schema.gate_name,
        schema.from_status,
        schema.to_status,
    )


@router.get("/audit-trail", response_model=list[AuditTrailResponse])
def get_audit_trail_endpoint(
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    limit: int = 100,
    db: Session = Depends(get_db_session),
) -> Any:
    from app.services.approval_gate import get_audit_trail

    return get_audit_trail(db, entity_type, entity_id, user_id, limit)


@router.get("/entity/{entity_type}/{entity_id}", response_model=list[GateResponse])
def get_entity_gates_endpoint(
    entity_type: str,
    entity_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    from app.services.approval_gate import get_entity_gates

    return get_entity_gates(db, entity_type, entity_id)


@router.get("/{gate_id}", response_model=GateResponse)
def get_gate(gate_id: uuid.UUID, db: Session = Depends(get_db_session)) -> Any:
    gate = db.get(ApprovalGate, gate_id)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found")
    return gate


@router.post("/{gate_id}/approve", response_model=GateResponse)
def approve_gate_endpoint(
    gate_id: uuid.UUID,
    schema: GateDecision,
    db: Session = Depends(get_db_session),
) -> Any:
    from app.services.approval_gate import approve_gate

    require_approval_mutations_enabled()
    gate = approve_gate(db, gate_id, schema.user_id, schema.notes, schema.evidence_ids)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found or not pending")
    return gate


@router.post("/{gate_id}/reject", response_model=GateResponse)
def reject_gate_endpoint(
    gate_id: uuid.UUID,
    schema: GateDecision,
    db: Session = Depends(get_db_session),
) -> Any:
    from app.services.approval_gate import reject_gate

    require_approval_mutations_enabled()
    gate = reject_gate(db, gate_id, schema.user_id, schema.notes)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found or not pending")
    return gate
