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

