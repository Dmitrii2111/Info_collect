import { Fragment } from "react";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  CloseOutlined,
  SafetyOutlined,
  SettingOutlined,
  KeyOutlined,
  HistoryOutlined,
  ExportOutlined,
  TeamOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  TableOutlined,
  LockOutlined,
  UserOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import "../styles/rolesScreen.css";
import {
  ROLES_KPI,
  ROLE_CARDS,
  MATRIX_LEGEND,
  MATRIX_SECTIONS,
  DETAIL_ROLE,
  DETAIL_CAPABILITIES,
  DETAIL_RESTRICTIONS,
  PENDING_CHANGES,
  HISTORY_ITEMS,
} from "../data/rolesScreenData.js";

/* ── Icon mapping for role cards ── */

const ROLE_ICON_MAP = {
  shield:  SafetyOutlined,
  manage:  SettingOutlined,
  tool:    ToolOutlined,
};

function RoleIcon({ name, className }) {
  const Icon = ROLE_ICON_MAP[name] || KeyOutlined;
  return <Icon className={className} aria-hidden="true" />;
}

/* ── KPI card ── */

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className={`ro-kpi-card${accent ? " accent" : ""}`}>
      <span className="ro-kpi-label">{label}</span>
      <div className="ro-kpi-bottom">
        <span className="ro-kpi-value">{value}</span>
        <span className="ro-kpi-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ── Role quick-select card ── */

function RoleCard({ card }) {
  return (
    <div className={`ro-role-card${card.selected ? " selected" : ""}`}>
      {card.selected && <span className="ro-role-selected-badge">Выбрано</span>}
      <div className="ro-role-card-top">
        <div className="ro-role-icon">
          <RoleIcon name={card.icon} />
        </div>
        <span className="ro-role-count">{card.count}</span>
      </div>
      <p className="ro-role-name">{card.label}</p>
      <p className="ro-role-desc">{card.desc}</p>
      <div className="ro-role-tags">
        {card.tags.map((tag) => (
          <span key={tag} className="ro-role-tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Permission pill ── */

function PermPill({ text, tone }) {
  return (
    <span className={`ro-perm-pill ${tone}`}>{text}</span>
  );
}

/* ── Matrix table ── */

function MatrixTable() {
  return (
    <div className="ro-matrix-card">
      <div className="ro-matrix-header">
        <div className="ro-matrix-title">
          <TableOutlined className="ro-matrix-title-icon" aria-hidden="true" />
          Матрица прав доступа
        </div>
        <div className="ro-matrix-legend">
          {MATRIX_LEGEND.map((item) => (
            <div key={item.label} className="ro-matrix-legend-item">
              <span
                className="ro-matrix-legend-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
      <table className="ro-matrix-table">
        <thead>
          <tr>
            <th style={{ width: "34%" }}>Раздел / действие</th>
            <th className="center">Администратор</th>
            <th className="center">Диспетчер</th>
            <th className="center">Оператор</th>
          </tr>
        </thead>
        <tbody>
          {MATRIX_SECTIONS.map((section) => (
            <Fragment key={section.section}>
              <tr key={section.section} className="ro-matrix-section-row">
                <td colSpan={4}>{section.section}</td>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="center">
                    <PermPill text={row.admin.text} tone={row.admin.tone} />
                  </td>
                  <td className="center">
                    <PermPill text={row.dispatcher.text} tone={row.dispatcher.tone} />
                  </td>
                  <td className="center">
                    <PermPill text={row.operator.text} tone={row.operator.tone} />
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      <div className="ro-safety-note">
        <LockOutlined style={{ fontSize: 13 }} aria-hidden="true" />
        Защита системы: Невозможно отозвать права доступа у последнего активного администратора.
      </div>
    </div>
  );
}

/* ── Detail panel ── */

function DetailPanel() {
  return (
    <div className="ro-detail-panel">
      <div className="ro-detail-panel-header">
        <h4 className="ro-detail-panel-title">Детали роли</h4>
        <InfoCircleOutlined className="ro-detail-panel-icon" aria-hidden="true" />
      </div>

      <div className="ro-detail-role-row">
        <div className="ro-detail-role-icon">
          <RoleIcon name={DETAIL_ROLE.icon} />
        </div>
        <div>
          <p className="ro-detail-role-name">{DETAIL_ROLE.label}</p>
          <p className="ro-detail-role-meta">
            Уровень: {DETAIL_ROLE.level} | Сотрудников: {DETAIL_ROLE.count}
          </p>
        </div>
      </div>

      <p className="ro-detail-section-title">Возможности</p>
      <ul className="ro-cap-list">
        {DETAIL_CAPABILITIES.map((cap) => (
          <li key={cap} className="ro-cap-item">
            <CheckCircleOutlined className="ro-cap-icon" aria-hidden="true" />
            {cap}
          </li>
        ))}
      </ul>

      <p className="ro-detail-section-title">Ограничения</p>
      <ul className="ro-restrict-list">
        {DETAIL_RESTRICTIONS.map((r) => (
          <li key={r} className="ro-restrict-item">
            <StopOutlined className="ro-restrict-icon" aria-hidden="true" />
            {r}
          </li>
        ))}
      </ul>

      <div className="ro-detail-actions">
        <button className="ro-detail-btn" type="button">
          <EditOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Редактировать роль
        </button>
        <button className="ro-detail-btn" type="button">
          <TeamOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Показать сотрудников
        </button>
        <button className="ro-detail-btn" type="button">
          <CopyOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Дублировать роль
        </button>
      </div>
    </div>
  );
}

/* ── Pending changes panel ── */

function PendingPanel() {
  return (
    <div className="ro-pending-panel">
      <div className="ro-pending-header">
        <h4 className="ro-pending-title">
          <HistoryOutlined style={{ fontSize: 15 }} aria-hidden="true" />
          Изменения прав ({PENDING_CHANGES.length})
        </h4>
        <span className="ro-pending-badge">Не сохранено</span>
      </div>
      <div className="ro-pending-list">
        {PENDING_CHANGES.map((item, i) => (
          <div key={i} className="ro-pending-item">
            <p className="ro-pending-role">{item.role}</p>
            <p className="ro-pending-desc">
              {item.desc}{" "}
              <span className={`ro-pending-hl-${item.highlightTone}`}>
                {item.highlight}
              </span>
            </p>
            <button className="ro-pending-remove" type="button" aria-label="Отменить изменение">
              <CloseOutlined />
            </button>
          </div>
        ))}
      </div>
      <p className="ro-pending-footer">Есть несохранённые изменения</p>
    </div>
  );
}

/* ── History mini ── */

function HistoryPanel() {
  return (
    <div className="ro-history-panel">
      <h4 className="ro-history-title">Последние действия</h4>
      <div className="ro-history-timeline">
        {HISTORY_ITEMS.map((item, i) => (
          <div key={i} className="ro-history-item">
            <span className={`ro-history-dot ${item.active ? "active" : "inactive"}`} />
            <p className="ro-history-user">{item.user}</p>
            <p className="ro-history-action">{item.action}</p>
            <p className="ro-history-time">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main screen ── */

export function DesktopRolesScreen() {
  return (
    <div className="desktop-screen ro-screen">

      {/* Page header */}
      <div className="ro-page-header">
        <div>
          <h1 className="ro-page-title">Управление доступом</h1>
          <p className="ro-page-sub">Настройка доступа сотрудников к разделам и действиям системы</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="ro-action-bar">
        <div className="ro-action-bar-left">
          <div className="ro-search-wrap">
            <SearchOutlined className="ro-search-icon" aria-hidden="true" />
            <input
              className="ro-search-input"
              placeholder="Поиск по правам или ролям..."
              type="text"
            />
          </div>
        </div>
        <div className="ro-action-bar-right">
          <button className="ro-btn-secondary" type="button">
            <HistoryOutlined aria-hidden="true" />
            История изменений
          </button>
          <button className="ro-btn-secondary" type="button">
            <ExportOutlined aria-hidden="true" />
            Экспорт прав
          </button>
          <button className="ro-btn-outline-blue" type="button">
            <PlusOutlined aria-hidden="true" />
            Добавить роль
          </button>
          <button className="ro-btn-save" type="button">
            Сохранить изменения
          </button>
        </div>
      </div>

      {/* Sync alert */}
      <div className="ro-sync-alert">
        <InfoCircleOutlined className="ro-sync-alert-icon" aria-hidden="true" />
        <div className="ro-sync-alert-text">
          <strong>Изменения прав вступят в силу после следующей синхронизации мобильных устройств.</strong>
          <p className="ro-sync-alert-sub">Desktop-доступ обновится сразу после сохранения.</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="ro-kpi-grid">
        {ROLES_KPI.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main bento layout */}
      <div className="ro-body">
        {/* Left column */}
        <div className="ro-main-col">
          {/* Role cards */}
          <div className="ro-cards-grid">
            {ROLE_CARDS.map((card) => (
              <RoleCard key={card.key} card={card} />
            ))}
          </div>

          {/* Matrix */}
          <MatrixTable />
        </div>

        {/* Right column */}
        <div className="ro-side-col">
          <DetailPanel />
          <PendingPanel />
          <HistoryPanel />
        </div>
      </div>

    </div>
  );
}
