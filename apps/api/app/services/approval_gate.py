"""Approval Gate Service - Workflow state machine."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.approval_gate import ApprovalGate, AuditTrail


def create_gate(db: Session, entity_type: str, entity_id: uuid.UUID, gate_name: str, from_status: str, to_status: str) -> ApprovalGate:
    gate = ApprovalGate(
        gate_id=f"GATE-{entity_type[:3].upper()}-{str(entity_id)[:8]}",
        entity_type=entity_type, entity_id=entity_id,
        gate_name=gate_name, from_status=from_status, to_status=to_status,
        status="pending",
    )
    db.add(gate)
    db.commit()
    db.refresh(gate)
    return gate


def approve_gate(db: Session, gate_id: uuid.UUID, user_id: uuid.UUID, notes: str | None = None, evidence_ids: list[str] | None = None) -> ApprovalGate | None:
    gate = db.get(ApprovalGate, gate_id)
    if not gate or gate.status != "pending":
        return None
    gate.status = "approved"
    gate.decision_by = user_id
    gate.decision_at = datetime.now(timezone.utc)
    gate.decision_notes = notes
    gate.evidence_ids = {"ids": evidence_ids or []}
    audit = AuditTrail(action="approved", entity_type=gate.entity_type, entity_id=gate.entity_id, user_id=user_id, new_value={"gate": gate.gate_name, "status": "approved"})
    db.add(audit)
    db.commit()
    db.refresh(gate)
    return gate


def reject_gate(db: Session, gate_id: uuid.UUID, user_id: uuid.UUID, notes: str | None = None) -> ApprovalGate | None:
    gate = db.get(ApprovalGate, gate_id)
    if not gate or gate.status != "pending":
        return None
    gate.status = "rejected"
    gate.decision_by = user_id
    gate.decision_at = datetime.now(timezone.utc)
    gate.decision_notes = notes
    audit = AuditTrail(action="rejected", entity_type=gate.entity_type, entity_id=gate.entity_id, user_id=user_id, new_value={"gate": gate.gate_name, "status": "rejected"})
    db.add(audit)
    db.commit()
    db.refresh(gate)
    return gate


def set_ai_recommendation(db: Session, gate_id: uuid.UUID, recommendation: str, confidence: int, analysis: dict | None = None) -> ApprovalGate | None:
    gate = db.get(ApprovalGate, gate_id)
    if not gate:
        return None
    gate.ai_recommendation = recommendation
    gate.ai_confidence = confidence
    gate.ai_analysis = analysis
    db.commit()
    db.refresh(gate)
    return gate


def get_entity_gates(db: Session, entity_type: str, entity_id: uuid.UUID) -> list[ApprovalGate]:
    return list(db.scalars(select(ApprovalGate).where(ApprovalGate.entity_type == entity_type, ApprovalGate.entity_id == entity_id).order_by(ApprovalGate.created_at)).all())


def get_audit_trail(db: Session, entity_type: str | None = None, entity_id: uuid.UUID | None = None, user_id: uuid.UUID | None = None, limit: int = 100) -> list[AuditTrail]:
    query = select(AuditTrail)
    if entity_type:
        query = query.where(AuditTrail.entity_type == entity_type)
    if entity_id:
        query = query.where(AuditTrail.entity_id == entity_id)
    if user_id:
        query = query.where(AuditTrail.user_id == user_id)
    return list(db.scalars(query.order_by(AuditTrail.created_at.desc()).limit(limit)).all())
