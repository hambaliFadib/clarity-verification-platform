from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "669d131c1303"
down_revision: Union[str, None] = "0ba0d1310343"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "approval_gates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("gate_id", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("gate_name", sa.String(length=100), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=False),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("decision_by", sa.Uuid(), nullable=True),
        sa.Column("decision_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decision_notes", sa.Text(), nullable=True),
        sa.Column("ai_recommendation", sa.String(length=20), nullable=True),
        sa.Column("ai_confidence", sa.Integer(), nullable=True),
        sa.Column("ai_analysis", sa.JSON(), nullable=True),
        sa.Column("evidence_ids", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["decision_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("gate_id"),
    )
    op.create_index("ix_approval_gates_entity", "approval_gates", ["entity_type", "entity_id"], unique=False)
    op.create_index("ix_approval_gates_status", "approval_gates", ["status"], unique=False)

    op.create_table(
        "audit_trail",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("audit_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_trail_entity", "audit_trail", ["entity_type", "entity_id"], unique=False)
    op.create_index("ix_audit_trail_user_id", "audit_trail", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_audit_trail_user_id", table_name="audit_trail")
    op.drop_index("ix_audit_trail_entity", table_name="audit_trail")
    op.drop_table("audit_trail")

    op.drop_index("ix_approval_gates_status", table_name="approval_gates")
    op.drop_index("ix_approval_gates_entity", table_name="approval_gates")
    op.drop_table("approval_gates")
