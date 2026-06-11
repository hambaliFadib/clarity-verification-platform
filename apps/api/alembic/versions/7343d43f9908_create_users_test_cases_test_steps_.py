from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '7343d43f9908'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('avatar', sa.String(length=500), nullable=True),
    sa.Column('initials', sa.String(length=5), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('test_cases',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('display_id', sa.String(length=20), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('module', sa.String(length=100), nullable=False),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('priority', sa.String(length=10), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('complexity', sa.String(length=10), nullable=True),
    sa.Column('assigned_to', sa.Uuid(), nullable=True),
    sa.Column('created_by', sa.Uuid(), nullable=True),
    sa.Column('requirement_id', sa.String(length=50), nullable=True),
    sa.Column('estimated_time', sa.String(length=30), nullable=True),
    sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('environment', sa.String(length=20), nullable=True),
    sa.Column('automation_status', sa.String(length=30), nullable=True),
    sa.Column('preconditions', sa.Text(), nullable=True),
    sa.Column('expected_result', sa.Text(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_cases_display_id'), 'test_cases', ['display_id'], unique=True)
    op.create_table('test_steps',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('test_case_id', sa.Uuid(), nullable=False),
    sa.Column('step_number', sa.Integer(), nullable=False),
    sa.Column('action', sa.Text(), nullable=False),
    sa.Column('test_data', sa.Text(), nullable=True),
    sa.Column('expected_result', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=10), nullable=True),
    sa.Column('actual_result', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['test_case_id'], ['test_cases.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('test_steps')
    op.drop_index(op.f('ix_test_cases_display_id'), table_name='test_cases')
    op.drop_table('test_cases')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
