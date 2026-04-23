"""Initial PostgreSQL schema for InfoCollect.

Revision ID: 20260420_0001
Revises:
Create Date: 2026-04-20 11:55:00
"""

from __future__ import annotations

from pathlib import Path

from alembic import op


revision = "20260420_0001"
down_revision = None
branch_labels = None
depends_on = None


def _read_schema_sql() -> str:
    base_dir = Path(__file__).resolve().parents[2]
    schema_path = base_dir / "db" / "schema.sql"
    return schema_path.read_text(encoding="utf-8")


def _split_sql_statements(raw_sql: str) -> list[str]:
    statements: list[str] = []
    buffer: list[str] = []

    for line in raw_sql.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        buffer.append(line)
        if stripped.endswith(";"):
            statement = "\n".join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []

    if buffer:
        statement = "\n".join(buffer).strip()
        if statement:
            statements.append(statement)

    return statements


def upgrade() -> None:
    for statement in _split_sql_statements(_read_schema_sql()):
        op.execute(statement)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS export_sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS import_rows CASCADE")
    op.execute("DROP TABLE IF EXISTS plan_change_items CASCADE")
    op.execute("DROP TABLE IF EXISTS plan_change_sets CASCADE")
    op.execute("DROP TABLE IF EXISTS stock_movements CASCADE")
    op.execute("DROP TABLE IF EXISTS stock_balances CASCADE")
    op.execute("DROP TABLE IF EXISTS warehouse_receipt_confirmations CASCADE")
    op.execute("DROP TABLE IF EXISTS warehouse_receipt_items CASCADE")
    op.execute("DROP TABLE IF EXISTS warehouse_receipts CASCADE")
    op.execute("DROP TABLE IF EXISTS conflicts CASCADE")
    op.execute("DROP TABLE IF EXISTS communication_history CASCADE")
    op.execute("DROP TABLE IF EXISTS pnr_history CASCADE")
    op.execute("DROP TABLE IF EXISTS item_status_history CASCADE")
    op.execute("DROP TABLE IF EXISTS item_checks CASCADE")
    op.execute("DROP TABLE IF EXISTS repeat_checks CASCADE")
    op.execute("DROP TABLE IF EXISTS domain_events CASCADE")
    op.execute("DROP TABLE IF EXISTS sync_batches CASCADE")
    op.execute("DROP TABLE IF EXISTS equipment_instances CASCADE")
    op.execute("DROP TABLE IF EXISTS storage_zones CASCADE")
    op.execute("DROP TABLE IF EXISTS planned_items CASCADE")
    op.execute("DROP TABLE IF EXISTS planned_positions CASCADE")
    op.execute("DROP TABLE IF EXISTS plan_versions CASCADE")
    op.execute("DROP TABLE IF EXISTS import_sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS devices CASCADE")
    op.execute("DROP TABLE IF EXISTS user_assignments CASCADE")
    op.execute("DROP TABLE IF EXISTS equipment_categories CASCADE")
    op.execute("DROP TABLE IF EXISTS rooms CASCADE")
    op.execute("DROP TABLE IF EXISTS departments CASCADE")
    op.execute("DROP TABLE IF EXISTS floors CASCADE")
    op.execute("DROP TABLE IF EXISTS buildings CASCADE")
    op.execute("DROP TABLE IF EXISTS user_team_memberships CASCADE")
    op.execute("DROP TABLE IF EXISTS teams CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")

    op.execute("DROP TYPE IF EXISTS export_type")
    op.execute("DROP TYPE IF EXISTS sync_batch_status")
    op.execute("DROP TYPE IF EXISTS change_resolution_action")
    op.execute("DROP TYPE IF EXISTS change_resolution_status")
    op.execute("DROP TYPE IF EXISTS change_type")
    op.execute("DROP TYPE IF EXISTS change_set_status")
    op.execute("DROP TYPE IF EXISTS movement_type")
    op.execute("DROP TYPE IF EXISTS receipt_status")
    op.execute("DROP TYPE IF EXISTS conflict_status")
    op.execute("DROP TYPE IF EXISTS conflict_type")
    op.execute("DROP TYPE IF EXISTS repeat_check_status")
    op.execute("DROP TYPE IF EXISTS repeat_check_scope")
    op.execute("DROP TYPE IF EXISTS check_type")
    op.execute("DROP TYPE IF EXISTS communications_status")
    op.execute("DROP TYPE IF EXISTS pnr_status")
    op.execute("DROP TYPE IF EXISTS serial_state")
    op.execute("DROP TYPE IF EXISTS item_presence_status")
    op.execute("DROP TYPE IF EXISTS import_row_status")
    op.execute("DROP TYPE IF EXISTS import_status")
    op.execute("DROP TYPE IF EXISTS import_type")
    op.execute("DROP TYPE IF EXISTS plan_version_status")
    op.execute("DROP TYPE IF EXISTS category_code")
    op.execute("DROP TYPE IF EXISTS user_role")

    op.execute('DROP EXTENSION IF EXISTS "pgcrypto"')
