"""Add avatar url for field workers.

Revision ID: 20260422_0002
Revises: 20260420_0001
Create Date: 2026-04-22 17:45:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260422_0002"
down_revision = "20260420_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
