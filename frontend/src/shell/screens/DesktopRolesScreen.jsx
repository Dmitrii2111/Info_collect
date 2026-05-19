import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  ToolOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import "../styles/rolesScreen.css";
import { DesktopModalShell } from "../components/DesktopModalShell";
import {
  ROLES_KPI,
  ROLE_CARDS,
  ROLE_LEVEL_OPTIONS,
  ROLE_STATUS_OPTIONS,
  ROLE_PERMISSION_GROUPS,
  MATRIX_LEGEND,
  MATRIX_SECTIONS,
  DETAIL_CAPABILITIES,
  DETAIL_RESTRICTIONS,
  PENDING_CHANGES,
  HISTORY_ITEMS,
  ROLE_HISTORY_ITEMS,
} from "../data/rolesScreenData.js";

const ALL_LEVEL = ROLE_LEVEL_OPTIONS[0];
const ALL_STATUS = ROLE_STATUS_OPTIONS[0];

const DEFAULT_FILTERS = {
  level: ALL_LEVEL,
  status: ALL_STATUS,
};

const EMPTY_ROLE_FORM = {
  label: "",
  desc: "",
  level: "Расширенный доступ",
  status: "Активна",
  usersText: "",
  permissions: {
    registry: true,
    inspections: true,
    warehouse: false,
    employees: false,
    settings: false,
    reports: true,
  },
};

const ROLE_ICON_MAP = {
  shield: SafetyOutlined,
  manage: SettingOutlined,
  tool: ToolOutlined,
};

function RoleIcon({ name, className }) {
  const Icon = ROLE_ICON_MAP[name] || KeyOutlined;
  return <Icon className={className} aria-hidden="true" />;
}

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

function RoleCard({ card, selected, onSelect, onEdit, onDuplicate }) {
  return (
    <button className={`ro-role-card${selected ? " selected" : ""}`} type="button" onClick={() => onSelect(card.key)}>
      {selected && <span className="ro-role-selected-badge">Выбрано</span>}
      <div className="ro-role-card-top">
        <div className="ro-role-icon">
          <RoleIcon name={card.icon} />
        </div>
        <span className="ro-role-count">{card.count}</span>
      </div>
      <p className="ro-role-name">{card.label}</p>
      <p className="ro-role-desc">{card.desc}</p>
      <div className="ro-role-tags">
        {[card.level, card.status, ...card.tags].map((tag) => (
          <span key={tag} className="ro-role-tag">{tag}</span>
        ))}
      </div>
      <div className="ro-card-actions">
        <span className="ro-card-action" onClick={(event) => { event.stopPropagation(); onEdit(card); }}>
          <EditOutlined aria-hidden="true" />
          Редактировать
        </span>
        <span className="ro-card-action" onClick={(event) => { event.stopPropagation(); onDuplicate(card); }}>
          <CopyOutlined aria-hidden="true" />
          Дублировать
        </span>
      </div>
    </button>
  );
}

function PermPill({ text, tone }) {
  return <span className={`ro-perm-pill ${tone}`}>{text}</span>;
}

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
              <span className="ro-matrix-legend-dot" style={{ background: item.color }} />
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
              <tr className="ro-matrix-section-row">
                <td colSpan={4}>{section.section}</td>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="center"><PermPill text={row.admin.text} tone={row.admin.tone} /></td>
                  <td className="center"><PermPill text={row.dispatcher.text} tone={row.dispatcher.tone} /></td>
                  <td className="center"><PermPill text={row.operator.text} tone={row.operator.tone} /></td>
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

function DetailPanel({ role, onEdit, onDuplicate, onHistory, onShowUsers }) {
  const capabilities = role
    ? ROLE_PERMISSION_GROUPS.filter((group) => role.permissions?.[group.key]).map((group) => group.label)
    : DETAIL_CAPABILITIES;
  const restrictions = role
    ? ROLE_PERMISSION_GROUPS.filter((group) => !role.permissions?.[group.key]).map((group) => group.label)
    : DETAIL_RESTRICTIONS;

  if (!role) {
    return (
      <div className="ro-detail-panel">
        <div className="ro-empty-detail">Выберите роль, чтобы увидеть права и действия.</div>
      </div>
    );
  }

  return (
    <div className="ro-detail-panel">
      <div className="ro-detail-panel-header">
        <h4 className="ro-detail-panel-title">Детали роли</h4>
        <InfoCircleOutlined className="ro-detail-panel-icon" aria-hidden="true" />
      </div>

      <div className="ro-detail-role-row">
        <div className="ro-detail-role-icon">
          <RoleIcon name={role.icon} />
        </div>
        <div>
          <p className="ro-detail-role-name">{role.label}</p>
          <p className="ro-detail-role-meta">
            Уровень: {role.level} | Сотрудников: {role.count}
          </p>
        </div>
      </div>

      <p className="ro-detail-section-title">Возможности</p>
      <ul className="ro-cap-list">
        {capabilities.map((cap) => (
          <li key={cap} className="ro-cap-item">
            <CheckCircleOutlined className="ro-cap-icon" aria-hidden="true" />
            {cap}
          </li>
        ))}
      </ul>

      <p className="ro-detail-section-title">Ограничения</p>
      <ul className="ro-restrict-list">
        {restrictions.map((r) => (
          <li key={r} className="ro-restrict-item">
            <StopOutlined className="ro-restrict-icon" aria-hidden="true" />
            {r}
          </li>
        ))}
      </ul>

      <div className="ro-detail-actions">
        <button className="ro-detail-btn" type="button" onClick={() => onEdit(role)}>
          <EditOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Редактировать роль
        </button>
        <button className="ro-detail-btn" type="button" onClick={() => onShowUsers(role)}>
          <TeamOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Показать сотрудников
        </button>
        <button className="ro-detail-btn" type="button" onClick={() => onDuplicate(role)}>
          <CopyOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          Дублировать роль
        </button>
        <button className="ro-detail-btn" type="button" onClick={() => onHistory(role)}>
          <HistoryOutlined style={{ fontSize: 14 }} aria-hidden="true" />
          История прав
        </button>
      </div>
    </div>
  );
}

function PendingPanel({ onSave }) {
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
              {item.desc} <span className={`ro-pending-hl-${item.highlightTone}`}>{item.highlight}</span>
            </p>
            <button className="ro-pending-remove" type="button" aria-label="Отменить изменение">
              <CloseOutlined />
            </button>
          </div>
        ))}
      </div>
      <button className="ro-pending-save" type="button" onClick={onSave}>Сохранить изменения</button>
    </div>
  );
}

function HistoryPanel({ onOpen }) {
  return (
    <div className="ro-history-panel">
      <div className="ro-history-head">
        <h4 className="ro-history-title">Последние действия</h4>
        <button className="ro-history-link" type="button" onClick={onOpen}>Все</button>
      </div>
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

function roleToForm(role) {
  if (!role) return EMPTY_ROLE_FORM;
  return {
    label: role.label,
    desc: role.desc,
    level: role.level,
    status: role.status,
    usersText: role.users?.join(", ") ?? "",
    permissions: { ...EMPTY_ROLE_FORM.permissions, ...role.permissions },
  };
}

function RoleFormModal({ mode, role, onClose, onSave }) {
  const [form, setForm] = useState(() => roleToForm(role));
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const updatePermission = (key, value) => {
    setForm((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }));
    setDirty(true);
  };

  const requestClose = () => {
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    onClose();
  };

  const title = mode === "add" ? "Добавить роль" : mode === "duplicate" ? "Дублировать роль" : "Редактировать роль";

  return (
    <DesktopModalShell
      title={title}
      subtitle={mode === "duplicate" ? "Форма предзаполнена выбранной ролью" : "Настройка роли и матрицы прав"}
      size="wide"
      onClose={requestClose}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={requestClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="submit" form="role-form">
            <CheckCircleOutlined aria-hidden="true" />
            Сохранить
          </button>
        </>
      )}
    >
      <form className="ro-form" id="role-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <div className="ro-form-grid">
          <label className="ro-field">
            <span>Название роли</span>
            <input value={form.label} onChange={(event) => updateField("label", event.target.value)} required />
          </label>
          <label className="ro-field">
            <span>Уровень доступа</span>
            <select value={form.level} onChange={(event) => updateField("level", event.target.value)}>
              {ROLE_LEVEL_OPTIONS.filter((item) => item !== ALL_LEVEL).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="ro-field">
            <span>Статус</span>
            <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
              {ROLE_STATUS_OPTIONS.filter((item) => item !== ALL_STATUS).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="ro-field">
          <span>Описание</span>
          <textarea value={form.desc} onChange={(event) => updateField("desc", event.target.value)} rows={3} required />
        </label>
        <label className="ro-field">
          <span>Пользователи роли</span>
          <input value={form.usersText} onChange={(event) => updateField("usersText", event.target.value)} placeholder="Имена через запятую" />
        </label>
        <div className="ro-permission-box">
          <p>Группы прав</p>
          <div className="ro-permission-grid">
            {ROLE_PERMISSION_GROUPS.map((group) => (
              <label key={group.key} className="ro-check-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.permissions[group.key])}
                  onChange={(event) => updatePermission(group.key, event.target.checked)}
                />
                <span>{group.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
      {confirmClose ? (
        <div className="ro-unsaved-card">
          <ExclamationCircleOutlined aria-hidden="true" />
          <div>
            <strong>Есть несохранённые изменения</strong>
            <span>Закрыть форму без сохранения?</span>
          </div>
          <button type="button" onClick={onClose}>Закрыть без сохранения</button>
          <button type="button" onClick={() => setConfirmClose(false)}>Продолжить редактирование</button>
        </div>
      ) : null}
    </DesktopModalShell>
  );
}

function RoleStatusModal({ operation, onClose, onComplete }) {
  const [phase, setPhase] = useState("loading");
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setPhase("success");
      onComplete?.();
    }, 3000);
    return () => window.clearTimeout(timerRef.current);
  }, [operation.id]);

  const copy = {
    add: ["Сохраняем роль", "Обновляем права доступа", "Роль создана"],
    edit: ["Сохраняем роль", "Обновляем права доступа", "Роль обновлена"],
    duplicate: ["Сохраняем роль", "Обновляем права доступа", "Копия роли создана"],
    export: ["Готовим экспорт", "Формируем список ролей и прав", "Экспорт готов"],
    saveChanges: ["Сохраняем роль", "Обновляем права доступа", "Изменения сохранены"],
  }[operation.kind];

  return (
    <DesktopModalShell
      title={phase === "success" ? copy[2] : copy[0]}
      subtitle={operation.role?.label ?? "Текущее состояние"}
      size="narrow"
      onClose={onClose}
      closeDisabled={phase === "loading"}
      footer={(
        <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={phase === "loading"}>
          Закрыть
        </button>
      )}
    >
      {phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>{copy[0]}</strong>
            <span>{copy[1]}</span>
          </div>
        </div>
      ) : (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>{copy[2]}</strong>
            <span>{operation.kind === "export" ? "Файл будет сформирован backend после подключения API" : "Изменения применены во frontend state."}</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

function RoleHistoryModal({ role, onClose }) {
  return (
    <DesktopModalShell title="История прав" subtitle={role?.label ?? "Все роли"} size="wide" onClose={onClose}>
      <div className="ro-history-modal-list">
        {ROLE_HISTORY_ITEMS.map((item) => (
          <div key={`${item.time}-${item.change}`} className="ro-history-modal-item">
            <div>
              <strong>{item.change}</strong>
              <span>{item.time} | {item.user}</span>
            </div>
            <p>{item.before} → {item.after}</p>
            <em>{item.comment}</em>
            <span className="ro-history-status">{item.status}</span>
          </div>
        ))}
      </div>
    </DesktopModalShell>
  );
}

function RoleUsersModal({ role, onClose }) {
  return (
    <DesktopModalShell title="Пользователи роли" subtitle={role.label} size="narrow" onClose={onClose}>
      <div className="ro-users-list">
        {(role.users ?? []).map((user) => (
          <div key={user} className="ro-user-row">
            <TeamOutlined aria-hidden="true" />
            <span>{user}</span>
          </div>
        ))}
      </div>
    </DesktopModalShell>
  );
}

function buildRoleFromForm(form, baseRole, mode) {
  const users = form.usersText.split(",").map((item) => item.trim()).filter(Boolean);
  const label = mode === "duplicate" && !form.label.startsWith("Копия:") ? `Копия: ${form.label}` : form.label;

  return {
    ...baseRole,
    key: mode === "edit" ? baseRole.key : `role-${Date.now()}`,
    icon: baseRole?.icon ?? "manage",
    label,
    desc: form.desc,
    level: form.level,
    status: form.status,
    users,
    count: `${users.length} чел.`,
    permissions: form.permissions,
    tags: [form.level, form.status],
    selected: false,
  };
}

function filterRoles(roles, filters, query) {
  const normalized = query.trim().toLowerCase();
  return roles.filter((role) => {
    if (filters.level !== ALL_LEVEL && role.level !== filters.level) return false;
    if (filters.status !== ALL_STATUS && role.status !== filters.status) return false;
    if (!normalized) return true;
    return [role.label, role.desc, role.level, role.status, ...(role.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
}

function buildOptions(roles, query, filters, key, allLabel) {
  const scopedFilters = key === "level" ? { ...filters, level: ALL_LEVEL, status: ALL_STATUS } : { ...filters, status: ALL_STATUS };
  const values = filterRoles(roles, scopedFilters, query).map((role) => role[key]);
  return [allLabel, ...Array.from(new Set(values))];
}

export function DesktopRolesScreen() {
  const [roles, setRoles] = useState(() => ROLE_CARDS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("dispatcher");
  const [formOperation, setFormOperation] = useState(null);
  const [statusOperation, setStatusOperation] = useState(null);
  const [historyRole, setHistoryRole] = useState(null);
  const [usersRole, setUsersRole] = useState(null);

  const options = useMemo(() => ({
    level: buildOptions(roles, query, filters, "level", ALL_LEVEL),
    status: buildOptions(roles, query, filters, "status", ALL_STATUS),
  }), [roles, query, filters]);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.status !== ALL_STATUS && !options.status.includes(prev.status)) {
        return { ...prev, status: ALL_STATUS };
      }
      return prev;
    });
  }, [options.status]);

  const visibleRoles = useMemo(() => filterRoles(roles, filters, query), [roles, filters, query]);

  useEffect(() => {
    if (!visibleRoles.some((role) => role.key === selectedKey)) {
      setSelectedKey(visibleRoles[0]?.key ?? null);
    }
  }, [selectedKey, visibleRoles]);

  const selectedRole = visibleRoles.find((role) => role.key === selectedKey) ?? null;

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const startFormSave = (form) => {
    const baseRole = formOperation.role;
    const payload = buildRoleFromForm(form, baseRole, formOperation.mode);
    const kind = formOperation.mode;

    setFormOperation(null);
    setStatusOperation({
      id: `${kind}-${payload.key}`,
      kind,
      role: payload,
      apply: () => {
        setRoles((prev) => {
          if (kind === "edit") {
            return prev.map((item) => item.key === baseRole.key ? payload : item);
          }
          return [payload, ...prev];
        });
        setSelectedKey(payload.key);
      },
    });
  };

  const closeStatus = () => setStatusOperation(null);
  const completeStatus = () => statusOperation?.apply?.();

  return (
    <div className="desktop-screen ro-screen">
      <div className="ro-page-header">
        <div>
          <h1 className="ro-page-title">Управление доступом</h1>
          <p className="ro-page-sub">Настройка доступа сотрудников к разделам и действиям системы</p>
        </div>
      </div>

      <div className="ro-action-bar">
        <div className="ro-action-bar-left">
          <button className="ro-btn-outline-blue" type="button" onClick={() => setFormOperation({ mode: "add", role: null })}>
            <PlusOutlined aria-hidden="true" />
            Добавить роль
          </button>
          <select className="ro-filter-select" value={filters.level} onChange={(event) => updateFilter("level", event.target.value)}>
            {options.level.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="ro-filter-select" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {options.status.map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="ro-search-wrap">
            <SearchOutlined className="ro-search-icon" aria-hidden="true" />
            <input
              className="ro-search-input"
              placeholder="Поиск по правам или ролям..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="ro-action-bar-right">
          <button className="ro-btn-secondary" type="button" onClick={() => setHistoryRole(selectedRole)}>
            <HistoryOutlined aria-hidden="true" />
            История изменений
          </button>
          <button className="ro-btn-secondary" type="button" onClick={() => setStatusOperation({ id: `export-${Date.now()}`, kind: "export", role: selectedRole })}>
            <ExportOutlined aria-hidden="true" />
            Экспорт прав
          </button>
          <button className="ro-btn-save" type="button" onClick={() => setStatusOperation({ id: `save-${Date.now()}`, kind: "saveChanges", role: selectedRole })}>
            Сохранить изменения
          </button>
        </div>
      </div>

      <div className="ro-sync-alert">
        <InfoCircleOutlined className="ro-sync-alert-icon" aria-hidden="true" />
        <div className="ro-sync-alert-text">
          <strong>Изменения прав вступят в силу после следующей синхронизации мобильных устройств.</strong>
          <p className="ro-sync-alert-sub">Desktop-доступ обновится сразу после сохранения.</p>
        </div>
      </div>

      <div className="ro-kpi-grid">
        {ROLES_KPI.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="ro-body">
        <div className="ro-main-col">
          <div className="ro-cards-grid">
            {visibleRoles.map((card) => (
              <RoleCard
                key={card.key}
                card={card}
                selected={card.key === selectedKey}
                onSelect={setSelectedKey}
                onEdit={(role) => setFormOperation({ mode: "edit", role })}
                onDuplicate={(role) => setFormOperation({ mode: "duplicate", role: { ...role, label: `Копия: ${role.label}` } })}
              />
            ))}
          </div>
          {visibleRoles.length === 0 ? <div className="ro-empty-list">Нет ролей по выбранным фильтрам</div> : null}
          <MatrixTable />
        </div>

        <div className="ro-side-col">
          <DetailPanel
            role={selectedRole}
            onEdit={(role) => setFormOperation({ mode: "edit", role })}
            onDuplicate={(role) => setFormOperation({ mode: "duplicate", role: { ...role, label: `Копия: ${role.label}` } })}
            onHistory={setHistoryRole}
            onShowUsers={setUsersRole}
          />
          <PendingPanel onSave={() => setStatusOperation({ id: `save-${Date.now()}`, kind: "saveChanges", role: selectedRole })} />
          <HistoryPanel onOpen={() => setHistoryRole(selectedRole)} />
        </div>
      </div>

      {formOperation ? (
        <RoleFormModal
          mode={formOperation.mode}
          role={formOperation.role}
          onClose={() => setFormOperation(null)}
          onSave={startFormSave}
        />
      ) : null}

      {statusOperation ? (
        <RoleStatusModal operation={statusOperation} onClose={closeStatus} onComplete={completeStatus} />
      ) : null}

      {historyRole !== null ? (
        <RoleHistoryModal role={historyRole} onClose={() => setHistoryRole(null)} />
      ) : null}

      {usersRole ? (
        <RoleUsersModal role={usersRole} onClose={() => setUsersRole(null)} />
      ) : null}
    </div>
  );
}
