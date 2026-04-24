import { Button, Select } from "antd";

import { SummaryBadge, SummaryCard } from "../components.jsx";

function getScopeLabel(scope) {
  if (scope === "system") return "Система";
  if (scope === "field") return "Поле";
  if (scope === "office") return "Офис";
  return scope || "—";
}

function getScopeTone(scope) {
  if (scope === "system") return "soft";
  if (scope === "field") return "warning";
  return "success";
}

function getEventTypeLabel(eventType) {
  if (eventType === "field.item_checked") return "Отметка экземпляра";
  if (eventType === "room.check_completed") return "Завершение помещения";
  if (eventType === "operator.item_corrected") return "Операторская корректировка";
  if (eventType === "plan.imported") return "Импорт плана";
  if (eventType === "stock.zone_created") return "Создание складской зоны";
  return eventType || "—";
}

function getAggregateLabel(aggregateType) {
  if (aggregateType === "equipment_instance") return "Экземпляр";
  if (aggregateType === "room") return "Помещение";
  if (aggregateType === "storage_zone") return "Складская зона";
  if (aggregateType === "plan_version") return "Версия плана";
  if (aggregateType === "assignment") return "Назначение";
  return aggregateType || "—";
}

function formatEventTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

function getUniqueOptions(items, key, labelBuilder) {
  const map = new Map();
  items.forEach((item) => {
    const value = item[key];
    if (!value || map.has(value)) return;
    map.set(value, { value, label: labelBuilder(value) });
  });
  return [...map.values()];
}

const SCOPE_OPTIONS = [
  { value: "", label: "Все источники" },
  { value: "system", label: "Система" },
  { value: "field", label: "Поле" },
  { value: "office", label: "Офис" },
];

export function AuditTab({
  auditLoading,
  auditStatus,
  auditData,
  auditFilters,
  onUpdateAuditFilter,
  onRefresh,
}) {
  const eventOptions = [{ value: "", label: "Все события" }, ...getUniqueOptions(auditData.items, "event_type", getEventTypeLabel)];
  const aggregateOptions = [{ value: "", label: "Все сущности" }, ...getUniqueOptions(auditData.items, "aggregate_type", getAggregateLabel)];

  return (
    <section className="react-panel audit-panel">
      <div className="panel-title-row">
        <div>
          <h2>Журнал событий</h2>
          <p className="panel-subtitle">
            История действий в системе: полевые отметки, операторские исправления, импорт, складские операции и служебные события.
          </p>
        </div>
        <Button onClick={onRefresh}>Обновить</Button>
      </div>

      <div className="react-summary-grid audit-summary-grid">
        <SummaryCard label="Всего событий" value={auditData.summary?.total || 0} />
        <SummaryCard label="Система" value={auditData.summary?.system_events || 0} />
        <SummaryCard label="Поле" value={auditData.summary?.field_events || 0} tone="warning" />
        <SummaryCard label="Офис" value={auditData.summary?.office_events || 0} tone="success" />
      </div>

      <div className="filter-grid antd-filter-grid">
        <Select value={auditFilters.actorScope} onChange={(value) => onUpdateAuditFilter("actorScope", value)} options={SCOPE_OPTIONS} />
        <Select value={auditFilters.eventType} onChange={(value) => onUpdateAuditFilter("eventType", value)} options={eventOptions} />
        <Select value={auditFilters.aggregateType} onChange={(value) => onUpdateAuditFilter("aggregateType", value)} options={aggregateOptions} />
      </div>

      {auditStatus ? <p className="assignment-status-note">{auditStatus}</p> : null}
      {auditLoading && !auditData.items.length ? <div className="empty-box">Загрузка журнала...</div> : null}
      {!auditLoading && !auditData.items.length ? <div className="empty-box">Событий пока нет.</div> : null}

      <div className="audit-list">
        {auditData.items.map((event) => (
          <article key={event.event_id} className="audit-card">
            <div className="audit-card-head">
              <div>
                <strong>{getEventTypeLabel(event.event_type)}</strong>
                <p>{getAggregateLabel(event.aggregate_type)} / {event.aggregate_id}</p>
              </div>
              <SummaryBadge tone={getScopeTone(event.actor_scope)}>
                {getScopeLabel(event.actor_scope)}
              </SummaryBadge>
            </div>

            <div className="audit-meta-grid">
              <div>
                <span>Пользователь</span>
                <strong>{event.user_name || "Система"}</strong>
              </div>
              <div>
                <span>Роль</span>
                <strong>{event.user_role || "system"}</strong>
              </div>
              <div>
                <span>Устройство</span>
                <strong>{event.device_uid || "web/system"}</strong>
              </div>
              <div>
                <span>Платформа</span>
                <strong>{event.platform || "—"}</strong>
              </div>
              <div>
                <span>Время на устройстве</span>
                <strong>{formatEventTime(event.occurred_at_device)}</strong>
              </div>
              <div>
                <span>Время на сервере</span>
                <strong>{formatEventTime(event.recorded_at_server)}</strong>
              </div>
            </div>

            <details className="audit-payload">
              <summary>Данные события</summary>
              <pre>{JSON.stringify({ payload: event.payload_json, metadata: event.metadata_json }, null, 2)}</pre>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AuditTab;
