import {
  ClearOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "../styles/registryScreen.css";

/* ─────────────────────────────────────────
   1. Action Bar
───────────────────────────────────────── */
function RegistryActionBar() {
  return (
    <div className="reg-action-bar">
      <div className="reg-action-bar-left">
        <button className="reg-btn-primary" type="button">
          <UploadOutlined aria-hidden="true" />
          Импорт / обновление Excel
        </button>
        <button className="reg-btn-secondary" type="button">
          <DownloadOutlined aria-hidden="true" />
          Экспорт
        </button>
      </div>
      <div className="reg-action-bar-right">
        <button className="reg-btn-link" type="button">
          <FileTextOutlined aria-hidden="true" />
          Скачать шаблон
        </button>
        <button className="reg-btn-link" type="button">
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
function RegistryStatusCard() {
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
                2
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="reg-status-actions">
        <button className="reg-btn-warning" type="button">Открыть ошибки</button>
        <button className="reg-btn-outlined-blue" type="button">Импортировать новую версию</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   4. Filters
───────────────────────────────────────── */
const FILTERS = [
  { label: "Объект", options: ["Все объекты", "Корпус А", "Корпус Б"] },
  { label: "Этаж", options: ["Все этажи"] },
  { label: "Зона", options: ["Все зоны"] },
  { label: "Помещение", options: ["Все помещения"] },
  { label: "Тип", options: ["Все типы"] },
  { label: "Поставщик", options: ["Все поставщики"] },
  { label: "Статус", options: ["Все статусы"] },
];

function RegistryFilters() {
  return (
    <div className="reg-filters-card">
      <div className="reg-filters-grid">
        {FILTERS.map((f) => (
          <div className="reg-filter-field" key={f.label}>
            <label className="reg-filter-label">{f.label}</label>
            <select className="reg-filter-select" defaultValue={f.options[0]}>
              {f.options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="reg-filter-row2">
        <div className="reg-quick-filters">
          <button className="reg-qf-pill reg-qf-active" type="button">Все</button>
          <button className="reg-qf-pill reg-qf-error" type="button">С ошибками (2)</button>
          <button className="reg-qf-pill" type="button">Без помещения</button>
          <button className="reg-qf-pill" type="button">Без поставщика</button>
          <button className="reg-qf-pill" type="button">Проверено</button>
        </div>
        <button className="reg-reset-btn" type="button">
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
    id: "EQ-201-01", poz: "1", name: "Кондиционер LG", type: "Климатическое", supplier: "MedSupply",
    qty: "1", status: "Проверено", statusTone: "green", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "2", dept: "Приемное", room: "2.01.29", roomName: "Кабинет врача",
    id: "EQ-201-02", poz: "2", name: "Щит освещения ЩО-1", type: "Электрика", supplier: "ЭлектроСнаб",
    qty: "1", status: "С расхождением", statusTone: "amber", error: { label: "Маркировка", tone: "amber" },
    action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "2", dept: "Пост", room: "2.01.32", roomName: "Пост медсестры",
    id: "EQ-201-04", poz: "5", name: "Тележка мед.", type: "Медоборудование", supplier: "HealthLine",
    qty: "1", status: "В работе", statusTone: "blue", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус Б", floor: "1", dept: "Склад", room: "ST-01", roomName: "СВХ",
    id: "EQ-201-05", poz: "10", name: "Монитор пациента", type: "Медоборудование", supplier: "MedSupply",
    qty: "30", status: "Ожидает проверки", statusTone: "slate", error: null, action: { label: "Открыть", tone: "primary" },
  },
  {
    object: "Корпус А", floor: "3", dept: "Диагностика", room: "3.01.14", roomName: "Диагностическая",
    id: "EQ-301-07", poz: "3", name: "Проектор Epson", type: "Техника", supplier: null,
    qty: "1", status: "Не проверено", statusTone: "slate", error: { label: "Нет поставщика", tone: "error" },
    action: { label: "Исправить данные", tone: "blue" },
  },
];

const STATUS_TONE_CLASS = {
  green: "reg-badge-green",
  amber: "reg-badge-amber",
  blue: "reg-badge-blue",
  slate: "reg-badge-slate",
};

function RegistryTable() {
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
            {TABLE_ROWS.map((row, ri) => (
              <tr className="reg-tr" key={ri}>
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
                  <a className={`reg-table-action reg-table-action-${row.action.tone}`} href="#">
                    {row.action.label}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="reg-table-footer">
        <p className="reg-table-footer-text">Показано 5 из 512 позиций</p>
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
function ErrorsPanel() {
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
          <button className="reg-alert-action reg-alert-action-red" type="button">Исправить</button>
        </div>
        <div className="reg-alert reg-alert-amber">
          <div className="reg-alert-left">
            <span className="reg-alert-dot reg-dot-amber" />
            <span className="reg-alert-text reg-alert-text-amber">1 строка без помещения</span>
          </div>
          <button className="reg-alert-action reg-alert-action-amber" type="button">Указать</button>
        </div>
        <div className="reg-alert reg-alert-blue">
          <div className="reg-alert-left">
            <span className="reg-alert-dot reg-dot-blue" />
            <span className="reg-alert-text reg-alert-text-blue">14 строк ожидают валидации ID</span>
          </div>
          <button className="reg-alert-action reg-alert-action-blue" type="button">Проверить</button>
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

function RegistryBottomPanels() {
  return (
    <div className="reg-bottom-panels">
      <ErrorsPanel />
      <HistoryPanel />
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */
export function DesktopRegistryScreen() {
  return (
    <div className="reg-screen">
      <RegistryActionBar />
      <RegistryStatsGrid />
      <RegistryStatusCard />
      <RegistryFilters />
      <RegistryTable />
      <RegistryBottomPanels />
    </div>
  );
}
