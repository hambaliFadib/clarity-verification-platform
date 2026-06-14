"""remove complexity and rename priority to severity

Revision ID: 20260611_0001
Revises: 20260610_0001
Create Date: 2026-06-11 14:23:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260611_0001'
down_revision: Union[str, None] = '20260610_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop the complexity column safely
    op.execute("ALTER TABLE test_cases DROP COLUMN IF EXISTS complexity")
    # 2. Rename priority to severity safely
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='test_cases' AND column_name='priority') THEN
            ALTER TABLE test_cases RENAME COLUMN priority TO severity;
        END IF;
    END $$;
    """)


def downgrade() -> None:
    # 1. Rename severity back to priority
    op.alter_column('test_cases', 'severity', new_column_name='priority')
    # 2. Add the complexity column back
    op.add_column('test_cases', sa.Column('complexity', sa.String(length=10), nullable=True))
