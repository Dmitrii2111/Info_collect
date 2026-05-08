import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  ClearOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  SyncOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { DesktopConfirmDialog } from "../components/DesktopConfirmDialog";
import { DesktopDetailsModal } from "../components/DesktopDetailsModal";
import { DesktopModalShell } from "../components/DesktopModalShell";
import { DesktopUploadDialog } from "../components/DesktopUploadDialog";
import "../styles/registryScreen.css";

/* ─────────────────────────────────────────
   1. Action Bar
───────────────────────────────────────── */
function RegistryActionBar({ onOpenImport, onOpenUpdateStructure, onExport, onTemplate, onHistory }) {
  return (
    <div className="reg-action-bar">
      <div className="reg-action-bar-left">
        <button className="reg-btn-primary" type="button" onClick={onOpenImport}>
          <UploadOutlined aria-hidden="true" />
          Импорт / обновление Excel
        </button>
        <button className="reg-btn-secondary" type="button" onClick={onOpenUpdateStructure}>
          <SyncOutlined aria-hidden="true" />
          Обновить структуру
        </button>
        <button className="reg-btn-secondary" type="button" onClick={onExport}>
          <DownloadOutlined aria-hidden="true" />
          Экспорт
        </button>
      </div>
      <div className="reg-action-bar-right">
        <button className="reg-btn-link" type="button" onClick={onTemplate}>
          <FileTextOutlined aria-hidden="true" />
          Скачать шаблон
        </button>
        <button className="reg-btn-link" type="button" onClick={onHistory}>
          <HistoryOutlined aria-hidden="true" />
          История импортов
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   2. Summary Cards
───────────────────────────────────────── */
function RegistryStatsGrid() {
  return (
    <div className="reg-stats-grid">
      {/* Всего позиций */}
      <div className="reg-stat-card">
        <p className="reg-stat-label">Всего позиций</p>
        <div className="reg-stat-value-row">
          <span className="reg-stat-value">512</span>
          <span className="reg-stat-badge-green">+12</span>
        </div>
      </div>
      {/* Объектов */}
      <div className="reg-stat-card">
        <p className="reg-stat-label">Объектов</p>
        <span className="reg-stat-value">3</span>
      </div>
      {/* Помещений */}
      <div className="reg-stat-card">
        <p className="reg-stat-label">Помещений</p>
        <span className="reg-stat-value">74</span>
      </div>
      {/* Ошибки проверки */}
      <div className="reg-stat-card">
        <p className="reg-stat-label">Ошибки проверки</p>
        <span className="reg-stat-value reg-stat-value-error">2</span>
      </div>
      {/* Последний импорт */}
      <div className="reg-stat-card">
        <p className="reg-stat-label">Последний импорт</p>
        <p className="reg-stat-import-date">Сегодня, 08:20</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   3. Registry Status Card
───────────────────────────────────────── */
function RegistryStatusCard({ onOpenImport, onOpenErrors, errorCount }) {
  return (
    <div className="reg-status-card">
      <div className="reg-status-left">
        <div className="reg-status-icon">
          <FileTextOutlined style={{ fontSize: 24 }} aria-hidden="true" />
        </div>
        <div className="reg-status-body">
          <h3 className="reg-status-title">
            equipment_registry_april.xlsx
            <span className="reg-status-badge">Текущий реестр</span>
          </h3>
          <div className="reg-status-meta">
            <div className="reg-status-meta-item">
              <span className="reg-meta-label">Строк:</span>
              <span className="reg-meta-value">512</span>
            </div>
            <div className="reg-status-meta-item">
              <span className="reg-meta-label">Успешно:</span>
              <span className="reg-meta-value reg-meta-success">510</span>
            </div>
            <div className="reg-status-meta-item">
              <span className="reg-meta-label">Ошибки:</span>
              <span className="reg-meta-value reg-meta-warn">
                <WarningOutlined style={{ fontSize: 12 }} aria-hidden="true" />
                {errorCount}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="reg-status-actions">
        <button className="reg-btn-warning" type="button" onClick={onOpenErrors}>Открыть ошибки</button>
        <button className="reg-btn-outlined-blue" type="button" onClick={onOpenImport}>Импортировать новую версию</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   4. Filters
───────────────────────────────────────── */
const FILTER_CONFIG = [
  { key: "object", label: "Объект", allLabel: "Все объекты" },
  { key: "floor", label: "Этаж", allLabel: "Все этажи" },
  { key: "zone", label: "Зона", allLabel: "Все зоны" },
  { key: "room", label: "Помещение", allLabel: "Все помещения" },
  { key: "type", label: "Тип", allLabel: "Все типы" },
  { key: "supplier", label: "Поставщик", allLabel: "Все поставщики" },
  { key: "status", label: "Статус", allLabel: "Все статусы" },
];

const QUICK_FILTERS = [
  { key: "all", label: "Все" },
  { key: "errors", label: "С ошибками", tone: "error" },
  { key: "missingRoom", label: "Без помещения" },
  { key: "missingSupplier", label: "Без поставщика" },
  { key: "checked", label: "Проверено" },
];

function RegistryFilters({ filters, quickFilter, filterOptions, onFilterChange, onQuickFilterChange, onReset }) {
  return (
    <div className="reg-filters-card">
      <div className="reg-filters-grid">
        {FILTER_CONFIG.map((f) => (
          <div className="reg-filter-field" key={f.label}>
            <label className="reg-filter-label">{f.label}</label>
            <select
              className="reg-filter-select"
              value={filters[f.key]}
              onChange={(event) => onFilterChange(f.key, event.target.value)}
            >
              {[f.allLabel, ...filterOptions[f.key]].map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="reg-filter-row2">
        <div className="reg-quick-filters">
          {QUICK_FILTERS.map((filter) => (
            <button
              className={`reg-qf-pill${quickFilter === filter.key ? " reg-qf-active" : ""}${filter.tone === "error" ? " reg-qf-error" : ""}`}
              type="button"
              key={filter.key}
              onClick={() => onQuickFilterChange(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button className="reg-reset-btn" type="button" onClick={onReset}>
          <ClearOutlined aria-hidden="true" />
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   5. Main Table
───────────────────────────────────────── */
const TABLE_COLS = [
  "", "Объект", "Этаж", "Отделение", "Помещение", "Наим. помещения",
  "ID / артикул", "ПОЗ", "Наим. оборудования", "Тип", "Поставщик",
  "Количество", "Статус проверки", "Ошибки", "Действие",
];

const TABLE_ROWS = [
  {
    object: "Корпус А", floor: "2", dept: "Приемное", room: "2.01.29", roomName: "Кабинет врача",
    zone: "Клиническая зона",
    id: "EQ-201-01", poz: "1", name: "Кондиционер LG", type: "Климатическое", supplier: "MedSupply",
    qty: "1", status: "Проверено", statusTone: "green", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "2", dept: "Приемное", room: "2.01.29", roomName: "Кабинет врача",
    zone: "Клиническая зона",
    id: "EQ-201-02", poz: "2", name: "Щит освещения ЩО-1", type: "Электрика", supplier: "ЭлектроСнаб",
    qty: "1", status: "С расхождением", statusTone: "amber", error: { label: "Маркировка", tone: "amber" },
    action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "2", dept: "Пост", room: "2.01.32", roomName: "Пост медсестры",
    zone: "Клиническая зона",
    id: "EQ-201-04", poz: "5", name: "Тележка мед.", type: "Медоборудование", supplier: "HealthLine",
    qty: "1", status: "В работе", statusTone: "blue", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус Б", floor: "1", dept: "Склад", room: "ST-01", roomName: "СВХ",
    zone: "Складская зона",
    id: "EQ-201-05", poz: "10", name: "Монитор пациента", type: "Медоборудование", supplier: "MedSupply",
    qty: "30", status: "Ожидает проверки", statusTone: "slate", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "3", dept: "Диагностика", room: "3.01.14", roomName: "Диагностическая",
    zone: "Диагностика",
    id: "EQ-301-07", poz: "3", name: "Проектор Epson", type: "Техника", supplier: null,
    qty: "1", status: "Не проверено", statusTone: "slate", error: { label: "Нет поставщика", tone: "error", kind: "supplier" },
    action: { label: "Исправить данные", tone: "blue" },
  },
  {
    object: "Корпус Б", floor: "2", dept: "Лаборатория", room: "2.12.08", roomName: "Лаборатория анализа",
    zone: "Лабораторная зона",
    id: "EQ-402-11", poz: "7", name: "Центрифуга настольная", type: "Лабораторное", supplier: "LabService",
    qty: "2", status: "Проверено", statusTone: "green", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус В", floor: "1", dept: "Приемка", room: "", roomName: "Не указано",
    zone: "Приемка",
    id: "EQ-115-09", poz: "14", name: "Стойка инфузионная", type: "Медоборудование", supplier: "HealthLine",
    qty: "4", status: "Ошибка", statusTone: "amber", error: { label: "Нет помещения", tone: "amber", kind: "room" },
    action: { label: "Указать", tone: "blue" },
  },
  {
    object: "Корпус Б", floor: "1", dept: "Склад", room: "ST-01", roomName: "СВХ",
    zone: "Складская зона",
    id: "EQ-201-06", poz: "11", name: "Дефибриллятор", type: "Медоборудование", supplier: null,
    qty: "3", status: "Ошибка", statusTone: "amber", error: { label: "Нет поставщика", tone: "error", kind: "supplier" },
    action: { label: "Указать", tone: "blue" },
  },
  {
    object: "Корпус А", floor: "4", dept: "Операционный блок", room: "4.02.01", roomName: "Операционная 1",
    zone: "Операционный блок",
    id: "EQ-401-02", poz: "18", name: "Светильник хирургический", type: "Электрика", supplier: "ЭлектроСнаб",
    qty: "1", status: "Ожидает проверки", statusTone: "slate", error: null, action: { label: "Проверить", tone: "blue" },
  },
  {
    object: "Корпус В", floor: "0", dept: "Техническая", room: "0.01.02", roomName: "Серверная",
    zone: "Техническая зона",
    id: "EQ-001-20", poz: "22", name: "Контроллер доступа", type: "СКУД", supplier: "SecureTech",
    qty: "1", status: "В работе", statusTone: "blue", error: { label: "Неверный ID", tone: "amber", kind: "data" },
    action: { label: "Исправить", tone: "blue" },
  },
];

const STATUS_TONE_CLASS = {
  green: "reg-badge-green",
  amber: "reg-badge-amber",
  blue: "reg-badge-blue",
  slate: "reg-badge-slate",
};

const REGISTRY_IMPORT_DIALOG = {
  title: "Импорт реестра оборудования",
  subtitle: "Загрузка, проверка и обновление основной Excel-таблицы оборудования",
  currentFile: {
    name: "equipment_registry_april.xlsx",
    meta: "Последний импорт: сегодня, 08:20",
  },
  metrics: [
    { label: "Строк / объектов", value: "512", detail: "3" },
    { label: "Помещений / ошибок", value: "74", detail: "2 ошибки", tone: "warning" },
  ],
  note: "Если исходная таблица была изменена вне приложения, загрузите новую версию и нажмите «Обновить данные».",
  validationItems: ["Файл прочитан", "Структура распознана", "Обязательные колонки найдены", "Формат строк корректен", "Дубликаты ID проверены", "Критических ошибок нет"],
  warning: {
    title: "2 строки без поставщика",
    text: "1 строка без помещения. Предупреждения можно исправить позже, но они будут отмечены в реестре.",
  },
  compare: {
    title: "Сравнение с текущими данными",
    subtitle: "Что изменится после обновления",
    changes: ["Будет добавлено: 16 строк", "Будет обновлено: 4 строки", "Будет добавлено: 2 помещения", "Ошибок проверки станет меньше: 2 → 1"],
    rows: [
      ["Строки", "512", "528", "+16 строк"],
      ["Помещения", "74", "76", "+2 помещения"],
      ["Существующие записи", "—", "4", "4 строки обновлены"],
      ["Ошибки проверки", "2", "1", "-1 ошибка"],
    ],
  },
};

const REGISTRY_EQUIPMENT_DETAILS = {
  title: "Щит освещения ЩО-1",
  subtitle: "ID: EQ-201-02 • Электрика",
  initials: "ЩО",
};

const REGISTRY_UPDATE_STRUCTURE_DIALOG = {
  title: "Обновить структуру из реестра?",
  subtitle: "Структура объектов будет пересчитана по текущему Excel-файлу.",
  fileName: "equipment_registry_april.xlsx",
  fileMeta: "Строк: 512 • Помещений: 74",
};

const EMPTY_FILTERS = {
  object: "Все объекты",
  floor: "Все этажи",
  zone: "Все зоны",
  room: "Все помещения",
  type: "Все типы",
  supplier: "Все поставщики",
  status: "Все статусы",
};

const IMPORT_HISTORY_ROWS = [
  { date: "Сегодня, 08:20", file: "equipment_registry_april.xlsx", user: "Иван Иванов", status: "Успешно", result: "2 ошибки" },
  { date: "Вчера, 16:10", file: "equipment_registry_draft.xlsx", user: "Анна Смирнова", status: "С предупреждениями", result: "1 помещение" },
  { date: "11.04.2026, 14:15", file: "equip_apr_draft.xlsx", user: "Петр Сергеев", status: "Ошибка", result: "Нет поставщика" },
  { date: "10.04.2026, 09:30", file: "initial_registry.xlsx", user: "Иван Иванов", status: "Успешно", result: "490 строк" },
];

function getRowAction(row) {
  if (row.error?.kind === "room" || row.error?.kind === "supplier") {
    return { label: "Указать", tone: "blue" };
  }

  if (row.error) {
    return { label: row.action?.label?.startsWith("Исправ") ? row.action.label : "Исправить", tone: "blue" };
  }

  if (row.status !== "Проверено") {
    return { label: "Проверить", tone: "blue" };
  }

  return { label: "Открыть", tone: "primary" };
}

function buildFilterOptions(rows) {
  const getUnique = (key) => [...new Set(rows.map((row) => row[key] || "Не указано"))].sort((a, b) => a.localeCompare(b, "ru"));
  return {
    object: getUnique("object"),
    floor: getUnique("floor"),
    zone: getUnique("zone"),
    room: getUnique("room"),
    type: getUnique("type"),
    supplier: getUnique("supplier"),
    status: getUnique("status"),
  };
}

function rowMatchesFilters(row, filters, quickFilter) {
  const values = {
    object: row.object,
    floor: row.floor,
    zone: row.zone,
    room: row.room || "Не указано",
    type: row.type,
    supplier: row.supplier || "Не указано",
    status: row.status,
  };

  const selectMatch = FILTER_CONFIG.every((filter) => {
    const selected = filters[filter.key];
    return selected === filter.allLabel || values[filter.key] === selected;
  });

  if (!selectMatch) {
    return false;
  }

  if (quickFilter === "errors") return Boolean(row.error);
  if (quickFilter === "missingRoom") return !row.room;
  if (quickFilter === "missingSupplier") return !row.supplier;
  if (quickFilter === "checked") return row.status === "Проверено";
  return true;
}

function RegistryTable({ rows, totalRows, onOpenDetails, onRowAction, checkingRowId }) {
  return (
    <div className="reg-table-card">
      <div className="reg-table-scroll">
        <table className="reg-table">
          <thead>
            <tr className="reg-thead-row">
              {TABLE_COLS.map((col, i) => (
                <th className="reg-th" key={i}>
                  {i === 0 ? <input type="checkbox" /> : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="reg-tbody">
            {rows.map((row) => {
              const rowAction = getRowAction(row);
              const isChecking = checkingRowId === row.id;
              return (
              <tr className="reg-tr" key={row.id} onDoubleClick={() => onOpenDetails(row)}>
                <td className="reg-td"><input type="checkbox" /></td>
                <td className="reg-td reg-td-nowrap">{row.object}</td>
                <td className="reg-td">{row.floor}</td>
                <td className="reg-td">{row.dept}</td>
                <td className="reg-td reg-td-mono">{row.room}</td>
                <td className="reg-td reg-td-nowrap">{row.roomName}</td>
                <td className="reg-td reg-td-mono">{row.id}</td>
                <td className="reg-td">{row.poz}</td>
                <td className="reg-td reg-td-name">{row.name}</td>
                <td className="reg-td">{row.type}</td>
                <td className="reg-td">{row.supplier ?? <span className="reg-td-dash">—</span>}</td>
                <td className="reg-td">{row.qty}</td>
                <td className="reg-td">
                  <span className={`reg-status-badge-pill ${STATUS_TONE_CLASS[row.statusTone]}`}>
                    {row.status}
                  </span>
                </td>
                <td className="reg-td">
                  {row.error ? (
                    <span className={`reg-error-text reg-error-${row.error.tone}`}>{row.error.label}</span>
                  ) : (
                    <span className="reg-td-dash">—</span>
                  )}
                </td>
                <td className="reg-td">
                  <button
                    className={`reg-table-action reg-table-action-${rowAction.tone}`}
                    type="button"
                    disabled={isChecking}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRowAction(row);
                    }}
                  >
                    {isChecking ? "Проверяем..." : rowAction.label}
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      <div className="reg-table-footer">
        <p className="reg-table-footer-text">Показано {rows.length} из {totalRows} позиций</p>
        <div className="reg-pagination">
          <button className="reg-page-btn" type="button" disabled><LeftOutlined /></button>
          <button className="reg-page-btn" type="button"><RightOutlined /></button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   6. Bottom Panels
───────────────────────────────────────── */
function ErrorsPanel({ onSpecify, onFix, onCheck }) {
  return (
    <div className="reg-bottom-card">
      <div className="reg-bottom-header">
        <h3 className="reg-bottom-title">
          <WarningOutlined className="reg-icon-error" aria-hidden="true" />
          Ошибки и предупреждения
        </h3>
        <span className="reg-bottom-summary">Всего: 3 критических</span>
      </div>
      <div className="reg-errors-list">
        <div className="reg-alert reg-alert-red">
          <div className="reg-alert-left">
            <span className="reg-alert-dot reg-dot-red" />
            <span className="reg-alert-text reg-alert-text-red">2 строки без поставщика</span>
          </div>
          <button className="reg-alert-action reg-alert-action-red" type="button" onClick={onFix}>Исправить</button>
        </div>
        <div className="reg-alert reg-alert-amber">
          <div className="reg-alert-left">
            <span className="reg-alert-dot reg-dot-amber" />
            <span className="reg-alert-text reg-alert-text-amber">1 строка без помещения</span>
          </div>
          <button className="reg-alert-action reg-alert-action-amber" type="button" onClick={onSpecify}>Указать</button>
        </div>
        <div className="reg-alert reg-alert-blue">
          <div className="reg-alert-left">
            <span className="reg-alert-dot reg-dot-blue" />
            <span className="reg-alert-text reg-alert-text-blue">14 строк ожидают валидации ID</span>
          </div>
          <button className="reg-alert-action reg-alert-action-blue" type="button" onClick={onCheck}>Проверить</button>
        </div>
      </div>
    </div>
  );
}

const HISTORY_ROWS = [
  { date: "12.04.2024, 08:20", file: "equip_apr_final.xlsx", rows: "512", status: "Успешно", statusTone: "green" },
  { date: "11.04.2024, 14:15", file: "equip_apr_draft.xlsx", rows: "508", status: "2 ошибки", statusTone: "amber" },
  { date: "10.04.2024, 09:30", file: "initial_registry.xlsx", rows: "490", status: "Успешно", statusTone: "green" },
];

function HistoryPanel() {
  return (
    <div className="reg-bottom-card">
      <div className="reg-bottom-header">
        <h3 className="reg-bottom-title">
          <HistoryOutlined className="reg-icon-primary" aria-hidden="true" />
          История импортов
        </h3>
      </div>
      <table className="reg-history-table">
        <thead>
          <tr className="reg-history-thead-row">
            <th className="reg-history-th">Дата / Время</th>
            <th className="reg-history-th">Файл</th>
            <th className="reg-history-th reg-th-center">Строк</th>
            <th className="reg-history-th reg-th-right">Статус проверки</th>
          </tr>
        </thead>
        <tbody className="reg-history-tbody">
          {HISTORY_ROWS.map((row) => (
            <tr className="reg-history-tr" key={row.date}>
              <td className="reg-history-td reg-history-td-bold">{row.date}</td>
              <td className="reg-history-td reg-history-td-file">{row.file}</td>
              <td className="reg-history-td reg-th-center">{row.rows}</td>
              <td className="reg-history-td reg-th-right">
                <span className={`reg-history-status reg-history-status-${row.statusTone}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegistryBottomPanels({ onSpecify, onFix, onCheck }) {
  return (
    <div className="reg-bottom-panels">
      <ErrorsPanel onSpecify={onSpecify} onFix={onFix} onCheck={onCheck} />
      <HistoryPanel />
    </div>
  );
}

function RegistryStatusDialog({ config, onClose, onComplete }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus("success");
      onComplete?.();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  const isLoading = status === "loading";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={isLoading}
      title={isLoading ? config.loadingTitle : config.successTitle}
      subtitle={isLoading ? config.loadingText : config.successText}
      footer={(
        <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={isLoading}>
          Закрыть
        </button>
      )}
    >
      <div className={`${isLoading ? "reg-loading-card" : "reg-success-card"} reg-success-card-full`}>
        {isLoading ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
        <div>
          <strong>{isLoading ? config.loadingTitle : config.successTitle}</strong>
          <span>{isLoading ? config.loadingText : config.successText}</span>
        </div>
      </div>
    </DesktopModalShell>
  );
}

function ImportHistoryModal({ onClose }) {
  return (
    <DesktopModalShell
      onClose={onClose}
      size="default"
      title="История импортов"
      subtitle="Последние загрузки Excel-реестра"
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <table className="reg-modal-table">
        <thead>
          <tr><th>Дата</th><th>Файл</th><th>Пользователь</th><th>Статус</th><th>Итог</th></tr>
        </thead>
        <tbody>
          {IMPORT_HISTORY_ROWS.map((row) => (
            <tr key={`${row.date}-${row.file}`}>
              <td>{row.date}</td>
              <td>{row.file}</td>
              <td>{row.user}</td>
              <td>{row.status}</td>
              <td>{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DesktopModalShell>
  );
}

function ImportErrorsModal({ rows, onClose }) {
  const errorRows = rows.filter((row) => row.error).slice(0, 5);

  return (
    <DesktopModalShell
      onClose={onClose}
      size="default"
      title="Ошибки импорта"
      subtitle={`Всего ошибок: ${errorRows.length}`}
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <table className="reg-modal-table">
        <thead>
          <tr><th>Строка</th><th>Поле</th><th>Проблема</th><th>Рекомендация</th></tr>
        </thead>
        <tbody>
          {errorRows.map((row) => (
            <tr key={row.id}>
              <td>{row.poz}</td>
              <td>{row.error.kind === "supplier" ? "Поставщик" : row.error.kind === "room" ? "Помещение" : "Данные"}</td>
              <td>{row.error.label}</td>
              <td>{row.error.kind === "supplier" ? "Укажите поставщика" : row.error.kind === "room" ? "Привяжите помещение" : "Проверьте значение строки"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DesktopModalShell>
  );
}

function RowEditModal({ row, mode, onClose, onSave }) {
  const [supplier, setSupplier] = useState(row.supplier ?? "");
  const [room, setRoom] = useState(row.room ?? "");
  const [comment, setComment] = useState(row.error?.label ?? "");
  const isSpecify = mode === "specify";
  const needsSupplier = row.error?.kind === "supplier";
  const needsRoom = row.error?.kind === "room";

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...row,
      supplier: needsSupplier ? supplier.trim() || "Не указано" : row.supplier,
      room: needsRoom ? room.trim() : row.room,
      roomName: needsRoom ? "Уточнено вручную" : row.roomName,
      status: isSpecify ? "Ожидает проверки" : "Проверено",
      statusTone: isSpecify ? "slate" : "green",
      error: null,
      action: { label: isSpecify ? "Проверить" : "Открыть", tone: isSpecify ? "blue" : "primary" },
    });
  };

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      title={isSpecify ? "Указать данные строки" : "Исправить данные строки"}
      subtitle={`${row.id} • ${row.name}`}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="submit" form="registry-row-edit-form">Сохранить</button>
        </>
      )}
    >
      <form className="reg-row-form" id="registry-row-edit-form" onSubmit={handleSubmit}>
        {needsSupplier ? (
          <label>
            <span>Поставщик</span>
            <input value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Например, MedSupply" />
          </label>
        ) : null}
        {needsRoom ? (
          <label>
            <span>Помещение</span>
            <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Например, 2.01.29" />
          </label>
        ) : null}
        {!isSpecify ? (
          <label>
            <span>Комментарий исправления</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
          </label>
        ) : null}
      </form>
    </DesktopModalShell>
  );
}

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */
export function DesktopRegistryScreen() {
  const [activeModal, setActiveModal] = useState(null);
  const [rows, setRows] = useState(TABLE_ROWS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [quickFilter, setQuickFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState(null);
  const [checkingRowId, setCheckingRowId] = useState(null);

  const closeModal = () => setActiveModal(null);
  const errorCount = rows.filter((row) => row.error).length;
  const filterOptions = useMemo(() => buildFilterOptions(rows), [rows]);
  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesFilters(row, filters, quickFilter)),
    [rows, filters, quickFilter],
  );

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setQuickFilter("all");
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setQuickFilter("all");
  };

  const openRowModal = (row, mode) => {
    setSelectedRow(row);
    setActiveModal(mode);
  };

  const handleRowAction = (row) => {
    const action = getRowAction(row);
    if (action.label === "Открыть") {
      setSelectedRow(row);
      setActiveModal("equipment");
      return;
    }

    if (action.label === "Указать") {
      openRowModal(row, "specifyRow");
      return;
    }

    if (action.label.startsWith("Исправ")) {
      openRowModal(row, "fixRow");
      return;
    }

    setCheckingRowId(row.id);
    setSelectedRow(row);
    setActiveModal("checkRow");
  };

  const saveRow = (updatedRow) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    setSelectedRow(null);
    closeModal();
  };

  const completeRowCheck = () => {
    if (!selectedRow) {
      return;
    }

    setRows((currentRows) => currentRows.map((row) => (
      row.id === selectedRow.id
        ? { ...row, status: "Проверено", statusTone: "green", error: null, action: { label: "Открыть", tone: "primary" } }
        : row
    )));
    setCheckingRowId(null);
  };

  const firstMissingRoom = rows.find((row) => row.error?.kind === "room");
  const firstFixable = rows.find((row) => row.error && row.error.kind !== "supplier" && row.error.kind !== "room") ?? rows.find((row) => row.error);
  const firstCheckable = rows.find((row) => row.status !== "Проверено" && !row.error);

  return (
    <div className="reg-screen">
      <RegistryActionBar
        onOpenImport={() => setActiveModal("import")}
        onOpenUpdateStructure={() => setActiveModal("updateStructure")}
        onExport={() => setActiveModal("export")}
        onTemplate={() => setActiveModal("template")}
        onHistory={() => setActiveModal("importHistory")}
      />
      <RegistryStatsGrid />
      <RegistryStatusCard
        onOpenImport={() => setActiveModal("import")}
        onOpenErrors={() => setActiveModal("importErrors")}
        errorCount={errorCount}
      />
      <RegistryFilters
        filters={filters}
        quickFilter={quickFilter}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onQuickFilterChange={setQuickFilter}
        onReset={resetFilters}
      />
      <RegistryTable
        rows={filteredRows}
        totalRows={rows.length}
        onOpenDetails={(row) => {
          setSelectedRow(row);
          setActiveModal("equipment");
        }}
        onRowAction={handleRowAction}
        checkingRowId={checkingRowId}
      />
      <RegistryBottomPanels
        onSpecify={() => firstMissingRoom && openRowModal(firstMissingRoom, "specifyRow")}
        onFix={() => firstFixable && openRowModal(firstFixable, "fixRow")}
        onCheck={() => firstCheckable && handleRowAction(firstCheckable)}
      />
      {activeModal === "import" && <DesktopUploadDialog config={REGISTRY_IMPORT_DIALOG} onClose={closeModal} />}
      {activeModal === "equipment" && <DesktopDetailsModal details={REGISTRY_EQUIPMENT_DETAILS} onClose={closeModal} />}
      {activeModal === "updateStructure" && <DesktopConfirmDialog config={REGISTRY_UPDATE_STRUCTURE_DIALOG} onClose={closeModal} />}
      {activeModal === "export" && (
        <RegistryStatusDialog
          onClose={closeModal}
          config={{
            loadingTitle: "Готовим экспорт",
            loadingText: "Формируем Excel-файл реестра",
            successTitle: "Экспорт готов",
            successText: "Файл будет скачан после подключения backend/API",
          }}
        />
      )}
      {activeModal === "template" && (
        <RegistryStatusDialog
          onClose={closeModal}
          config={{
            loadingTitle: "Готовим шаблон",
            loadingText: "Формируем Excel-шаблон для заполнения",
            successTitle: "Шаблон готов",
            successText: "Скачивание будет подключено вместе с backend/API",
          }}
        />
      )}
      {activeModal === "importHistory" && <ImportHistoryModal onClose={closeModal} />}
      {activeModal === "importErrors" && <ImportErrorsModal rows={rows} onClose={closeModal} />}
      {activeModal === "specifyRow" && selectedRow && (
        <RowEditModal row={selectedRow} mode="specify" onClose={closeModal} onSave={saveRow} />
      )}
      {activeModal === "fixRow" && selectedRow && (
        <RowEditModal row={selectedRow} mode="fix" onClose={closeModal} onSave={saveRow} />
      )}
      {activeModal === "checkRow" && (
        <RegistryStatusDialog
          onClose={() => {
            setCheckingRowId(null);
            closeModal();
          }}
          onComplete={completeRowCheck}
          config={{
            loadingTitle: "Проверяем позицию",
            loadingText: "Сверяем данные строки с правилами реестра",
            successTitle: "Позиция проверена",
            successText: "Статус строки обновлен на «Проверено»",
          }}
        />
      )}
    </div>
  );
}
