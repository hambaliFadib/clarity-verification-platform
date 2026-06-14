"""ensure severity column exists on test_cases

Revision ID: 20260614_0001
Revises: 669d131c1303
Create Date: 2026-06-14 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260614_0001'
down_revision: Union[str, None] = '669d131c1303'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Idempotent: if 'priority' still exists and 'severity' does not -> rename
    # If 'severity' already exists -> do nothing
    # If neither exists -> add 'severity'
    op.execute("""
    DO $$
    BEGIN
        -- Case 1: priority exists but severity does not -> rename priority to severity
        IF EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name='test_cases' AND column_name='priority'
        ) AND NOT EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name='test_cases' AND column_name='severity'
        ) THEN
            ALTER TABLE test_cases RENAME COLUMN priority TO severity;

        -- Case 2: neither column exists -> add severity
        ELSIF NOT EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name='test_cases' AND column_name='severity'
        ) THEN
            ALTER TABLE test_cases ADD COLUMN severity VARCHAR(10) NOT NULL DEFAULT 'Medium';
        END IF;

        -- Drop priority column if it still lingers (e.g. both coexist)
        IF EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name='test_cases' AND column_name='priority'
        ) THEN
            ALTER TABLE test_cases DROP COLUMN priority;
        END IF;
    END $$;
    """)


def downgrade() -> None:
    # Rename severity back to priority
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name='test_cases' AND column_name='severity'
        ) THEN
            ALTER TABLE test_cases RENAME COLUMN severity TO priority;
        END IF;
    END $$;
    """)
