export const TABS = [
  { id: "control", label: "Контроль" },
  { id: "warehouse", label: "Склады" },
  { id: "conflicts", label: "Конфликты" },
  { id: "assignments", label: "Назначения" },
  { id: "users", label: "Сотрудники" },
  { id: "groups", label: "Группы" },
  { id: "export", label: "Экспорт" },
];

export const ROOM_WORKLIST_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "unchecked", label: "Не проверенные" },
  { value: "missing", label: "С отсутствием" },
  { value: "conflict", label: "С конфликтами" },
  { value: "no_serial", label: "Без серийных номеров" },
  { value: "pnr_attention", label: "ПНР требует внимания" },
];

export const ITEM_WORKLIST_OPTIONS = [
  { value: "", label: "Все" },
  { value: "unchecked", label: "Не проверенные" },
  { value: "missing", label: "Отсутствующие" },
  { value: "conflict", label: "Конфликтные" },
  { value: "no_serial", label: "Без серийного номера" },
  { value: "pnr_attention", label: "ПНР требует внимания" },
];

export const PRESENCE_FILTER_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "not_checked", label: "Не проверено" },
  { value: "found", label: "Найдено" },
  { value: "missing", label: "Отсутствует" },
  { value: "conflict", label: "Конфликт" },
];

export const ROLE_OPTIONS = [
  { value: "field_worker", label: "Оператор" },
  { value: "operator", label: "Диспетчер" },
  { value: "admin", label: "Супервайзер" },
];

export const ROLE_LABELS = {
  field_worker: "Оператор",
  operator: "Диспетчер",
  admin: "Супервайзер",
};

export const EMPTY_USER_FORM = {
  login: "",
  password: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  phone: "",
  email: "",
  role: "field_worker",
};

export const EMPTY_LOGIN_FORM = {
  login: "",
  password: "",
};

export const THEME_MODE_OPTIONS = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Темная" },
];

export const THEME_ACCENT_OPTIONS = [
  { value: "forest", label: "Лес" },
  { value: "ocean", label: "Океан" },
  { value: "copper", label: "Медь" },
];

export const PRESENCE_LABELS = {
  not_checked: "Не проверено",
  found: "Найдено",
  missing: "Отсутствует",
  conflict: "Конфликт",
};

export const SERIAL_LABELS = {
  unknown: "Не указан",
  not_provided: "Не предусмотрен",
};

export const PNR_LABELS = {
  unknown: "Неизвестно",
  not_required: "Не требуется",
  not_done: "Не проведено",
  done: "Проведено",
  installation: "Монтаж",
};

export const COMMUNICATIONS_LABELS = {
  unknown: "Неизвестно",
  missing: "Отсутствуют",
  done: "Выполнены",
  error: "Выполнены с ошибками",
  not_provided: "Не предусмотрены",
};

export const LOGIN_RE = /^[A-Za-z0-9]+$/;
export const CYRILLIC_NAME_RE = /^[А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)?$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(?:\+7|7|8)\d{10}$/;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
