from types import SimpleNamespace

import app.api.routes.auth as auth_routes


def test_auth_login_returns_user_payload(client, monkeypatch):
    def fake_authenticate_any_user(_db, login, password):
        assert login == "admin"
        assert password == "Admin123!"
        return SimpleNamespace(
            id="user-1",
            login="admin",
            full_name="Админ Системы",
            last_name="Админ",
            first_name="Системы",
            middle_name=None,
            role=SimpleNamespace(value="admin"),
            phone="+79990000000",
            email="admin@example.local",
            avatar_url="/static/uploads/admin.png",
        )

    monkeypatch.setattr(auth_routes, "authenticate_any_user", fake_authenticate_any_user)

    response = client.post("/api/auth/login", json={"login": "admin", "password": "Admin123!"})

    assert response.status_code == 200
    assert response.json() == {
        "user_id": "user-1",
        "login": "admin",
        "full_name": "Админ Системы",
        "last_name": "Админ",
        "first_name": "Системы",
        "middle_name": None,
        "role": "admin",
        "phone": "+79990000000",
        "email": "admin@example.local",
        "avatar_url": "/static/uploads/admin.png",
    }


def test_auth_login_returns_400_on_invalid_credentials(client, monkeypatch):
    def fake_authenticate_any_user(_db, login, password):
        raise ValueError("Неверный логин или пароль")

    monkeypatch.setattr(auth_routes, "authenticate_any_user", fake_authenticate_any_user)

    response = client.post("/api/auth/login", json={"login": "bad", "password": "bad"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Неверный логин или пароль"
