/* ─── Employees screen static data ─── */

export const KPI_CARDS = [
  { label: "Всего сотрудников", value: "42", icon: "group",            tone: "blue"   },
  { label: "Активные",          value: "31", icon: "check_circle",      tone: "green"  },
  { label: "На смене",          value: "12", icon: "engineering",       tone: "amber"  },
  { label: "Офлайн",            value: "5",  icon: "person_off",        tone: "slate"  },
  { label: "Отключены",         value: "6",  icon: "block",             tone: "red"    },
  { label: "Администраторы",    value: "3",  icon: "admin_panel_settings", tone: "navy" },
];

export const TABS = ["Сотрудники", "Активность", "Отключённые", "Права доступа"];

export const ROLE_OPTIONS   = ["Все роли",        "Администратор", "Оператор", "Диспетчер"];
export const STATUS_OPTIONS = ["Все статусы",     "В сети",        "Офлайн",   "Активен",   "Отключён"];
export const ACCESS_OPTIONS = ["Уровень доступа", "Полный доступ", "Мобильный доступ", "Desktop доступ"];

export const TABLE_COLS = [
  "Сотрудник", "Логин", "Роль", "Доступ", "Статус", "Инспекции", "Активность",
];

export const EMPLOYEES = [
  {
    id:          "emp-001",
    initials:   "ИИ",
    avatarTone: "primary",
    name:       "Иван Иванов",
    email:      "ivan.ivanov@company.ru",
    phone:      "+7 (999) 123-45-67",
    login:      "ivan_admin",
    role:       "Администратор",
    roleTone:   "blue",
    access:     "Полный доступ",
    status:     "В сети",
    statusTone: "online",
    inspections:"2 инспекции",
    activity:   "Сегодня 09:42",
    isSelected: true,
  },
  {
    id:          "emp-002",
    initials:   "АС",
    avatarTone: "secondary",
    name:       "Анна Смирнова",
    email:      "a.smirnova@company.ru",
    phone:      "+7 (999) 234-56-78",
    login:      "a.smirnova",
    role:       "Оператор",
    roleTone:   "slate",
    access:     "Мобильный доступ",
    status:     "В сети",
    statusTone: "online",
    inspections:"3 инспекции",
    activity:   "Сегодня 08:15",
    isSelected: false,
  },
  {
    id:          "emp-003",
    initials:   "ПК",
    avatarTone: "tertiary",
    name:       "Пётр Кузнецов",
    email:      "p.kuznetsov@company.ru",
    phone:      "+7 (999) 345-67-89",
    login:      "p.kuznetsov",
    role:       "Диспетчер",
    roleTone:   "slate",
    access:     "Desktop доступ",
    status:     "Офлайн",
    statusTone: "offline",
    inspections:"0 инспекций",
    activity:   "Вчера 18:30",
    isSelected: false,
  },
  {
    id:          "emp-004",
    initials:   "МК",
    avatarTone: "secondary",
    name:       "Мария Котова",
    email:      "m.kotova@company.ru",
    phone:      "+7 (999) 456-78-90",
    login:      "m.kotova",
    role:       "Оператор",
    roleTone:   "slate",
    access:     "Мобильный доступ",
    status:     "Активен",
    statusTone: "online",
    inspections:"1 инспекция",
    activity:   "Сегодня 10:05",
    isSelected: false,
  },
  {
    id:          "emp-005",
    initials:   "ДВ",
    avatarTone: "tertiary",
    name:       "Дмитрий Волков",
    email:      "d.volkov@company.ru",
    phone:      "+7 (999) 567-89-01",
    login:      "d.volkov",
    role:       "Диспетчер",
    roleTone:   "slate",
    access:     "Desktop доступ",
    status:     "Отключён",
    statusTone: "disabled",
    inspections:"0 инспекций",
    activity:   "12.05.2026 16:20",
    isSelected: false,
  },
];

export const DETAIL_EMPLOYEE = EMPLOYEES[0];

export const DETAIL_INFO = [
  { icon: "mail",                  label: "ivan.ivanov@company.ru"  },
  { icon: "call",                  label: "+7 (999) 123-45-67"      },
  { icon: "shield",                label: "Уровень доступа: Полный доступ", accent: true },
  { icon: "info",                  label: "Статус: В сети"          },
  { icon: "schedule",              label: "Активность: Сегодня 09:42" },
  { icon: "sync",                  label: "Синхронизация: 09:35"    },
  { icon: "desktop_windows",       label: "Устройство: Chrome Desktop" },
  { icon: "assignment_turned_in",  label: "Инспекции: 2 назначено"  },
];

export const DETAIL_PERMISSIONS = [
  "Управление инспекциями",
  "Назначение операторов",
  "Разрешение конфликтов",
  "Управление сотрудниками",
];
