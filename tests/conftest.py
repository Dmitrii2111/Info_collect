from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.server import create_app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    app = create_app(bootstrap_builtin_users=False)

    class DummyDbSession:
        def commit(self) -> None:
            return None

        def rollback(self) -> None:
            return None

        def close(self) -> None:
            return None

    def override_get_db():
        yield DummyDbSession()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client
