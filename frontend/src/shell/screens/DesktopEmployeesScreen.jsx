import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  SyncOutlined,
  DesktopOutlined,
  CheckSquareOutlined,
  EditOutlined,
  LockOutlined,
  UserDeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  StopOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import "../styles/employeesScreen.css";
import {
  KPI_CARDS,
  TABS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  ACCESS_OPTIONS,
  TABLE_COLS,
  EMPLOYEES,
  DETAIL_EMPLOYEE,
  DETAIL_INFO,
  DETAIL_PERMISSIONS,
} from "../data/employeesScreenData.js";

/* ─── Icon map for KPI cards (Material icon name → Ant icon component) ─── */

const KPI_ICON_MAP = {
  group:                  TeamOutlined,
  check_circle:           CheckCircleOutlined,
  engineering:            ToolOutlined,
  person_off:             UserOutlined,
  block:                  StopOutlined,
  admin_panel_settings:   SafetyCertificateOutlined,
};

/* ─── Icon map for detail info rows ─── */

const INFO_ICON_MAP = {
  mail:                 MailOutlined,
  call:                 PhoneOutlined,
  shield:               SafetyOutlined,
  info:                 InfoCircleOutlined,
  schedule:             CalendarOutlined,
  sync:                 SyncOutlined,
  desktop_windows:      DesktopOutlined,
  assignment_turned_in: CheckSquareOutlined,
};

function KpiIcon({ name, className }) {
  const Icon = KPI_ICON_MAP[name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

function InfoIcon({ name, className }) {
  const Icon = INFO_ICON_MAP[name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

/* ─── KPI card ─── */

function KpiCard({ label, value, icon, tone }) {
  return (
    <div className={`em-kpi-card em-kpi-${tone}`}>
      <span className="em-kpi-label">{label}</span>
      <div className="em-kpi-bottom">
        <span className="em-kpi-value">{value}</span>
        <KpiIcon name={icon} className="em-kpi-icon" />
      </div>
    </div>
  );
}

/* ─── Employee row ─── */

function EmployeeRow({ emp }) {
  return (
    <tr className={emp.isSelected ? "is-selected" : ""}>
      <td>
        <div className="em-employee-cell">
          <div className={`em-avatar em-avatar-${emp.avatarTone}`}>{emp.initials}</div>
          <div>
            <div className="em-employee-name">{emp.name}</div>
            <div className="em-employee-email">{emp.email}</div>
          </div>
        </div>
      </td>
      <td>{emp.login}</td>
      <td>
        <span className={`em-role-pill em-role-${emp.roleTone}`}>{emp.role}</span>
      </td>
      <td>{emp.access}</td>
      <td>
        <div className={`em-status em-status-${emp.statusTone}`}>
          <span className="em-status-dot" />
          <span className="em-status-text">{emp.status}</span>
        </div>
      </td>
      <td>{emp.inspections}</td>
      <td>{emp.activity}</td>
      <td style={{ textAlign: "right" }}>
        <button className="em-row-btn" type="button">Открыть</button>
      </td>
    </tr>
  );
}

/* ─── Detail panel ─── */

function DetailPanel({ emp, info, permissions }) {
  return (
    <aside className="em-detail-panel">
      {/* Top: avatar + name + role */}
      <div className="em-detail-top">
        <div className="em-detail-avatar-wrap">
          <div className={`em-detail-avatar em-avatar-${emp.avatarTone}`}>{emp.initials}</div>
          {emp.statusTone === "online" && <div className="em-detail-online-dot" />}
        </div>
        <h3 className="em-detail-name">{emp.name}</h3>
        <div className="em-detail-badges">
          <span className="em-detail-role-badge">{emp.role}</span>
          <span className="em-detail-access-label">{emp.access}</span>
        </div>
      </div>

      {/* Body */}
      <div className="em-detail-body">
        {/* Contact info */}
        <div>
          <p className="em-detail-section-title">Контактная информация</p>
          <div className="em-detail-info-list">
            {info.map((row) => (
              <div className="em-detail-info-row" key={row.icon + row.label}>
                <InfoIcon name={row.icon} className="em-detail-info-icon" />
                <span className={`em-detail-info-text${row.accent ? " is-accent" : ""}`}>
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div>
          <p className="em-detail-section-title">Доступные разрешения</p>
          <div className="em-perm-list">
            {permissions.map((perm) => (
              <div className="em-perm-row" key={perm}>
                <CheckSquareOutlined className="em-perm-icon" aria-hidden="true" />
                <span className="em-perm-label">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="em-detail-footer">
        <button className="em-detail-btn em-detail-btn-default" type="button">
          <EditOutlined style={{ fontSize: 15 }} />
          Редактировать
        </button>
        <button className="em-detail-btn em-detail-btn-default" type="button">
          <LockOutlined style={{ fontSize: 15 }} />
          Сбросить пароль
        </button>
        <button className="em-detail-btn em-detail-btn-danger" type="button">
          <UserDeleteOutlined style={{ fontSize: 15 }} />
          Отключить доступ
        </button>
      </div>
    </aside>
  );
}

/* ─── Main screen ─── */

export function DesktopEmployeesScreen() {
  return (
    <div className="desktop-screen em-screen">

      {/* Page header */}
      <div className="em-page-header">
        <div>
          <h1 className="em-page-title">Сотрудники</h1>
          <p className="em-page-sub">Управление пользователями, ролями и доступом</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="em-action-bar">
        <div className="em-action-bar-left">
          <button className="em-btn-primary" type="button">
            <PlusOutlined />
            Добавить сотрудника
          </button>
          <button className="em-btn-secondary" type="button">
            <UploadOutlined />
            Импорт сотрудников
          </button>
          <button className="em-btn-secondary" type="button">
            <DownloadOutlined />
            Экспорт списка
          </button>
        </div>
        <div className="em-search-wrap">
          <SearchOutlined className="em-search-icon" />
          <input
            className="em-search-input"
            placeholder="Поиск по имени, логину, email или телефону"
            type="text"
          />
        </div>
      </div>

      {/* KPI grid */}
      <div className="em-kpi-grid">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Tabs + filters */}
      <div>
        <div className="em-tabs-row">
          {TABS.map((tab, i) => (
            <button key={tab} className={`em-tab${i === 0 ? " is-active" : ""}`} type="button">
              {tab}
            </button>
          ))}
        </div>
        <div className="em-filters-row" style={{ marginTop: 12 }}>
          <select className="em-filter-select">
            {ROLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="em-filter-select">
            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="em-filter-select">
            {ACCESS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <button className="em-reset-btn" type="button">
            <FilterOutlined style={{ fontSize: 15 }} />
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Table + detail panel */}
      <div className="em-body">
        {/* Table */}
        <div className="em-table-wrap">
          <table className="em-table">
            <thead>
              <tr>
                {TABLE_COLS.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((emp) => (
                <EmployeeRow key={emp.login} emp={emp} />
              ))}
            </tbody>
          </table>
          <div className="em-table-footer">
            Показано {EMPLOYEES.length} из {KPI_CARDS[0].value} сотрудников
          </div>
        </div>

        {/* Right detail panel */}
        <DetailPanel
          emp={DETAIL_EMPLOYEE}
          info={DETAIL_INFO}
          permissions={DETAIL_PERMISSIONS}
        />
      </div>

    </div>
  );
}
