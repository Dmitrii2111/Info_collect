import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Drawer,
  Dropdown,
  Form,
  Grid,
  Input,
  Layout,
  List,
  Menu,
  Modal as AntModal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  theme as antdTheme,
} from "antd";
import {
  ApartmentOutlined,
  AuditOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  createFieldUser,
  createGroupMerge,
  deactivateFieldUser,
  loadAssignmentOptions,
  loadControlData,
  loadExportRows,
  loadGroups,
  loadOperatorBootstrap,
  loadRoomDetail,
  loginOperator,
  previewAssignmentOverlaps,
  restoreFieldUser,
  saveUserAssignments,
  updateFieldUser,
  uploadFieldUserAvatar,
} from "./lib/api";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const TABS = [
  { id: "control", label: "Контроль" },
  { id: "assignments", label: "Назначения" },
  { id: "users", label: "Сотрудники" },
  { id: "groups", label: "Группы" },
  { id: "export", label: "Экспорт" },
];

const ROOM_WORKLIST_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "unchecked", label: "Не проверенные" },
  { value: "missing", label: "С отсутствием" },
  { value: "conflict", label: "С конфликтами" },
  { value: "no_serial", label: "Без серийных номеров" },
  { value: "pnr_attention", label: "ПНР требует внимания" },
];

const ITEM_WORKLIST_OPTIONS = [
  { value: "", label: "Все" },
  { value: "unchecked", label: "Не проверенные" },
  { value: "missing", label: "Отсутствующие" },
  { value: "conflict", label: "Конфликтные" },
  { value: "no_serial", label: "Без серийного номера" },
  { value: "pnr_attention", label: "ПНР требует внимания" },
];

const PRESENCE_FILTER_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "not_checked", label: "Не проверено" },
  { value: "found", label: "Найдено" },
  { value: "missing", label: "Отсутствует" },
  { value: "conflict", label: "Конфликт" },
];

const ROLE_OPTIONS = [
  { value: "field_worker", label: "Оператор" },
  { value: "operator", label: "Диспетчер" },
  { value: "admin", label: "Супервайзер" },
];

const ROLE_LABELS = {
  field_worker: "Оператор",
  operator: "Диспетчер",
  admin: "Супервайзер",
};

const EMPTY_USER_FORM = {
  login: "",
  password: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  phone: "",
  email: "",
  role: "field_worker",
};

const EMPTY_LOGIN_FORM = {
  login: "",
  password: "",
};

const THEME_MODE_OPTIONS = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Темная" },
];

const THEME_ACCENT_OPTIONS = [
  { value: "forest", label: "Лес" },
  { value: "ocean", label: "Океан" },
  { value: "copper", label: "Медь" },
];

const PRESENCE_LABELS = {
  not_checked: "Не проверено",
  found: "Найдено",
  missing: "Отсутствует",
  conflict: "Конфликт",
};

const SERIAL_LABELS = {
  unknown: "Не указан",
  not_provided: "Не предусмотрен",
};

const PNR_LABELS = {
  unknown: "Неизвестно",
  not_required: "Не требуется",
  not_done: "Не проведено",
  done: "Проведено",
  installation: "Монтаж",
};

const COMMUNICATIONS_LABELS = {
  unknown: "Неизвестно",
  missing: "Отсутствуют",
  done: "Выполнены",
  error: "Выполнены с ошибками",
  not_provided: "Не предусмотрены",
};

const LOGIN_RE = /^[A-Za-z0-9]+$/;
const CYRILLIC_NAME_RE = /^[А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+7|7|8)\d{10}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function readStoredAuth() {
  try {
    const raw = sessionStorage.getItem("operator-auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeAuth(auth) {
  sessionStorage.setItem("operator-auth", JSON.stringify(auth));
}

function clearStoredAuth() {
  sessionStorage.removeItem("operator-auth");
}

function readStoredThemeMode() {
  try {
    return localStorage.getItem("operator-theme-mode") || "light";
  } catch {
    return "light";
  }
}

function storeThemeMode(mode) {
  localStorage.setItem("operator-theme-mode", mode);
}

function readStoredThemeAccent() {
  try {
    return localStorage.getItem("operator-theme-accent") || "forest";
  } catch {
    return "forest";
  }
}

function storeThemeAccent(accent) {
  localStorage.setItem("operator-theme-accent", accent);
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function formatRuPhone(value) {
  const normalized = normalizePhone(value);
  if (!normalized) return "";
  let digits = normalized.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11) return value;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function validateUserForm(form, { requirePassword = true } = {}) {
  const errors = {};
  const login = String(form.login || "").trim();
  const password = String(form.password || "");
  const lastName = String(form.last_name || "").trim();
  const firstName = String(form.first_name || "").trim();
  const middleName = String(form.middle_name || "").trim();
  const phone = normalizePhone(form.phone);
  const email = String(form.email || "").trim();

  if (!login) errors.login = "Укажите логин.";
  else if (!LOGIN_RE.test(login)) errors.login = "Только латиница и цифры.";

  if (requirePassword || password) {
    if (!password) errors.password = "Укажите пароль.";
    else if (!PASSWORD_RE.test(password)) errors.password = "Минимум 8 символов, верхний/нижний регистр, цифра и спецсимвол.";
  }

  if (!lastName) errors.last_name = "Укажите фамилию.";
  else if (lastName.length < 2 || !CYRILLIC_NAME_RE.test(lastName)) errors.last_name = "Только кириллица, минимум 2 буквы.";

  if (!firstName) errors.first_name = "Укажите имя.";
  else if (firstName.length < 2 || !CYRILLIC_NAME_RE.test(firstName)) errors.first_name = "Только кириллица, минимум 2 буквы.";

  if (!middleName) errors.middle_name = "Укажите отчество.";
  else if (middleName.length < 2 || !CYRILLIC_NAME_RE.test(middleName)) errors.middle_name = "Только кириллица, минимум 2 буквы.";

  if (!phone) errors.phone = "Укажите телефон.";
  else if (!PHONE_RE.test(phone)) errors.phone = "Телефон РФ: +7XXXXXXXXXX.";

  if (!email) errors.email = "Укажите email.";
  else if (!EMAIL_RE.test(email)) errors.email = "Некорректный email.";

  if (!form.role) errors.role = "Выберите роль.";
  return errors;
}

function getVisibleTabsForRole(role) {
  if (role === "admin") return TABS;
  if (role === "operator") return TABS.filter((tab) => tab.id !== "users");
  return TABS.filter((tab) => tab.id === "assignments");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

function getUniqueValues(items, accessor) {
  return [...new Set(items.map(accessor).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ru"));
}

function getInitials(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "—";
}

function getProgressPercent(completedCount, assignedCount) {
  if (!assignedCount) return 0;
  return Math.max(0, Math.min(100, Math.round((completedCount / assignedCount) * 100)));
}

function getFirstActiveUserId(users) {
  return users.find((user) => user.is_active)?.user_id || null;
}

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "—";
}

function getPresenceLabel(value) {
  return PRESENCE_LABELS[value] || value || "—";
}

function getSerialLabel(serialNumber, serialState) {
  if (serialNumber) return serialNumber;
  return SERIAL_LABELS[serialState] || serialState || "—";
}

function getPnrLabel(value) {
  return PNR_LABELS[value] || value || "—";
}

function getCommunicationsLabel(value) {
  return COMMUNICATIONS_LABELS[value] || value || "—";
}

function getPresenceTone(status) {
  if (status === "found" || status === "moved_to_room") return "success";
  if (status === "missing" || status === "conflict") return "danger";
  if (status === "not_checked") return "warning";
  return "soft";
}

function getUserStatusLabel(status) {
  if (status === "in_progress") return "В работе";
  if (status === "idle") return "Простаивает";
  return "Свободен";
}

function getUserStatusTone(status) {
  if (status === "in_progress") return "success";
  if (status === "idle") return "danger";
  return "warning";
}

function getAssignmentStatusLabel(status) {
  if (status === "completed") return "Завершено";
  if (status === "in_progress") return "В работе";
  if (status === "not_started") return "Не начато";
  return "Не назначено";
}

function getAssignmentStatusTone(status) {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warning";
  if (status === "not_started") return "danger";
  return "soft";
}

function getRoomProgressClass(room) {
  if (room.status_flags?.has_missing_items || room.status_flags?.has_conflict_items) return "problem";
  if (room.completed_at) return "done";
  if (room.status_flags?.has_unchecked_items || room.status_flags?.has_no_serial_items || room.status_flags?.has_pnr_attention_items) return "attention";
  return "neutral";
}

function getControlRoomOptions(rooms, floorCode, departmentName) {
  return rooms
    .filter((room) => {
      if (floorCode && room.floor_code !== floorCode) return false;
      if (departmentName && room.department_name !== departmentName) return false;
      return true;
    })
    .map((room) => ({
      value: room.room_id,
      label: `${room.room_code} — ${room.room_name}`,
    }));
}

function collectFloorRoomIds(floor) {
  return floor.departments.flatMap((department) => department.rooms.map((room) => room.room_id));
}

function collectDepartmentRoomIds(department) {
  return department.rooms.map((room) => room.room_id);
}

function buildSelectionMap(options) {
  return new Set(options?.selected_room_ids || []);
}

function countSelection(roomIds, selectionSet) {
  return roomIds.reduce((acc, roomId) => acc + (selectionSet.has(roomId) ? 1 : 0), 0);
}

function buildEditForm(user) {
  if (!user) return EMPTY_USER_FORM;
  return {
    login: user.login || "",
    password: "",
    last_name: user.last_name || "",
    first_name: user.first_name || "",
    middle_name: user.middle_name || "",
    phone: user.phone || "",
    email: user.email || "",
    role: user.role || "field_worker",
  };
}

function buildAuthFromUser(user, fallbackAuth = null) {
  if (!user) return fallbackAuth;
  return {
    ...(fallbackAuth || {}),
    user_id: user.user_id,
    login: user.login,
    full_name: user.full_name,
    last_name: user.last_name || "",
    first_name: user.first_name || "",
    middle_name: user.middle_name || "",
    role: user.role,
    phone: user.phone || "",
    email: user.email || "",
    avatar_url: user.avatar_url || null,
  };
}

function getRoomActivitySummary(roomDetail) {
  if (!roomDetail?.positions?.length) {
    return "По помещению пока нет отметок.";
  }
  const checkedItems = roomDetail.positions.flatMap((position) => position.items).filter((item) => item.last_check_at);
  if (!checkedItems.length) {
    return "По помещению пока нет отметок.";
  }
  checkedItems.sort((left, right) => new Date(right.last_check_at) - new Date(left.last_check_at));
  const lastItem = checkedItems[0];
  return `Последняя отметка: ${lastItem.last_checked_by_name || "Неизвестно"} / ${formatDate(lastItem.last_check_at)}`;
}

function getAssignmentUserSummary(users) {
  const activeUsers = users.filter((user) => user.is_active);
  const inactiveUsers = users.filter((user) => !user.is_active);
  const inProgress = activeUsers.filter(
    (user) => (user.assigned_rooms_count || 0) > 0 && (user.completed_rooms_count || 0) < (user.assigned_rooms_count || 0),
  ).length;
  const available = activeUsers.filter(
    (user) => (user.assigned_rooms_count || 0) === 0 || (user.completed_rooms_count || 0) >= (user.assigned_rooms_count || 0),
  ).length;
  return {
    activeCount: activeUsers.length,
    inactiveCount: inactiveUsers.length,
    inProgress,
    available,
  };
}

function getDirectorySummary(users) {
  const activeUsers = users.filter((user) => user.is_active);
  const inactiveUsers = users.filter((user) => !user.is_active);
  const inProgress = activeUsers.filter((user) => user.work_status === "in_progress").length;
  const available = activeUsers.filter((user) => user.work_status !== "in_progress").length;
  return {
    total: activeUsers.length,
    inProgress,
    available,
    inactive: inactiveUsers.length,
  };
}

function getGroupSummary(group) {
  return {
    assigned: group?.assigned_rooms_count || 0,
    completed: group?.completed_rooms_count || 0,
    inProgress: group?.in_progress_rooms_count || 0,
    notStarted: group?.not_started_rooms_count || 0,
  };
}

function SummaryCard({ label, value, tone = "default" }) {
  const statusMap = {
    default: "#1677ff",
    success: "#52c41a",
    warning: "#faad14",
    danger: "#ff4d4f",
  };
  return <Card size="small" className={`summary-card-react tone-${tone}`} bordered><Statistic title={label} value={value} valueStyle={{ color: statusMap[tone] || statusMap.default, fontSize: 34 }} /></Card>;
}

function SummaryBadge({ children, tone = "soft" }) {
  const colorMap = { soft: "default", success: "success", warning: "warning", danger: "error" };
  return <Tag color={colorMap[tone] || "default"}>{children}</Tag>;
}

function Modal({ open, title, subtitle, children, actions }) {
  return (
    <AntModal
      open={open}
      width={720}
      title={
        <Space direction="vertical" size={0}>
          <Text type="secondary">{subtitle}</Text>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
      }
      footer={actions}
      closable={false}
      onCancel={() => {}}
      styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
    >
      <div className="modal-body">{children}</div>
    </AntModal>
  );
}

function UserAvatar({ user, previewUrl = "", size = "default" }) {
  const src = previewUrl || user?.avatar_url || "";
  const avatarSize = size === "large" ? 88 : 42;
  if (src) return <Avatar src={src} size={avatarSize} shape="circle" />;
  return <Avatar size={avatarSize} icon={<UserOutlined />}>{getInitials(user?.full_name)}</Avatar>;
}

function AvatarDropzone({ label, previewUrl, onFileSelected, helperText = "" }) {
  return (
    <div className="avatar-dropzone-wrap">
      <Text strong>{label}</Text>
      <Dragger
        multiple={false}
        maxCount={1}
        accept=".jpg,.jpeg,.png,.webp"
        showUploadList={false}
        beforeUpload={(file) => {
          onFileSelected(file);
          return false;
        }}
        className="avatar-dropzone"
      >
        {previewUrl ? <img className="avatar-dropzone-preview" src={previewUrl} alt="Предпросмотр фото" /> : <Paragraph style={{ marginBottom: 0 }}>Перетащите фото или нажмите для выбора</Paragraph>}
      </Dragger>
      {helperText ? <Text type="secondary">{helperText}</Text> : null}
    </div>
  );
}

function TextField({ label, value, onChange, error, type = "text", placeholder = "", className = "" }) {
  return (
    <Form.Item className={className} label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Input type={type} value={value} onChange={onChange} placeholder={placeholder} status={error ? "error" : ""} />
    </Form.Item>
  );
}

function PasswordField({ label, value, onChange, error, visible, onToggleVisibility, placeholder = "" }) {
  return (
    <Form.Item label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Input.Password
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        status={error ? "error" : ""}
        visibilityToggle={{ visible, onVisibleChange: onToggleVisibility }}
      />
    </Form.Item>
  );
}

function SelectField({ label, value, onChange, error, options, className = "" }) {
  return (
    <Form.Item className={className} label={label} validateStatus={error ? "error" : ""} help={error || ""}>
      <Select value={value} onChange={(nextValue) => onChange({ target: { value: nextValue } })} status={error ? "error" : ""} options={options} />
    </Form.Item>
  );
}

function LoginScreen({ form, setForm, onSubmit, loading, error, passwordVisible, onTogglePassword }) {
  return (
    <main className="login-screen">
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text type="secondary">InfoCollect</Text>
          <Title level={2} style={{ marginBottom: 0 }}>
            Вход в систему
          </Title>
          <Paragraph type="secondary">Введите логин и пароль. После авторизации откроется интерфейс в соответствии с ролью пользователя.</Paragraph>
        </Space>
        <Form layout="vertical" className="login-form">
          <div className="login-form-row">
            <Form.Item label="Логин" className="login-form-item">
              <Input
                size="large"
                value={form.login}
                onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
              />
            </Form.Item>
            <Form.Item label="Пароль" className="login-form-item">
              <Input.Password
                size="large"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                visibilityToggle={{ visible: passwordVisible, onVisibleChange: onTogglePassword }}
              />
            </Form.Item>
          </div>
        </Form>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <Button type="primary" size="large" block onClick={onSubmit} loading={loading} disabled={!form.login || !form.password}>
          Войти
        </Button>
      </Card>
    </main>
  );
}

function RoomCard({ room }) {
  return (
    <Card className={`control-card room-card-react tone-${getRoomProgressClass(room)}`}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div className="control-card-header">
          <div>
            <strong>{room.room_code}</strong>
            <div>{room.room_name}</div>
          </div>
          <SummaryBadge>{room.planned_items_count}</SummaryBadge>
        </div>
        <Text type="secondary">{room.floor_code || "Без этажа"} / {room.department_name || "Без отделения"}</Text>
        <div className="control-badges">
          {room.status_flags?.has_unchecked_items ? <SummaryBadge tone="warning">Не проверено</SummaryBadge> : null}
          {room.status_flags?.has_missing_items ? <SummaryBadge tone="danger">Отсутствует</SummaryBadge> : null}
          {room.status_flags?.has_conflict_items ? <SummaryBadge tone="danger">Конфликт</SummaryBadge> : null}
          {room.status_flags?.has_no_serial_items ? <SummaryBadge>Без серийника</SummaryBadge> : null}
          {room.status_flags?.has_pnr_attention_items ? <SummaryBadge tone="warning">ПНР</SummaryBadge> : null}
        </div>
      </Space>
    </Card>
  );
}

function ItemCard({ item }) {
  return (
    <Card className="control-card item-card-react">
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <div className="control-card-header">
          <div>
            <strong>{item.position_code} / {item.display_label}</strong>
            <div>{item.equipment_name}</div>
          </div>
          <SummaryBadge tone={getPresenceTone(item.current_presence_status)}>{getPresenceLabel(item.current_presence_status)}</SummaryBadge>
        </div>
        <Text type="secondary">{item.room_code || "Без кода"} / {item.room_name || "Без названия"}</Text>
        <div className="control-badges">
          <SummaryBadge>{getSerialLabel(item.serial_number, item.serial_state)}</SummaryBadge>
          <SummaryBadge>{getPnrLabel(item.pnr_status)}</SummaryBadge>
          <SummaryBadge>{getCommunicationsLabel(item.communications_status)}</SummaryBadge>
        </div>
        {item.last_checked_by_name ? <Text type="secondary">Последняя проверка: {item.last_checked_by_name} / {formatDate(item.last_check_at)}</Text> : null}
      </Space>
    </Card>
  );
}

function AssignmentUserCard({ user, selected, onClick }) {
  const showWorkStatus = user.role === "field_worker";
  return (
    <Card hoverable className={`assignment-user-card ${selected ? "selected" : ""}`} onClick={onClick} bordered={selected}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div className="assignment-user-header">
          <div className="assignment-user-main">
            <UserAvatar user={user} />
            <div>
              <strong>{user.full_name}</strong>
                <div>{user.phone || user.email || "Без контактов"}</div>
              </div>
            </div>
          <SummaryBadge tone={showWorkStatus ? getUserStatusTone(user.work_status) : "soft"}>
            {showWorkStatus ? getUserStatusLabel(user.work_status) : getRoleLabel(user.role)}
          </SummaryBadge>
        </div>
        {showWorkStatus ? (
          <div className="assignment-user-meta">
            <span>Назначено: {user.assigned_rooms_count || 0}</span>
            <span>Завершено: {user.completed_rooms_count || 0}</span>
          </div>
        ) : null}
      </Space>
    </Card>
  );
}

function RoomCompletionHistogram({ activity }) {
  const days = activity?.days || [];
  if (!days.length) {
    return <div className="empty-box">Закрытых помещений пока нет.</div>;
  }

  const maxValue = Math.max(...days.map((day) => day.total_completed_rooms), 1);
  return (
    <div className="completion-chart-list">
      {days.map((day) => (
        <div key={day.date} className="completion-chart-row">
          <div className="completion-chart-head">
            <strong>{formatDate(`${day.date}T00:00:00`)}</strong>
            <span>{day.total_completed_rooms} помещений</span>
          </div>
          <div className="completion-chart-bar">
            {day.employees.map((employee) => (
              <div
                key={`${day.date}-${employee.user_id || employee.full_name}`}
                className="completion-chart-segment"
                style={{ width: `${(employee.completed_rooms_count / maxValue) * 100}%` }}
                title={`${employee.full_name}: ${employee.completed_rooms_count}`}
              >
                <span>{employee.completed_rooms_count}</span>
              </div>
            ))}
          </div>
          <div className="completion-chart-legend">
            {day.employees.map((employee) => (
              <SummaryBadge key={`${day.date}-legend-${employee.user_id || employee.full_name}`}>
                {employee.full_name}: {employee.completed_rooms_count}
              </SummaryBadge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function UserDirectoryCard({ user, onEdit, onDeactivate, onRestore }) {
  return (
    <Card className={`directory-card ${!user.is_active ? "inactive" : ""}`}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div className="directory-card-body">
          <UserAvatar user={user} size="large" />
          <div className="directory-card-text">
            <strong>{user.full_name}</strong>
            <div>{getRoleLabel(user.role)}</div>
            <div>{user.phone ? formatRuPhone(user.phone) : "Телефон не указан"}</div>
            <div>{user.email || "Почта не указана"}</div>
          </div>
        </div>
        <div className="directory-actions">
          <Button onClick={() => onEdit(user)}>Редактировать</Button>
          {user.is_active ? (
            <Button danger type="primary" className="danger-action-button" onClick={() => onDeactivate(user)}>
              Отключить
            </Button>
          ) : (
            <Button type="primary" onClick={() => onRestore(user)}>
              Восстановить
            </Button>
          )}
        </div>
      </Space>
    </Card>
  );
}

function AssignmentTree({
  options,
  selection,
  expansion,
  onToggleExpand,
  onToggleRoom,
  onToggleDepartment,
  onToggleFloor,
  onSelectRoom,
  selectedRoomId,
  readOnly = false,
}) {
  if (!options) return <div className="empty-box">Выберите сотрудника слева.</div>;
  if (!options.floors.length) return <div className="empty-box">Для активной версии плана помещений не найдено.</div>;

  return (
    <div className="assignment-tree-react">
      {options.floors.map((floor) => {
        const floorRoomIds = collectFloorRoomIds(floor);
        const floorSelectedCount = countSelection(floorRoomIds, selection);
        const floorAssignedCount = floor.assigned_rooms_count || 0;
        const floorChecked = floorRoomIds.length > 0 && floorSelectedCount === floorRoomIds.length;
        const floorPartial = floorSelectedCount > 0 && floorSelectedCount < floorRoomIds.length;
        const floorKey = `floor:${floor.floor_id || floor.floor_code}`;
        const floorExpanded = expansion[floorKey] ?? false;

        return (
          <article key={floorKey} className="assignment-level-card">
            <div className="assignment-level-header">
              <div className="assignment-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={floorChecked}
                  disabled={readOnly}
                  ref={(node) => {
                    if (node) node.indeterminate = floorPartial;
                  }}
                  onChange={() => onToggleFloor(floor)}
                />
                <button type="button" className="assignment-expand-button" onClick={() => onToggleExpand(floorKey)}>
                  {floorExpanded ? "▾" : "▸"}
                </button>
                <div>
                  <strong>{floor.floor_code || "Без этажа"}</strong>
                  <p>{getAssignmentStatusLabel(floor.progress_status)}</p>
                </div>
              </div>
              <div className="assignment-level-side">
                <SummaryBadge tone={getAssignmentStatusTone(floor.progress_status)}>{getAssignmentStatusLabel(floor.progress_status)}</SummaryBadge>
                <strong>
                  {floor.completed_rooms_count || 0} / {floorAssignedCount}
                </strong>
              </div>
            </div>
            <div className="assignment-progress-bar">
              <span style={{ width: `${getProgressPercent(floor.completed_rooms_count || 0, floorAssignedCount)}%` }} />
            </div>
            {floorExpanded ? (
              <div className="assignment-children">
                {floor.departments.map((department) => {
                  const departmentKey = `department:${department.department_id || `${floorKey}:${department.department_name}`}`;
                  const departmentRoomIds = collectDepartmentRoomIds(department);
                  const departmentSelectedCount = countSelection(departmentRoomIds, selection);
                  const departmentChecked = departmentRoomIds.length > 0 && departmentSelectedCount === departmentRoomIds.length;
                  const departmentPartial = departmentSelectedCount > 0 && departmentSelectedCount < departmentRoomIds.length;
                  const departmentExpanded = expansion[departmentKey] ?? false;
                  const departmentAssignedCount = department.assigned_rooms_count || 0;

                  return (
                    <article key={departmentKey} className="assignment-level-card nested">
                      <div className="assignment-level-header">
                        <div className="assignment-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={departmentChecked}
                            disabled={readOnly}
                            ref={(node) => {
                              if (node) node.indeterminate = departmentPartial;
                            }}
                            onChange={() => onToggleDepartment(department)}
                          />
                          <button type="button" className="assignment-expand-button" onClick={() => onToggleExpand(departmentKey)}>
                            {departmentExpanded ? "▾" : "▸"}
                          </button>
                          <div>
                            <strong>{department.department_name || "Без отделения"}</strong>
                            <p>{getAssignmentStatusLabel(department.progress_status)}</p>
                          </div>
                        </div>
                        <div className="assignment-level-side">
                          <SummaryBadge tone={getAssignmentStatusTone(department.progress_status)}>{getAssignmentStatusLabel(department.progress_status)}</SummaryBadge>
                          <strong>
                            {department.completed_rooms_count || 0} / {departmentAssignedCount}
                          </strong>
                        </div>
                      </div>
                      <div className="assignment-progress-bar">
                        <span style={{ width: `${getProgressPercent(department.completed_rooms_count || 0, departmentAssignedCount)}%` }} />
                      </div>
                      {departmentExpanded ? (
                        <div className="assignment-children rooms">
                          {department.rooms.map((room) => (
                            <label
                              key={room.room_id}
                              className={`assignment-room-row ${selectedRoomId === room.room_id ? "selected" : ""}`}
                              onClick={() => onSelectRoom?.(room.room_id)}
                            >
                              <span className="assignment-room-main">
                                <input type="checkbox" checked={selection.has(room.room_id)} disabled={readOnly} onChange={() => onToggleRoom(room.room_id)} />
                                <span>
                                  <strong>
                                    {room.room_code} — {room.room_name}
                                  </strong>
                                  <small>
                                    {room.checked_items_count} / {room.total_items_count}
                                  </small>
                                </span>
                              </span>
                              <span className="assignment-room-side">
                                {room.repeat_check_required ? <SummaryBadge tone="warning">Повторная проверка</SummaryBadge> : null}
                                <SummaryBadge tone={getAssignmentStatusTone(room.progress_status)}>{getAssignmentStatusLabel(room.progress_status)}</SummaryBadge>
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function AssignmentRoomContext({ roomDetail, loading }) {
  if (loading) {
    return <div className="empty-box">Загрузка деталей помещения...</div>;
  }
  if (!roomDetail) {
    return <div className="empty-box">Выберите помещение, чтобы увидеть состав и последние отметки.</div>;
  }

  return (
    <article className="react-panel room-context-panel">
      <div className="panel-title-row">
        <div>
          <h2>{roomDetail.room_code} — {roomDetail.room_name}</h2>
          <p className="assignment-helper-text">{roomDetail.floor_code || "Без этажа"} / {roomDetail.department_name || "Без отделения"}</p>
        </div>
        <SummaryBadge>{roomDetail.positions.length}</SummaryBadge>
      </div>
      <p className="assignment-status-note">{getRoomActivitySummary(roomDetail)}</p>
      <div className="room-context-list">
        {roomDetail.positions.map((position) => (
          <section key={position.planned_position_id} className="room-context-position">
            <div className="room-context-position-header">
              <div>
                <strong>{position.position_code} / {position.equipment_name}</strong>
                {position.model_mark ? <p>{position.model_mark}</p> : null}
              </div>
              <SummaryBadge>{position.items.length}</SummaryBadge>
            </div>
            <div className="room-context-items">
              {position.items.map((item) => (
                <article key={item.planned_item_id} className="room-context-item">
                  <div className="room-context-item-header">
                    <strong>{item.display_label}</strong>
                    <SummaryBadge tone={getPresenceTone(item.current_presence_status)}>{getPresenceLabel(item.current_presence_status)}</SummaryBadge>
                  </div>
                  <div className="control-badges">
                    <SummaryBadge>{getSerialLabel(item.serial_number, item.serial_state)}</SummaryBadge>
                    <SummaryBadge>{getPnrLabel(item.pnr_status)}</SummaryBadge>
                    <SummaryBadge>{getCommunicationsLabel(item.communications_status)}</SummaryBadge>
                  </div>
                  <p className="room-context-meta">
                    {item.last_checked_by_name ? `${item.last_checked_by_name} / ${formatDate(item.last_check_at)}` : "Отметок пока нет"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [authForm, setAuthForm] = useState(EMPTY_LOGIN_FORM);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  const [activeTab, setActiveTab] = useState("control");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);

  const [data, setData] = useState({
    roomsSummary: null,
    itemsSummary: null,
    planVersions: [],
    users: [],
    errors: [],
  });
  const [controlData, setControlData] = useState({
    roomSummary: null,
    itemSummary: null,
    rooms: [],
    items: [],
  });
  const [controlFilters, setControlFilters] = useState({
    roomWorklist: "",
    itemWorklist: "unchecked",
    floorCode: "",
    departmentName: "",
    roomId: "",
  });
  const [controlError, setControlError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState(null);
  const [assignmentSelection, setAssignmentSelection] = useState(new Set());
  const [assignmentSavedSelection, setAssignmentSavedSelection] = useState(new Set());
  const [assignmentExpansion, setAssignmentExpansion] = useState({});
  const [selectedAssignmentRoomId, setSelectedAssignmentRoomId] = useState(null);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [assignmentRoomLoading, setAssignmentRoomLoading] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [repeatDialog, setRepeatDialog] = useState({ open: false, rooms: [], payload: null });
  const [overlapDialog, setOverlapDialog] = useState({ open: false, overlaps: [], payload: null, teamName: "" });

  const [createForm, setCreateForm] = useState(EMPTY_USER_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState("");
  const [createPasswordVisible, setCreatePasswordVisible] = useState(false);
  const [usersStatus, setUsersStatus] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_USER_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [editPasswordVisible, setEditPasswordVisible] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_USER_FORM);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState("");
  const [profilePasswordVisible, setProfilePasswordVisible] = useState(false);
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => readStoredThemeMode());
  const [themeAccent, setThemeAccent] = useState(() => readStoredThemeAccent());

  const [groupsData, setGroupsData] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupsStatus, setGroupsStatus] = useState("");

  const [exportRows, setExportRows] = useState([]);
  const [exportFilters, setExportFilters] = useState({
    floorCode: "",
    departmentName: "",
    roomId: "",
    equipmentQuery: "",
    serialQuery: "",
    presenceStatus: "",
  });

  const controlCacheRef = useRef(new Map());
  const assignmentCacheRef = useRef(new Map());
  const roomDetailCacheRef = useRef(new Map());
  const groupsLoadedRef = useRef(false);
  const exportLoadedRef = useRef(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleTabs = useMemo(() => getVisibleTabsForRole(auth?.role), [auth?.role]);
  const menuItems = useMemo(
    () =>
      visibleTabs.map((tab) => ({
        key: tab.id,
        label: tab.label,
        icon:
          tab.id === "control" ? <AuditOutlined /> :
          tab.id === "assignments" ? <ApartmentOutlined /> :
          tab.id === "users" ? <TeamOutlined /> :
          tab.id === "groups" ? <UsergroupAddOutlined /> :
          <ExportOutlined />,
      })),
    [visibleTabs],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const nextData = await loadOperatorBootstrap();
        if (!cancelled) {
          setData(nextData);
          setSelectedUserId((current) => {
            if (auth.role === "field_worker") return auth.user_id;
            return current || getFirstActiveUserId(nextData.users);
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  useEffect(() => {
    if (!createAvatarFile) {
      setCreateAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(createAvatarFile);
    setCreateAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [createAvatarFile]);

  useEffect(() => {
    if (!editAvatarFile) {
      setEditAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(editAvatarFile);
    setEditAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [editAvatarFile]);

  useEffect(() => {
    if (!profileAvatarFile) {
      setProfileAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(profileAvatarFile);
    setProfileAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [profileAvatarFile]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    storeThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.accent = themeAccent;
    storeThemeAccent(themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    if (!visibleTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "assignments");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (auth?.role === "field_worker" && auth.user_id && selectedUserId !== auth.user_id) {
      setSelectedUserId(auth.user_id);
    }
  }, [auth, selectedUserId]);

  useEffect(() => {
    if (!assignmentOptions?.selected_room_ids?.length) {
      setSelectedAssignmentRoomId(null);
      setSelectedRoomDetail(null);
      return;
    }
    setSelectedAssignmentRoomId((current) => {
      if (current && assignmentOptions.selected_room_ids.includes(current)) {
        return current;
      }
      return assignmentOptions.selected_room_ids[0];
    });
  }, [assignmentOptions]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "control") return;
      const key = JSON.stringify({
        roomWorklist: controlFilters.roomWorklist,
        itemWorklist: controlFilters.itemWorklist,
      });
      const cached = controlCacheRef.current.get(key);
      if (cached) setControlData(cached);
      setControlLoading(!cached);
      setControlError("");
      try {
        const payload = await loadControlData({
          roomWorklist: controlFilters.roomWorklist,
          itemWorklist: controlFilters.itemWorklist,
        });
        if (!cancelled) {
          controlCacheRef.current.set(key, payload);
          setControlData(payload);
        }
      } catch (error) {
        if (!cancelled) setControlError(error.message || "Не удалось загрузить контроль.");
      } finally {
        if (!cancelled) setControlLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, controlFilters.roomWorklist, controlFilters.itemWorklist]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "assignments") return;
      const effectiveUserId =
        auth.role === "field_worker"
          ? auth.user_id
          : data.users.find((user) => user.user_id === selectedUserId && user.is_active)?.user_id || getFirstActiveUserId(data.users);
      if (!effectiveUserId) return;
      if (effectiveUserId !== selectedUserId) {
        startTransition(() => setSelectedUserId(effectiveUserId));
        return;
      }

      const cached = assignmentCacheRef.current.get(effectiveUserId);
      if (cached) {
        setAssignmentOptions(cached);
        setAssignmentSelection(buildSelectionMap(cached));
        setAssignmentSavedSelection(buildSelectionMap(cached));
      }

      setAssignmentsLoading(!cached);
      setAssignmentError("");
      try {
        const payload = await loadAssignmentOptions(effectiveUserId);
        if (!cancelled) {
          assignmentCacheRef.current.set(effectiveUserId, payload);
          setAssignmentOptions(payload);
          setAssignmentSelection(buildSelectionMap(payload));
          setAssignmentSavedSelection(buildSelectionMap(payload));
        }
      } catch (error) {
        if (!cancelled) setAssignmentError(error.message || "Не удалось загрузить назначения.");
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, selectedUserId, data.users, startTransition]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedAssignmentRoomId || activeTab !== "assignments") return;
      const cached = roomDetailCacheRef.current.get(selectedAssignmentRoomId);
      if (cached) {
        setSelectedRoomDetail(cached);
      }
      setAssignmentRoomLoading(!cached);
      try {
        const payload = await loadRoomDetail(selectedAssignmentRoomId);
        if (!cancelled) {
          roomDetailCacheRef.current.set(selectedAssignmentRoomId, payload);
          setSelectedRoomDetail(payload);
        }
      } catch (error) {
        if (!cancelled) setAssignmentError(error.message || "Не удалось загрузить детали помещения.");
      } finally {
        if (!cancelled) setAssignmentRoomLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedAssignmentRoomId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "groups") return;
      if (groupsLoadedRef.current && groupsData.length) return;
      setGroupsLoading(true);
      try {
        const payload = await loadGroups();
        if (!cancelled) {
          groupsLoadedRef.current = true;
          setGroupsData(payload);
          setSelectedGroupId((current) => current || payload[0]?.team_id || null);
        }
      } catch (error) {
        if (!cancelled) setGroupsStatus(error.message || "Не удалось загрузить группы.");
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, groupsData.length]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "export") return;
      if (exportLoadedRef.current && exportRows.length) return;
      setExportLoading(true);
      try {
        const rows = await loadExportRows();
        if (!cancelled) {
          exportLoadedRef.current = true;
          setExportRows(rows);
        }
      } finally {
        if (!cancelled) setExportLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, exportRows.length]);

  const activePlan = data.planVersions.find((item) => item.status === "applied") || data.planVersions[0] || null;
  const floors = getUniqueValues(controlData.rooms, (room) => room.floor_code);
  const departments = getUniqueValues(
    controlData.rooms.filter((room) => !controlFilters.floorCode || room.floor_code === controlFilters.floorCode),
    (room) => room.department_name,
  );
  const roomOptions = getControlRoomOptions(controlData.rooms, controlFilters.floorCode, controlFilters.departmentName);
  const selectedAssignmentUser = data.users.find((user) => user.user_id === selectedUserId) || null;
  const assignmentUsers = useMemo(() => {
    const activeUsers = data.users.filter((user) => user.is_active);
    if (auth?.role === "field_worker") {
      return activeUsers.filter((user) => user.user_id === auth.user_id);
    }
    return activeUsers;
  }, [auth, data.users]);
  const activeDirectoryUsers = useMemo(() => data.users.filter((user) => user.is_active), [data.users]);
  const inactiveDirectoryUsers = useMemo(() => data.users.filter((user) => !user.is_active), [data.users]);
  const userSummary = getAssignmentUserSummary(data.users);
  const directorySummary = getDirectorySummary(data.users);
  const selectedGroup = groupsData.find((group) => group.team_id === selectedGroupId) || null;
  const groupSummary = getGroupSummary(selectedGroup);
  const currentUser = data.users.find((user) => user.user_id === auth?.user_id) || null;
  const configTheme = useMemo(
    () => ({
      algorithm: themeMode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary:
          themeAccent === "ocean"
            ? "#1763a6"
            : themeAccent === "copper"
              ? "#a15c2f"
              : "#1f4d3a",
        colorBgLayout: themeMode === "dark" ? "#101217" : "#f5f7fb",
        colorBgContainer: themeMode === "dark" ? "#171b21" : "#ffffff",
        colorBgElevated: themeMode === "dark" ? "#1f242c" : "#ffffff",
        colorBorder: themeMode === "dark" ? "#2a313b" : "#d9e0e7",
        colorText: themeMode === "dark" ? "#f5f7fa" : "#1f2329",
        colorTextSecondary: themeMode === "dark" ? "#a9b4c0" : "#667085",
        boxShadowSecondary: themeMode === "dark" ? "0 16px 48px rgba(0,0,0,0.34)" : "0 16px 40px rgba(15,23,42,0.08)",
        borderRadius: 12,
      },
      components: {
        Layout: {
          headerBg: themeMode === "dark" ? "#11151b" : "#ffffff",
          siderBg: themeMode === "dark" ? "#11151b" : "#ffffff",
          bodyBg: themeMode === "dark" ? "#101217" : "#f5f7fb",
          triggerBg: themeMode === "dark" ? "#11151b" : "#ffffff",
        },
        Card: {
          colorBgContainer: themeMode === "dark" ? "#171b21" : "#ffffff",
        },
      },
    }),
    [themeAccent, themeMode],
  );
  const profileMenuItems = useMemo(
    () => [
      { key: "profile", icon: <UserOutlined />, label: "Мой профиль", onClick: openProfile },
      { key: "theme", icon: <BgColorsOutlined />, label: "Тема интерфейса", onClick: () => setThemeSettingsOpen(true) },
      { key: "logout", icon: <LogoutOutlined />, label: "Выйти", onClick: handleLogout },
    ],
    [handleLogout],
  );

  const filteredRooms = controlData.rooms.filter((room) => {
    if (controlFilters.floorCode && room.floor_code !== controlFilters.floorCode) return false;
    if (controlFilters.departmentName && room.department_name !== controlFilters.departmentName) return false;
    if (controlFilters.roomId && room.room_id !== controlFilters.roomId) return false;
    return true;
  });

  const filteredItems = controlData.items.filter((item) => {
    if (controlFilters.floorCode && item.floor_code !== controlFilters.floorCode) return false;
    if (controlFilters.departmentName && item.department_name !== controlFilters.departmentName) return false;
    if (controlFilters.roomId && item.room_id !== controlFilters.roomId) return false;
    return true;
  });

  const exportFloors = getUniqueValues(exportRows, (item) => item.floor_code);
  const exportDepartments = getUniqueValues(
    exportRows.filter((item) => !exportFilters.floorCode || item.floor_code === exportFilters.floorCode),
    (item) => item.department_name,
  );
  const exportRoomOptions = exportRows
    .filter((item) => {
      if (exportFilters.floorCode && item.floor_code !== exportFilters.floorCode) return false;
      if (exportFilters.departmentName && item.department_name !== exportFilters.departmentName) return false;
      return true;
    })
    .map((item) => ({ value: item.room_id, label: `${item.room_code || "—"} — ${item.room_name || "—"}` }))
    .filter((item, index, all) => item.value && all.findIndex((candidate) => candidate.value === item.value) === index);

  const filteredExportRows = exportRows.filter((item) => {
    if (exportFilters.floorCode && item.floor_code !== exportFilters.floorCode) return false;
    if (exportFilters.departmentName && item.department_name !== exportFilters.departmentName) return false;
    if (exportFilters.roomId && item.room_id !== exportFilters.roomId) return false;
    if (exportFilters.presenceStatus && item.current_presence_status !== exportFilters.presenceStatus) return false;
    if (exportFilters.equipmentQuery) {
      const haystack = `${item.position_code || ""} ${item.equipment_name || ""} ${item.display_label || ""}`.toLowerCase();
      if (!haystack.includes(exportFilters.equipmentQuery.toLowerCase())) return false;
    }
    if (exportFilters.serialQuery) {
      const serialHaystack = `${item.serial_number || item.serial_state || ""}`.toLowerCase();
      if (!serialHaystack.includes(exportFilters.serialQuery.toLowerCase())) return false;
    }
    return true;
  });

  async function reloadBootstrapUsers() {
    const nextData = await loadOperatorBootstrap();
    setData((current) => ({
      ...current,
      users: nextData.users,
      errors: nextData.errors,
      planVersions: nextData.planVersions.length ? nextData.planVersions : current.planVersions,
    }));
    startTransition(() => {
      setSelectedUserId((current) => {
        if (auth?.role === "field_worker" && auth.user_id) return auth.user_id;
        const stillValid = nextData.users.find((user) => user.user_id === current && user.is_active);
        return stillValid ? current : getFirstActiveUserId(nextData.users);
      });
    });
  }

  async function reloadGroupsData() {
    const payload = await loadGroups();
    groupsLoadedRef.current = true;
    setGroupsData(payload);
    setSelectedGroupId((current) => current || payload[0]?.team_id || null);
  }

  async function handleLogin() {
    setAuthLoading(true);
    setAuthError("");
    try {
      const payload = await loginOperator(authForm);
      setAuth(payload);
      storeAuth(payload);
      setSelectedUserId(payload.role === "field_worker" ? payload.user_id : null);
      setActiveTab(payload.role === "field_worker" ? "assignments" : "control");
    } catch (error) {
      setAuthError(error.message || "Не удалось выполнить вход.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAuth();
    setAuth(null);
    setAuthForm(EMPTY_LOGIN_FORM);
    setAuthError("");
    setSelectedUserId(null);
  }

  function openProfile() {
    const sourceUser = currentUser || auth;
    setProfileForm(buildEditForm(sourceUser));
    setProfileErrors({});
    setProfileAvatarFile(null);
    setProfileAvatarPreview("");
    setProfilePasswordVisible(false);
    setProfileOpen(true);
  }

  function closeProfile() {
    setProfileOpen(false);
    setProfileForm(EMPTY_USER_FORM);
    setProfileErrors({});
    setProfileAvatarFile(null);
    setProfileAvatarPreview("");
    setProfilePasswordVisible(false);
  }

  async function handleSaveProfile() {
    if (!auth?.user_id) return;
    const nextErrors = validateUserForm(profileForm, { requirePassword: false });
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в профиле.");
      return;
    }
    setUserActionLoading(true);
    try {
      const updatedUser = await updateFieldUser(auth.user_id, {
        ...profileForm,
        phone: normalizePhone(profileForm.phone),
      });
      const finalUser = profileAvatarFile ? await uploadFieldUserAvatar(auth.user_id, profileAvatarFile) : updatedUser;
      await reloadBootstrapUsers();
      const nextAuth = buildAuthFromUser(finalUser, auth);
      setAuth(nextAuth);
      storeAuth(nextAuth);
      setUsersStatus("Профиль обновлен.");
      closeProfile();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось обновить профиль.");
    } finally {
      setUserActionLoading(false);
    }
  }

  function handleSidebarToggle() {
    if (isMobile) {
      setMobileNavOpen((current) => !current);
      return;
    }
    setSidebarCollapsed((current) => !current);
  }

  function handleMenuSelect(key) {
    startTransition(() => setActiveTab(key));
    if (isMobile) {
      setMobileNavOpen(false);
    }
  }

  function updateCreateForm(key, value) {
    setCreateForm((current) => ({ ...current, [key]: value }));
    setCreateErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateEditForm(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }));
    setEditErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function openEditUser(user) {
    setEditUser(user);
    setEditForm(buildEditForm(user));
    setEditErrors({});
    setEditAvatarFile(null);
    setEditAvatarPreview("");
    setEditPasswordVisible(false);
    setUsersStatus("");
  }

  function closeEditUser() {
    setEditUser(null);
    setEditForm(EMPTY_USER_FORM);
    setEditErrors({});
    setEditAvatarFile(null);
    setEditAvatarPreview("");
  }

  function toggleExpand(key) {
    setAssignmentExpansion((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleRoom(roomId) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
    setSelectedAssignmentRoomId(roomId);
  }

  function selectAssignmentRoom(roomId) {
    setSelectedAssignmentRoomId(roomId);
  }

  function toggleDepartment(department) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      const roomIds = collectDepartmentRoomIds(department);
      const allSelected = roomIds.every((roomId) => next.has(roomId));
      roomIds.forEach((roomId) => (allSelected ? next.delete(roomId) : next.add(roomId)));
      return next;
    });
  }

  function toggleFloor(floor) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      const roomIds = collectFloorRoomIds(floor);
      const allSelected = roomIds.every((roomId) => next.has(roomId));
      roomIds.forEach((roomId) => (allSelected ? next.delete(roomId) : next.add(roomId)));
      return next;
    });
  }

  function buildAssignmentPayload() {
    return {
      floor_ids: [],
      department_ids: [],
      room_ids: [...assignmentSelection],
    };
  }

  function getRepeatRooms(payload) {
    if (!assignmentOptions) return [];
    const result = [];
    assignmentOptions.floors.forEach((floor) =>
      floor.departments.forEach((department) =>
        department.rooms.forEach((room) => {
          if (!payload.room_ids.includes(room.room_id)) return;
          if (assignmentSavedSelection.has(room.room_id)) return;
          if (!room.repeat_check_required) return;
          result.push(room);
        }),
      ),
    );
    return result;
  }

  async function finalizeAssignmentSave(payload, mergeDecision = null) {
    setSavingAssignments(true);
    setAssignmentError("");
    setAssignmentStatus("Сохраняю назначения...");
    try {
      if (mergeDecision?.action === "merge") {
        await createGroupMerge({
          primary_user_id: selectedUserId,
          other_user_ids: [...new Set(mergeDecision.overlaps.map((entry) => entry.other_user_id))],
          team_name: mergeDecision.teamName || null,
        });
      }
      const result = await saveUserAssignments(selectedUserId, payload);
      const nextOptions = await loadAssignmentOptions(selectedUserId);
      assignmentCacheRef.current.set(selectedUserId, nextOptions);
      setAssignmentOptions(nextOptions);
      setAssignmentSelection(buildSelectionMap(nextOptions));
      setAssignmentSavedSelection(buildSelectionMap(nextOptions));
      await reloadBootstrapUsers();
      await reloadGroupsData();
      setAssignmentStatus(`Сохранено. Активных назначений: ${result.active_assignments_count}.`);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось сохранить назначения.");
    } finally {
      setSavingAssignments(false);
    }
  }

  async function startAssignmentSave() {
    if (!selectedUserId) {
      setAssignmentError("Сначала выберите сотрудника.");
      return;
    }
    const payload = buildAssignmentPayload();
    const repeatRooms = getRepeatRooms(payload);
    if (repeatRooms.length > 0) {
      setRepeatDialog({ open: true, rooms: repeatRooms, payload });
      return;
    }
    try {
      const overlapPreview = await previewAssignmentOverlaps(selectedUserId, payload);
      if (overlapPreview.overlap_count > 0) {
        setOverlapDialog({ open: true, overlaps: overlapPreview.overlaps, payload, teamName: "" });
        return;
      }
      await finalizeAssignmentSave(payload);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось проверить пересечения назначений.");
    }
  }

  async function continueAfterRepeatCheck() {
    const payload = repeatDialog.payload;
    setRepeatDialog({ open: false, rooms: [], payload: null });
    if (!payload) return;
    try {
      const overlapPreview = await previewAssignmentOverlaps(selectedUserId, payload);
      if (overlapPreview.overlap_count > 0) {
        setOverlapDialog({ open: true, overlaps: overlapPreview.overlaps, payload, teamName: "" });
        return;
      }
      await finalizeAssignmentSave(payload);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось проверить пересечения назначений.");
    }
  }

  async function continueWithGroupMerge() {
    const mergeDecision = {
      action: "merge",
      overlaps: overlapDialog.overlaps,
      teamName: overlapDialog.teamName,
    };
    const payload = overlapDialog.payload;
    setOverlapDialog({ open: false, overlaps: [], payload: null, teamName: "" });
    if (!payload) return;
    await finalizeAssignmentSave(payload, mergeDecision);
  }

  async function handleCreateUser() {
    const nextErrors = validateUserForm(createForm, { requirePassword: true });
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в форме.");
      return;
    }
    setUserActionLoading(true);
    setUsersStatus("Создаю сотрудника...");
    try {
      const createdUser = await createFieldUser({
        ...createForm,
        phone: normalizePhone(createForm.phone),
      });
      if (createAvatarFile) {
        await uploadFieldUserAvatar(createdUser.user_id, createAvatarFile);
      }
      setCreateForm(EMPTY_USER_FORM);
      setCreateErrors({});
      setCreateAvatarFile(null);
      setCreatePasswordVisible(false);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник создан.");
    } catch (error) {
      setUsersStatus(error.message || "Не удалось создать сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleSaveEditUser() {
    if (!editUser) return;
    const nextErrors = validateUserForm(editForm, { requirePassword: false });
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в форме редактирования.");
      return;
    }
    setUserActionLoading(true);
    setUsersStatus("Сохраняю данные сотрудника...");
    try {
      await updateFieldUser(editUser.user_id, {
        ...editForm,
        phone: normalizePhone(editForm.phone),
      });
      if (editAvatarFile) {
        await uploadFieldUserAvatar(editUser.user_id, editAvatarFile);
      }
      await reloadBootstrapUsers();
      setUsersStatus("Данные сотрудника обновлены.");
      closeEditUser();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось обновить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleDeactivateUser(user) {
    setUserActionLoading(true);
    setUsersStatus(`Отключаю сотрудника ${user.full_name}...`);
    try {
      await deactivateFieldUser(user.user_id);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник отключен.");
      if (editUser?.user_id === user.user_id) closeEditUser();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось отключить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleRestoreUser(user) {
    setUserActionLoading(true);
    setUsersStatus(`Восстанавливаю сотрудника ${user.full_name}...`);
    try {
      await restoreFieldUser(user.user_id);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник восстановлен.");
    } catch (error) {
      setUsersStatus(error.message || "Не удалось восстановить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  function updateControlFilter(key, value) {
    setControlFilters((current) => {
      if (key === "floorCode") return { ...current, floorCode: value, departmentName: "", roomId: "" };
      if (key === "departmentName") return { ...current, departmentName: value, roomId: "" };
      return { ...current, [key]: value };
    });
  }

  function updateExportFilter(key, value) {
    setExportFilters((current) => {
      if (key === "floorCode") return { ...current, floorCode: value, departmentName: "", roomId: "" };
      if (key === "departmentName") return { ...current, departmentName: value, roomId: "" };
      return { ...current, [key]: value };
    });
  }

  function renderControlTab() {
    const roomSummary = controlData.roomSummary || {};
    const itemSummary = controlData.itemSummary || {};
    const roomTotal = Number(roomSummary.total || 0);
    const roomCompleted = Math.max(roomTotal - Number(roomSummary.worklist?.unchecked || 0), 0);
    const roomAttention = Number(roomSummary.worklist?.missing || 0) + Number(roomSummary.worklist?.conflict || 0);
    const itemTotal = Number(itemSummary.total || 0);
    const itemCompleted = Math.max(itemTotal - Number(itemSummary.worklist?.unchecked || 0), 0);
    const itemAttention = Number(itemSummary.worklist?.no_serial || 0) + Number(itemSummary.worklist?.pnr_attention || 0);
    const roomFilters = [
      { value: "", label: "Все статусы" },
      ...ROOM_WORKLIST_OPTIONS.filter((option) => option.value),
    ];

    return (
      <>
        <section className="react-grid control-summary-grid">
          <article className="react-panel control-summary-panel">
            <div className="panel-title-row">
              <h2>Сводка по помещениям</h2>
            </div>
            <div className="react-summary-grid">
              <SummaryCard label="Всего" value={roomSummary.total ?? "—"} />
              <SummaryCard label="Не проверено" value={roomSummary.worklist?.unchecked ?? "—"} tone="warning" />
              <SummaryCard label="Отсутствует" value={roomSummary.worklist?.missing ?? "—"} tone="danger" />
              <SummaryCard label="Конфликт" value={roomSummary.worklist?.conflict ?? "—"} tone="danger" />
            </div>
            <div className="control-chart-grid">
              <Card size="small" bordered={false}>
                <Text type="secondary">Прогресс по помещениям</Text>
                <Progress type="dashboard" percent={roomTotal ? Math.round((roomCompleted / roomTotal) * 100) : 0} />
              </Card>
              <Card size="small" bordered={false}>
                <Text type="secondary">Проблемные помещения</Text>
                <Progress percent={roomTotal ? Math.round((roomAttention / roomTotal) * 100) : 0} status="exception" />
                <Text type="secondary">{roomAttention} из {roomTotal || 0}</Text>
              </Card>
            </div>
          </article>

          <article className="react-panel control-summary-panel">
            <div className="panel-title-row">
              <h2>Сводка по экземплярам</h2>
            </div>
            <div className="react-summary-grid">
              <SummaryCard label="Всего" value={itemSummary.total ?? "—"} />
              <SummaryCard label="Не проверено" value={itemSummary.worklist?.unchecked ?? "—"} tone="warning" />
              <SummaryCard label="Без серийника" value={itemSummary.worklist?.no_serial ?? "—"} tone="warning" />
              <SummaryCard label="ПНР требует внимания" value={itemSummary.worklist?.pnr_attention ?? "—"} tone="warning" />
            </div>
            <div className="control-chart-grid">
              <Card size="small" bordered={false}>
                <Text type="secondary">Прогресс по экземплярам</Text>
                <Progress type="dashboard" percent={itemTotal ? Math.round((itemCompleted / itemTotal) * 100) : 0} />
              </Card>
              <Card size="small" bordered={false}>
                <Text type="secondary">Экземпляры с проблемами</Text>
                <Progress percent={itemTotal ? Math.round((itemAttention / itemTotal) * 100) : 0} status="active" />
                <Text type="secondary">{itemAttention} из {itemTotal || 0}</Text>
              </Card>
            </div>
          </article>
        </section>

        <section className="react-grid">
          <article className="react-panel">
            <div className="panel-title-row">
              <h2>Закрытие помещений по дням</h2>
            </div>
            <p className="assignment-helper-text">Сколько помещений и какими сотрудниками было закрыто по дням.</p>
            <RoomCompletionHistogram activity={controlData.completionActivity} />
          </article>

          <article className={`react-panel ${controlLoading && controlData.rooms.length ? "panel-busy" : ""}`}>
            <div className="panel-title-row">
              <h2>Рабочие помещения</h2>
              <Select
                className="control-filter-select control-filter-select-top"
                value={controlFilters.roomWorklist}
                onChange={(value) => updateControlFilter("roomWorklist", value)}
                options={roomFilters}
              />
            </div>
            <div className="filter-grid antd-filter-grid">
              <Select value={controlFilters.floorCode} onChange={(value) => updateControlFilter("floorCode", value)} options={[{ value: "", label: "Все этажи" }, ...floors.map((floorCode) => ({ value: floorCode, label: floorCode }))]} />
              <Select value={controlFilters.departmentName} onChange={(value) => updateControlFilter("departmentName", value)} options={[{ value: "", label: "Все отделения" }, ...departments.map((departmentName) => ({ value: departmentName, label: departmentName }))]} />
              <Select value={controlFilters.roomId} onChange={(value) => updateControlFilter("roomId", value)} options={[{ value: "", label: "Все помещения" }, ...roomOptions]} />
            </div>
            {controlError ? <p className="error-note">{controlError}</p> : null}
            {controlLoading && !controlData.rooms.length ? <div className="empty-box">Загрузка помещений...</div> : null}
            {!controlLoading && filteredRooms.length === 0 ? <div className="empty-box">Помещений по выбранному фильтру нет.</div> : null}
            {(filteredRooms.length > 0 || (controlLoading && controlData.rooms.length > 0)) ? <div className="control-list">{filteredRooms.map((room) => <RoomCard key={room.room_id} room={room} />)}</div> : null}
          </article>

          <article className={`react-panel ${controlLoading && controlData.items.length ? "panel-busy" : ""}`}>
            <div className="panel-title-row">
              <h2>Проблемные экземпляры</h2>
              <Select
                className="control-filter-select control-filter-select-top"
                value={controlFilters.itemWorklist}
                onChange={(value) => updateControlFilter("itemWorklist", value)}
                options={ITEM_WORKLIST_OPTIONS}
              />
            </div>
            <div className="filter-grid antd-filter-grid">
              <Select value={controlFilters.floorCode} onChange={(value) => updateControlFilter("floorCode", value)} options={[{ value: "", label: "Все этажи" }, ...floors.map((floorCode) => ({ value: floorCode, label: floorCode }))]} />
              <Select value={controlFilters.departmentName} onChange={(value) => updateControlFilter("departmentName", value)} options={[{ value: "", label: "Все отделения" }, ...departments.map((departmentName) => ({ value: departmentName, label: departmentName }))]} />
              <Select value={controlFilters.roomId} onChange={(value) => updateControlFilter("roomId", value)} options={[{ value: "", label: "Все помещения" }, ...roomOptions]} />
            </div>
            {controlLoading && !controlData.items.length ? <div className="empty-box">Загрузка экземпляров...</div> : null}
            {!controlLoading && filteredItems.length === 0 ? <div className="empty-box">Экземпляров по выбранному фильтру нет.</div> : null}
            {(filteredItems.length > 0 || (controlLoading && controlData.items.length > 0)) ? <div className="control-list">{filteredItems.map((item) => <ItemCard key={item.planned_item_id} item={item} />)}</div> : null}
          </article>
        </section>
      </>
    );
  }

  function renderAssignmentsTab() {
    const isFieldWorker = auth?.role === "field_worker";
    return (
      <section className={`react-grid assignments-grid-react ${isFieldWorker ? "assignments-single-column" : ""}`}>
        {!isFieldWorker ? (
          <article className="react-panel">
            <div className="panel-title-row">
              <h2>Сотрудники</h2>
            </div>
            <p className="assignment-helper-text">Сводка по сотрудникам</p>
            <div className="react-summary-grid assignment-summary-grid">
              <SummaryCard label="Всего сотрудников" value={userSummary.activeCount} />
              <SummaryCard label="В работе" value={userSummary.inProgress} tone="success" />
              <SummaryCard label="Свободны" value={userSummary.available} tone="warning" />
              <SummaryCard label="Неактивны" value={userSummary.inactiveCount} tone="danger" />
            </div>
            <div className="assignment-users-list">
              {assignmentUsers.map((user) => (
                <AssignmentUserCard
                  key={user.user_id}
                  user={user}
                  selected={user.user_id === selectedUserId}
                  onClick={() => {
                    setAssignmentStatus("");
                    setAssignmentError("");
                    startTransition(() => setSelectedUserId(user.user_id));
                  }}
                />
              ))}
            </div>
          </article>
        ) : null}

        <article className={`react-panel ${assignmentsLoading && assignmentOptions ? "panel-busy" : ""}`}>
          <div className="panel-title-row">
            <div>
              <h2>{isFieldWorker ? "Мои назначения" : "Назначения"}</h2>
              <p className="assignment-helper-text">
                {selectedAssignmentUser ? `Назначения сотрудника: ${selectedAssignmentUser.full_name}` : "Выберите сотрудника слева."}
              </p>
            </div>
            {!isFieldWorker ? (
              <button type="button" onClick={startAssignmentSave} disabled={!selectedUserId || savingAssignments}>
                {savingAssignments ? "Сохраняю..." : "Сохранить назначения"}
              </button>
            ) : null}
          </div>
          {assignmentOptions ? (
            <div className="react-summary-grid assignment-summary-grid">
              <SummaryCard label="Назначено помещений" value={assignmentOptions.progress_summary?.assigned_rooms_count || 0} />
              <SummaryCard label="Завершено" value={assignmentOptions.progress_summary?.completed_rooms_count || 0} tone="success" />
              <SummaryCard label="В работе" value={assignmentOptions.progress_summary?.in_progress_rooms_count || 0} tone="warning" />
              <SummaryCard label="Не начато" value={assignmentOptions.progress_summary?.not_started_rooms_count || 0} tone="danger" />
            </div>
          ) : null}
          {assignmentError ? <p className="error-note">{assignmentError}</p> : null}
          {assignmentStatus ? <p className="assignment-status-note">{assignmentStatus}</p> : null}
          {assignmentsLoading && !assignmentOptions ? (
            <div className="empty-box">Загрузка назначений...</div>
          ) : (
            <AssignmentTree
              options={assignmentOptions}
              selection={assignmentSelection}
              expansion={assignmentExpansion}
              onToggleExpand={toggleExpand}
              onToggleRoom={toggleRoom}
              onToggleDepartment={toggleDepartment}
              onToggleFloor={toggleFloor}
              onSelectRoom={selectAssignmentRoom}
              selectedRoomId={selectedAssignmentRoomId}
              readOnly={isFieldWorker}
            />
          )}
          <AssignmentRoomContext roomDetail={selectedRoomDetail} loading={assignmentRoomLoading} />
        </article>
      </section>
    );
  }

  function renderUsersTab() {
    const createValidationErrors = validateUserForm(createForm, { requirePassword: true });
    const createDisabled = userActionLoading || Object.keys(createValidationErrors).length > 0;
    return (
      <section className="react-grid users-grid-react">
        <section className="react-panel">
          <div className="panel-title-row">
            <h2>Новый сотрудник</h2>
            <button type="button" onClick={handleCreateUser} disabled={createDisabled}>
              {userActionLoading ? "Создаю..." : "Создать сотрудника"}
            </button>
          </div>
          <div className="form-grid-react">
            <TextField label="Логин" value={createForm.login} onChange={(event) => updateCreateForm("login", event.target.value)} error={createErrors.login} />
            <PasswordField
              label="Пароль"
              value={createForm.password}
              onChange={(event) => updateCreateForm("password", event.target.value)}
              error={createErrors.password}
              visible={createPasswordVisible}
              onToggleVisibility={() => setCreatePasswordVisible((current) => !current)}
            />
            <TextField label="Фамилия" value={createForm.last_name} onChange={(event) => updateCreateForm("last_name", event.target.value)} error={createErrors.last_name} />
            <TextField label="Имя" value={createForm.first_name} onChange={(event) => updateCreateForm("first_name", event.target.value)} error={createErrors.first_name} />
            <TextField label="Отчество" value={createForm.middle_name} onChange={(event) => updateCreateForm("middle_name", event.target.value)} error={createErrors.middle_name} />
            <TextField label="Телефон" value={createForm.phone} onChange={(event) => updateCreateForm("phone", event.target.value)} error={createErrors.phone} placeholder="+7XXXXXXXXXX" />
            <TextField label="Email" value={createForm.email} onChange={(event) => updateCreateForm("email", event.target.value)} error={createErrors.email} className="field-span-2" />
            <SelectField label="Роль" value={createForm.role} onChange={(event) => updateCreateForm("role", event.target.value)} error={createErrors.role} className="field-span-2" options={ROLE_OPTIONS} />
          </div>
          <AvatarDropzone label="Фото сотрудника" previewUrl={createAvatarPreview} onFileSelected={setCreateAvatarFile} helperText="Фото необязательно. Поддерживаются JPG, PNG и WEBP." />
          {usersStatus ? <p className="assignment-status-note">{usersStatus}</p> : null}
        </section>

        <section className="react-panel">
          <div className="panel-title-row">
            <h2>Список сотрудников</h2>
            <span className="status-chip subtle">{isPending ? "Обновляю..." : "Актуально"}</span>
          </div>
          <div className="react-summary-grid assignment-summary-grid">
            <SummaryCard label="Всего сотрудников" value={directorySummary.total} />
            <SummaryCard label="В работе" value={directorySummary.inProgress} tone="success" />
            <SummaryCard label="Свободны" value={directorySummary.available} tone="warning" />
            <SummaryCard label="Неактивны" value={directorySummary.inactive} tone="danger" />
          </div>

          <div className="directory-list">
            {activeDirectoryUsers.map((user) => (
              <UserDirectoryCard key={user.user_id} user={user} onEdit={openEditUser} onDeactivate={handleDeactivateUser} onRestore={handleRestoreUser} />
            ))}

            {inactiveDirectoryUsers.length ? (
              <section className="inactive-group-wrap">
                <button type="button" className="inactive-toggle-button" onClick={() => setShowInactiveUsers((current) => !current)}>
                  {showInactiveUsers ? "▾" : "▸"} Неактивные сотрудники ({inactiveDirectoryUsers.length})
                </button>
                {showInactiveUsers
                  ? inactiveDirectoryUsers.map((user) => (
                      <UserDirectoryCard key={user.user_id} user={user} onEdit={openEditUser} onDeactivate={handleDeactivateUser} onRestore={handleRestoreUser} />
                    ))
                  : null}
              </section>
            ) : null}
          </div>
        </section>
      </section>
    );
  }

  function renderGroupsTab() {
    return (
      <section className="react-grid">
        <article className={`react-panel ${groupsLoading && groupsData.length ? "panel-busy" : ""}`}>
          <div className="panel-title-row">
            <h2>Группы сотрудников</h2>
          </div>
          <p className="assignment-helper-text">Общие помещения считаются только по пересечению назначений всех участников группы.</p>
          {groupsStatus ? <p className="assignment-status-note">{groupsStatus}</p> : null}
          {groupsLoading && !groupsData.length ? <div className="empty-box">Загрузка групп...</div> : null}
          {!groupsLoading && !groupsData.length ? <div className="empty-box">Группы пока не созданы.</div> : null}
          {groupsData.length ? (
            <div className="assignment-users-list">
              {groupsData.map((group) => (
                <button key={group.team_id} type="button" className={`assignment-user-card ${group.team_id === selectedGroupId ? "selected" : ""}`} onClick={() => setSelectedGroupId(group.team_id)}>
                  <div className="assignment-user-header">
                    <div>
                      <strong>{group.team_name}</strong>
                      <p>{group.members_count} участников</p>
                    </div>
                    <SummaryBadge>{group.assigned_rooms_count || 0}</SummaryBadge>
                  </div>
                  <div className="control-badges">
                    {group.members.map((member) => (
                      <SummaryBadge key={member.user_id}>{member.full_name}</SummaryBadge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </article>

        <article className="react-panel">
          <div className="panel-title-row">
            <h2>Сводка группы</h2>
          </div>
          {!selectedGroup ? (
            <div className="empty-box">Выберите группу слева.</div>
          ) : (
            <>
              <div className="react-summary-grid assignment-summary-grid">
                <SummaryCard label="Общие помещения" value={groupSummary.assigned} />
                <SummaryCard label="Завершено" value={groupSummary.completed} tone="success" />
                <SummaryCard label="В работе" value={groupSummary.inProgress} tone="warning" />
                <SummaryCard label="Не начато" value={groupSummary.notStarted} tone="danger" />
              </div>
              <div className="control-badges">
                {selectedGroup.members.map((member) => (
                  <SummaryBadge key={member.user_id}>{member.full_name}</SummaryBadge>
                ))}
              </div>
            </>
          )}
        </article>
      </section>
    );
  }

  function renderExportTab() {
    return (
        <section className="react-panel">
          <div className="panel-title-row">
            <h2>Экспортная таблица</h2>
            <Button
              type="primary"
              onClick={async () => {
                setExportLoading(true);
                const rows = await loadExportRows();
                setExportRows(rows);
                setExportLoading(false);
              }}
            >
              Обновить таблицу
            </Button>
          </div>

          <div className="filter-grid export-filter-grid antd-filter-grid">
            <Select value={exportFilters.floorCode} onChange={(value) => updateExportFilter("floorCode", value)} options={[{ value: "", label: "Все этажи" }, ...exportFloors.map((floorCode) => ({ value: floorCode, label: floorCode }))]} />
            <Select value={exportFilters.departmentName} onChange={(value) => updateExportFilter("departmentName", value)} options={[{ value: "", label: "Все отделения" }, ...exportDepartments.map((departmentName) => ({ value: departmentName, label: departmentName }))]} />
            <Select value={exportFilters.roomId} onChange={(value) => updateExportFilter("roomId", value)} options={[{ value: "", label: "Все помещения" }, ...exportRoomOptions]} />
            <Input placeholder="Оборудование" value={exportFilters.equipmentQuery} onChange={(event) => updateExportFilter("equipmentQuery", event.target.value)} />
            <Input placeholder="Серийный номер" value={exportFilters.serialQuery} onChange={(event) => updateExportFilter("serialQuery", event.target.value)} />
            <Select value={exportFilters.presenceStatus} onChange={(value) => updateExportFilter("presenceStatus", value)} options={PRESENCE_FILTER_OPTIONS} />
          </div>

        {exportLoading && !exportRows.length ? <div className="empty-box">Загрузка строк экспорта...</div> : null}
        {!exportLoading && !filteredExportRows.length ? <div className="empty-box">Строк по выбранным фильтрам нет.</div> : null}
        {filteredExportRows.length ? (
          <div className={`export-table-wrap ${exportLoading ? "panel-busy" : ""}`}>
            <table className="export-table-react">
              <thead>
                <tr>
                  <th>Этаж</th>
                  <th>Отделение</th>
                  <th>Помещение</th>
                  <th>Позиция</th>
                  <th>Оборудование</th>
                  <th>Экземпляр</th>
                  <th>Наличие</th>
                  <th>Серийный номер</th>
                  <th>ПНР</th>
                  <th>Коммуникации</th>
                  <th>Дата проверки</th>
                  <th>Сотрудник</th>
                </tr>
              </thead>
              <tbody>
                {filteredExportRows.map((item) => (
                  <tr key={item.planned_item_id} className={`export-row-${getPresenceTone(item.current_presence_status)}`}>
                    <td>{item.floor_code || "—"}</td>
                    <td>{item.department_name || "—"}</td>
                    <td>
                      {item.room_code || "—"} — {item.room_name || "—"}
                    </td>
                    <td>{item.position_code}</td>
                    <td>{item.equipment_name}</td>
                    <td>{item.display_label}</td>
                    <td>{getPresenceLabel(item.current_presence_status)}</td>
                    <td>{getSerialLabel(item.serial_number, item.serial_state)}</td>
                    <td>{getPnrLabel(item.pnr_status)}</td>
                    <td>{getCommunicationsLabel(item.communications_status)}</td>
                    <td>{formatDate(item.last_check_at)}</td>
                    <td>{item.last_checked_by_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    );
  }

  function renderTab() {
    if (activeTab === "control") return renderControlTab();
    if (activeTab === "assignments") return renderAssignmentsTab();
    if (activeTab === "users") return renderUsersTab();
    if (activeTab === "groups") return renderGroupsTab();
    return renderExportTab();
  }

  if (!auth) {
    return (
      <LoginScreen
        form={authForm}
        setForm={setAuthForm}
        onSubmit={handleLogin}
        loading={authLoading}
        error={authError}
        passwordVisible={loginPasswordVisible}
        onTogglePassword={() => setLoginPasswordVisible((current) => !current)}
      />
    );
  }

  return (
    <>
      <ConfigProvider theme={configTheme}>
        <Layout style={{ minHeight: "100vh" }}>
          <Header
            style={{
              padding: 0,
              background: themeMode === "dark" ? "#11151b" : "#fff",
              borderBottom: `1px solid ${themeMode === "dark" ? "#2a313b" : "#f0f0f0"}`,
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div className="operator-ant-header">
              <Space size="middle">
                <Button type="text" icon={isMobile || sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={handleSidebarToggle} />
                <div className="operator-brand-block">
                  <Text className="operator-brand-text" type="secondary">InfoCollect</Text>
                  <Title className="operator-page-title" level={4}>
                    {auth.role === "field_worker" ? "Мой кабинет" : "Операторская панель"}
                  </Title>
                </div>
              </Space>
              <Space size="middle">
                {!isMobile ? <Badge status={isPending ? "processing" : "success"} text={loading ? "Загрузка данных" : isPending ? "Обновление интерфейса" : "Данные получены"} /> : null}
                <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
                  <Button type="text" className="operator-profile-trigger">
                    <Space>
                      <UserAvatar user={auth} />
                      {!isMobile ? <span>{auth.full_name}</span> : null}
                    </Space>
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </Header>
          <Drawer
            placement="left"
            closable={false}
            width={280}
            open={isMobile && mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            className="mobile-sider-drawer"
          >
            <div className="mobile-menu-body">
              <div className="operator-sider-meta mobile">
                <UserAvatar user={auth} size="large" />
                <div>
                  <Text strong>{auth.full_name}</Text>
                  <br />
                  <Text type="secondary">{getRoleLabel(auth.role)}</Text>
                </div>
              </div>
              <Menu mode="inline" selectedKeys={[activeTab]} items={menuItems} onClick={({ key }) => handleMenuSelect(key)} style={{ borderRight: 0 }} />
            </div>
          </Drawer>
          <Layout>
            {!isMobile ? (
              <Sider
                width={240}
                collapsedWidth={88}
                collapsible
                collapsed={sidebarCollapsed}
                trigger={null}
                breakpoint="lg"
                style={{ background: themeMode === "dark" ? "#11151b" : "#fff", borderRight: `1px solid ${themeMode === "dark" ? "#2a313b" : "#f0f0f0"}` }}
              >
                <div className="operator-sider-meta">
                  <UserAvatar user={auth} size="large" />
                  {!sidebarCollapsed ? (
                    <div>
                      <Text strong>{auth.full_name}</Text>
                      <br />
                      <Text type="secondary">{getRoleLabel(auth.role)}</Text>
                    </div>
                  ) : null}
                </div>
                <Menu mode="inline" selectedKeys={[activeTab]} items={menuItems} onClick={({ key }) => handleMenuSelect(key)} style={{ borderRight: 0 }} />
              </Sider>
            ) : null}
            <Layout>
              <Content className="operator-main-content">
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card>
                        <Statistic title="Активная версия плана" value={activePlan?.version_label || "—"} prefix={<CheckCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card>
                        <Statistic title="Роль доступа" value={getRoleLabel(auth.role)} prefix={<UserOutlined />} />
                      </Card>
                    </Col>
                  </Row>
                  {data.errors.length > 0 ? <Alert type="warning" showIcon icon={<WarningOutlined />} message="Замечания по загрузке" description={<ul>{data.errors.map((error) => <li key={error}>{error}</li>)}</ul>} /> : null}
                  <div className="operator-content-surface">
                    {loading ? <div className="ant-loading-wrap"><Spin indicator={<ReloadOutlined spin />} size="large" /></div> : renderTab()}
                  </div>
                </Space>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </ConfigProvider>

      <Modal
        open={Boolean(editUser)}
        subtitle="Редактирование сотрудника"
        title={editUser?.full_name || "Сотрудник"}
        actions={
          <>
            <Button type="primary" onClick={handleSaveEditUser} loading={userActionLoading}>
              Сохранить изменения
            </Button>
            <Button onClick={closeEditUser}>Закрыть</Button>
          </>
        }
      >
        <div className="modal-profile-header">
          <AvatarDropzone label="Заменить фото" previewUrl={editAvatarPreview || editUser?.avatar_url || ""} onFileSelected={setEditAvatarFile} />
        </div>
        <div className="form-grid-react modal-form-grid">
          <TextField label="Логин" value={editForm.login} onChange={(event) => updateEditForm("login", event.target.value)} error={editErrors.login} />
          <PasswordField
            label="Новый пароль"
            value={editForm.password}
            onChange={(event) => updateEditForm("password", event.target.value)}
            error={editErrors.password}
            visible={editPasswordVisible}
            onToggleVisibility={() => setEditPasswordVisible((current) => !current)}
          />
          <TextField label="Фамилия" value={editForm.last_name} onChange={(event) => updateEditForm("last_name", event.target.value)} error={editErrors.last_name} />
          <TextField label="Имя" value={editForm.first_name} onChange={(event) => updateEditForm("first_name", event.target.value)} error={editErrors.first_name} />
          <TextField label="Отчество" value={editForm.middle_name} onChange={(event) => updateEditForm("middle_name", event.target.value)} error={editErrors.middle_name} />
          <TextField label="Телефон" value={editForm.phone} onChange={(event) => updateEditForm("phone", event.target.value)} error={editErrors.phone} placeholder="+7XXXXXXXXXX" />
          <TextField label="Email" value={editForm.email} onChange={(event) => updateEditForm("email", event.target.value)} error={editErrors.email} className="field-span-2" />
          <SelectField label="Роль" value={editForm.role} onChange={(event) => updateEditForm("role", event.target.value)} error={editErrors.role} className="field-span-2" options={ROLE_OPTIONS} />
        </div>
      </Modal>

      <Modal
        open={profileOpen}
        subtitle="Мой профиль"
        title={auth?.full_name || "Профиль"}
        actions={
          <>
            <Button type="primary" onClick={handleSaveProfile} loading={userActionLoading}>
              Сохранить профиль
            </Button>
            <Button onClick={closeProfile}>Закрыть</Button>
          </>
        }
      >
        <div className="modal-profile-header">
          <UserAvatar user={auth} previewUrl={profileAvatarPreview} size="large" />
          <AvatarDropzone label="Обновить фото" previewUrl={profileAvatarPreview || auth?.avatar_url || ""} onFileSelected={setProfileAvatarFile} />
        </div>
        <div className="form-grid-react modal-form-grid">
          <TextField label="Логин" value={profileForm.login} onChange={(event) => setProfileForm((current) => ({ ...current, login: event.target.value }))} error={profileErrors.login} />
          <PasswordField
            label="Новый пароль"
            value={profileForm.password}
            onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))}
            error={profileErrors.password}
            visible={profilePasswordVisible}
            onToggleVisibility={() => setProfilePasswordVisible((current) => !current)}
          />
          <TextField label="Фамилия" value={profileForm.last_name} onChange={(event) => setProfileForm((current) => ({ ...current, last_name: event.target.value }))} error={profileErrors.last_name} />
          <TextField label="Имя" value={profileForm.first_name} onChange={(event) => setProfileForm((current) => ({ ...current, first_name: event.target.value }))} error={profileErrors.first_name} />
          <TextField label="Отчество" value={profileForm.middle_name} onChange={(event) => setProfileForm((current) => ({ ...current, middle_name: event.target.value }))} error={profileErrors.middle_name} />
          <TextField label="Телефон" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} error={profileErrors.phone} placeholder="+7XXXXXXXXXX" />
          <TextField label="Email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} error={profileErrors.email} className="field-span-2" />
        </div>
      </Modal>

      <Modal
        open={themeSettingsOpen}
        subtitle="Тема интерфейса"
        title="Настройка внешнего вида"
        actions={
          <>
            <Button type="primary" onClick={() => setThemeSettingsOpen(false)}>Готово</Button>
          </>
        }
      >
        <div className="form-grid-react modal-form-grid">
          <SelectField
            label="Режим"
            value={themeMode}
            onChange={(event) => setThemeMode(event.target.value)}
            options={THEME_MODE_OPTIONS}
          />
          <SelectField
            label="Акцент"
            value={themeAccent}
            onChange={(event) => setThemeAccent(event.target.value)}
            options={THEME_ACCENT_OPTIONS}
          />
        </div>
      </Modal>

      <Modal
        open={repeatDialog.open}
        subtitle="Повторная проверка"
        title="Некоторые помещения уже были завершены"
        actions={
          <>
            <button type="button" onClick={continueAfterRepeatCheck}>
              Продолжить
            </button>
            <button type="button" className="ghost-button-react" onClick={() => setRepeatDialog({ open: false, rooms: [], payload: null })}>
              Отмена
            </button>
          </>
        }
      >
        <p className="modal-note">Для этих помещений будет доступна только повторная проверка.</p>
        <div className="modal-list">
          {repeatDialog.rooms.map((room) => (
            <div key={room.room_id} className="modal-list-row">
              <strong>
                {room.room_code} — {room.room_name}
              </strong>
              <span>{formatDate(room.completed_at)}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={overlapDialog.open}
        subtitle="Пересечение назначений"
        title="Найдены совпадающие помещения"
        actions={
          <>
            <button type="button" onClick={continueWithGroupMerge}>
              Объединить в группу и сохранить
            </button>
            <button type="button" className="ghost-button-react" onClick={() => setOverlapDialog({ open: false, overlaps: [], payload: null, teamName: "" })}>
              Отмена
            </button>
          </>
        }
      >
        <p className="modal-note">Можно отменить сохранение или объединить сотрудников в группу.</p>
        <input className="modal-input" value={overlapDialog.teamName} onChange={(event) => setOverlapDialog((current) => ({ ...current, teamName: event.target.value }))} placeholder="Например, Группа этаж 2" />
        <div className="modal-list">
          {overlapDialog.overlaps.map((entry, index) => (
            <div key={`${entry.room_id}-${entry.other_user_id}-${index}`} className="modal-list-row">
              <strong>
                {entry.room_code} — {entry.room_name}
              </strong>
              <span>{entry.other_user_name}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
