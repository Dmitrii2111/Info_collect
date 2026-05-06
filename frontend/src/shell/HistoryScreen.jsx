import { useCallback, useEffect, useState } from "react";
import { Drawer, Select, Spin } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { DESKTOP_SCREEN_DATA } from "./desktopScreenData.js";

const HISTORY_DATA = DESKTOP_SCREEN_DATA.history;

const TODAY = new Date().toDateString();

const AGGREGATE_TYPE_MAP = {
  item: "Материал",
  collection: "Коллекция",
  user: "Пользователь",
  inspection: "Инспекция",
  discrepancy: "Расхождение",
  warehouse: "Склад",
  receipt: "Поступление",
  sync: "Синхронизация",
  role: "Роль",
  object: "Объект",
  report: "Отчёт",
  settings: "Настройки",
};

function formatTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (date.toDateString() === TODAY) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapAggregateType(type) {
  if (!type) return "—";
  return AGGREGATE_TYPE_MAP[type] ?? type;
}

function parseJsonSafe(str) {
  if (!str) return null;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

function EventDrawer({ event, onClose }) {
  const payload = parseJsonSafe(event?.payload_json);
  const metadata = parseJsonSafe(event?.metadata_json);

  return (
    <Drawer
      open={!!event}
      onClose={onClose}
      title="Детали события"
      width={480}
      destroyOnHidden
    >
      {event && (
        <div className="history-drawer-body">
          <dl className="history-drawer-fields">
            <dt>ID события</dt>
            <dd>{event.event_id ?? "—"}</dd>

            <dt>Тип события</dt>
            <dd>
              <span className="desktop-status-pill">{event.event_type ?? "—"}</span>
            </dd>

            <dt>Тип объекта</dt>
            <dd>{mapAggregateType(event.aggregate_type)}</dd>

            <dt>ID объекта</dt>
            <dd>{event.aggregate_id ?? "—"}</dd>

            <dt>Пользователь</dt>
            <dd>
              {event.user_name ?? "—"}
              {event.user_role ? <small style={{ display: "block", color: "#888" }}>{event.user_role}</small> : null}
            </dd>

            <dt>Область действия</dt>
            <dd>{event.actor_scope ?? "—"}</dd>

            <dt>Время</dt>
            <dd>{formatTime(event.recorded_at_server)}</dd>
          </dl>

          {payload !== null && (
            <>
              <h4 style={{ marginTop: 20, marginBottom: 6 }}>Payload</h4>
              <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, overflow: "auto", fontSize: 12 }}>
                {JSON.stringify(payload, null, 2)}
              </pre>
            </>
          )}

          {metadata !== null && (
            <>
              <h4 style={{ marginTop: 16, marginBottom: 6 }}>Metadata</h4>
              <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, overflow: "auto", fontSize: 12 }}>
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

export function HistoryScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async (eventType) => {
    setLoading(true);
    setError(null);
    try {
      const url = eventType
        ? `/api/audit/events?limit=100&event_type=${encodeURIComponent(eventType)}`
        : "/api/audit/events?limit=100";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message ?? "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(eventTypeFilter);
  }, [loadEvents, eventTypeFilter]);

  const eventTypeOptions = [
    { value: null, label: "Все события" },
    ...Array.from(new Set(events.map((e) => e.event_type).filter(Boolean))).map((t) => ({
      value: t,
      label: t,
    })),
  ];

  return (
    <div className="desktop-screen">
      <div className="desktop-screen-actions">
        <Select
          allowClear
          placeholder="Фильтр по событию"
          style={{ minWidth: 220 }}
          value={eventTypeFilter}
          onChange={(value) => setEventTypeFilter(value ?? null)}
          options={eventTypeOptions.filter((o) => o.value !== null)}
        />
      </div>

      <div className="desktop-stats-grid">
        {HISTORY_DATA.stats.map((stat) => (
          <article key={stat.label} className={`desktop-stat-card tone-${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>

      <section className="desktop-data-card desktop-data-card-main">
        <div className="desktop-data-card-header">
          <h2>Журнал событий</h2>
        </div>

        {loading && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ color: "#c0392b", marginBottom: 12 }}>{error}</p>
            <button
              className="desktop-screen-action"
              type="button"
              onClick={() => loadEvents(eventTypeFilter)}
            >
              <ReloadOutlined aria-hidden="true" />
              <span>Повторить</span>
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>
            Событий пока нет
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="desktop-table-wrap">
            <table className="desktop-data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Событие</th>
                  <th>Объект</th>
                  <th>Пользователь</th>
                  <th>ID объекта</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.event_id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <td>{formatTime(event.recorded_at_server)}</td>
                    <td>
                      <span className="desktop-status-pill">{event.event_type ?? "—"}</span>
                    </td>
                    <td>{mapAggregateType(event.aggregate_type)}</td>
                    <td>
                      {event.user_name ?? "—"}
                      {event.user_role && (
                        <small style={{ display: "block", color: "#888", fontSize: "0.8em" }}>
                          {event.user_role}
                        </small>
                      )}
                    </td>
                    <td>
                      <span title={event.aggregate_id ?? ""}>
                        {event.aggregate_id ? event.aggregate_id.slice(0, 10) : "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="desktop-screen-action"
                        type="button"
                        style={{ fontSize: "0.8em", padding: "2px 10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        Детали
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
