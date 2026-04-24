from datetime import datetime, timezone
from types import SimpleNamespace

import app.api.routes.users as users_routes


def test_get_field_workers_returns_serialized_users(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "list_field_users",
        lambda _db: [
            {
                "user_id": "u-1",
                "login": "worker1",
                "full_name": "Иванов Иван Иванович",
                "last_name": "Иванов",
                "first_name": "Иван",
                "middle_name": "Иванович",
                "role": "field_worker",
                "is_active": True,
                "phone": "+79990001122",
                "email": "worker@example.local",
                "avatar_url": None,
                "active_assignments_count": 2,
                "assigned_rooms_count": 4,
                "completed_rooms_count": 1,
                "in_progress_rooms_count": 1,
                "not_started_rooms_count": 2,
                "work_status": "in_progress",
            }
        ],
    )

    response = client.get("/api/users/field-workers")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["login"] == "worker1"
    assert payload[0]["assigned_rooms_count"] == 4
    assert payload[0]["work_status"] == "in_progress"


def test_create_field_worker_returns_created_user(client, monkeypatch):
    def fake_create_field_user(_db, **kwargs):
        assert kwargs["login"] == "worker2"
        assert kwargs["role"].value == "field_worker"
        return SimpleNamespace(
            id="u-2",
            login="worker2",
            full_name="Петров Петр Петрович",
            last_name="Петров",
            first_name="Петр",
            middle_name="Петрович",
            role=SimpleNamespace(value="field_worker"),
            phone="+79991112233",
            email="worker2@example.local",
            avatar_url=None,
        )

    monkeypatch.setattr(users_routes, "create_field_user", fake_create_field_user)

    response = client.post(
        "/api/users/field-workers",
        json={
            "login": "worker2",
            "password": "StrongPass1!",
            "last_name": "Петров",
            "first_name": "Петр",
            "middle_name": "Петрович",
            "phone": "+79991112233",
            "email": "worker2@example.local",
            "role": "field_worker",
        },
    )

    assert response.status_code == 201
    assert response.json()["full_name"] == "Петров Петр Петрович"


def test_update_assignments_returns_counter(client, monkeypatch):
    monkeypatch.setattr(users_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(users_routes, "replace_user_assignments", lambda _db, **kwargs: 5)

    response = client.put(
        "/api/users/field-workers/u-1/assignments",
        json={
            "floor_ids": ["floor-1"],
            "department_ids": ["dep-1"],
            "room_ids": ["room-1", "room-2"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Assignments updated"
    assert payload["active_assignments_count"] == 5
    assert payload["user_id"] == "u-1"


def test_assignment_overlap_preview_returns_conflicts(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "build_assignment_overlap_preview",
        lambda _db, user_id, room_ids: {
            "user_id": user_id,
            "overlap_count": 1,
            "overlaps": [
                {
                    "room_id": "room-4",
                    "room_code": "4.01",
                    "room_name": "Кабинет 4",
                    "other_user_id": "u-2",
                    "other_user_name": "Сидоров Сидор Сидорович",
                    "other_group_id": None,
                    "other_group_name": None,
                }
            ],
        },
    )

    response = client.post(
        "/api/users/field-workers/u-1/assignment-overlaps",
        json={"floor_ids": [], "department_ids": [], "room_ids": ["room-4"]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["overlap_count"] == 1
    assert payload["overlaps"][0]["other_user_name"] == "Сидоров Сидор Сидорович"


def test_get_groups_returns_group_summary(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "list_groups",
        lambda _db: [
            {
                "team_id": "team-1",
                "team_name": "Бригада А",
                "members_count": 2,
                "assigned_rooms_count": 6,
                "completed_rooms_count": 3,
                "in_progress_rooms_count": 2,
                "not_started_rooms_count": 1,
                "members": [
                    {"user_id": "u-1", "full_name": "Иванов Иван Иванович", "login": "ivanov"},
                    {"user_id": "u-2", "full_name": "Петров Петр Петрович", "login": "petrov"},
                ],
            }
        ],
    )

    response = client.get("/api/users/groups")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["team_name"] == "Бригада А"
    assert payload[0]["members_count"] == 2



def test_update_group_returns_updated_payload(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "update_team",
        lambda _db, **kwargs: (
            SimpleNamespace(id="team-1", name=kwargs["team_name"]),
            {"disbanded": False, "disbanded_to_user_id": None, "conflicts_created": 0},
        ),
    )
    monkeypatch.setattr(
        users_routes,
        "get_group_detail",
        lambda _db, team_id: {
            "team_id": team_id,
            "team_name": "??????? ?",
            "members_count": 2,
            "assigned_rooms_count": 4,
            "completed_rooms_count": 1,
            "in_progress_rooms_count": 2,
            "not_started_rooms_count": 1,
            "members": [
                {"user_id": "u-1", "full_name": "?????? ???? ????????", "login": "ivanov"},
                {"user_id": "u-2", "full_name": "?????? ???? ????????", "login": "petrov"},
            ],
        },
    )

    response = client.put(
        "/api/users/groups/team-1",
        json={"team_name": "??????? ?", "member_user_ids": ["u-1", "u-2"]},
    )

    assert response.status_code == 200
    assert response.json()["team_name"] == "??????? ?"


def test_update_group_returns_disband_payload(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "update_team",
        lambda _db, **kwargs: (
            None,
            {"disbanded": True, "disbanded_to_user_id": "u-1", "conflicts_created": 0},
        ),
    )

    response = client.put(
        "/api/users/groups/team-1",
        json={"team_name": "??????? ?", "member_user_ids": ["u-1"]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Group disbanded"
    assert payload["disbanded_to_user_id"] == "u-1"


def test_delete_group_returns_conflicts_created(client, monkeypatch):
    monkeypatch.setattr(
        users_routes,
        "delete_team",
        lambda _db, **kwargs: {"team_id": kwargs["team_id"], "conflicts_created": 3},
    )

    response = client.delete("/api/users/groups/team-9")

    assert response.status_code == 200
    payload = response.json()
    assert payload["team_id"] == "team-9"
    assert payload["conflicts_created"] == 3
