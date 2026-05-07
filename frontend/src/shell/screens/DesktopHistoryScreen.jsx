import { useCallback, useEffect, useState } from "react";
import {
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  AuditOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  PlusCircleOutlined,
  CloudSyncOutlined,
  DiffOutlined,
  LeftOutlined,
  RightOutlined,
  ScheduleOutlined,
  CopyOutlined,
  HistoryOutlined,
  CloudOutlined,
  DownOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "../styles/historyScreen.css";

/* ──────────────── helpers ──────────────── */

const TODAY = new Date().toDateString();

function formatTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (date.toDateString() === TODAY) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function mapAggregateType(type) {
  if (!type) return "—";
  return AGGREGATE_TYPE_MAP[type] ?? type;
}

function parseJsonSafe(str) {
  if (!str) return null;
  if (typeof str === "object") return str;
  try { return JSON.parse(str); } catch { return str; }
}

/* ──────────────── event icon / pill ──────────────── */

function eventMeta(event) {
  const t = event?.event_type ?? "";
  if (t.toLowerCase().includes("sync") || t.toLowerCase().includes("конфликт")) {
    return { icon: <CloudSyncOutlined />, iconColor: "#dc2626", pillClass: "pill-critical", pillLabel: "Критично" };
  }
  if (t.toLowerCase().includes("расхожд") || t.toLowerCase().includes("disc")) {
    return { icon: <DiffOutlined />, iconColor: "#d97706", pillClass: "pill-warning", pillLabel: "Внимание" };
  }
  if (t.toLowerCase().includes("назнач") || t.toLowerCase().includes("transfer")) {
    return { icon: <UserSwitchOutlined />, iconColor: "#7c3aed", pillClass: "pill-tasks", pillLabel: "Задачи" };
  }
  if (t.toLowerCase().includes("создан") || t.toLowerCase().includes("добавл") || t.toLowerCase().includes("create")) {
    return { icon: <PlusCircleOutlined />, iconColor: "#16a34a", pillClass: "pill-inventory", pillLabel: "Инвентарь" };
  }
  if (t.toLowerCase().includes("разрешен") || t.toLowerCase().includes("inspect") || t.toLowerCase().includes("инспекц")) {
    return { icon: <AuditOutlined />, iconColor: "var(--accent)", pillClass: "pill-inspection", pillLabel: "Инспекция" };
  }
  return { icon: <HistoryOutlined />, iconColor: "var(--muted)", pillClass: "pill-default", pillLabel: "Событие" };
}

/* ──────────────── static demo rows (shown when API has no data) ──────────────── */

const DEMO_ROWS = [
  {
    event_id: "AUDIT-98234-X",
    event_type: "Разрешение расхождения",
    time: "09:42",
    description: "Разрешение расхождения серийного номера по объекту 'Склад 4'...",
    executor: "П. Смирнов",
    pillClass: "pill-inspection",
    pillLabel: "Инспекция",
    iconEl: <AuditOutlined style={{ fontSize: 16, color: "var(--accent)" }} />,
    selected: true,
    detail: {
      time: "Сегодня, 09:42:15 (UTC+3)",
      executor: "Павел Смирнов",
      role: "Старший инспектор",
      object: "Склад 4 (Север)",
      changeField: "Серийный номер",
      oldVal: "SN-90831",
      newVal: "SN-90381",
      comment: "Исправлена опечатка в серийном номере, допущенная при первичном вводе данных. Сверено с физической шильдой оборудования.",
      ip: "192.168.1.142",
      device: "Mozilla/5.0 (Android 12; Mobile)",
      session: "sess_901238490a0f",
    },
  },
  {
    event_id: "SYNC-2024-001",
    event_type: "Конфликт синхронизации",
    time: "09:39",
    description: "Конфликт версий при синхронизации данных мобильного приложения...",
    executor: "SYSTEM",
    pillClass: "pill-critical",
    pillLabel: "Критично",
    iconEl: <CloudSyncOutlined style={{ fontSize: 16, color: "#dc2626" }} />,
  },
  {
    event_id: "DISC-00912",
    event_type: "Обнаружено расхождение",
    time: "09:32",
    description: "Фактическое количество (14) не совпадает с учетным (15)",
    executor: "А. Кузнецов",
    pillClass: "pill-warning",
    pillLabel: "Внимание",
    iconEl: <DiffOutlined style={{ fontSize: 16, color: "#d97706" }} />,
  },
  {
    event_id: "TASK-440-B",
    event_type: "Переназначение оператора",
    time: "09:20",
    description: "Переназначение инспектора для задачи #440-B на завтра",
    executor: "И. Иванов",
    pillClass: "pill-tasks",
    pillLabel: "Задачи",
    iconEl: <UserSwitchOutlined style={{ fontSize: 16, color: "#7c3aed" }} />,
  },
  {
    event_id: "AST-90212",
    event_type: "Создание оборудования",
    time: "09:10",
    description: "Добавлен новый актив 'Генератор G-500' в реестр",
    executor: "П. Смирнов",
    pillClass: "pill-inventory",
    pillLabel: "Инвентарь",
    iconEl: <PlusCircleOutlined style={{ fontSize: 16, color: "#16a34a" }} />,
  },
];

/* ──────────────── EventDetailPanel ──────────────── */

function EventDetailPanel({ event, onClose }) {
  if (!event) {
    return (
      <div className="hist-detail-panel">
        <div className="hist-detail-head">
          <div>
            <div className="hist-detail-head-title">Детали события</div>
            <div className="hist-detail-head-id">Выберите строку</div>
          </div>
        </div>
        <div className="hist-detail-body" style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Нажмите на строку журнала для просмотра деталей
          </div>
        </div>
      </div>
    );
  }

  const isDemo = !!event.detail;
  const detail = event.detail || {};
  const payload = !isDemo ? parseJsonSafe(event.payload_json) : null;
  const metadata = !isDemo ? parseJsonSafe(event.metadata_json) : null;

  return (
    <div className="hist-detail-panel">
      <div className="hist-detail-head">
        <div>
          <div className="hist-detail-head-title">Детали события</div>
          <div className="hist-detail-head-id">ID: {event.event_id ?? "—"}</div>
        </div>
        <button className="hist-detail-close" type="button" onClick={onClose}>
          <CloseOutlined />
        </button>
      </div>

      <div className="hist-detail-body">
        {/* Metadata */}
        <div>
          <p className="hist-detail-section-title">Метаданные</p>
          <div className="hist-meta-block">
            <div className="hist-meta-row">
              <span className="hist-meta-key">Время</span>
              <span className="hist-meta-val">
                {isDemo ? detail.time : formatTime(event.recorded_at_server)}
              </span>
            </div>
            <div className="hist-meta-row">
              <span className="hist-meta-key">Исполнитель</span>
              <span className="hist-meta-val is-accent">
                {isDemo ? detail.executor : (event.user_name ?? "—")}
              </span>
            </div>
            <div className="hist-meta-row">
              <span className="hist-meta-key">Роль</span>
              <span className="hist-meta-val">
                {isDemo ? detail.role : (event.user_role ?? "—")}
              </span>
            </div>
            <div className="hist-meta-row">
              <span className="hist-meta-key">Объект</span>
              <span className="hist-meta-val">
                {isDemo ? detail.object : mapAggregateType(event.aggregate_type)}
              </span>
            </div>
          </div>
        </div>

        {/* Data change */}
        {isDemo && detail.changeField && (
          <div>
            <p className="hist-detail-section-title">Изменение данных</p>
            <div className="hist-change-block">
              <div className="hist-change-field-label">Поле: {detail.changeField}</div>
              <div className="hist-change-grid">
                <div>
                  <span className="hist-change-col-label">До</span>
                  <div className="hist-change-val is-old">{detail.oldVal}</div>
                </div>
                <div>
                  <span className="hist-change-col-label">После</span>
                  <div className="hist-change-val is-new">{detail.newVal}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payload for real events */}
        {payload !== null && (
          <div>
            <p className="hist-detail-section-title">Изменение данных</p>
            <div className="hist-change-block">
              <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", overflowX: "auto", color: "var(--muted-strong)" }}>
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Comment */}
        {isDemo && detail.comment && (
          <div>
            <p className="hist-detail-section-title">Комментарий оператора</p>
            <div className="hist-comment-block">
              <p>"{detail.comment}"</p>
            </div>
          </div>
        )}

        {/* Metadata for real events */}
        {metadata !== null && (
          <div>
            <p className="hist-detail-section-title">Метаданные запроса</p>
            <div className="hist-tech-body">
              <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "var(--muted-strong)" }}>
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Technical info */}
        {isDemo && detail.ip && (
          <div>
            <details>
              <summary className="hist-tech-summary">
                <DownOutlined />
                Техническая информация
              </summary>
              <div className="hist-tech-body">
                <div><strong>IP Address:</strong> {detail.ip}</div>
                <div><strong>Device:</strong> {detail.device}</div>
                <div><strong>Session ID:</strong> {detail.session}</div>
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="hist-detail-footer">
        <button className="hist-detail-btn is-primary" type="button">
          <AuditOutlined />
          Открыть инспекцию
        </button>
        <button className="hist-detail-btn is-secondary" type="button">
          <DiffOutlined />
          Открыть расхождение
        </button>
        <button className="hist-detail-btn is-ghost" type="button">
          <CopyOutlined />
          Скопировать ID события
        </button>
      </div>
    </div>
  );
}

/* ──────────────── Main component ──────────────── */

const QUICK_FILTERS = ["Все", "Инспекции", "Назначения", "Синхронизация", "Расхождения", "Сотрудники", "Ошибки"];

export function DesktopHistoryScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("Все");
  const [selectedEvent, setSelectedEvent] = useState(DEMO_ROWS[0]);
  const [activePage, setActivePage] = useState(1);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit/events?limit=100");
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message ?? "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  /* Use real events if loaded, otherwise demo */
  const displayRows = events.length > 0
    ? events.map((e) => {
        const meta = eventMeta(e);
        return {
          event_id: e.event_id,
          event_type: e.event_type ?? "Событие",
          time: formatTime(e.recorded_at_server),
          description: e.description ?? `${mapAggregateType(e.aggregate_type)} · ${e.aggregate_id ?? ""}`,
          executor: e.user_name ?? "SYSTEM",
          pillClass: meta.pillClass,
          pillLabel: meta.pillLabel,
          iconEl: <span style={{ color: meta.iconColor, fontSize: 16, display: "flex" }}>{meta.icon}</span>,
          _raw: e,
        };
      })
    : DEMO_ROWS;

  return (
    <div className="hist-screen">
      {/* ── Action bar ── */}
      <div className="hist-actions">
        <div className="hist-actions-left">
          <button className="hist-btn" type="button">
            <DownloadOutlined />
            Экспорт журнала
          </button>
          <button className="hist-btn" type="button" onClick={loadEvents}>
            <ReloadOutlined />
            Обновить
          </button>
        </div>
        <button className="hist-btn" type="button">
          <SettingOutlined />
          Настройки аудита
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="hist-kpi-grid">
        <div className="hist-kpi-card">
          <p className="hist-kpi-label">Всего событий</p>
          <p className="hist-kpi-value is-primary">1 248</p>
          <div className="hist-kpi-sub is-up">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l5 5H3l5-5z"/></svg>
            +4.2% за месяц
          </div>
        </div>
        <div className="hist-kpi-card">
          <p className="hist-kpi-label">Сегодня</p>
          <p className="hist-kpi-value">86</p>
          <div className="hist-kpi-sub is-active">
            <ClockCircleOutlined style={{ fontSize: 13 }} />
            Активно
          </div>
        </div>
        <div className="hist-kpi-card is-critical">
          <p className="hist-kpi-label">Критичные</p>
          <p className="hist-kpi-value is-critical">12</p>
          <div className="hist-kpi-sub is-warn">
            <WarningOutlined style={{ fontSize: 13 }} />
            Требует внимания
          </div>
        </div>
        <div className="hist-kpi-card">
          <p className="hist-kpi-label">Действия пользователей</p>
          <p className="hist-kpi-value">732</p>
          <div className="hist-kpi-sub is-muted">58.6% от всех событий</div>
        </div>
        <div className="hist-kpi-card">
          <p className="hist-kpi-label">Системные</p>
          <p className="hist-kpi-value">516</p>
          <div className="hist-kpi-sub is-muted">41.4% от всех событий</div>
        </div>
      </div>

      {/* ── Filters card ── */}
      <div className="hist-filters-card">
        <div className="hist-filters-grid">
          <div className="hist-filter-field">
            <span className="hist-filter-label">Тип события</span>
            <select className="hist-filter-select">
              <option>Все типы</option>
              <option>Инспекция</option>
              <option>Синхронизация</option>
              <option>Поступление</option>
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Пользователь</span>
            <select className="hist-filter-select">
              <option>Любой</option>
              <option>Иван Иванов</option>
              <option>Павел Смирнов</option>
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Роль</span>
            <select className="hist-filter-select">
              <option>Все роли</option>
              <option>Администратор</option>
              <option>Инспектор</option>
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Инспекция</span>
            <select className="hist-filter-select">
              <option>Все инспекции</option>
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Объект</span>
            <select className="hist-filter-select">
              <option>Все объекты</option>
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Период</span>
            <select className="hist-filter-select">
              <option>За сегодня</option>
              <option>Вчера</option>
              <option>Последние 7 дней</option>
            </select>
          </div>
        </div>

        <div className="hist-filter-pills">
          <span className="hist-filter-pills-label">Быстрые фильтры:</span>
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`hist-pill${f === eventTypeFilter ? " is-active" : ""}${f === "Ошибки" && f !== eventTypeFilter ? " is-error" : ""}`}
              onClick={() => setEventTypeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split view ── */}
      <div className="hist-split">
        {/* Audit list panel */}
        <div className="hist-list-panel">
          <div className="hist-panel-head">
            <span className="hist-panel-head-title">Журнал аудита</span>
            <span className="hist-panel-head-meta">
              {loading ? "Загрузка..." : `Найдено ${displayRows.length} записей за сегодня`}
            </span>
          </div>

          <div className="hist-table-scroll">
            {/* Table header */}
            <div className="hist-table-header">
              <div>Время</div>
              <div>Событие и описание</div>
              <div>Исполнитель</div>
              <div>Связанный ID</div>
              <div className="col-right">Статус</div>
            </div>

            {/* Loading state */}
            {loading && (
              <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div className="hist-state-spinner" />
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>Загрузка данных...</span>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div className="hist-state-icon-wrap is-error">
                  <CloudOutlined />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>Ошибка связи с сервером</span>
                <button className="hist-state-retry-btn" type="button" onClick={loadEvents}>Повторить попытку</button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayRows.length === 0 && (
              <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div className="hist-state-icon-wrap">
                  <HistoryOutlined style={{ fontSize: 24 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>История пуста</span>
                <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", maxWidth: 200 }}>
                  За выбранный период событий не найдено
                </span>
              </div>
            )}

            {/* Rows */}
            {!loading && displayRows.map((row) => (
              <div
                key={row.event_id}
                className={`hist-table-row${selectedEvent?.event_id === row.event_id ? " is-selected" : ""}`}
                onClick={() => setSelectedEvent(row)}
              >
                <div className={`hist-row-time${selectedEvent?.event_id === row.event_id ? " is-selected" : ""}`}>
                  {row.time}
                </div>
                <div className="hist-row-event">
                  <div className="hist-row-event-head">
                    <span className="hist-row-event-icon">{row.iconEl}</span>
                    <span className="hist-row-event-title">{row.event_type}</span>
                  </div>
                  <div className="hist-row-event-desc">{row.description}</div>
                </div>
                <div className="hist-row-executor">{row.executor}</div>
                <div className="hist-row-id">{row.event_id}</div>
                <div className="hist-row-status">
                  <span className={`hist-status-pill ${row.pillClass}`}>{row.pillLabel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="hist-pagination">
            <span className="hist-pagination-info">
              Показано <strong>11</strong> из <strong>1 248</strong> событий
            </span>
            <div className="hist-pager">
              <button className="hist-pager-btn" type="button">
                <LeftOutlined />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`hist-pager-btn${activePage === p ? " is-active" : ""}`}
                  onClick={() => setActivePage(p)}
                >
                  {p}
                </button>
              ))}
              <span className="hist-pager-dots">...</span>
              <button className="hist-pager-btn" type="button" onClick={() => setActivePage(114)}>114</button>
              <button className="hist-pager-btn" type="button">
                <RightOutlined />
              </button>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>

      {/* ── UI States section ── */}
      <div className="hist-states-section">
        <p className="hist-states-title">Примеры состояний интерфейса</p>
        <div className="hist-states-grid">
          <div className="hist-state-card">
            <div className="hist-state-spinner" />
            <span className="hist-state-label is-loading">Загрузка данных...</span>
          </div>
          <div className="hist-state-card">
            <div className="hist-state-icon-wrap">
              <HistoryOutlined style={{ fontSize: 28 }} />
            </div>
            <span className="hist-state-label">История пуста</span>
            <span className="hist-state-sub">За выбранный период событий не найдено</span>
          </div>
          <div className="hist-state-card">
            <div className="hist-state-icon-wrap is-error">
              <CloudOutlined style={{ fontSize: 28 }} />
            </div>
            <span className="hist-state-label is-error">Ошибка связи с сервером</span>
            <button className="hist-state-retry-btn" type="button">Повторить попытку</button>
          </div>
        </div>
      </div>
    </div>
  );
}
