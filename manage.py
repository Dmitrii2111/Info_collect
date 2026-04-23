from __future__ import annotations

import argparse
import sys

from alembic import command
from alembic.config import Config

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.plan_import import import_plan_from_excel
from app.services.plan_queries import list_plan_change_sets, list_plan_versions
from app.services.system_user import get_or_create_system_user
from app.models.enums import CategoryCode


def get_alembic_config() -> Config:
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", settings.database_url)
    return config


def migrate() -> None:
    command.upgrade(get_alembic_config(), "head")


def import_plan(args: argparse.Namespace) -> None:
    with SessionLocal() as db:
        system_user = get_or_create_system_user(db)
        result = import_plan_from_excel(
            db,
            source_path=args.source_path,
            building_code=args.building_code,
            building_name=args.building_name,
            version_label=args.version_label,
            category_code=CategoryCode(args.category_code),
            comment_text=args.comment_text,
            created_by_id=system_user.id,
        )
        db.commit()
        print(f"Import session: {result.import_session.id}")
        print(f"Plan version: {result.plan_version.version_no} / {result.plan_version.id}")
        print(f"Imported rooms: {result.imported_rooms}")
        print(f"Imported positions: {result.imported_positions}")
        print(f"Imported items: {result.imported_items}")
        print(f"Detected changes: {result.detected_changes}")
        print(f"Change set id: {result.change_set_id}")


def show_plan_versions() -> None:
    with SessionLocal() as db:
        rows = list_plan_versions(db)
        for plan_version, building in rows:
            print(
                f"{plan_version.version_no}\t{building.code}\t{plan_version.version_label}\t"
                f"{plan_version.status_code.value}\t{plan_version.source_file_name}"
            )


def show_change_sets() -> None:
    with SessionLocal() as db:
        rows = list_plan_change_sets(db)
        for item in rows:
            print(
                f"{item.id}\t{item.status_code.value}\t"
                f"{item.old_plan_version_id}\t{item.new_plan_version_id}\t{item.summary_json}"
            )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="InfoCollect management commands")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate", help="Apply Alembic migrations")
    subparsers.add_parser("plan-versions", help="Show imported plan versions")
    subparsers.add_parser("plan-changes", help="Show generated plan change sets")

    import_parser = subparsers.add_parser("import-plan", help="Import source Excel plan into PostgreSQL")
    import_parser.add_argument("--source-path", required=True)
    import_parser.add_argument("--building-code", default="default-building")
    import_parser.add_argument("--building-name", default="Default building")
    import_parser.add_argument("--version-label", required=True)
    import_parser.add_argument("--category-code", choices=[value.value for value in CategoryCode], default="furniture")
    import_parser.add_argument("--comment-text", default=None)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "migrate":
        migrate()
        return 0
    if args.command == "import-plan":
        import_plan(args)
        return 0
    if args.command == "plan-versions":
        show_plan_versions()
        return 0
    if args.command == "plan-changes":
        show_change_sets()
        return 0

    parser.error(f"Unknown command: {args.command}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
