import { useEffect, useMemo, useRef, useState } from "react";
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
  CloseCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import "../styles/employeesScreen.css";
import { DesktopModalShell } from "../components/DesktopModalShell";
import {
  KPI_CARDS,
  TABS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  ACCESS_OPTIONS,
  TABLE_COLS,
  EMPLOYEES,
  DETAIL_INFO,
  DETAIL_PERMISSIONS,
} from "../data/employeesScreenData.js";

const ALL_ROLE = "Все роли";
const ALL_STATUS = "Все статусы";
const ALL_ACCESS = "Уровень доступа";

const DEFAULT_FILTERS = {
  role: ALL_ROLE,
  status: ALL_STATUS,
  access: ALL_ACCESS,
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  login: "",
  role: "Оператор",
  access: "Мобильный доступ",
  status: "Активен",
};

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "С";
}

function getRoleTone(role) {
  return role === "Администратор" ? "blue" : "slate";
}

function getStatusTone(status) {
  if (status === "Отключён") return "disabled";
  if (status === "Офлайн") return "offline";
  return "online";
}

function buildEmployeeInfo(emp) {
  return [
    { icon: "mail", label: emp.email },
    { icon: "call", label: emp.phone },
    { icon: "shield", label: `Уровень доступа: ${emp.access}`, accent: true },
    { icon: "info", label: `Статус: ${emp.status}` },
    { icon: "schedule", label: `Активность: ${emp.activity}` },
    { icon: "sync", label: emp.status === "Отключён" ? "Синхронизация: доступ отключён" : "Синхронизация: 09:35" },
    { icon: "desktop_windows", label: "Устройство: Chrome Desktop" },
    { icon: "assignment_turned_in", label: `Инспекции: ${emp.inspections}` },
  ];
}

function filterEmployees(employees, filters, query) {
  const normalized = query.trim().toLowerCase();

  return employees.filter((emp) => {
    const matchesQuery = !normalized || [
      emp.name,
      emp.login,
      emp.email,
      emp.phone,
    ].some((value) => value.toLowerCase().includes(normalized));
    const matchesRole = filters.role === ALL_ROLE || emp.role === filters.role;
    const matchesStatus = filters.status === ALL_STATUS || emp.status === filters.status;
    const matchesAccess = filters.access === ALL_ACCESS || emp.access === filters.access;
    return matchesQuery && matchesRole && matchesStatus && matchesAccess;
  });
}

function buildCascadeOptions(employees, filters, query, key, allLabel) {
  const chain = ["role", "status", "access"];
  const currentIndex = chain.indexOf(key);
  const scopedFilters = chain.reduce((acc, filterKey, index) => {
    acc[filterKey] = index < currentIndex ? filters[filterKey] : {
      role: ALL_ROLE,
      status: ALL_STATUS,
      access: ALL_ACCESS,
    }[filterKey];
    return acc;
  }, {});
  const values = Array.from(new Set(filterEmployees(employees, scopedFilters, query).map((emp) => emp[key])));
  return [allLabel, ...values];
}

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

function EmployeeRow({ emp, onOpen }) {
  return (
    <tr className={emp.isSelected ? "is-selected" : ""} onClick={() => onOpen(emp.id)}>
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
    </tr>
  );
}

/* ─── Detail panel ─── */

function DetailPanel({ emp, info, permissions, onEdit, onResetPassword, onDisableAccess }) {
  if (!emp) {
    return (
      <aside className="em-detail-panel">
        <div className="em-detail-empty">
          <InfoCircleOutlined aria-hidden="true" />
          <strong>Сотрудник не выбран</strong>
          <span>Измените фильтры или добавьте нового сотрудника.</span>
        </div>
      </aside>
    );
  }

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
        <button className="em-detail-btn em-detail-btn-default" type="button" onClick={() => onEdit(emp)}>
          <EditOutlined style={{ fontSize: 15 }} />
          Редактировать
        </button>
        <button className="em-detail-btn em-detail-btn-default" type="button" onClick={() => onResetPassword(emp)}>
          <LockOutlined style={{ fontSize: 15 }} />
          Сбросить пароль
        </button>
        <button className="em-detail-btn em-detail-btn-danger" type="button" onClick={() => onDisableAccess(emp)}>
          <UserDeleteOutlined style={{ fontSize: 15 }} />
          Отключить доступ
        </button>
      </div>
    </aside>
  );
}

function EmployeeFormModal({ employee, onClose, onSave }) {
  const initialForm = employee ? {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    login: employee.login,
    role: employee.role,
    access: employee.access,
    status: employee.status === "Отключён" ? "Активен" : employee.status,
  } : EMPTY_FORM;
  const [form, setForm] = useState(initialForm);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const requestClose = () => {
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <DesktopModalShell
      title={employee ? "Редактировать сотрудника" : "Добавить сотрудника"}
      subtitle={employee ? employee.name : "Новая учетная запись сотрудника"}
      size="narrow"
      onClose={requestClose}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={requestClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="submit" form="employee-form">
            <CheckCircleOutlined aria-hidden="true" />
            Сохранить
          </button>
        </>
      )}
    >
      <form className="em-form" id="employee-form" onSubmit={handleSubmit}>
        <label className="em-field">
          <span>ФИО</span>
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </label>
        <label className="em-field">
          <span>Email</span>
          <input value={form.email} onChange={(event) => updateField("email", event.target.value)} required type="email" />
        </label>
        <label className="em-field">
          <span>Телефон</span>
          <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required />
        </label>
        <label className="em-field">
          <span>Логин</span>
          <input value={form.login} onChange={(event) => updateField("login", event.target.value)} required />
        </label>
        <div className="em-form-grid">
          <label className="em-field">
            <span>Роль</span>
            <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
              {ROLE_OPTIONS.filter((item) => item !== ALL_ROLE).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="em-field">
            <span>Доступ</span>
            <select value={form.access} onChange={(event) => updateField("access", event.target.value)}>
              {ACCESS_OPTIONS.filter((item) => item !== ALL_ACCESS).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="em-field">
          <span>Статус</span>
          <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            {STATUS_OPTIONS.filter((item) => item !== ALL_STATUS).map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </form>

      {confirmClose ? (
        <div className="em-unsaved-card">
          <ExclamationCircleOutlined aria-hidden="true" />
          <div>
            <strong>Есть несохранённые изменения</strong>
            <span>Закрыть форму без сохранения?</span>
          </div>
          <button type="button" onClick={onClose}>Закрыть</button>
          <button type="button" onClick={() => setConfirmClose(false)}>Вернуться</button>
        </div>
      ) : null}
    </DesktopModalShell>
  );
}

function EmployeeConfirmModal({ operation, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const isDisable = operation.kind === "disable";

  return (
    <DesktopModalShell
      title={isDisable ? "Отключить доступ" : "Сбросить пароль"}
      subtitle={operation.employee.name}
      size="narrow"
      onClose={onClose}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className={isDisable ? "reg-modal-btn em-modal-danger-btn" : "reg-modal-btn reg-modal-btn-primary"} type="button" onClick={() => onConfirm(reason)}>
            {isDisable ? <UserDeleteOutlined aria-hidden="true" /> : <LockOutlined aria-hidden="true" />}
            {isDisable ? "Отключить доступ" : "Сбросить пароль"}
          </button>
        </>
      )}
    >
      <div className="em-warning-card">
        <ExclamationCircleOutlined aria-hidden="true" />
        <div>
          <strong>{isDisable ? "Сотрудник потеряет доступ к системе" : "Будет создан временный пароль"}</strong>
          <span>{isDisable ? "Данные сотрудника будут сохранены в текущем состоянии." : "Проверьте параметры действия перед подтверждением."}</span>
        </div>
      </div>
      {isDisable ? (
        <label className="em-field">
          <span>Причина отключения</span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Например: сотрудник больше не работает в смене" rows={3} />
        </label>
      ) : null}
    </DesktopModalShell>
  );
}

function EmployeeStatusModal({ operation, onClose, onComplete }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setPhase(operation.forceError ? "error" : "success");
      if (!operation.forceError) {
        onComplete?.();
      }
    }, 3000);
    return () => window.clearTimeout(timerRef.current);
  }, [operation.forceError, operation.id]);

  const copy = {
    add: ["Добавляем сотрудника", "Сотрудник добавлен"],
    edit: ["Сохраняем сотрудника", "Сотрудник обновлён"],
    disable: ["Отключаем доступ", "Доступ отключён"],
    reset: ["Сбрасываем пароль", "Пароль сброшен"],
    import: ["Импортируем сотрудников", "Импорт завершён"],
    export: ["Экспортируем список", "Список экспортирован"],
  }[operation.kind];

  return (
    <DesktopModalShell
      title={phase === "success" ? copy[1] : phase === "error" ? "Ошибка операции" : copy[0]}
      subtitle={operation.employee?.name ?? "Текущее состояние"}
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
            <span>Действие выполняется в текущем рабочем состоянии.</span>
          </div>
        </div>
      ) : phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>{copy[1]}</strong>
            <span>Изменения применены во frontend state.</span>
          </div>
        </div>
      ) : (
        <div className="em-error-card">
          <CloseCircleOutlined aria-hidden="true" />
          <div>
            <strong>Не удалось выполнить действие</strong>
            <span>Mock error state для сценария design.</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ─── Main screen ─── */

export function DesktopEmployeesScreen() {
  const [employees, setEmployees] = useState(() => EMPLOYEES);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(EMPLOYEES[0]?.id ?? null);
  const [formEmployee, setFormEmployee] = useState(null);
  const [confirmOperation, setConfirmOperation] = useState(null);
  const [statusOperation, setStatusOperation] = useState(null);

  const options = useMemo(() => ({
    role: buildCascadeOptions(employees, filters, query, "role", ALL_ROLE),
    status: buildCascadeOptions(employees, filters, query, "status", ALL_STATUS),
    access: buildCascadeOptions(employees, filters, query, "access", ALL_ACCESS),
  }), [employees, filters, query]);

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;

      if (next.status !== ALL_STATUS && !options.status.includes(next.status)) {
        next.status = ALL_STATUS;
        changed = true;
      }
      if (next.access !== ALL_ACCESS && !options.access.includes(next.access)) {
        next.access = ALL_ACCESS;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [options.status, options.access]);

  const visibleEmployees = useMemo(
    () => filterEmployees(employees, filters, query),
    [employees, filters, query],
  );

  useEffect(() => {
    if (!visibleEmployees.some((emp) => emp.id === selectedId)) {
      setSelectedId(visibleEmployees[0]?.id ?? null);
    }
  }, [selectedId, visibleEmployees]);

  const selectedEmployee = visibleEmployees.find((emp) => emp.id === selectedId) ?? null;
  const selectedInfo = selectedEmployee ? buildEmployeeInfo(selectedEmployee) : [];

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  const startFormSave = (form) => {
    const base = formEmployee?.mode === "add" ? null : formEmployee;
    const payload = {
      ...base,
      ...form,
      id: base?.id ?? `emp-${Date.now()}`,
      initials: getInitials(form.name),
      avatarTone: base?.avatarTone ?? "secondary",
      roleTone: getRoleTone(form.role),
      statusTone: getStatusTone(form.status),
      inspections: base?.inspections ?? "0 инспекций",
      activity: "Сегодня 10:30",
      isSelected: false,
    };

    setFormEmployee(null);
    setStatusOperation({
      id: payload.id,
      kind: base ? "edit" : "add",
      employee: payload,
      apply: () => {
        setEmployees((prev) => {
          if (base) {
            return prev.map((item) => item.id === base.id ? payload : item);
          }
          return [payload, ...prev];
        });
        setSelectedId(payload.id);
      },
    });
  };

  const startStatusOperation = (kind, employee, apply) => {
    setStatusOperation({
      id: `${kind}-${employee?.id ?? Date.now()}`,
      kind,
      employee,
      apply,
    });
  };

  const completeStatusOperation = () => {
    statusOperation?.apply?.();
  };

  const confirmDisable = (reason) => {
    const employee = confirmOperation.employee;
    setConfirmOperation(null);
    startStatusOperation("disable", employee, () => {
      setEmployees((prev) => prev.map((item) => item.id === employee.id ? {
        ...item,
        status: "Отключён",
        statusTone: "disabled",
        activity: reason ? `Отключён: ${reason}` : "Доступ отключён сегодня",
      } : item));
    });
  };

  const confirmResetPassword = () => {
    const employee = confirmOperation.employee;
    setConfirmOperation(null);
    startStatusOperation("reset", employee, () => {
      setEmployees((prev) => prev.map((item) => item.id === employee.id ? {
        ...item,
        activity: "Пароль сброшен сегодня",
      } : item));
    });
  };

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
          <button className="em-btn-primary" type="button" onClick={() => setFormEmployee({ mode: "add" })}>
            <PlusOutlined />
            Добавить сотрудника
          </button>
          <button className="em-btn-secondary" type="button" onClick={() => startStatusOperation("import", null)}>
            <UploadOutlined />
            Импорт сотрудников
          </button>
          <button className="em-btn-secondary" type="button" onClick={() => startStatusOperation("export", null)}>
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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
          <select className="em-filter-select" value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
            {options.role.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="em-filter-select" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {options.status.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="em-filter-select" value={filters.access} onChange={(event) => updateFilter("access", event.target.value)}>
            {options.access.map((o) => <option key={o}>{o}</option>)}
          </select>
          <button className="em-reset-btn" type="button" onClick={resetFilters}>
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
              {visibleEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  emp={{ ...emp, isSelected: emp.id === selectedId }}
                  onOpen={setSelectedId}
                />
              ))}
            </tbody>
          </table>
          {visibleEmployees.length === 0 ? (
            <div className="em-table-empty">Нет сотрудников по выбранным фильтрам</div>
          ) : null}
          <div className="em-table-footer">
            Показано {visibleEmployees.length} из {employees.length} сотрудников
          </div>
        </div>

        {/* Right detail panel */}
        <DetailPanel
          emp={selectedEmployee}
          info={selectedInfo.length ? selectedInfo : DETAIL_INFO}
          permissions={DETAIL_PERMISSIONS}
          onEdit={(employee) => setFormEmployee(employee)}
          onResetPassword={(employee) => setConfirmOperation({ kind: "reset", employee })}
          onDisableAccess={(employee) => setConfirmOperation({ kind: "disable", employee })}
        />
      </div>

      {formEmployee ? (
        <EmployeeFormModal
          employee={formEmployee.mode === "add" ? null : formEmployee}
          onClose={() => setFormEmployee(null)}
          onSave={startFormSave}
        />
      ) : null}

      {confirmOperation ? (
        <EmployeeConfirmModal
          operation={confirmOperation}
          onClose={() => setConfirmOperation(null)}
          onConfirm={confirmOperation.kind === "disable" ? confirmDisable : confirmResetPassword}
        />
      ) : null}

      {statusOperation ? (
        <EmployeeStatusModal
          operation={statusOperation}
          onClose={() => setStatusOperation(null)}
          onComplete={completeStatusOperation}
        />
      ) : null}

    </div>
  );
}
