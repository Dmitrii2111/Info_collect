import {
  COMMUNICATIONS_LABELS,
  CYRILLIC_NAME_RE,
  EMAIL_RE,
  LOGIN_RE,
  PASSWORD_RE,
  PHONE_RE,
  PNR_LABELS,
  PRESENCE_LABELS,
  ROLE_LABELS,
  SERIAL_LABELS,
  TABS,
} from "./constants.js";

export function readStoredAuth() {
  try {
    const raw = sessionStorage.getItem("operator-auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuth(auth) {
  sessionStorage.setItem("operator-auth", JSON.stringify(auth));
}

export function clearStoredAuth() {
  sessionStorage.removeItem("operator-auth");
}

export function readStoredThemeMode() {
  try {
    return localStorage.getItem("operator-theme-mode") || "light";
  } catch {
    return "light";
  }
}

export function storeThemeMode(mode) {
  localStorage.setItem("operator-theme-mode", mode);
}

export function readStoredThemeAccent() {
  try {
    return localStorage.getItem("operator-theme-accent") || "forest";
  } catch {
    return "forest";
  }
}

export function storeThemeAccent(accent) {
  localStorage.setItem("operator-theme-accent", accent);
}

export function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

export function formatRuPhone(value) {
  const normalized = normalizePhone(value);
  if (!normalized) return "";
  let digits = normalized.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11) return value;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function validateUserForm(form, { requirePassword = true } = {}) {
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

export function getVisibleTabsForRole(role) {
  if (role === "admin") return TABS;
  if (role === "operator") return TABS.filter((tab) => tab.id !== "users");
  return TABS.filter((tab) => tab.id === "assignments");
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

export function getUniqueValues(items, accessor) {
  return [...new Set(items.map(accessor).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ru"));
}

export function getInitials(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "—";
}

export function getProgressPercent(completedCount, assignedCount) {
  if (!assignedCount) return 0;
  return Math.max(0, Math.min(100, Math.round((completedCount / assignedCount) * 100)));
}

export function getFirstActiveUserId(users) {
  return users.find((user) => user.is_active)?.user_id || null;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "—";
}

export function getPresenceLabel(value) {
  return PRESENCE_LABELS[value] || value || "—";
}

export function getSerialLabel(serialNumber, serialState) {
  if (serialNumber) return serialNumber;
  return SERIAL_LABELS[serialState] || serialState || "—";
}

export function getPnrLabel(value) {
  return PNR_LABELS[value] || value || "—";
}

export function getCommunicationsLabel(value) {
  return COMMUNICATIONS_LABELS[value] || value || "—";
}

export function getPresenceTone(status) {
  if (status === "found" || status === "moved_to_room") return "success";
  if (status === "missing" || status === "conflict") return "danger";
  if (status === "not_checked") return "warning";
  return "soft";
}

export function getUserStatusLabel(status) {
  if (status === "in_progress") return "В работе";
  if (status === "idle") return "Простаивает";
  return "Свободен";
}

export function getUserStatusTone(status) {
  if (status === "in_progress") return "success";
  if (status === "idle") return "danger";
  return "warning";
}

export function getAssignmentStatusLabel(status) {
  if (status === "completed") return "Завершено";
  if (status === "in_progress") return "В работе";
  if (status === "not_started") return "Не начато";
  return "Не назначено";
}

export function getAssignmentStatusTone(status) {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warning";
  if (status === "not_started") return "danger";
  return "soft";
}

export function getRoomProgressClass(room) {
  if (room.status_flags?.has_missing_items || room.status_flags?.has_conflict_items) return "problem";
  if (room.completed_at) return "done";
  if (room.status_flags?.has_unchecked_items || room.status_flags?.has_no_serial_items || room.status_flags?.has_pnr_attention_items) return "attention";
  return "neutral";
}

export function getControlRoomOptions(rooms, floorCode, departmentName) {
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

export function collectFloorRoomIds(floor) {
  return floor.departments.flatMap((department) => department.rooms.map((room) => room.room_id));
}

export function collectDepartmentRoomIds(department) {
  return department.rooms.map((room) => room.room_id);
}

export function buildSelectionMap(options) {
  return new Set(options?.selected_room_ids || []);
}

export function countSelection(roomIds, selectionSet) {
  return roomIds.reduce((acc, roomId) => acc + (selectionSet.has(roomId) ? 1 : 0), 0);
}

export function buildEditForm(user, emptyUserForm) {
  if (!user) return emptyUserForm;
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

export function buildAuthFromUser(user, fallbackAuth = null) {
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

export function getRoomActivitySummary(roomDetail) {
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

export function getAssignmentUserSummary(users) {
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

export function getDirectorySummary(users) {
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

export function getGroupSummary(group) {
  return {
    assigned: group?.assigned_rooms_count || 0,
    completed: group?.completed_rooms_count || 0,
    inProgress: group?.in_progress_rooms_count || 0,
    notStarted: group?.not_started_rooms_count || 0,
  };
}

export function getConflictStatusLabel(status) {
  if (status === "open") return "Открыт";
  if (status === "resolved") return "Решен";
  if (status === "dismissed") return "Отклонен";
  return status || "—";
}

export function getConflictStatusTone(status) {
  if (status === "resolved") return "success";
  if (status === "dismissed") return "soft";
  return "danger";
}

export function getConflictTypeLabel(conflictType) {
  if (conflictType === "presence_mismatch") return "Расхождение по наличию";
  if (conflictType === "serial_mismatch") return "Расхождение по серийному номеру";
  if (conflictType === "pnr_mismatch") return "Расхождение по ПНР";
  if (conflictType === "communications_mismatch") return "Расхождение по коммуникациям";
  if (conflictType === "parallel_room_activity") return "Параллельная работа по помещению";
  return conflictType || "—";
}

export function getExportSummary(rows) {
  const total = rows.length;
  const checked = rows.filter((row) => row.current_presence_status && row.current_presence_status !== "not_checked").length;
  const problem = rows.filter((row) => row.current_presence_status === "missing" || row.current_presence_status === "conflict").length;
  const withSerial = rows.filter((row) => row.serial_state === "serial_entered" && row.serial_number).length;
  return {
    total,
    checked,
    problem,
    withSerial,
  };
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!text.includes(";") && !text.includes('"') && !text.includes("\n")) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildExportCsv(rows) {
  const headers = [
    "Этаж",
    "Отделение",
    "Помещение",
    "Позиция",
    "Оборудование",
    "Экземпляр",
    "Наличие",
    "Серийный номер",
    "ПНР",
    "Коммуникации",
    "Дата проверки",
    "Сотрудник",
  ];

  const lines = rows.map((item) => [
    item.floor_code || "—",
    item.department_name || "—",
    `${item.room_code || "—"} — ${item.room_name || "—"}`,
    item.position_code || "—",
    item.equipment_name || "—",
    item.display_label || "—",
    getPresenceLabel(item.current_presence_status),
    getSerialLabel(item.serial_number, item.serial_state),
    getPnrLabel(item.pnr_status),
    getCommunicationsLabel(item.communications_status),
    formatDate(item.last_check_at),
    item.last_checked_by_name || "—",
  ]);

  return [headers, ...lines]
    .map((row) => row.map(escapeCsv).join(";"))
    .join("\n");
}
