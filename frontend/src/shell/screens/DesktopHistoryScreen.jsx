import { useCallback, useEffect, useRef, useState } from "react";
import {
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  AuditOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserSwitchOutlined,
  PlusCircleOutlined,
  CloudSyncOutlined,
  DiffOutlined,
  LeftOutlined,
  RightOutlined,
  CopyOutlined,
  HistoryOutlined,
  CloudOutlined,
  DownOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
import { HIST_MOCK_INSPECTIONS } from "../data/historyScreenData";
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

function uniqueSortedValues(rows, getter) {
  return [...new Set(rows.map(getter).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
}

function getEventDateLabel(row) {
  if (row.dateLabel) return row.dateLabel;
  const source = row.recorded_at_server ?? row._raw?.recorded_at_server;
  if (!source) return "Сегодня";
  return new Date(source).toLocaleDateString("ru-RU");
}

function getFilterValue(row, key) {
  const raw = row._raw ?? row;
  if (key === "period") return getEventDateLabel(row);
  if (key === "type") return row.pillLabel ?? row.event_type ?? raw.event_type;
  if (key === "user") return row.executor ?? raw.user_name ?? "SYSTEM";
  if (key === "role") return row.detail?.role ?? raw.user_role ?? raw.role ?? "—";
  if (key === "inspection") {
    if (raw.aggregate_type === "inspection" && raw.aggregate_id) return raw.aggregate_id;
    return row.inspectionId ?? raw.inspection_id ?? raw.inspection ?? row.detail?.inspectionId ?? null;
  }
  if (key === "object") return row.detail?.object ?? raw.object ?? raw.object_name ?? raw.aggregate_id ?? null;
  return null;
}

function matchesPeriod(row, period) {
  if (!period || period === "Все") return true;
  if (period === "Неделя" || period === "Месяц") {
    const source = row.recorded_at_server ?? row._raw?.recorded_at_server;
    if (!source) return true;
    const eventDate = new Date(source);
    const maxAgeMs = period === "Неделя" ? 7 * 24 * 60 * 60 * 1000 : 31 * 24 * 60 * 60 * 1000;
    return Date.now() - eventDate.getTime() <= maxAgeMs;
  }
  return getEventDateLabel(row) === period;
}

function rowMatchesFilters(row, filters, keys) {
  return keys.every((key) => {
    const value = filters[key];
    if (!value || value === "Все") return true;
    if (key === "period") return matchesPeriod(row, value);
    return getFilterValue(row, key) === value;
  });
}

function buildHistoryContext(event, target) {
  const raw = event?._raw ?? event ?? {};
  const payload = parseJsonSafe(raw.payload_json) ?? {};
  const inspectionId =
    getFilterValue(event, "inspection") ??
    payload.inspection_id ??
    payload.inspection ??
    (raw.aggregate_type === "inspection" ? raw.aggregate_id : null);
  const discrepancyId =
    raw.discrepancy_id ??
    payload.discrepancy_id ??
    payload.discrepancy ??
    (raw.aggregate_type === "discrepancy" ? raw.aggregate_id : null);

  return {
    source: "history",
    eventId: event?.event_id ?? raw.event_id,
    eventType: event?.event_type ?? raw.event_type,
    inspectionId,
    discrepancyId,
    object: getFilterValue(event, "object"),
    target,
  };
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

/* ──────────────── demo rows ──────────────── */

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
  {
    event_id: "INSP-8812",
    event_type: "Инспекция завершена",
    time: "09:05",
    description: "Завершена плановая инспекция 'Котлоагрегат Цех №3'",
    executor: "А. Кузнецов",
    pillClass: "pill-inspection",
    pillLabel: "Инспекция",
    iconEl: <AuditOutlined style={{ fontSize: 16, color: "var(--accent)" }} />,
  },
  {
    event_id: "EMP-00451",
    event_type: "Добавлен сотрудник",
    time: "08:55",
    description: "В систему добавлен новый оператор Петров И.С.",
    executor: "Администратор",
    pillClass: "pill-inventory",
    pillLabel: "Сотрудники",
    iconEl: <PlusCircleOutlined style={{ fontSize: 16, color: "#16a34a" }} />,
  },
  {
    event_id: "ERR-0044",
    event_type: "Ошибка авторизации",
    time: "08:48",
    description: "Попытка входа с неверными учётными данными (3 раза подряд)",
    executor: "unknown",
    pillClass: "pill-critical",
    pillLabel: "Критично",
    iconEl: <CloudSyncOutlined style={{ fontSize: 16, color: "#dc2626" }} />,
  },
  {
    event_id: "DISC-00913",
    event_type: "Расхождение устранено",
    time: "08:40",
    description: "Расхождение по позиции 'Задвижка 12' принято и закрыто",
    executor: "П. Смирнов",
    pillClass: "pill-warning",
    pillLabel: "Внимание",
    iconEl: <DiffOutlined style={{ fontSize: 16, color: "#d97706" }} />,
  },
  {
    event_id: "SYNC-2024-002",
    event_type: "Синхронизация завершена",
    time: "08:30",
    description: "Успешная синхронизация данных с планшетом TAB-02",
    executor: "SYSTEM",
    pillClass: "pill-critical",
    pillLabel: "Критично",
    iconEl: <CloudSyncOutlined style={{ fontSize: 16, color: "#dc2626" }} />,
  },
];

/* ──────────────── chip filter map ──────────────── */

const CHIP_FILTER_FN = {
  "Все": () => true,
  "Инспекции": (r) => r.pillClass === "pill-inspection",
  "Назначения": (r) => r.pillClass === "pill-tasks",
  "Синхронизация": (r) => r.event_type?.toLowerCase().includes("синхрон"),
  "Расхождения": (r) => r.pillClass === "pill-warning",
  "Сотрудники": (r) => r.event_type?.toLowerCase().includes("сотрудн"),
  "Ошибки": (r) => r.event_type?.toLowerCase().includes("ошибк") || r.pillClass === "pill-critical",
};

/* ──────────────── HistExportModal ──────────────── */

function HistExportModal({ filteredCount, onClose }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form"); // form | loading | success | error
  const [exportScope, setExportScope] = useState("filtered");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleExport = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Журнал экспортирован" :
    phase === "loading" ? "Готовим экспорт" :
    phase === "error"   ? "Не удалось экспортировать журнал" :
    "Экспортировать журнал?";

  const subtitle =
    phase === "success" ? "Файл будет сформирован backend после подключения API." :
    phase === "loading" ? "Формируем журнал аудита..." :
    phase === "error"   ? "Система не смогла сформировать файл. Повторите попытку." :
    "Будет сформирован файл журнала с событиями в соответствии с выбранными параметрами.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className={`reg-confirm-icon${phase === "error" ? " hist-icon-error" : ""}`}>
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             phase === "error"   ? <WarningOutlined aria-hidden="true" /> :
             <DownloadOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase === "form" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleExport}
            >
              <DownloadOutlined aria-hidden="true" />
              Экспортировать
            </button>
          ) : null}
          {phase === "error" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={() => setPhase("form")}
            >
              <ReloadOutlined aria-hidden="true" />
              Повторить
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Журнал экспортирован</strong>
            <span>Файл будет сформирован backend после подключения API.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Готовим экспорт</strong>
            <span>Формируем журнал аудита...</span>
          </div>
        </div>
      ) : phase === "error" ? (
        <div className="hist-modal-error-body">
          <div className="hist-modal-error-reason">
            <span className="hist-modal-error-reason-label">Причина</span>
            <span>Хранилище временно недоступно.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="hist-modal-export-bento">
            <div className="hist-modal-export-bento-item">
              <span className="hist-modal-export-bento-label">Период</span>
              <span className="hist-modal-export-bento-val">за сегодня</span>
            </div>
            <div className="hist-modal-export-bento-item">
              <span className="hist-modal-export-bento-label">Записей</span>
              <span className="hist-modal-export-bento-val">{filteredCount}</span>
            </div>
            <div className="hist-modal-export-bento-item">
              <span className="hist-modal-export-bento-label">Формат</span>
              <span className="hist-modal-export-bento-val">XLSX</span>
            </div>
          </div>
          <div className="hist-modal-scope-group">
            <p className="hist-modal-scope-title">Область экспорта</p>
            <label className="hist-modal-scope-row">
              <input
                type="radio"
                name="export_scope"
                value="filtered"
                checked={exportScope === "filtered"}
                onChange={() => setExportScope("filtered")}
              />
              <span>Текущие фильтры ({filteredCount} записей)</span>
            </label>
            <label className="hist-modal-scope-row">
              <input
                type="radio"
                name="export_scope"
                value="all"
                checked={exportScope === "all"}
                onChange={() => setExportScope("all")}
              />
              <span>Все записи за период</span>
            </label>
          </div>
          <button
            className="hist-modal-error-trigger"
            type="button"
            onClick={() => setPhase("error")}
          >
            Симулировать ошибку
          </button>
        </>
      )}
    </DesktopModalShell>
  );
}

/* ──────────────── HistAuditSettingsModal ──────────────── */

function HistAuditSettingsModal({ onClose }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form"); // form | loading | success | error
  const [retention, setRetention] = useState("24 месяца");
  const [logRetention, setLogRetention] = useState("90 дней");
  const [logErrors, setLogErrors] = useState(true);
  const [logSync, setLogSync] = useState(true);
  const [logSettings, setLogSettings] = useState(true);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleSave = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Настройки сохранены" :
    phase === "loading" ? "Сохраняем настройки" :
    phase === "error"   ? "Не удалось сохранить настройки" :
    "Настройки аудита";

  const subtitle =
    phase === "success" ? "Параметры аудита обновлены." :
    phase === "loading" ? "Обновляем параметры аудита..." :
    phase === "error"   ? "Система не смогла применить изменения. Повторите попытку." :
    "Параметры хранения и логирования действий";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className={`reg-confirm-icon${phase === "error" ? " hist-icon-error" : ""}`}>
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             phase === "error"   ? <WarningOutlined aria-hidden="true" /> :
             <SettingOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase === "form" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleSave}
            >
              <CheckCircleOutlined aria-hidden="true" />
              Сохранить настройки
            </button>
          ) : null}
          {phase === "error" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={() => setPhase("form")}
            >
              <ReloadOutlined aria-hidden="true" />
              Повторить
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Настройки сохранены</strong>
            <span>Параметры аудита обновлены.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Сохраняем настройки</strong>
            <span>Обновляем параметры аудита...</span>
          </div>
        </div>
      ) : phase === "error" ? (
        <div className="hist-modal-error-body">
          <div className="hist-modal-error-reason">
            <span className="hist-modal-error-reason-label">Причина</span>
            <span>Сервер временно недоступен.</span>
          </div>
        </div>
      ) : (
        <div className="hist-settings-form">
          <div className="hist-modal-info-banner">
            <InfoCircleOutlined aria-hidden="true" />
            <span>Настройки влияют на объём хранимых данных и детализацию системных журналов.</span>
          </div>
          <div className="hist-settings-field">
            <label className="hist-settings-field-label" htmlFor="hist-retention">Срок хранения активности</label>
            <select
              id="hist-retention"
              className="hist-settings-select"
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
            >
              <option>12 месяцев</option>
              <option>24 месяца</option>
              <option>36 месяцев</option>
              <option>Бессрочно</option>
            </select>
          </div>
          <div className="hist-settings-field">
            <label className="hist-settings-field-label" htmlFor="hist-log-retention">Хранение системных логов</label>
            <select
              id="hist-log-retention"
              className="hist-settings-select"
              value={logRetention}
              onChange={(e) => setLogRetention(e.target.value)}
            >
              <option>30 дней</option>
              <option>60 дней</option>
              <option>90 дней</option>
              <option>180 дней</option>
            </select>
          </div>
          <hr className="hist-settings-divider" />
          <div className="hist-settings-toggles">
            <label className="hist-settings-toggle-row">
              <div className="hist-settings-toggle-info">
                <span className="hist-settings-toggle-label">Логировать технические ошибки</span>
                <span className="hist-settings-toggle-sub">Запись стека вызовов и системных сбоев</span>
              </div>
              <input
                type="checkbox"
                className="hist-settings-checkbox"
                checked={logErrors}
                onChange={(e) => setLogErrors(e.target.checked)}
              />
            </label>
            <label className="hist-settings-toggle-row">
              <div className="hist-settings-toggle-info">
                <span className="hist-settings-toggle-label">Подробный лог синхронизации</span>
                <span className="hist-settings-toggle-sub">Детальная информация об обмене данными</span>
              </div>
              <input
                type="checkbox"
                className="hist-settings-checkbox"
                checked={logSync}
                onChange={(e) => setLogSync(e.target.checked)}
              />
            </label>
            <label className="hist-settings-toggle-row">
              <div className="hist-settings-toggle-info">
                <span className="hist-settings-toggle-label">Аудит изменений настроек</span>
                <span className="hist-settings-toggle-sub">Отслеживание правок конфигурации системы</span>
              </div>
              <input
                type="checkbox"
                className="hist-settings-checkbox"
                checked={logSettings}
                onChange={(e) => setLogSettings(e.target.checked)}
              />
            </label>
          </div>
          <button
            className="hist-modal-error-trigger"
            type="button"
            onClick={() => setPhase("error")}
          >
            Симулировать ошибку
          </button>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ──────────────── HistInspectionHistoryModal ──────────────── */

function HistInspectionHistoryModal({ onClose }) {
  return (
    <DesktopModalShell
      onClose={onClose}
      size="default"
      title="История инспекций"
      subtitle="Обзор завершённых проверок оборудования и систем"
    >
      <div className="hist-insp-modal-wrap">
        <table className="hist-insp-table">
          <thead>
            <tr>
              <th>ID события</th>
              <th>Объект / Тип</th>
              <th>Дата</th>
              <th>Инспектор</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {HIST_MOCK_INSPECTIONS.map((row) => (
              <tr key={row.id}>
                <td className="hist-insp-id">{row.id}</td>
                <td>
                  <div className="hist-insp-object">{row.object}</div>
                  <div className="hist-insp-type">{row.type}</div>
                </td>
                <td>{row.date}</td>
                <td>{row.inspector}</td>
                <td>
                  <span className={`hist-status-pill ${row.status === "В процессе" ? "pill-warning" : "pill-inspection"}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DesktopModalShell>
  );
}

/* ──────────────── EventDetailPanel ──────────────── */

function EventDetailPanel({ event, onClose, onCopyId, onOpenInspection, onOpenDiscrepancies }) {
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
        <button className="hist-detail-btn is-primary" type="button" onClick={() => onOpenInspection(event)}>
          <AuditOutlined />
          Открыть инспекцию
        </button>
        <button className="hist-detail-btn is-secondary" type="button" onClick={() => onOpenDiscrepancies(event)}>
          <DiffOutlined />
          Открыть расхождение
        </button>
        <button
          className="hist-detail-btn is-ghost"
          type="button"
          onClick={() => onCopyId(event.event_id)}
        >
          <CopyOutlined />
          Скопировать ID события
        </button>
      </div>
    </div>
  );
}

/* ──────────────── Main component ──────────────── */

const QUICK_FILTERS = ["Все", "Инспекции", "Назначения", "Синхронизация", "Расхождения", "Сотрудники", "Ошибки"];
const CASCADE_FILTER_KEYS = ["period", "type", "user", "role", "inspection", "object"];
const PAGE_SIZE = 10;

export function DesktopHistoryScreen({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("Все");
  const [selectedEvent, setSelectedEvent] = useState(DEMO_ROWS[0]);
  const [activePage, setActivePage] = useState(1);
  const [modal, setModal] = useState(null); // "export" | "audit-settings" | "inspections"
  const [copyToast, setCopyToast] = useState(null); // event_id string
  const [filters, setFilters] = useState({
    period: "Все",
    type: "Все",
    user: "Все",
    role: "Все",
    inspection: "Все",
    object: "Все",
  });
  const toastTimerRef = useRef(null);

  const openModal = (type) => setModal(type);
  const closeModal = () => setModal(null);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const handleCopyId = (eventId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(eventId).catch(() => {});
    }
    setCopyToast(eventId);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setCopyToast(null), 3000);
  };

  const updateFilter = (key, value) => {
    const keyIndex = CASCADE_FILTER_KEYS.indexOf(key);
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      CASCADE_FILTER_KEYS.slice(keyIndex + 1).forEach((lowerKey) => {
        next[lowerKey] = "Все";
      });
      return next;
    });
    setActivePage(1);
  };

  const handleQuickFilter = (value) => {
    setEventTypeFilter(value);
    setActivePage(1);
  };

  const navigateToSection = (sectionKey, storageKey, payload) => {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("infocollect:navigate", { detail: { sectionKey, payload } }));
    onNavigate?.(sectionKey, payload);
  };

  const handleOpenInspection = (event) => {
    navigateToSection(
      "inspections",
      "infocollect.pendingInspectionContext",
      buildHistoryContext(event, "inspection"),
    );
  };

  const handleOpenDiscrepancies = (event) => {
    navigateToSection(
      "discrepancies",
      "infocollect.pendingDiscrepancyContext",
      buildHistoryContext(event, "discrepancy"),
    );
  };

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
  const allDisplayRows = events.length > 0
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
          recorded_at_server: e.recorded_at_server,
          aggregate_type: e.aggregate_type,
          aggregate_id: e.aggregate_id,
          user_role: e.user_role,
          payload_json: e.payload_json,
          metadata_json: e.metadata_json,
          dateLabel: getEventDateLabel(e),
          _raw: e,
        };
      })
    : DEMO_ROWS;

  const rowsAfterPeriod = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, ["period"]));
  const rowsAfterType = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, ["period", "type"]));
  const rowsAfterUser = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, ["period", "type", "user"]));
  const rowsAfterRole = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, ["period", "type", "user", "role"]));
  const rowsAfterInspection = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, ["period", "type", "user", "role", "inspection"]));

  const filterOptions = {
    period: ["Все", "Неделя", "Месяц", ...uniqueSortedValues(allDisplayRows, getEventDateLabel)],
    type: ["Все", ...uniqueSortedValues(rowsAfterPeriod, (row) => getFilterValue(row, "type"))],
    user: ["Все", ...uniqueSortedValues(rowsAfterType, (row) => getFilterValue(row, "user"))],
    role: ["Все", ...uniqueSortedValues(rowsAfterUser, (row) => getFilterValue(row, "role"))],
    inspection: ["Все", ...uniqueSortedValues(rowsAfterRole, (row) => getFilterValue(row, "inspection"))],
    object: ["Все", ...uniqueSortedValues(rowsAfterInspection, (row) => getFilterValue(row, "object"))],
  };

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(filterOptions).forEach(([key, options]) => {
        if (next[key] !== "Все" && !options.includes(next[key])) {
          next[key] = "Все";
          changed = true;
        }
      });
      if (changed) setActivePage(1);
      return changed ? next : prev;
    });
  }, [
    filterOptions.period.join("|"),
    filterOptions.type.join("|"),
    filterOptions.user.join("|"),
    filterOptions.object.join("|"),
    filterOptions.inspection.join("|"),
    filterOptions.role.join("|"),
  ]);

  const rowsAfterSelects = allDisplayRows.filter((row) => rowMatchesFilters(row, filters, CASCADE_FILTER_KEYS));

  /* Apply chip filter */
  const chipFn = CHIP_FILTER_FN[eventTypeFilter] ?? (() => true);
  const displayRows = rowsAfterSelects.filter(chipFn);
  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));

  useEffect(() => {
    if (activePage > totalPages) setActivePage(1);
  }, [activePage, totalPages]);

  useEffect(() => {
    if (!displayRows.some((row) => row.event_id === selectedEvent?.event_id)) {
      setSelectedEvent(displayRows[0] ?? null);
    }
  }, [displayRows, selectedEvent?.event_id]);

  return (
    <div className="hist-screen">
      {/* ── Action bar ── */}
      <div className="hist-actions">
        <div className="hist-actions-left">
          <button className="hist-btn" type="button" onClick={() => openModal("export")}>
            <DownloadOutlined />
            Экспорт журнала
          </button>
          <button className="hist-btn" type="button" onClick={loadEvents}>
            <ReloadOutlined />
            Обновить
          </button>
          <button className="hist-btn" type="button" onClick={() => openModal("inspections")}>
            <ScheduleOutlined />
            История инспекций
          </button>
        </div>
        <button className="hist-btn" type="button" onClick={() => openModal("audit-settings")}>
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
            <select className="hist-filter-select" value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
              {filterOptions.type.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Пользователь</span>
            <select className="hist-filter-select" value={filters.user} onChange={(e) => updateFilter("user", e.target.value)}>
              {filterOptions.user.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Роль</span>
            <select className="hist-filter-select" value={filters.role} onChange={(e) => updateFilter("role", e.target.value)}>
              {filterOptions.role.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Инспекция</span>
            <select className="hist-filter-select" value={filters.inspection} onChange={(e) => updateFilter("inspection", e.target.value)}>
              {filterOptions.inspection.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Объект</span>
            <select className="hist-filter-select" value={filters.object} onChange={(e) => updateFilter("object", e.target.value)}>
              {filterOptions.object.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hist-filter-field">
            <span className="hist-filter-label">Период</span>
            <select className="hist-filter-select" value={filters.period} onChange={(e) => updateFilter("period", e.target.value)}>
              {filterOptions.period.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
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
              onClick={() => handleQuickFilter(f)}
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
              Показано <strong>{displayRows.length}</strong> из <strong>1 248</strong> событий
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
          onCopyId={handleCopyId}
          onOpenInspection={handleOpenInspection}
          onOpenDiscrepancies={handleOpenDiscrepancies}
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

      {/* ── Modals ── */}
      {modal === "export" ? (
        <HistExportModal filteredCount={displayRows.length} onClose={closeModal} />
      ) : null}
      {modal === "audit-settings" ? (
        <HistAuditSettingsModal onClose={closeModal} />
      ) : null}
      {modal === "inspections" ? (
        <HistInspectionHistoryModal onClose={closeModal} />
      ) : null}

      {/* ── Copy ID toast ── */}
      {copyToast ? (
        <div className="hist-toast-layer" role="status" aria-live="polite">
          <div className="hist-toast">
            <div className="hist-toast-icon">
              <CheckCircleOutlined aria-hidden="true" />
            </div>
            <div className="hist-toast-body">
              <span className="hist-toast-title">ID события скопирован</span>
              <span className="hist-toast-id">{copyToast}</span>
            </div>
            <button
              className="hist-toast-close"
              type="button"
              aria-label="Закрыть"
              onClick={() => setCopyToast(null)}
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
