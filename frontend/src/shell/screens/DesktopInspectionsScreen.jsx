import {
  PlusCircleOutlined,
  UserAddOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ReloadOutlined,
  WarningOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "../styles/inspectionsScreen.css";

/* ─── Progress Bar ─── */
function InspProgressBar({ pct, tone }) {
  const fillClass = tone === "success" ? "ins-pb-fill ins-pb-fill-success" : "ins-pb-fill";
  const trackClass = tone === "success" ? "ins-pb-track ins-pb-track-success" : "ins-pb-track";
  return (
    <div className="ins-pb-wrap">
      <div className={trackClass}>
        {pct > 0 && <div className={fillClass} style={{ width: `${pct}%` }} />}
      </div>
      <span className={tone === "success" ? "ins-pb-label ins-pb-label-success" : "ins-pb-label"}>
        {pct}%
      </span>
    </div>
  );
}

/* ─── Status Pill ─── */
function StatusPill({ status }) {
  const map = {
    "В работе": "ins-pill ins-pill-blue",
    "Ожидает назначения": "ins-pill ins-pill-amber",
    "Завершено": "ins-pill ins-pill-green",
    "Требует внимания": "ins-pill ins-pill-rose",
  };
  return <span className={map[status] || "ins-pill ins-pill-gray"}>{status}</span>;
}

/* ─── Operator Avatar ─── */
function OperatorCell({ initials, name, tone }) {
  if (!initials) return <span className="ins-no-operator">Не назначен</span>;
  const cls = tone === "primary" ? "ins-avatar ins-avatar-primary" : "ins-avatar ins-avatar-gray";
  return (
    <div className="ins-operator-cell">
      <div className={cls}>{initials}</div>
      <span className="ins-operator-name">{name}</span>
    </div>
  );
}

/* ─── Sync Cell ─── */
function SyncCell({ type, text }) {
  if (type === "pending") {
    return (
      <div className="ins-sync-cell">
        <ClockCircleOutlined className="ins-sync-icon ins-sync-icon-amber" />
        <span className="ins-sync-text ins-sync-text-amber">{text}</span>
      </div>
    );
  }
  if (type === "ok") {
    return (
      <div className="ins-sync-cell">
        <CheckCircleOutlined className="ins-sync-icon ins-sync-icon-green" />
        <span className="ins-sync-text ins-sync-text-green">ОК</span>
      </div>
    );
  }
  if (type === "error") {
    return (
      <div className="ins-sync-cell">
        <CloseCircleOutlined className="ins-sync-icon ins-sync-icon-rose" />
        <span className="ins-sync-text ins-sync-text-rose">Ошибка</span>
      </div>
    );
  }
  return <span className="ins-cell-dim">—</span>;
}

/* ─── Main Table ─── */
const ROWS = [
  {
    id: "#INS-2024-001",
    object: "Корпус А",
    zone: "Приемное отделение",
    operator: { initials: "ИИ", name: "И. Иванов", tone: "primary" },
    rooms: "16/42",
    items: "48/128",
    pct: 38,
    discrepancies: 8,
    sync: { type: "pending", text: "12 в оч." },
    status: "В работе",
    action: { label: "Открыть", tone: "primary" },
    rowCls: "ins-tr ins-tr-active",
  },
  {
    id: "#INS-2024-002",
    object: "Корпус А",
    zone: "Диагностика",
    operator: { initials: null },
    rooms: "0/16",
    items: "0/84",
    pct: 0,
    discrepancies: null,
    sync: { type: "none" },
    status: "Ожидает назначения",
    action: { label: "Назначить", tone: "amber" },
    rowCls: "ins-tr ins-tr-default",
  },
  {
    id: "#INS-2024-003",
    object: "Корпус Б",
    zone: "Офисная зона",
    operator: { initials: "ПС", name: "П. Смирнов", tone: "gray" },
    rooms: "12/12",
    items: "96/96",
    pct: 100,
    pctTone: "success",
    discrepancies: 0,
    discrepanciesTone: "success",
    sync: { type: "ok" },
    status: "Завершено",
    action: { label: "Открыть", tone: "primary" },
    rowCls: "ins-tr ins-tr-default",
  },
  {
    id: "#INS-2024-004",
    object: "Склад временного...",
    zone: "Поступления",
    operator: { initials: "АС", name: "А. Смирнова", tone: "gray" },
    rooms: "18/24",
    items: "56/75",
    pct: 75,
    discrepancies: 2,
    sync: { type: "error" },
    status: "Требует внимания",
    action: { label: "Открыть", tone: "primary" },
    rowCls: "ins-tr ins-tr-default",
  },
];

function InspectionsTable() {
  return (
    <div className="ins-table-card">
      <div className="ins-table-header">
        <h3 className="ins-table-title">Список инспекций</h3>
        <span className="ins-table-count">Показано: 18 из 124</span>
      </div>
      <div className="ins-table-scroll">
        <table className="ins-table">
          <thead>
            <tr className="ins-thead-row">
              <th className="ins-th">Инспекция</th>
              <th className="ins-th">Объект / зона</th>
              <th className="ins-th">Оператор</th>
              <th className="ins-th">Помещения</th>
              <th className="ins-th">Позиции</th>
              <th className="ins-th">Прогресс</th>
              <th className="ins-th">Расхождения</th>
              <th className="ins-th">Синхронизация</th>
              <th className="ins-th">Статус</th>
              <th className="ins-th ins-th-right">Действие</th>
            </tr>
          </thead>
          <tbody className="ins-tbody">
            {ROWS.map((row) => (
              <tr key={row.id} className={row.rowCls}>
                <td className="ins-td">
                  <span className="ins-id">{row.id}</span>
                </td>
                <td className="ins-td">
                  <div className="ins-object-name">{row.object}</div>
                  <div className="ins-object-zone">{row.zone}</div>
                </td>
                <td className="ins-td">
                  <OperatorCell {...row.operator} />
                </td>
                <td className="ins-td">
                  <span className={row.operator.initials ? "ins-count" : "ins-count-dim"}>
                    {row.rooms}
                  </span>
                </td>
                <td className="ins-td">
                  <span className={row.operator.initials ? "ins-count" : "ins-count-dim"}>
                    {row.items}
                  </span>
                </td>
                <td className="ins-td">
                  {row.pct > 0 ? (
                    <InspProgressBar pct={row.pct} tone={row.pctTone} />
                  ) : (
                    <div className="ins-pb-empty" />
                  )}
                </td>
                <td className="ins-td ins-td-center">
                  {row.discrepancies === null ? (
                    <span className="ins-cell-dim">—</span>
                  ) : row.discrepancies === 0 ? (
                    <span className="ins-disc-zero">{row.discrepancies}</span>
                  ) : (
                    <span className="ins-disc-error">{row.discrepancies}</span>
                  )}
                </td>
                <td className="ins-td">
                  <SyncCell {...row.sync} />
                </td>
                <td className="ins-td">
                  <StatusPill status={row.status} />
                </td>
                <td className="ins-td ins-td-right">
                  <button
                    className={
                      row.action.tone === "amber"
                        ? "ins-row-action ins-row-action-amber"
                        : "ins-row-action"
                    }
                    type="button"
                  >
                    {row.action.label}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Right Panel: Detail ─── */
function DetailPanel() {
  return (
    <div className="ins-card ins-detail-card">
      <div className="ins-detail-head">
        <h3 className="ins-detail-title">Детали инспекции</h3>
        <span className="ins-detail-badge">#INS-2024-001</span>
      </div>
      <div className="ins-detail-fields">
        <div className="ins-detail-field ins-detail-field-border">
          <p className="ins-field-label">Объект / Зона</p>
          <p className="ins-field-value">Корпус А, Приемное отделение</p>
        </div>
        <div className="ins-detail-field ins-detail-field-border">
          <p className="ins-field-label">Оператор</p>
          <div className="ins-operator-cell">
            <div className="ins-avatar ins-avatar-primary">ИИ</div>
            <span className="ins-field-value">Иван Иванов</span>
          </div>
        </div>
        <div className="ins-detail-grid ins-detail-field-border">
          <div>
            <p className="ins-field-label">Помещения</p>
            <p className="ins-field-value">16 из 42</p>
          </div>
          <div>
            <p className="ins-field-label">Позиции</p>
            <p className="ins-field-value">48 из 128</p>
          </div>
        </div>
        <div className="ins-detail-grid ins-detail-field-border">
          <div>
            <p className="ins-field-label">Расхождения</p>
            <p className="ins-field-value ins-field-value-rose">8</p>
          </div>
          <div>
            <p className="ins-field-label">Очередь</p>
            <p className="ins-field-value ins-field-value-amber">12 изм.</p>
          </div>
        </div>
        <div>
          <p className="ins-field-label">Последняя синхронизация</p>
          <p className="ins-field-value">сегодня, 09:42</p>
        </div>
      </div>
      <div className="ins-detail-actions">
        <button className="ins-detail-btn ins-detail-btn-primary" type="button">
          Открыть инспекцию
        </button>
        <button className="ins-detail-btn ins-detail-btn-secondary" type="button">
          Назначить другого оператора
        </button>
        <button className="ins-detail-btn ins-detail-btn-rose" type="button">
          Открыть расхождения
        </button>
        <button className="ins-detail-btn ins-detail-btn-blue" type="button">
          Открыть синхронизацию
        </button>
      </div>
    </div>
  );
}

/* ─── Right Panel: Attention Widget ─── */
function AttentionWidget() {
  return (
    <div className="ins-alert-card">
      <div className="ins-alert-head">
        <h4 className="ins-alert-title">
          <WarningOutlined className="ins-alert-icon" />
          Внимание
        </h4>
        <span className="ins-alert-count">12</span>
      </div>
      <div className="ins-alert-rows">
        <div className="ins-alert-row">
          <span>Расхождений:</span>
          <span className="ins-alert-val-rose">8</span>
        </div>
        <div className="ins-alert-row">
          <span>Без оператора:</span>
          <span className="ins-alert-val-amber">3</span>
        </div>
        <div className="ins-alert-row">
          <span>Ошибок синхр.:</span>
          <span className="ins-alert-val-rose">1</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Right Panel: Activity ─── */
const ACTIVITY = [
  { icon: "sync", cls: "ins-act-dot ins-act-dot-green", label: "Синхронизация завершена", meta: "09:42 • И. Иванов", last: false },
  { icon: "report", cls: "ins-act-dot ins-act-dot-rose", label: "Новое расхождение", meta: "09:31 • #EQ-42", last: false },
  { icon: "add", cls: "ins-act-dot ins-act-dot-blue", label: "Создана инспекция", meta: "08:40 • Диспетчер", last: true },
];

function ActivityIcon({ type }) {
  if (type === "sync") return <SyncOutlined style={{ fontSize: 12 }} />;
  if (type === "report") return <WarningOutlined style={{ fontSize: 12 }} />;
  return <PlusCircleOutlined style={{ fontSize: 12 }} />;
}

function ActivityPanel() {
  return (
    <div className="ins-card ins-activity-card">
      <h4 className="ins-activity-title">Последние действия</h4>
      <div className="ins-activity-list">
        {ACTIVITY.map((item, i) => (
          <div key={i} className={item.last ? "ins-act-item" : "ins-act-item ins-act-item-line"}>
            <div className={item.cls}>
              <ActivityIcon type={item.icon} />
            </div>
            <div className="ins-act-body">
              <p className="ins-act-label">{item.label}</p>
              <p className="ins-act-meta">{item.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Screen ─── */
export function DesktopInspectionsScreen() {
  return (
    <div className="ins-screen">
      {/* Action Bar */}
      <div className="ins-action-bar">
        <div className="ins-action-group">
          <button className="ins-btn-primary" type="button">
            <PlusCircleOutlined /> Создать инспекцию
          </button>
          <button className="ins-btn-secondary" type="button">
            <UserAddOutlined /> Назначить оператора
          </button>
        </div>
        <div className="ins-action-group">
          <button className="ins-btn-secondary" type="button">
            <DownloadOutlined /> Экспорт
          </button>
          <button className="ins-btn-secondary" type="button">
            <HistoryOutlined /> История инспекций
          </button>
        </div>
      </div>

      {/* KPI Row — 6 cards */}
      <div className="ins-kpi-grid">
        <div className="ins-kpi-card">
          <p className="ins-kpi-label">Всего</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">18</span>
            <span className="ins-kpi-sub">за месяц</span>
          </div>
        </div>
        <div className="ins-kpi-card ins-kpi-card-blue">
          <p className="ins-kpi-label ins-kpi-label-blue">Активные</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">4</span>
            <span className="ins-kpi-badge-blue">+12%</span>
          </div>
        </div>
        <div className="ins-kpi-card ins-kpi-card-amber">
          <p className="ins-kpi-label ins-kpi-label-amber">Ожидают</p>
          <span className="ins-kpi-value">3</span>
        </div>
        <div className="ins-kpi-card ins-kpi-card-green">
          <p className="ins-kpi-label ins-kpi-label-green">Завершено</p>
          <span className="ins-kpi-value">9</span>
        </div>
        <div className="ins-kpi-card ins-kpi-card-rose">
          <p className="ins-kpi-label ins-kpi-label-rose">С расхожд.</p>
          <span className="ins-kpi-value">6</span>
        </div>
        <div className="ins-kpi-card">
          <p className="ins-kpi-label">Синхронизация</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">12</span>
            <span className="ins-kpi-sub">в оч.</span>
          </div>
        </div>
      </div>

      {/* Content: main + right sidebar */}
      <div className="ins-content-grid">
        {/* Left column */}
        <div className="ins-main-col">
          {/* Filters */}
          <div className="ins-filters-card">
            <div className="ins-filters-selects">
              <div className="ins-filter-field">
                <span className="ins-filter-label">Объект</span>
                <select className="ins-select">
                  <option>Все объекты</option>
                  <option>Корпус А</option>
                  <option>Корпус Б</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Этаж</span>
                <select className="ins-select">
                  <option>Все этажи</option>
                  <option>1 этаж</option>
                  <option>2 этаж</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Оператор</span>
                <select className="ins-select">
                  <option>Все операторы</option>
                  <option>Иван Иванов</option>
                  <option>Анна Смирнова</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Период</span>
                <select className="ins-select">
                  <option>Сегодня</option>
                  <option>Вчера</option>
                  <option>Неделя</option>
                </select>
              </div>
            </div>
            <div className="ins-filter-chips-row">
              <div className="ins-filter-chips">
                <button className="ins-chip ins-chip-active" type="button">Все</button>
                <button className="ins-chip" type="button">Активные</button>
                <button className="ins-chip" type="button">Ожидают назначения</button>
                <button className="ins-chip" type="button">В работе</button>
                <button className="ins-chip" type="button">С расхождениями</button>
                <button className="ins-chip" type="button">Завершено</button>
                <button className="ins-chip" type="button">Без оператора</button>
              </div>
              <button className="ins-reset-btn" type="button">
                <ReloadOutlined style={{ fontSize: 11 }} /> Сбросить
              </button>
            </div>
          </div>

          {/* Table */}
          <InspectionsTable />
        </div>

        {/* Right sidebar */}
        <aside className="ins-right-col">
          <DetailPanel />
          <div className="ins-widgets">
            <AttentionWidget />
            <ActivityPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
