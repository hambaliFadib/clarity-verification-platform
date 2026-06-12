from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '69d473bf5279'
down_revision: Union[str, None] = '20260611_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('verification_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('verification_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        'users',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        'users',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.create_index(op.f('ix_users_verification_token'), 'users', ['verification_token'], unique=False)
    op.alter_column('users', 'email_verified', server_default=None)
    op.alter_column('users', 'is_active', server_default=None)
    op.alter_column('users', 'updated_at', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_verification_token'), table_name='users')
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'verification_expires')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'google_id')

