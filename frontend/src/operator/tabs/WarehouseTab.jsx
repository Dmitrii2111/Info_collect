import { Button, Input, Select } from "antd";
import { SummaryBadge, SummaryCard } from "../components.jsx";

export function WarehouseTab({
  warehouseLoading,
  warehouseActionLoading,
  warehouseStatus,
  warehouseData,
  warehouseForm,
  onUpdateWarehouseForm,
  onCreateZone,
}) {
  const roomOptions = (warehouseData.rooms || []).map((room) => ({
    value: room.room_id,
    label: `${room.room_code} — ${room.room_name}`,
  }));

  return (
    <section className="react-grid warehouse-grid-react">
      <article className={`react-panel warehouse-overview-panel ${warehouseLoading ? "panel-busy" : ""}`}>
        <div className="panel-title-row">
          <div>
            <h2>Складские зоны</h2>
            <p className="panel-subtitle">
              Локальные зоны хранения, текущие остатки и история движения через складской контур.
            </p>
          </div>
        </div>

        <div className="react-summary-grid warehouse-summary-grid">
          <SummaryCard label="Всего зон" value={warehouseData.overview?.storage_zones_count || 0} />
          <SummaryCard label="Активные зоны" value={warehouseData.overview?.active_storage_zones_count || 0} tone="success" />
          <SummaryCard label="Поступления" value={warehouseData.overview?.receipts_count || 0} />
          <SummaryCard label="Ожидают подтверждения" value={warehouseData.overview?.pending_receipts_count || 0} tone="warning" />
          <SummaryCard label="Движения" value={warehouseData.overview?.movements_count || 0} />
          <SummaryCard label="Остаток на руках" value={warehouseData.overview?.quantity_on_hand || 0} tone="success" />
        </div>

        {warehouseStatus ? <p className="assignment-status-note">{warehouseStatus}</p> : null}

        <div className="warehouse-zone-list">
          {!warehouseLoading && !warehouseData.zones.length ? <div className="empty-box">Складские зоны пока не созданы.</div> : null}
          {warehouseData.zones.map((zone) => (
            <article key={zone.storage_zone_id} className="warehouse-zone-card">
              <div className="warehouse-zone-head">
                <div>
                  <strong>{zone.code} — {zone.name}</strong>
                  <p>{zone.room_code ? `${zone.room_code} — ${zone.room_name || "без названия"}` : "Помещение не привязано"}</p>
                </div>
                <SummaryBadge tone={zone.is_active ? "success" : "soft"}>
                  {zone.is_active ? "Активна" : "Закрыта"}
                </SummaryBadge>
              </div>
              <div className="warehouse-zone-meta">
                <span>Остаток: {zone.quantity_on_hand}</span>
                <span>Движений: {zone.movements_count}</span>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="react-panel warehouse-actions-panel">
        <div className="warehouse-form-card">
          <div className="panel-title-row">
            <div>
              <h2>Новая зона хранения</h2>
              <p className="panel-subtitle">Создаётся оператором или супервайзером и сразу попадает в общий складской реестр.</p>
            </div>
          </div>
          <div className="warehouse-form-grid">
            <Input
              placeholder="Код зоны, например SK-01"
              value={warehouseForm.code}
              onChange={(event) => onUpdateWarehouseForm("code", event.target.value)}
            />
            <Input
              placeholder="Название зоны"
              value={warehouseForm.name}
              onChange={(event) => onUpdateWarehouseForm("name", event.target.value)}
            />
            <Select
              allowClear
              placeholder="Помещение (необязательно)"
              value={warehouseForm.room_id || undefined}
              onChange={(value) => onUpdateWarehouseForm("room_id", value || "")}
              options={roomOptions}
            />
          </div>
          <div className="warehouse-form-actions">
            <Button
              type="primary"
              loading={warehouseActionLoading}
              disabled={!warehouseForm.code.trim() || !warehouseForm.name.trim()}
              onClick={onCreateZone}
            >
              Создать зону
            </Button>
          </div>
        </div>

        <div className="warehouse-receipts-card">
          <div className="panel-title-row">
            <div>
              <h2>Последние поступления</h2>
              <p className="panel-subtitle">Видно текущее состояние приемки и привязку к целевой зоне хранения.</p>
            </div>
          </div>
          {!warehouseLoading && !warehouseData.receipts.length ? <div className="empty-box">Поступлений пока нет.</div> : null}
          <div className="warehouse-receipts-list">
            {warehouseData.receipts.map((receipt) => (
              <article key={receipt.warehouse_receipt_id} className="warehouse-receipt-card">
                <div className="warehouse-receipt-head">
                  <div>
                    <strong>{receipt.receipt_no || "Без номера"} — {receipt.target_storage_zone_name}</strong>
                    <p>{receipt.created_by_name || "Система"} / {receipt.items_count} строк</p>
                  </div>
                  <SummaryBadge tone={receipt.status_code === "confirmed" ? "success" : receipt.status_code === "cancelled" ? "danger" : "warning"}>
                    {receipt.status_code}
                  </SummaryBadge>
                </div>
                <div className="warehouse-receipt-meta">
                  <span>Заявлено: {receipt.total_declared_quantity}</span>
                  <span>Факт: {receipt.total_actual_quantity}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}

export default WarehouseTab;
