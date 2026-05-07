/* ── Системные настройки — data ── */

export const SETTINGS_STATUS_CARDS = [
  { label: "Сервер",          value: "localhost:8080",   sub: "Работает",       subTone: "green" },
  { label: "Синхронизация",   value: "Каждые 5 минут",   sub: "Авторежим",      subTone: "blue" },
  { label: "Хранилище",       value: "68% занято",       sub: null,             subTone: null,   progress: 68 },
  { label: "Резервные копии", value: "Сегодня, 02:00",   sub: "Успешно",        subTone: "green" },
  { label: "Версия",          value: "MVP v0.1",         sub: "Локальная",      subTone: "gray"  },
];

export const SYNC_TOGGLES = [
  { label: "Авто-повтор при ошибке",         checked: true  },
  { label: "Оффлайн работа (разрешено)",     checked: true  },
  { label: "Синхронизация только по Wi-Fi",  checked: false },
  { label: "Уведомления об ошибках",         checked: true  },
];

export const REGISTRY_CHECKS = [
  { label: "Проверка структуры колонок",        checked: true  },
  { label: "Сохранять предыдущую версию",       checked: true  },
  { label: "Запрещать дубликаты ID",            checked: true  },
  { label: "Блокировка при критических ошибках",checked: true  },
  { label: "Разрешать предупреждения",          checked: true  },
];

export const FILE_STORAGE_STATS = [
  { label: "Фото",   value: "18.4GB" },
  { label: "Доки",   value: "6.2GB"  },
  { label: "Отчёты", value: "2.1GB"  },
];

export const SECURITY_TOGGLES = [
  { label: "Вход по паролю (PIN)",       checked: true  },
  { label: "Смена пользователя на ТСД",  checked: false },
  { label: "Логирование действий",       checked: true  },
];

export const JOURNAL_SELECTS_LEFT = [
  { label: "Срок хранения активности",  defaultVal: "24 месяца",  options: ["24 месяца", "12 месяцев"] },
  { label: "Хранение системных логов",  defaultVal: "90 дней",    options: ["90 дней", "30 дней"] },
];

export const JOURNAL_TOGGLES = [
  { label: "Логировать тех. ошибки",          checked: true  },
  { label: "Подробный лог синхронизации",     checked: false },
  { label: "Аудит изменений настроек",        checked: true  },
];

export const JOURNAL_STATS = [
  { label: "Событий сегодня", value: "86",  tone: "normal" },
  { label: "Критических",     value: "12",  tone: "red"    },
  { label: "Системных",       value: "516", tone: "normal" },
];

export const MAINTENANCE_TOOLS = [
  { icon: "database",    label: "Переиндексация базы данных"   },
  { icon: "check",       label: "Проверка целостности данных"  },
  { icon: "clean",       label: "Очистка временных файлов"     },
  { icon: "download",    label: "Скачать пакет диагностики",   chevron: "download" },
];

export const DIAG_METRICS = [
  { label: "Активная очередь задач", value: "12",  tone: "primary" },
  { label: "Ошибки (24ч)",           value: "1",   tone: "red"     },
  { label: "Конфликты",              value: "2",   tone: "orange"  },
];

export const DIAG_BARS = [
  { label: "Загрузка процессора", value: 12,  color: "#1a1b22" },
  { label: "Занято в хранилище",  value: 68,  color: "#00288e" },
];

export const EVENT_LOG = [
  { tone: "green",  title: "Бэкап завершен",          time: "Сегодня, 02:00:15" },
  { tone: "blue",   title: "Синхронизация реестра",    time: "Сегодня, 08:30:42" },
  { tone: "gray",   title: "Вход администратора",      time: "Сегодня, 14:12:05" },
];
