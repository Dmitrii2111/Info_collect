import {
  ApartmentOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  HistoryOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  SyncOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export const DESKTOP_PRIMARY_SECTIONS = [
  {
    key: "dashboard",
    label: "Панель управления",
    icon: DashboardOutlined,
    title: "Панель управления",
    subtitle: "Ключевые показатели и состояние системы",
  },
  {
    key: "registry",
    label: "Реестр оборудования",
    icon: DatabaseOutlined,
    title: "Реестр оборудования",
    subtitle: "Структура данных, плановые позиции и сверка",
  },
  {
    key: "objects",
    label: "Объекты",
    icon: ApartmentOutlined,
    title: "Объекты",
    subtitle: "Структура зданий, помещений и зон обхода",
  },
  {
    key: "inspections",
    label: "Инспекции",
    icon: FileDoneOutlined,
    title: "Инспекции",
    subtitle: "Назначение и контроль обходов операторов",
  },
  {
    key: "warehouse",
    label: "Склад",
    icon: ShopOutlined,
    title: "Склад",
    subtitle: "Остатки, перемещения и складские операции",
  },
  {
    key: "receipts",
    label: "Поступления",
    icon: InboxOutlined,
    title: "Поступления",
    subtitle: "Приемка партий, документы и проверка поставок",
  },
  {
    key: "discrepancies",
    label: "Расхождения",
    icon: ExclamationCircleOutlined,
    title: "Расхождения",
    subtitle: "Разбор конфликтов и проблемных позиций",
  },
  {
    key: "sync",
    label: "Синхронизация",
    icon: SyncOutlined,
    title: "Синхронизация",
    subtitle: "Очередь обмена, ошибки и статус отправки",
  },
  {
    key: "history",
    label: "История",
    icon: HistoryOutlined,
    title: "История",
    subtitle: "Журнал действий пользователей и системных событий",
  },
  {
    key: "reports",
    label: "Отчёты",
    icon: BarChartOutlined,
    title: "Отчёты",
    subtitle: "Формирование, история и шаблоны отчётов",
  },
];

export const DESKTOP_ADMIN_SECTIONS = [
  {
    key: "staff",
    label: "Сотрудники",
    icon: TeamOutlined,
    title: "Сотрудники",
    subtitle: "Учетные записи, статусы и состав команды",
  },
  {
    key: "roles",
    label: "Роли и права",
    icon: SafetyCertificateOutlined,
    title: "Роли и права",
    subtitle: "Матрица разрешений и контроль доступа",
  },
  {
    key: "settings",
    label: "Системные настройки",
    icon: SettingOutlined,
    title: "Системные настройки",
    subtitle: "Параметры узла, обмена и сервисов",
  },
];

export const DESKTOP_SECTION_META = [...DESKTOP_PRIMARY_SECTIONS, ...DESKTOP_ADMIN_SECTIONS].reduce(
  (result, item) => {
    result[item.key] = item;
    return result;
  },
  {},
);
