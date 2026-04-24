import app.api.routes.items as items_routes


def test_items_export_returns_rows(client, monkeypatch):
    monkeypatch.setattr(
        items_routes,
        "list_items_for_export",
        lambda _db, plan_version_id=None: [
            {
                "equipment_instance_id": "inst-1",
                "planned_item_id": "item-1",
                "plan_version_id": "plan-1",
                "room_id": "room-1",
                "room_code": "3.01",
                "room_name": "Кабинет 301",
                "floor_code": "3",
                "department_name": "Диагностика",
                "position_code": "КТ-1",
                "equipment_name": "Томограф",
                "model_mark": None,
                "display_label": "Экземпляр 1",
                "current_presence_status": "not_checked",
                "serial_state": "unknown",
                "serial_number": None,
                "pnr_status": "not_done",
                "communications_status": "missing",
                "actual_condition": None,
                "completeness_status": None,
                "last_check_at": None,
                "last_checked_by_name": None,
            }
        ],
    )

    response = client.get("/api/items/export")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["planned_item_id"] == "item-1"
    assert payload[0]["room_code"] == "3.01"
