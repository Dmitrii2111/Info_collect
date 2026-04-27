"""Update roles and add receipt stage 1-2 stock logic.

Revision ID: 20260427_0003
Revises: 20260422_0002
Create Date: 2026-04-27 18:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260427_0003"
down_revision = "20260422_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role RENAME VALUE 'operator' TO 'dispetcher'")
    op.execute("ALTER TYPE user_role RENAME VALUE 'field_worker' TO 'operator'")

    op.execute("ALTER TYPE communications_status ADD VALUE IF NOT EXISTS 'not_provided'")
    op.execute("ALTER TYPE conflict_type ADD VALUE IF NOT EXISTS 'receipt_shortage'")
    op.execute("ALTER TYPE conflict_type ADD VALUE IF NOT EXISTS 'receipt_surplus'")
    op.execute("ALTER TYPE conflict_type ADD VALUE IF NOT EXISTS 'unplanned_receipt'")
    op.execute("ALTER TYPE conflict_type ADD VALUE IF NOT EXISTS 'location_mismatch'")

    op.execute("CREATE TYPE receipt_item_status AS ENUM ('draft', 'confirmed', 'shortage', 'surplus', 'unplanned')")
    op.execute(
        "CREATE TYPE placement_status AS ENUM ('awaiting_placement', 'placed_to_stock', 'placed_to_room', 'partially_placed')"
    )
    op.execute(
        "CREATE TYPE condition_status AS ENUM ('good', 'damaged', 'requires_inspection', 'incomplete', 'other')"
    )
    op.execute(
        "CREATE TYPE storage_zone_type AS ENUM ('physical', 'surplus', 'awaiting_placement', 'quarantine')"
    )
    op.execute("CREATE TYPE follow_up_task_type AS ENUM ('supply_shortage')")
    op.execute("CREATE TYPE follow_up_task_status AS ENUM ('open', 'in_progress', 'resolved', 'cancelled')")

    op.add_column(
        "storage_zones",
        sa.Column(
            "zone_type",
            sa.Enum(
                "physical",
                "surplus",
                "awaiting_placement",
                "quarantine",
                name="storage_zone_type",
            ),
            nullable=True,
        ),
    )
    op.execute("UPDATE storage_zones SET zone_type = 'physical' WHERE zone_type IS NULL")
    op.alter_column("storage_zones", "zone_type", nullable=False)

    op.add_column("warehouse_receipt_items", sa.Column("position_code", sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE warehouse_receipt_items AS wri
        SET position_code = COALESCE(pp.position_code, wri.equipment_name)
        FROM planned_positions AS pp
        WHERE wri.planned_position_id = pp.id
          AND wri.position_code IS NULL
        """
    )
    op.execute("UPDATE warehouse_receipt_items SET position_code = equipment_name WHERE position_code IS NULL")
    op.alter_column("warehouse_receipt_items", "position_code", nullable=False)

    op.execute(
        """
        ALTER TABLE warehouse_receipt_items
        ALTER COLUMN condition_status TYPE condition_status
        USING CASE
            WHEN condition_status IN ('good', 'damaged', 'requires_inspection', 'incomplete', 'other')
                THEN condition_status::condition_status
            ELSE NULL
        END
        """
    )
    op.add_column(
        "warehouse_receipt_items",
        sa.Column(
            "status_code",
            sa.Enum("draft", "confirmed", "shortage", "surplus", "unplanned", name="receipt_item_status"),
            nullable=True,
            server_default=sa.text("'draft'"),
        ),
    )
    op.add_column(
        "warehouse_receipt_items",
        sa.Column(
            "placement_status",
            sa.Enum(
                "awaiting_placement",
                "placed_to_stock",
                "placed_to_room",
                "partially_placed",
                name="placement_status",
            ),
            nullable=True,
            server_default=sa.text("'awaiting_placement'"),
        ),
    )
    op.add_column(
        "warehouse_receipt_items",
        sa.Column(
            "photo_refs_json",
            sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.execute("UPDATE warehouse_receipt_items SET status_code = 'draft' WHERE status_code IS NULL")
    op.execute("UPDATE warehouse_receipt_items SET placement_status = 'awaiting_placement' WHERE placement_status IS NULL")
    op.alter_column("warehouse_receipt_items", "status_code", nullable=False, server_default=None)
    op.alter_column("warehouse_receipt_items", "placement_status", nullable=False, server_default=None)
    op.alter_column("warehouse_receipt_items", "photo_refs_json", server_default=None)

    op.execute(
        """
        ALTER TABLE warehouse_receipt_confirmations
        ALTER COLUMN condition_status TYPE condition_status
        USING CASE
            WHEN condition_status IN ('good', 'damaged', 'requires_inspection', 'incomplete', 'other')
                THEN condition_status::condition_status
            ELSE NULL
        END
        """
    )
    op.add_column(
        "warehouse_receipt_confirmations",
        sa.Column(
            "photo_refs_json",
            sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.alter_column("warehouse_receipt_confirmations", "photo_refs_json", server_default=None)

    op.drop_constraint("chk_stock_balance_target", "stock_balances", type_="check")
    op.add_column("stock_balances", sa.Column("warehouse_receipt_item_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_stock_balances_receipt_item",
        "stock_balances",
        "warehouse_receipt_items",
        ["warehouse_receipt_item_id"],
        ["id"],
    )
    op.create_check_constraint(
        "chk_stock_balance_target",
        "stock_balances",
        "planned_item_id IS NOT NULL OR planned_position_id IS NOT NULL OR warehouse_receipt_item_id IS NOT NULL",
    )
    op.create_index("ix_stock_balances_receipt_item_id", "stock_balances", ["warehouse_receipt_item_id"], unique=False)

    op.add_column("conflicts", sa.Column("planned_position_id", sa.UUID(), nullable=True))
    op.add_column("conflicts", sa.Column("warehouse_receipt_id", sa.UUID(), nullable=True))
    op.add_column("conflicts", sa.Column("warehouse_receipt_item_id", sa.UUID(), nullable=True))
    op.add_column("conflicts", sa.Column("storage_zone_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_conflicts_planned_position", "conflicts", "planned_positions", ["planned_position_id"], ["id"])
    op.create_foreign_key("fk_conflicts_receipt", "conflicts", "warehouse_receipts", ["warehouse_receipt_id"], ["id"])
    op.create_foreign_key(
        "fk_conflicts_receipt_item",
        "conflicts",
        "warehouse_receipt_items",
        ["warehouse_receipt_item_id"],
        ["id"],
    )
    op.create_foreign_key("fk_conflicts_storage_zone", "conflicts", "storage_zones", ["storage_zone_id"], ["id"])

    op.create_table(
        "receipt_follow_up_tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("warehouse_receipt_item_id", sa.UUID(), nullable=False),
        sa.Column(
            "task_type",
            postgresql.ENUM("supply_shortage", name="follow_up_task_type", create_type=False),
            nullable=False,
        ),
        sa.Column("required_quantity", sa.Integer(), nullable=False),
        sa.Column(
            "status_code",
            postgresql.ENUM("open", "in_progress", "resolved", "cancelled", name="follow_up_task_status", create_type=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("resolved_by", sa.UUID(), nullable=True),
        sa.Column("comment_text", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["warehouse_receipt_item_id"], ["warehouse_receipt_items.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_receipt_follow_up_tasks_item_id", "receipt_follow_up_tasks", ["warehouse_receipt_item_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_receipt_follow_up_tasks_item_id", table_name="receipt_follow_up_tasks")
    op.drop_table("receipt_follow_up_tasks")

    op.drop_constraint("fk_conflicts_storage_zone", "conflicts", type_="foreignkey")
    op.drop_constraint("fk_conflicts_receipt_item", "conflicts", type_="foreignkey")
    op.drop_constraint("fk_conflicts_receipt", "conflicts", type_="foreignkey")
    op.drop_constraint("fk_conflicts_planned_position", "conflicts", type_="foreignkey")
    op.drop_column("conflicts", "storage_zone_id")
    op.drop_column("conflicts", "warehouse_receipt_item_id")
    op.drop_column("conflicts", "warehouse_receipt_id")
    op.drop_column("conflicts", "planned_position_id")

    op.drop_index("ix_stock_balances_receipt_item_id", table_name="stock_balances")
    op.drop_constraint("chk_stock_balance_target", "stock_balances", type_="check")
    op.drop_constraint("fk_stock_balances_receipt_item", "stock_balances", type_="foreignkey")
    op.drop_column("stock_balances", "warehouse_receipt_item_id")
    op.create_check_constraint(
        "chk_stock_balance_target",
        "stock_balances",
        "planned_item_id IS NOT NULL OR planned_position_id IS NOT NULL",
    )

    op.drop_column("warehouse_receipt_confirmations", "photo_refs_json")
    op.execute("ALTER TABLE warehouse_receipt_confirmations ALTER COLUMN condition_status TYPE TEXT USING condition_status::text")

    op.drop_column("warehouse_receipt_items", "photo_refs_json")
    op.drop_column("warehouse_receipt_items", "placement_status")
    op.drop_column("warehouse_receipt_items", "status_code")
    op.execute("ALTER TABLE warehouse_receipt_items ALTER COLUMN condition_status TYPE TEXT USING condition_status::text")
    op.drop_column("warehouse_receipt_items", "position_code")

    op.drop_column("storage_zones", "zone_type")

    op.execute("DROP TYPE follow_up_task_status")
    op.execute("DROP TYPE follow_up_task_type")
    op.execute("DROP TYPE storage_zone_type")
    op.execute("DROP TYPE condition_status")
    op.execute("DROP TYPE placement_status")
    op.execute("DROP TYPE receipt_item_status")

    op.execute("ALTER TYPE user_role RENAME VALUE 'operator' TO 'field_worker'")
    op.execute("ALTER TYPE user_role RENAME VALUE 'dispetcher' TO 'operator'")
