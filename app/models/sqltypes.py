from enum import Enum

from sqlalchemy import Enum as SqlEnum


def enum_column(enum_cls: type[Enum], name: str) -> SqlEnum:
    return SqlEnum(
        enum_cls,
        name=name,
        values_callable=lambda members: [member.value for member in members],
    )
