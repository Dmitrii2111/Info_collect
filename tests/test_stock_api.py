from types import SimpleNamespace

import app.api.routes.stock as stock_routes


def test_stock_overview_returns_payload(client, monkeypatch):
    monkeypatch.setattr(
        stock_routes,
        "get_stock_overview",
        lambda _db: {
            "storage_zones_count": 3,
            "active_storage_zones_count": 2,
            "receipts_count": 5,
            "pending_receipts_count": 2,
            "movements_count": 14,
            "quantity_on_hand": 18,
        },
    )

    response = client.get("/api/stock/overview")

    assert response.status_code == 200
    assert response.json()["storage_zones_count"] == 3
    assert response.json()["quantity_on_hand"] == 18


def test_stock_zones_returns_serialized_rows(client, monkeypatch):
    monkeypatch.setattr(
        stock_routes,
        "list_storage_zones",
        lambda _db: [
            {
                "storage_zone_id": "zone-1",
                "code": "SK-01",
                "name": "Основной склад",
                "zone_type": "physical",
                "room_id": "room-1",
                "room_code": "1.01",
                "room_name": "Складское помещение",
                "is_active": True,
                "quantity_on_hand": 12,
                "movements_count": 4,
                "opened_at": None,
            }
        ],
    )

    response = client.get("/api/stock/zones")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["code"] == "SK-01"
    assert payload[0]["quantity_on_hand"] == 12


def test_create_stock_zone_returns_created_zone(client, monkeypatch):
    monkeypatch.setattr(stock_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(
        stock_routes,
        "create_storage_zone",
        lambda _db, **kwargs: SimpleNamespace(id="zone-2", code=kwargs["code"], name=kwargs["name"]),
    )
    monkeypatch.setattr(
        stock_routes,
        "list_storage_zones",
        lambda _db: [
            {
                "storage_zone_id": "zone-2",
                "code": "SK-02",
                "name": "Локальный склад",
                "zone_type": "physical",
                "room_id": None,
                "room_code": None,
                "room_name": None,
                "is_active": True,
                "quantity_on_hand": 0,
                "movements_count": 0,
                "opened_at": None,
            }
        ],
    )

    response = client.post(
        "/api/stock/zones",
        json={
            "code": "SK-02",
            "name": "Локальный склад",
            "room_id": None,
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Локальный склад"


def test_create_receipt_returns_detail_payload(client, monkeypatch):
    monkeypatch.setattr(stock_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(stock_routes, "create_warehouse_receipt", lambda _db, **kwargs: SimpleNamespace(id="receipt-1"))
    monkeypatch.setattr(
        stock_routes,
        "get_receipt_detail",
        lambda _db, _receipt_id: {
            "warehouse_receipt_id": "receipt-1",
            "receipt_no": "REC-001",
            "building_id": "building-1",
            "target_storage_zone_id": "zone-1",
            "target_storage_zone_name": "Основной склад",
            "status_code": "draft",
            "created_at": None,
            "confirmed_at": None,
            "created_by_name": "System Import",
            "comment_text": None,
            "items": [
                {
                    "warehouse_receipt_item_id": "item-1",
                    "position_code": "2.34",
                    "planned_position_id": "position-1",
                    "equipment_name": "Облучатель",
                    "model_mark": None,
                    "category_id": None,
                    "declared_quantity": 10,
                    "actual_quantity": 10,
                    "condition_status": "good",
                    "completeness_status": None,
                    "status_code": "draft",
                    "placement_status": "awaiting_placement",
                    "photo_refs": ["photo-1"],
                    "comment_text": None,
                    "created_at": None,
                }
            ],
        },
    )

    response = client.post(
        "/api/stock/receipts",
        json={
            "receipt_no": "REC-001",
            "items": [
                {
                    "position_code": "2.34",
                    "planned_position_id": "position-1",
                    "equipment_name": "Облучатель",
                    "declared_quantity": 10,
                    "actual_quantity": 10,
                    "condition_status": "good",
                    "photo_refs": ["photo-1"],
                }
            ],
        },
    )

    assert response.status_code == 201
    assert response.json()["warehouse_receipt_id"] == "receipt-1"
    assert response.json()["items"][0]["position_code"] == "2.34"


def test_confirm_receipt_returns_updated_detail(client, monkeypatch):
    monkeypatch.setattr(stock_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(stock_routes, "confirm_warehouse_receipt", lambda _db, **kwargs: SimpleNamespace(id="receipt-1"))
    monkeypatch.setattr(
        stock_routes,
        "get_receipt_detail",
        lambda _db, _receipt_id: {
            "warehouse_receipt_id": "receipt-1",
            "receipt_no": "REC-001",
            "building_id": "building-1",
            "target_storage_zone_id": "zone-1",
            "target_storage_zone_name": "Основной склад",
            "status_code": "partially_confirmed",
            "created_at": None,
            "confirmed_at": None,
            "created_by_name": "System Import",
            "comment_text": "Подтверждено",
            "items": [],
        },
    )

    response = client.post("/api/stock/receipts/receipt-1/confirm", json={"comment_text": "Подтверждено"})

    assert response.status_code == 200
    assert response.json()["status_code"] == "partially_confirmed"


def test_receipt_issues_returns_rows(client, monkeypatch):
    monkeypatch.setattr(
        stock_routes,
        "list_receipt_issues",
        lambda _db, _receipt_id: [
            {
                "issue_id": "item-1",
                "issue_type": "shortage",
                "warehouse_receipt_item_id": "item-1",
                "position_code": "2.34",
                "equipment_name": "Облучатель",
                "declared_quantity": 10,
                "actual_quantity": 8,
                "delta_quantity": -2,
                "storage_zone_id": "zone-1",
                "storage_zone_name": "Ожидает размещения",
                "conflict_id": "conf-1",
                "follow_up_task_id": "task-1",
                "status_code": "open",
            }
        ],
    )

    response = client.get("/api/stock/receipts/receipt-1/issues")

    assert response.status_code == 200
    assert response.json()[0]["issue_type"] == "shortage"


def test_resolve_receipt_issue_returns_payload(client, monkeypatch):
    monkeypatch.setattr(stock_routes, "get_or_create_system_user", lambda _db: SimpleNamespace(id="system-user"))
    monkeypatch.setattr(
        stock_routes,
        "resolve_receipt_issue",
        lambda _db, **kwargs: {
            "issue_id": "item-1",
            "action": kwargs["action"],
            "status_code": "resolved",
        },
    )

    response = client.post(
        "/api/stock/receipts/receipt-1/issues/item-1/resolve",
        json={"action": "close_follow_up", "comment_text": "Закрыто"},
    )

    assert response.status_code == 200
    assert response.json()["status_code"] == "resolved"
