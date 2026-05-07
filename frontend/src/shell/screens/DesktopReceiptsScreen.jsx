import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CloseOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import "../styles/receiptsScreen.css";
import "../styles/desktopScreenCommon.css";

const STATS = [
  {
    label: "Всего поступлений",
    value: "24",
    sub: "тек. месяц",
    cls: "rcp-stat-default",
  },
  {
    label: "Ожидают проверки",
    value: "7",
    icon: <ExclamationCircleOutlined />,
    cls: "rcp-stat-amber",
  },
  {
    label: "Подтверждено",
    value: "12",
    icon: <CheckCircleOutlined />,
    cls: "rcp-stat-green",
  },
  {
    label: "Отклонено",
    value: "3",
    icon: <CloseCircleOutlined />,
    cls: "rcp-stat-red",
  },
  {
    label: "Спорные",
    value: "2",
    sub: "требуют внимания",
    cls: "rcp-stat-purple",
    info: true,
  },
];

const ROWS = [
  {
    batch: "B-2024-05",
    date: "Сегодня 08:40",
    name: "Монитор пациента",
    article: "EQ-201-05",
    warehouse: "Склад временного хранения",
    qty: "30 шт.",
    supplier: "MedSupply GmbH",
    creator: "Диспетчер",
    checker: "—",
    status: "Ожидает проверки",
    statusCls: "rcp-pill-amber",
    actionLabel: "Открыть",
    actionCls: "rcp-row-btn",
    active: true,
  },
  {
    batch: "A-104",
    date: "Сегодня 09:12",
    name: "Кондиционер LG",
    article: "EQ-201-01",
    warehouse: "Основной склад",
    qty: "12 шт.",
    supplier: "ClimatePro",
    creator: "Диспетчер",
    checker: "Иван Иванов",
    status: "Подтверждено",
    statusCls: "rcp-pill-green",
    actionLabel: "Открыть",
    actionCls: "rcp-row-btn",
  },
  {
    batch: "EL-22",
    date: "Вчера 16:10",
    name: "Щит освещения ЩО-1",
    article: "EQ-201-02",
    warehouse: "Склад №2",
    qty: "5 шт.",
    supplier: "ЭлектроСнаб",
    creator: "Диспетчер",
    checker: "Пётр Смирнов",
    status: "Отклонено",
    statusCls: "rcp-pill-red",
    actionLabel: "Открыть",
    actionCls: "rcp-row-btn",
  },
  {
    batch: "PR-301",
    date: "Вчера 14:35",
    name: "Проектор Epson",
    article: "EQ-301-07",
    warehouse: "Основной склад",
    qty: "4 шт.",
    supplier: "TechVision",
    creator: "Диспетчер",
    checker: "—",
    status: "Спорная",
    statusCls: "rcp-pill-purple",
    actionLabel: "Решить",
    actionCls: "rcp-row-btn rcp-row-btn-purple",
  },
  {
    batch: "MED-77",
    date: "10.04.2026",
    name: "Тележка медицинская",
    article: "EQ-201-04",
    warehouse: "Склад №3",
    qty: "8 шт.",
    supplier: "HealthLine",
    creator: "Диспетчер",
    checker: "Иван Иванов",
    status: "Подтверждено",
    statusCls: "rcp-pill-green",
    actionLabel: "Открыть",
    actionCls: "rcp-row-btn",
  },
];

const ATTENTION = [
  { icon: <CloseOutlined />, text: "3 поступления отклонены", cls: "rcp-attn-red", btnCls: "rcp-attn-btn-red", btn: "Перейти" },
  { icon: <QuestionCircleOutlined />, text: "2 спорные партии", cls: "rcp-attn-purple", btnCls: "rcp-attn-btn-purple", btn: "Решить" },
  { icon: <SyncOutlined />, text: "1 партия не синхронизирована", cls: "rcp-attn-amber", btnCls: "rcp-attn-btn-amber", btn: "Синхрон." },
];

const HISTORY = [
  {
    dotCls: "rcp-hist-dot-green",
    icon: <CheckOutlined />,
    iconCls: "rcp-hist-icon-green",
    time: "09:42",
    html: (
      <>
        <strong>Иван Иванов</strong> подтвердил партию <span className="rcp-hist-batch">A-104</span> (Кондиционер LG)
      </>
    ),
  },
  {
    dotCls: "rcp-hist-dot-red",
    icon: <CloseOutlined />,
    iconCls: "rcp-hist-icon-red",
    time: "09:31",
    html: (
      <>
        <strong>Пётр Смирнов</strong> отклонил партию <span className="rcp-hist-batch">EL-22</span> (Щит освещения ЩО-1)
      </>
    ),
  },
];

export function DesktopReceiptsScreen() {
  return (
    <div className="rcp-screen">
      {/* Action Bar */}
      <div className="rcp-actions">
        <button className="rcp-btn-primary" type="button">
          <PlusOutlined />
          <span>Создать поступление</span>
        </button>
        <button className="rcp-btn-secondary" type="button">
          <UploadOutlined />
          <span>Импорт из реестра</span>
        </button>
        <button className="rcp-btn-secondary" type="button">
          <DownloadOutlined />
          <span>Экспорт</span>
        </button>
        <button className="rcp-btn-secondary" type="button">
          <HistoryOutlined />
          <span>История проверок</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="rcp-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className={`rcp-stat-card ${s.cls}`}>
            {s.info && (
              <div className="rcp-stat-info-row">
                <span className="rcp-stat-label">{s.label}</span>
                <QuestionCircleOutlined className="rcp-stat-info-icon" title="требуют решения" />
              </div>
            )}
            {!s.info && <p className="rcp-stat-label">{s.label}</p>}
            <div className="rcp-stat-value-row">
              <span className="rcp-stat-value">{s.value}</span>
              {s.icon && <span className="rcp-stat-icon">{s.icon}</span>}
              {s.sub && <span className="rcp-stat-sub">{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rcp-filters-card">
        <div className="rcp-filters-row">
          <div className="rcp-filter-field">
            <label className="rcp-filter-label">Период</label>
            <select className="rcp-filter-select">
              <option>Текущий месяц</option>
            </select>
          </div>
          <div className="rcp-filter-field">
            <label className="rcp-filter-label">Поставщик</label>
            <select className="rcp-filter-select">
              <option>Все поставщики</option>
            </select>
          </div>
          <div className="rcp-filter-field">
            <label className="rcp-filter-label">Склад</label>
            <select className="rcp-filter-select">
              <option>Все склады</option>
            </select>
          </div>
          <div className="rcp-filter-field">
            <label className="rcp-filter-label">Статус</label>
            <select className="rcp-filter-select">
              <option>Все статусы</option>
            </select>
          </div>
          <div className="rcp-filter-field">
            <label className="rcp-filter-label">Партия</label>
            <input className="rcp-filter-input" type="text" placeholder="Номер..." />
          </div>
        </div>
        <div className="rcp-chips-row">
          <div className="rcp-chips">
            <button className="rcp-chip rcp-chip-active" type="button">Все</button>
            <button className="rcp-chip" type="button">Ожидают проверки</button>
            <button className="rcp-chip" type="button">Подтверждено</button>
            <button className="rcp-chip" type="button">Отклонено</button>
            <button className="rcp-chip" type="button">Спорные</button>
            <button className="rcp-chip" type="button">Не синхронизировано</button>
          </div>
          <button className="rcp-reset-btn" type="button">
            <CloseCircleOutlined />
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Table + Detail Panel */}
      <div className="rcp-main-layout">
        {/* Table */}
        <div className="rcp-table-card">
          <div className="rcp-table-head-row">
            <h3 className="rcp-table-title">Список поступлений</h3>
            <span className="rcp-table-count">Показано 5 из 24</span>
          </div>
          <div className="rcp-table-wrap">
            <table className="rcp-table">
              <thead>
                <tr>
                  <th>Партия</th>
                  <th>Дата / Время</th>
                  <th>Позиция</th>
                  <th>ID / Артикул</th>
                  <th>Склад</th>
                  <th className="rcp-th-center">Кол-во</th>
                  <th>Поставщик</th>
                  <th>Создал</th>
                  <th>Проверил</th>
                  <th>Статус</th>
                  <th className="rcp-th-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.batch} className={row.active ? "rcp-row-active" : ""}>
                    <td className={`rcp-td-batch${row.active ? " rcp-td-batch-active" : ""}`}>{row.batch}</td>
                    <td className="rcp-td-date">{row.date}</td>
                    <td className="rcp-td-name">{row.name}</td>
                    <td className="rcp-td-article">{row.article}</td>
                    <td className="rcp-td-warehouse" title={row.warehouse}>{row.warehouse}</td>
                    <td className="rcp-td-qty">{row.qty}</td>
                    <td className="rcp-td-supplier">{row.supplier}</td>
                    <td className="rcp-td-person">{row.creator}</td>
                    <td className="rcp-td-person">{row.checker}</td>
                    <td>
                      <span className={`rcp-pill ${row.statusCls}`}>{row.status}</span>
                    </td>
                    <td className="rcp-td-action">
                      <button className={row.actionCls} type="button">{row.actionLabel}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="rcp-detail-panel">
          <div className="rcp-detail-header">
            <h3 className="rcp-detail-title">Детали поступления</h3>
            <p className="rcp-detail-sub">B-2024-05 • Монитор пациента</p>
          </div>
          <div className="rcp-detail-body">
            <div className="rcp-detail-fields">
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">ID / артикул</span>
                <span className="rcp-detail-val rcp-detail-mono">EQ-201-05</span>
              </div>
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">Количество</span>
                <span className="rcp-detail-val">30 шт.</span>
              </div>
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">Поставщик</span>
                <span className="rcp-detail-val">MedSupply GmbH</span>
              </div>
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">Склад</span>
                <span className="rcp-detail-val">Склад временного хранения</span>
              </div>
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">Создал</span>
                <span className="rcp-detail-val">Иван Иванов</span>
              </div>
              <div className="rcp-detail-row">
                <span className="rcp-detail-key">Статус поступления</span>
                <span className="rcp-detail-val rcp-detail-status-amber">Ожидает проверки</span>
              </div>
              <div className="rcp-detail-row rcp-detail-row-last">
                <span className="rcp-detail-key">Проверка</span>
                <span className="rcp-detail-val rcp-detail-italic">ожидает оператора</span>
              </div>
            </div>
            <div className="rcp-detail-actions">
              <button className="rcp-detail-btn-primary" type="button">Открыть карточку</button>
              <button className="rcp-detail-btn-secondary" type="button">Редактировать поступление</button>
              <button className="rcp-detail-btn-outline" type="button">Отправить на проверку</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="rcp-bottom-panels">
        {/* Требуют внимания */}
        <div className="rcp-bottom-panel">
          <div className="rcp-bottom-panel-header">
            <ExclamationCircleOutlined className="rcp-bottom-panel-icon rcp-bottom-panel-icon-red" />
            <h3 className="rcp-bottom-panel-title">Требуют внимания</h3>
          </div>
          <div className="rcp-attn-list">
            {ATTENTION.map((a, i) => (
              <div key={i} className={`rcp-attn-item ${a.cls}`}>
                <div className="rcp-attn-left">
                  <span className="rcp-attn-icon">{a.icon}</span>
                  <span className="rcp-attn-text">{a.text}</span>
                </div>
                <button className={`rcp-attn-btn ${a.btnCls}`} type="button">{a.btn}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Последние проверки */}
        <div className="rcp-bottom-panel">
          <div className="rcp-bottom-panel-header">
            <HistoryOutlined className="rcp-bottom-panel-icon rcp-bottom-panel-icon-primary" />
            <h3 className="rcp-bottom-panel-title">Последние проверки</h3>
          </div>
          <div className="rcp-hist-list">
            {HISTORY.map((h, i) => (
              <div key={i} className={`rcp-hist-item${i < HISTORY.length - 1 ? " rcp-hist-item-line" : ""}`}>
                <div className={`rcp-hist-dot ${h.dotCls}`}>
                  <span className={`rcp-hist-dot-icon ${h.iconCls}`}>{h.icon}</span>
                </div>
                <div className="rcp-hist-content">
                  <p className="rcp-hist-time">{h.time}</p>
                  <p className="rcp-hist-text">{h.html}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="rcp-hist-more-btn" type="button">Показать всю историю</button>
        </div>
      </div>
    </div>
  );
}
