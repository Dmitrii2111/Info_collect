import {
  AppstoreOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  InboxOutlined,
  MoreOutlined,
  PlusSquareOutlined,
  SettingOutlined,
  SyncOutlined,
  ToolOutlined,
  UserAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "../styles/desktopScreenCommon.css";
import "../styles/dashboardScreen.css";

const MATERIAL_ICON_MAP = {
  domain: HomeOutlined,
  assignment: FileTextOutlined,
  meeting_room: AppstoreOutlined,
  construction: ToolOutlined,
  warning: WarningOutlined,
  sync: SyncOutlined,
  more_vert: MoreOutlined,
  box: InboxOutlined,
  settings_input_component: SettingOutlined,
  report_problem: ExclamationCircleOutlined,
  sync_problem: SyncOutlined,
  error: CloseCircleOutlined,
  priority_high: ExclamationCircleOutlined,
  history: HistoryOutlined,
  add_box: PlusSquareOutlined,
  download: DownloadOutlined,
  person_add: UserAddOutlined,
};

function MaterialIcon({ name, className }) {
  const Icon = MATERIAL_ICON_MAP[name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}

// ── KPI Cards ────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  {
    icon: "domain",
    iconBg: "bg-blue",
    value: "3",
    label: "Объекты",
  },
  {
    icon: "assignment",
    iconBg: "bg-indigo",
    value: "12",
    label: "Инспекции",
  },
  {
    icon: "meeting_room",
    iconBg: "bg-cyan",
    value: "74",
    label: "Помещения",
  },
  {
    icon: "construction",
    iconBg: "bg-purple",
    value: "512",
    label: "Позиций оборудования",
  },
  {
    icon: "warning",
    iconBg: "bg-red",
    value: "18",
    label: "Расхождения",
    variant: "attention",
    badge: "Внимание",
  },
  {
    icon: "sync",
    iconBg: "bg-blue",
    value: "12",
    label: "Очередь синхр.",
    variant: "info",
    badge: "Инфо",
  },
];

function KpiCard({ card }) {
  return (
    <div className={`db-kpi-card${card.variant ? ` db-kpi-card--${card.variant}` : ""}`}>
      <div className="db-kpi-card__top">
        <div className={`db-kpi-icon db-kpi-icon--${card.iconBg}`}>
          <MaterialIcon name={card.icon} />
        </div>
        {card.badge ? (
          <span className={`db-kpi-badge db-kpi-badge--${card.variant}`}>{card.badge}</span>
        ) : null}
      </div>
      <p className={`db-kpi-value${card.variant === "attention" ? " db-kpi-value--red" : ""}`}>{card.value}</p>
      <p className="db-kpi-label">{card.label}</p>
    </div>
  );
}

// ── Active Inspections Table ─────────────────────────────────────────────────

const INSPECTIONS_ROWS = [
  {
    id: "#INS-2024-001",
    object: "Складской терминал А",
    zone: "Сектор 4",
    progress: 65,
    progressColor: "primary",
    operInitials: "АП",
    operTone: "blue",
    statusLabel: "В работе",
    statusTone: "blue",
  },
  {
    id: "#INS-2024-002",
    object: "Цех сборки №3",
    zone: "Конвейер B",
    progress: 5,
    progressColor: "amber",
    operInitials: "?",
    operTone: "slate",
    statusLabel: "Не начато",
    statusTone: "slate",
  },
  {
    id: "#INS-2024-005",
    object: "Логистический узел",
    zone: "Приёмка",
    progress: 88,
    progressColor: "red",
    operInitials: "МК",
    operTone: "red",
    statusLabel: "Требует внимания",
    statusTone: "red",
  },
];

function ProgressBar({ value, color }) {
  return (
    <div className="db-progress-wrap">
      <div className="db-progress-track">
        <div
          className={`db-progress-fill db-progress-fill--${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="db-progress-pct">{value}%</span>
    </div>
  );
}

function OperAvatar({ initials, tone }) {
  return (
    <div className={`db-oper-avatar db-oper-avatar--${tone}`}>{initials}</div>
  );
}

function StatusPill({ label, tone }) {
  return (
    <span className={`db-status-pill db-status-pill--${tone}`}>{label}</span>
  );
}

function ActiveInspectionsPanel() {
  return (
    <div className="db-panel">
      <div className="db-panel__header">
        <h3 className="db-panel__title">Активные инспекции</h3>
        <button className="db-panel__link" type="button">Все инспекции</button>
      </div>
      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th>№ Инспекции</th>
              <th>Объект</th>
              <th>Зона</th>
              <th>Прогресс</th>
              <th>Опер.</th>
              <th>Статус</th>
              <th className="db-table__cell--right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {INSPECTIONS_ROWS.map((row) => (
              <tr key={row.id}>
                <td className="db-table__id">{row.id}</td>
                <td>{row.object}</td>
                <td className="db-table__muted">{row.zone}</td>
                <td>
                  <ProgressBar value={row.progress} color={row.progressColor} />
                </td>
                <td>
                  <OperAvatar initials={row.operInitials} tone={row.operTone} />
                </td>
                <td>
                  <StatusPill label={row.statusLabel} tone={row.statusTone} />
                </td>
                <td className="db-table__cell--right">
                  <button className="db-table__icon-btn" type="button">
                    <MaterialIcon name="more_vert" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Warehouse Table ──────────────────────────────────────────────────────────

const WAREHOUSE_ROWS = [
  {
    icon: "box",
    name: "Кабель силовой 5×10",
    article: "EL-CB-10-5",
    qty: "150 м",
    statusLabel: "Спорная позиция",
    statusTone: "amber",
    responsible: "Петров С.",
  },
  {
    icon: "settings_input_component",
    name: "Датчик давления P-22",
    article: "SN-PR-2212",
    qty: "4 шт",
    statusLabel: "Ожидает проверки",
    statusTone: "purple",
    responsible: "Сидоров В.",
  },
];

function WarehousePanel() {
  return (
    <div className="db-panel">
      <div className="db-panel__header">
        <h3 className="db-panel__title">Склад и поступления</h3>
        <button className="db-panel__link" type="button">Управление запасами</button>
      </div>
      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th>Товар / ТМЦ</th>
              <th>ID / артикул</th>
              <th className="db-table__cell--center">Кол-во</th>
              <th>Статус</th>
              <th>Ответственный</th>
              <th className="db-table__cell--right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {WAREHOUSE_ROWS.map((row) => (
              <tr key={row.article}>
                <td>
                  <div className="db-item-cell">
                    <div className="db-item-icon">
                      <MaterialIcon name={row.icon} />
                    </div>
                    <span className="db-item-name">{row.name}</span>
                  </div>
                </td>
                <td className="db-table__mono">{row.article}</td>
                <td className="db-table__cell--center db-table__bold">{row.qty}</td>
                <td>
                  <StatusPill label={row.statusLabel} tone={row.statusTone} />
                </td>
                <td className="db-table__sm">{row.responsible}</td>
                <td className="db-table__cell--right">
                  <button className="db-action-btn" type="button">ПРИНЯТЬ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Attention Alerts ─────────────────────────────────────────────────────────

const ALERTS = [
  {
    icon: "report_problem",
    tone: "red",
    title: "Критическое расхождение: Склад А",
    text: "Обнаружена недостача 5 единиц Оборудования тип-R в ходе инспекции #INS-2024-005.",
    btnLabel: "УСТРАНИТЬ",
  },
  {
    icon: "sync_problem",
    tone: "blue",
    title: "Конфликт синхронизации",
    text: 'Терминал #04 пытается отправить данные, конфликтующие с базой сервера (Объект "Цех сборки").',
    btnLabel: "РЕШИТЬ",
  },
  {
    icon: "error",
    tone: "slate",
    title: "Ошибка валидации импорта",
    text: 'Файл "Inventory_Jan.xlsx" содержит 3 строки с неверным форматом SKU.',
    btnLabel: "ЛОГИ",
  },
];

function AttentionPanel() {
  return (
    <div className="db-panel">
      <div className="db-panel__header db-panel__header--attention">
        <h3 className="db-panel__title db-panel__title--red">
          <MaterialIcon name="priority_high" />
          Требуют внимания
        </h3>
      </div>
      <div className="db-alerts">
        {ALERTS.map((alert) => (
          <div key={alert.title} className={`db-alert db-alert--${alert.tone}`}>
            <div className={`db-alert__icon db-alert__icon--${alert.tone}`}>
              <MaterialIcon name={alert.icon} />
            </div>
            <div className="db-alert__body">
              <h4 className="db-alert__title">{alert.title}</h4>
              <p className="db-alert__text">{alert.text}</p>
            </div>
            <button className={`db-alert__btn db-alert__btn--${alert.tone}`} type="button">
              {alert.btnLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity Timeline ────────────────────────────────────────────────────────

const TIMELINE_ITEMS = [
  {
    tone: "blue",
    time: "10:45 • СЕГОДНЯ",
    actor: "Иван Иванов",
    text: "Утвердил отчет по инспекции #INS-2024-001",
  },
  {
    tone: "green",
    time: "09:12 • СЕГОДНЯ",
    actor: "Система",
    text: "Автоматическая синхронизация со складской базой завершена успешно",
  },
  {
    tone: "amber",
    time: "ВЧЕРА • 18:30",
    actor: "Алексей Петров",
    text: 'Создал новое расхождение (тип: Недостача) в Объекте "Склад А"',
  },
  {
    tone: "slate",
    time: "ВЧЕРА • 16:15",
    actor: "Мария Кузнецова",
    text: "Запросила экспорт отчета за квартал в PDF",
  },
  {
    tone: "blue",
    time: "ВЧЕРА • 14:00",
    actor: "Иван Иванов",
    text: "Назначил новую инспекцию на Цех сборки №3",
  },
];

function ActivityTimeline() {
  return (
    <div className="db-panel">
      <div className="db-panel__header">
        <h3 className="db-panel__title">Последние действия</h3>
        <MaterialIcon name="history" className="db-panel__icon-muted" />
      </div>
      <div className="db-timeline">
        {TIMELINE_ITEMS.map((item, i) => (
          <div
            key={`${item.time}-${item.actor}`}
            className={`db-timeline__item${i === TIMELINE_ITEMS.length - 1 ? " db-timeline__item--last" : ""}`}
          >
            <div className={`db-timeline__dot db-timeline__dot--${item.tone}`} />
            <small className="db-timeline__time">{item.time}</small>
            <strong className="db-timeline__actor">{item.actor}</strong>
            <p className="db-timeline__text">{item.text}</p>
          </div>
        ))}
      </div>
      <button className="db-timeline__more-btn" type="button">
        Открыть историю
      </button>
    </div>
  );
}

// ── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  return (
    <div className="db-quick-actions">
      <button className="db-quick-btn db-quick-btn--primary" type="button">
        <MaterialIcon name="add_box" />
        Создать поступление
      </button>
      <button className="db-quick-btn db-quick-btn--outline" type="button">
        <MaterialIcon name="download" />
        Экспорт отчёта
      </button>
      <button className="db-quick-btn db-quick-btn--outline" type="button">
        <MaterialIcon name="person_add" />
        Добавить сотрудника
      </button>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export function DesktopDashboardScreen() {
  return (
    <div className="db-screen">
      <QuickActions />

      {/* KPI Grid */}
      <div className="db-kpi-grid">
        {KPI_CARDS.map((card) => (
          <KpiCard key={card.label} card={card} />
        ))}
      </div>

      {/* Main 9/3 layout */}
      <div className="db-main-layout">
        {/* Left column — 9/12 */}
        <div className="db-main-col">
          <ActiveInspectionsPanel />
          <WarehousePanel />
          <AttentionPanel />
        </div>

        {/* Right column — 3/12 */}
        <div className="db-side-col">
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}
