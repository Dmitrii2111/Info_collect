from types import SimpleNamespace

import app.api.routes.conflicts as conflicts_routes


def test_conflicts_summary_returns_counts(client, monkeypatch):
    monkeypatch.setattr(
        conflicts_routes,
        "get_conflicts_summary",
        lambda _db: {
            "total": 4,
            "open": 2,
            "resolved": 1,
            "dismissed": 1,
        },
    )

    response = client.get("/api/conflicts/summary")

    assert response.status_code == 200
    assert response.json()["open"] == 2


def test_conflicts_list_returns_rows(client, monkeypatch):
    monkeypatch.setattr(
        conflicts_routes,
        "list_conflicts",
        lambda _db, status_code=None, conflict_type=None: [
            {
                "conflict_id": "conf-1",
                "conflict_type": "serial_mismatch",
                "status_code": "open",
                "detected_at": None,
                "resolved_at": None,
                "room_id": "room-1",
                "room_code": "3.01",
                "room_name": "Кабинет 301",
                "equipment_instance_id": "inst-1",
                "planned_item_id": "item-1",
                "display_label": "Экземпляр 1",
                "equipment_name": "Монитор пациента",
                "first_event_type": "field.item_checked",
                "second_event_type": "operator.item_corrected",
                "first_user_name": "Иванов И.И.",
                "second_user_name": "Петров П.П.",
                "resolution_note": None,
            }
        ],
    )

    response = client.get("/api/conflicts")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["conflict_type"] == "serial_mismatch"
    assert payload[0]["room_code"] == "3.01"


def test_conflicts_update_returns_payload(client, monkeypatch):
    monkeypatch.setattr(conflicts_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(
        conflicts_routes,
        "update_conflict_status",
        lambda _db, **kwargs: SimpleNamespace(id="conf-1", status_code=SimpleNamespace(value=kwargs["status_code"].value)),
    )

    response = client.patch(
        "/api/conflicts/conf-1",
        json={
            "status_code": "resolved",
            "resolution_note": "Проверено диспетчером",
        },
    )

    assert response.status_code == 200
    assert response.json()["status_code"] == "resolved"

