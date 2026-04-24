import { Button, Select } from "antd";
import { SummaryBadge, SummaryCard } from "../components.jsx";
import {
  getConflictStatusLabel,
  getConflictStatusTone,
  getConflictTypeLabel,
} from "../utils.js";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "open", label: "Открытые" },
  { value: "resolved", label: "Решенные" },
  { value: "dismissed", label: "Отклоненные" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Все типы" },
  { value: "presence_mismatch", label: "По наличию" },
  { value: "serial_mismatch", label: "По серийному номеру" },
  { value: "pnr_mismatch", label: "По ПНР" },
  { value: "communications_mismatch", label: "По коммуникациям" },
  { value: "parallel_room_activity", label: "Параллельная работа" },
];

export function ConflictsTab({
  conflictsLoading,
  conflictsActionLoading,
  conflictsStatus,
  conflictsData,
  conflictFilters,
  onUpdateConflictFilter,
  onRefresh,
  onResolve,
  onDismiss,
}) {
  return (
    <section className="react-panel conflicts-panel">
      <div className="panel-title-row">
        <div>
          <h2>Конфликты</h2>
          <p className="panel-subtitle">
            Противоречивые данные по экземплярам и помещениям, которые требуют решения оператора.
          </p>
        </div>
        <Button onClick={onRefresh}>Обновить</Button>
      </div>

      <div className="react-summary-grid conflict-summary-grid">
        <SummaryCard label="Всего" value={conflictsData.summary?.total || 0} />
        <SummaryCard label="Открытые" value={conflictsData.summary?.open || 0} tone="danger" />
        <SummaryCard label="Решенные" value={conflictsData.summary?.resolved || 0} tone="success" />
        <SummaryCard label="Отклоненные" value={conflictsData.summary?.dismissed || 0} />
      </div>

      <div className="filter-grid antd-filter-grid">
        <Select
          value={conflictFilters.statusCode}
          onChange={(value) => onUpdateConflictFilter("statusCode", value)}
          options={STATUS_OPTIONS}
        />
        <Select
          value={conflictFilters.conflictType}
          onChange={(value) => onUpdateConflictFilter("conflictType", value)}
          options={TYPE_OPTIONS}
        />
      </div>

      {conflictsStatus ? <p className="assignment-status-note">{conflictsStatus}</p> : null}
      {conflictsLoading && !conflictsData.items.length ? <div className="empty-box">Загрузка конфликтов...</div> : null}
      {!conflictsLoading && !conflictsData.items.length ? <div className="empty-box">Конфликтов по текущим фильтрам нет.</div> : null}

      <div className="conflicts-list">
        {conflictsData.items.map((conflict) => (
          <article key={conflict.conflict_id} className="conflict-card">
            <div className="conflict-card-head">
              <div>
                <strong>{getConflictTypeLabel(conflict.conflict_type)}</strong>
                <p>
                  {conflict.room_code ? `${conflict.room_code} — ${conflict.room_name || "без названия"}` : "Помещение не указано"}
                </p>
              </div>
              <SummaryBadge tone={getConflictStatusTone(conflict.status_code)}>
                {getConflictStatusLabel(conflict.status_code)}
              </SummaryBadge>
            </div>

            <div className="conflict-meta-grid">
              <div>
                <span>Экземпляр</span>
                <strong>{conflict.display_label || "—"}</strong>
              </div>
              <div>
                <span>Оборудование</span>
                <strong>{conflict.equipment_name || "—"}</strong>
              </div>
              <div>
                <span>Источник 1</span>
                <strong>{conflict.first_user_name || "Система"} / {conflict.first_event_type || "—"}</strong>
              </div>
              <div>
                <span>Источник 2</span>
                <strong>{conflict.second_user_name || "Система"} / {conflict.second_event_type || "—"}</strong>
              </div>
            </div>

            {conflict.resolution_note ? <p className="conflict-note">{conflict.resolution_note}</p> : null}

            {conflict.status_code === "open" ? (
              <div className="conflict-actions">
                <Button type="primary" loading={conflictsActionLoading} onClick={() => onResolve(conflict.conflict_id)}>
                  Отметить решенным
                </Button>
                <Button danger loading={conflictsActionLoading} onClick={() => onDismiss(conflict.conflict_id)}>
                  Отклонить
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ConflictsTab;
