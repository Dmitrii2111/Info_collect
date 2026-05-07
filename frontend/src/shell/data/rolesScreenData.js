/* ── Roles Screen Data ── */

export const ROLES_KPI = [
  { label: "Ролей",          value: "3",  sub: "основные роли" },
  { label: "Сотрудников",    value: "42", sub: "с ролями" },
  { label: "Администраторов", value: "3",  sub: "активных" },
  { label: "Изменения",      value: "2",  sub: "ожидают сохранения", accent: true },
];

export const ROLE_CARDS = [
  {
    key: "admin",
    icon: "shield",
    label: "Администратор",
    desc: "Полный доступ ко всем разделам, сотрудникам, ролям и настройкам",
    count: "3 чел.",
    tags: ["Система", "Настройки"],
    selected: false,
  },
  {
    key: "dispatcher",
    icon: "manage",
    label: "Диспетчер",
    desc: "Контроль инспекций, поступлений, склада и расхождений",
    count: "12 чел.",
    tags: ["Инспекции", "Склад"],
    selected: true,
  },
  {
    key: "operator",
    icon: "tool",
    label: "Оператор",
    desc: "Выполнение назначенных инспекций и проверок на мобильном устройстве",
    count: "27 чел.",
    tags: ["Мобильный клиент", "Инспекции"],
    selected: false,
  },
];

export const MATRIX_LEGEND = [
  { color: "#2563eb", label: "Полный" },
  { color: "#16a34a", label: "Просмотр / Разрешено" },
  { color: "#ca8a04", label: "Ограничено" },
  { color: "#cbd5e1", label: "Нет доступа / Запрещено" },
];

export const MATRIX_SECTIONS = [
  {
    section: "Основные разделы",
    rows: [
      {
        label: "Панель управления",
        admin: { text: "Полный",     tone: "blue" },
        dispatcher: { text: "Просмотр",   tone: "green" },
        operator:   { text: "Нет доступа", tone: "none" },
      },
      {
        label: "Реестр оборудования",
        admin: { text: "Полный",  tone: "blue" },
        dispatcher: { text: "Полный",  tone: "blue" },
        operator:   { text: "Просмотр", tone: "green" },
      },
      {
        label: "Инспекции",
        admin: { text: "Полный",     tone: "blue" },
        dispatcher: { text: "Ограничено", tone: "yellow" },
        operator:   { text: "Полный",     tone: "blue" },
      },
    ],
  },
  {
    section: "Администрирование",
    rows: [
      {
        label: "Сотрудники",
        admin: { text: "Полный",     tone: "blue" },
        dispatcher: { text: "Нет доступа", tone: "none" },
        operator:   { text: "Нет доступа", tone: "none" },
      },
      {
        label: "Роли и права",
        admin: { text: "Полный",     tone: "blue" },
        dispatcher: { text: "Нет доступа", tone: "none" },
        operator:   { text: "Нет доступа", tone: "none" },
      },
      {
        label: "Системные настройки",
        admin: { text: "Полный",     tone: "blue" },
        dispatcher: { text: "Нет доступа", tone: "none" },
        operator:   { text: "Нет доступа", tone: "none" },
      },
    ],
  },
  {
    section: "Действия",
    rows: [
      {
        label: "Создать инспекцию",
        admin: { text: "Разрешено", tone: "green" },
        dispatcher: { text: "Разрешено", tone: "green" },
        operator:   { text: "Запрещено", tone: "none" },
      },
      {
        label: "Назначить оператора",
        admin: { text: "Разрешено", tone: "green" },
        dispatcher: { text: "Разрешено", tone: "green" },
        operator:   { text: "Запрещено", tone: "none" },
      },
      {
        label: "Проверить помещение",
        admin: { text: "Запрещено", tone: "none" },
        dispatcher: { text: "Запрещено", tone: "none" },
        operator:   { text: "Разрешено", tone: "green" },
      },
    ],
  },
];

export const DETAIL_ROLE = {
  key: "dispatcher",
  icon: "manage",
  label: "Диспетчер",
  level: "2",
  count: "8",
};

export const DETAIL_CAPABILITIES = [
  "Экспорт отчётов",
  "Назначение операторов",
  "Управление складом",
];

export const DETAIL_RESTRICTIONS = [
  "Системные настройки",
  "Изменение ролей",
  "Доступ к сотрудникам",
];

export const PENDING_CHANGES = [
  {
    role: "Диспетчер",
    desc: '"Панель управления" →',
    highlight: "Просмотр",
    highlightTone: "green",
  },
  {
    role: "Оператор",
    desc: 'Добавлено право',
    highlight: '"Фотофиксация"',
    highlightTone: "blue",
  },
];

export const HISTORY_ITEMS = [
  {
    user: "Иван Иванов",
    action: "Изменил права Диспетчера",
    time: "10:42 Сегодня",
    active: true,
  },
  {
    user: "Система",
    action: "Синхронизация завершена",
    time: "09:00 Сегодня",
    active: false,
  },
];
