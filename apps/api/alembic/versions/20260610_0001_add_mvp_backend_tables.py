from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260610_0001"
down_revision: Union[str, None] = "7343d43f9908"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "activity_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user", sa.String(length=100), nullable=False),
        sa.Column("user_initials", sa.String(length=5), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_id", sa.String(length=50), nullable=False),
        sa.Column("target_title", sa.String(length=255), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activity_items_target_id"), "activity_items", ["target_id"], unique=False)

    op.create_table(
        "defects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("display_id", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("priority", sa.String(length=10), nullable=False),
        sa.Column("assigned_to", sa.String(length=100), nullable=True),
        sa.Column("reported_by", sa.String(length=100), nullable=True),
        sa.Column("linked_test_case", sa.String(length=20), nullable=True),
        sa.Column("linked_test_run", sa.String(length=120), nullable=True),
        sa.Column("environment", sa.String(length=120), nullable=True),
        sa.Column("browser", sa.String(length=120), nullable=True),
        sa.Column("steps_to_reproduce", sa.Text(), nullable=True),
        sa.Column("tags", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_defects_display_id"), "defects", ["display_id"], unique=True)
    op.create_index(op.f("ix_defects_linked_test_case"), "defects", ["linked_test_case"], unique=False)

    op.create_table(
        "environments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("last_deployed", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("prefix", sa.String(length=12), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_priority", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_prefix"), "projects", ["prefix"], unique=True)

    op.create_table(
        "releases",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=False),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("total_test_cases", sa.Integer(), nullable=False),
        sa.Column("passed_test_cases", sa.Integer(), nullable=False),
        sa.Column("total_defects", sa.Integer(), nullable=False),
        sa.Column("open_defects", sa.Integer(), nullable=False),
        sa.Column("critical_defects", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_releases_version"), "releases", ["version"], unique=True)

    op.create_table(
        "test_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("display_id", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("environment", sa.String(length=120), nullable=False),
        sa.Column("release", sa.String(length=80), nullable=True),
        sa.Column("assigned_to", sa.String(length=100), nullable=False),
        sa.Column("total_cases", sa.Integer(), nullable=False),
        sa.Column("passed", sa.Integer(), nullable=False),
        sa.Column("failed", sa.Integer(), nullable=False),
        sa.Column("blocked", sa.Integer(), nullable=False),
        sa.Column("not_run", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_test_runs_display_id"), "test_runs", ["display_id"], unique=True)

    op.create_table(
        "work_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("priority", sa.String(length=10), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(length=120), nullable=True),
        sa.Column("assigned_to", sa.String(length=100), nullable=False),
        sa.Column("due_in", sa.String(length=40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "defect_comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("defect_id", sa.Uuid(), nullable=False),
        sa.Column("author", sa.String(length=100), nullable=False),
        sa.Column("initials", sa.String(length=5), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["defect_id"], ["defects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("defect_comments")
    op.drop_table("work_items")
    op.drop_index(op.f("ix_test_runs_display_id"), table_name="test_runs")
    op.drop_table("test_runs")
    op.drop_index(op.f("ix_releases_version"), table_name="releases")
    op.drop_table("releases")
    op.drop_index(op.f("ix_projects_prefix"), table_name="projects")
    op.drop_table("projects")
    op.drop_table("environments")
    op.drop_index(op.f("ix_defects_linked_test_case"), table_name="defects")
    op.drop_index(op.f("ix_defects_display_id"), table_name="defects")
    op.drop_table("defects")
    op.drop_index(op.f("ix_activity_items_target_id"), table_name="activity_items")
    op.drop_table("activity_items")
