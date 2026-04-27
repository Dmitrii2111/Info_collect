import app.api.routes.audit as audit_routes


def test_audit_summary_returns_counts(client, monkeypatch):
    monkeypatch.setattr(
        audit_routes,
        "get_audit_summary",
        lambda _db: {
            "total": 8,
            "system_events": 2,
            "field_events": 3,
            "office_events": 3,
        },
    )

    response = client.get("/api/audit/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 8
    assert payload["field_events"] == 3


def test_audit_events_returns_rows(client, monkeypatch):
    monkeypatch.setattr(
        audit_routes,
        "list_audit_events",
        lambda _db, **kwargs: [
            {
                "event_id": "evt-1",
                "event_type": "field.item_checked",
                "aggregate_type": "equipment_instance",
                "aggregate_id": "agg-1",
                "user_id": "user-1",
                "user_name": "Иванов И.И.",
                "user_role": "operator",
                "actor_scope": "field",
                "device_uid": "device-1",
                "platform": "android",
                "occurred_at_device": None,
                "recorded_at_server": "2026-04-24T10:00:00Z",
                "payload_json": {"presence_status": "found"},
                "metadata_json": {"source": "mobile"},
            }
        ],
    )

    response = client.get("/api/audit/events?actor_scope=field")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["event_type"] == "field.item_checked"
    assert payload[0]["actor_scope"] == "field"
