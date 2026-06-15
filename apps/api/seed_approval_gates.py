"""Local-only approval gate seed helper.

This script is intentionally guarded so it cannot seed production by accident.
Run from the repository root with:

  ALLOW_LOCAL_APPROVAL_SEED=1 ENVIRONMENT=local python apps/api/seed_approval_gates.py
"""

import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.session import get_db_session  # noqa: E402
from app.models.approval_gate import ApprovalGate, AuditTrail  # noqa: E402
from app.models.user import User  # noqa: E402


def require_local_seed_enabled() -> None:
    environment = os.getenv("ENVIRONMENT", "local").lower()
    allow_seed = os.getenv("ALLOW_LOCAL_APPROVAL_SEED", "").lower() in {"1", "true", "yes"}
    if environment not in {"local", "dev", "development"} or not allow_seed:
        raise SystemExit(
            "Refusing to seed approval gates. Set ALLOW_LOCAL_APPROVAL_SEED=1 "
            "and ENVIRONMENT=local/dev/development for local fixtures only."
        )


def seed() -> None:
    require_local_seed_enabled()
    session_generator = get_db_session()
    db = next(session_generator)
    try:
        user = db.query(User).order_by(User.created_at.asc()).first()
        if not user:
            raise SystemExit("No user found. Create a local user before seeding approval gates.")

        seeds = [
            {
                "gate_id": "LOCAL-GATE-REQ-001",
                "entity_type": "requirement",
                "entity_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "gate_name": "QA Review",
                "from_status": "Draft",
                "to_status": "Ready",
                "status": "pending",
                "ai_recommendation": "go",
                "ai_confidence": 85,
            },
            {
                "gate_id": "LOCAL-GATE-RUN-001",
                "entity_type": "test_run",
                "entity_id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
                "gate_name": "Execution Sign-off",
                "from_status": "Running",
                "to_status": "Completed",
                "status": "pending",
                "ai_recommendation": "conditional",
                "ai_confidence": 72,
            },
        ]

        for seed_data in seeds:
            existing = db.query(ApprovalGate).filter(ApprovalGate.gate_id == seed_data["gate_id"]).first()
            if existing:
                continue

            gate = ApprovalGate(**seed_data)
            db.add(gate)
            db.add(
                AuditTrail(
                    action="created",
                    entity_type=seed_data["entity_type"],
                    entity_id=seed_data["entity_id"],
                    user_id=user.id,
                    new_value={"gate_name": seed_data["gate_name"], "status": "pending"},
                )
            )

        db.commit()
        print("Local approval gates and audit trails seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
