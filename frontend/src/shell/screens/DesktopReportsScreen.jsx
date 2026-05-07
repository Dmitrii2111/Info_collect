import {
  FileTextOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  SafetyOutlined,
  PlusOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  SearchOutlined,
  MoreOutlined,
  LeftOutlined,
  RightOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RedoOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import "../styles/reportsScreen.css";
import "../styles/desktopScreenCommon.css";

/* ─── static data ─── */

const KPI_CARDS = [
  { label: "Всего отчётов", value: "64", tone: "default" },
  { label: "Готово", value: "51", tone: "green" },
  { label: "Формируются", value: "4", tone: "amber" },
  { label: "Ошибки", value: "2", tone: "red" },
  { label: "Запланировано", value: "7", tone: "slate" },
];

const REPORT_TYPES = [
  {
    icon: FileTextOutlined,
    iconTone: "blue",
    badge: "PDF",
    badgeTone: "red",
    title: "Отчёт по инспекции",
    desc: "Полный результат проверки объекта с фотографиями и статусами.",
  },
  {
    icon: UnorderedListOutlined,
    iconTone: "slate",
    badge: "XLS",
    badgeTone: "green",
    title: "Отчёт по расхождениям",
    desc: "Список несовпадений между учетными и фактическими данными.",
  },
  {
    icon: SyncOutlined,
    iconTone: "slate",
    badge: "CSV",
    badgeTone: "slate",
    title: "Журнал синхронизации",
    desc: "История обмена данными с центральной базой и терминалами.",
  },
  {
    icon: SafetyOutlined,
    iconTone: "slate",
    badge: "PDF",
    badgeTone: "red",
    title: "Журнал аудита",
    desc: "Лог действий пользователей в системе для контроля безопасности.",
  },
];

const SCHEDULED = [
  { icon: ClockCircleOutlined, tone: "amber", title: "Ежедневный отчёт по расхождениям", sub: "Ежедневно, 08:00" },
  { icon: SyncOutlined, tone: "blue", title: "Журнал синхронизации", sub: "Пн, Ср, Пт, 22:00" },
  { icon: InboxOutlined, tone: "purple", title: "Архив инспекций", sub: "1-е число месяца" },
];

const HISTORY_ROWS = [
  {
    date: "Сегодня, 10:15",
    name: "Отчёт_критич_ошибки",
    type: "Инспекция",
    object: "Цех №5",
    inspection: "#INS-2024-042",
    format: "PDF",
    formatTone: "red",
    status: "Ошибка",
    statusTone: "error",
    author: "Иван Иванов",
    rowTone: "error",
  },
  {
    date: "Сегодня, 09:42",
    name: "Отчёт_№142_А",
    type: "Инспекция",
    object: "Корпус А",
    inspection: "#INS-2024-001",
    format: "PDF",
    formatTone: "red",
    status: "Готово",
    statusTone: "success",
    author: "Иван Иванов",
    rowTone: null,
  },
  {
    date: "Сегодня, 09:20",
    name: "Журнал_синк_финал",
    type: "Синхронизация",
    object: "Все терминалы",
    inspection: null,
    format: "CSV",
    formatTone: "slate",
    status: "Формируется",
    statusTone: "warning",
    author: "Петр Петров",
    rowTone: null,
  },
  {
    date: "Вчера, 16:30",
    name: "Свод_Расхожд_04",
    type: "Расхождения",
    object: "Склад Центр",
    inspection: null,
    format: "XLS",
    formatTone: "green",
    status: "Готово",
    statusTone: "success",
    author: "Анна Сидорова",
    rowTone: null,
  },
];

/* ─── KPI card ─── */

function KpiCard({ label, value, tone }) {
  return (
    <div className={`rp-kpi-card rp-kpi-${tone}`}>
      <span className="rp-kpi-label">{label}</span>
      <span className="rp-kpi-value">{value}</span>
    </div>
  );
}

/* ─── Report type card ─── */

function ReportTypeCard({ icon: Icon, iconTone, badge, badgeTone, title, desc }) {
  return (
    <div className="rp-type-card">
      <div className="rp-type-card-header">
        <div className={`rp-type-icon rp-icon-${iconTone}`}>
          <Icon />
        </div>
        <span className={`rp-format-badge rp-badge-${badgeTone}`}>{badge}</span>
      </div>
      <h4 className="rp-type-title">{title}</h4>
      <p className="rp-type-desc">{desc}</p>
      <button className="rp-type-btn" type="button">Создать отчёт</button>
    </div>
  );
}

/* ─── Scheduled item ─── */

function ScheduledItem({ icon: Icon, tone, title, sub }) {
  return (
    <div className="rp-scheduled-item">
      <span className={`rp-sched-icon rp-sched-${tone}`}><Icon /></span>
      <div>
        <p className="rp-sched-title">{title}</p>
        <p className="rp-sched-sub">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Status pill ─── */

function StatusPill({ status, tone }) {
  return (
    <span className={`rp-status-pill rp-status-${tone}`}>
      <span className="rp-status-dot" />
      {status}
    </span>
  );
}

/* ─── Format badge ─── */

function FormatBadge({ format, tone }) {
  return <span className={`rp-format-badge rp-badge-${tone}`}>{format}</span>;
}

/* ─── Main screen ─── */

export function DesktopReportsScreen() {
  return (
    <div className="desktop-screen rp-screen">

      {/* Header */}
      <div className="rp-header">
        <div>
          <h1 className="rp-header-title">Отчёты</h1>
          <p className="rp-header-sub">Формирование, скачивание и история отчётов по инспекциям</p>
        </div>
        <div className="rp-header-actions">
          <span className="rp-updated-label">Обновлено: сегодня, 09:42</span>
          <button className="rp-btn-secondary" type="button">
            <ReloadOutlined /> Обновить
          </button>
          <button className="rp-btn-primary" type="button">
            <PlusOutlined /> Сформировать отчёт
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="rp-kpi-grid">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Top section: type grid + form panel */}
      <h3 className="rp-section-title">Типы отчётов</h3>
      <div className="rp-top-grid">

        {/* Left: report types + scheduled */}
        <div className="rp-top-left">
          <div className="rp-types-grid">
            {REPORT_TYPES.map((t) => (
              <ReportTypeCard key={t.title} {...t} />
            ))}
          </div>

          {/* Scheduled block */}
          <div className="rp-scheduled-block">
            <div className="rp-scheduled-header">
              <div className="rp-scheduled-header-left">
                <ScheduleOutlined className="rp-sched-heading-icon" />
                <h4 className="rp-scheduled-title">Запланированные отчёты</h4>
              </div>
              <button className="rp-link-btn" type="button">Управление расписанием</button>
            </div>
            <div className="rp-scheduled-grid">
              {SCHEDULED.map((s) => (
                <ScheduledItem key={s.title} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: new report form */}
        <div className="rp-top-right">
          <div className="rp-form-panel">
            <h3 className="rp-form-title">
              <FilePdfOutlined className="rp-form-title-icon" />
              Новый отчёт
            </h3>
            <div className="rp-form-fields">
              <div className="rp-field">
                <label className="rp-field-label">Тип отчёта</label>
                <select className="rp-select">
                  <option>Отчёт по инспекции</option>
                  <option>Отчёт по расхождениям</option>
                  <option>Журнал синхронизации</option>
                </select>
              </div>
              <div className="rp-field-row">
                <div className="rp-field">
                  <label className="rp-field-label">Инспекция</label>
                  <select className="rp-select">
                    <option>#INS-2024-042</option>
                    <option>#INS-2024-001</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label className="rp-field-label">Объект</label>
                  <select className="rp-select">
                    <option>Цех №5</option>
                    <option>Корпус А</option>
                  </select>
                </div>
              </div>
              <div className="rp-field-row">
                <div className="rp-field">
                  <label className="rp-field-label">Период</label>
                  <select className="rp-select">
                    <option>Сегодня</option>
                    <option>Последние 7 дней</option>
                    <option>За месяц</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label className="rp-field-label">Формат</label>
                  <div className="rp-format-btns">
                    <button className="rp-format-btn is-active" type="button">PDF</button>
                    <button className="rp-format-btn" type="button">XLS</button>
                    <button className="rp-format-btn" type="button">CSV</button>
                  </div>
                </div>
              </div>
              <div className="rp-checkboxes">
                <label className="rp-checkbox-row">
                  <input className="rp-checkbox" defaultChecked type="checkbox" />
                  <span>Включить фотофиксацию</span>
                </label>
                <label className="rp-checkbox-row">
                  <input className="rp-checkbox" type="checkbox" />
                  <span>История изменений</span>
                </label>
                <label className="rp-checkbox-row">
                  <input className="rp-checkbox" type="checkbox" />
                  <span>Список расхождений</span>
                </label>
              </div>
              <div className="rp-form-actions">
                <button className="rp-form-reset" type="button">Сбросить</button>
                <button className="rp-form-submit" type="button">Сформировать</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="rp-filter-panel">
        <div className="rp-search-wrap">
          <SearchOutlined className="rp-search-icon" />
          <input className="rp-search-input" placeholder="Поиск по названию или объекту..." type="text" />
        </div>
        <select className="rp-filter-select">
          <option>Тип: Все</option>
        </select>
        <select className="rp-filter-select">
          <option>Автор: Любой</option>
        </select>
        <div className="rp-filter-pills">
          <button className="rp-filter-pill is-active" type="button">Все</button>
          <button className="rp-filter-pill" type="button">Готово</button>
          <button className="rp-filter-pill" type="button">Формируются</button>
          <button className="rp-filter-pill" type="button">Ошибки</button>
        </div>
      </div>

      {/* Bottom split: table + details */}
      <div className="rp-bottom-split">

        {/* History table */}
        <div className="rp-table-card">
          <div className="rp-table-header">
            <h3 className="rp-table-title">История отчётов</h3>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Объект / инспекция</th>
                  <th className="rp-th-center">Формат</th>
                  <th className="rp-th-center">Статус</th>
                  <th>Автор</th>
                  <th className="rp-th-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY_ROWS.map((row) => (
                  <tr key={row.name} className={row.rowTone === "error" ? "rp-row-error" : ""}>
                    <td className="rp-td-date">{row.date}</td>
                    <td className="rp-td-name">{row.name}</td>
                    <td className="rp-td-muted">{row.type}</td>
                    <td>
                      <p className="rp-td-obj">{row.object}</p>
                      {row.inspection && <p className="rp-td-ins">{row.inspection}</p>}
                    </td>
                    <td className="rp-td-center">
                      <FormatBadge format={row.format} tone={row.formatTone} />
                    </td>
                    <td className="rp-td-center">
                      <StatusPill status={row.status} tone={row.statusTone} />
                    </td>
                    <td className="rp-td-muted">{row.author}</td>
                    <td className="rp-td-right">
                      <button className="rp-more-btn" type="button">
                        <MoreOutlined />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rp-table-footer">
            <span className="rp-table-count">Показано 4 из 64 отчётов</span>
            <div className="rp-pagination">
              <button className="rp-page-btn" type="button"><LeftOutlined /></button>
              <button className="rp-page-btn is-active" type="button">1</button>
              <button className="rp-page-btn" type="button">2</button>
              <button className="rp-page-btn" type="button">3</button>
              <span className="rp-page-ellipsis">...</span>
              <button className="rp-page-btn" type="button"><RightOutlined /></button>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div className="rp-details-panel">
          <div className="rp-details-header">
            <div>
              <h3 className="rp-details-title">Детали отчёта</h3>
              <p className="rp-details-sub">Просмотр и экспорт</p>
            </div>
            <span className="rp-details-id">ID: 8421</span>
          </div>
          <div className="rp-details-body">
            {/* Preview */}
            <div className="rp-preview-wrap">
              <div className="rp-preview-box">
                <FilePdfOutlined className="rp-preview-icon" />
                <ExclamationCircleOutlined className="rp-preview-error-icon" />
              </div>
            </div>

            {/* Detail rows */}
            <div className="rp-detail-rows">
              {[
                ["Тип", "Инспекция"],
                ["Инспекция", "#INS-2024-042"],
                ["Объект", "Цех №5"],
                ["Размер", "—"],
                ["Создан", "Сегодня 10:15"],
                ["Статус", "Ошибка"],
              ].map(([label, val]) => (
                <div key={label} className={`rp-detail-row${label === "Статус" ? " rp-detail-row-error" : ""}`}>
                  <span className="rp-detail-label">{label}</span>
                  <span className={`rp-detail-val${label === "Статус" ? " rp-detail-val-error" : ""}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* Error block */}
            <div className="rp-error-block">
              <div className="rp-error-block-header">
                <ExclamationCircleOutlined />
                <span>Ошибка формирования</span>
              </div>
              <p className="rp-error-block-text">
                Не удалось сформировать отчёт: часть вложений недоступна. Проверьте соединение с хранилищем медиафайлов.
              </p>
              <button className="rp-retry-btn" type="button">
                <RedoOutlined /> Повторить формирование
              </button>
            </div>

            {/* Standard actions (disabled in error state) */}
            <div className="rp-std-actions rp-std-actions-disabled">
              <button className="rp-download-btn" type="button" disabled>
                <DownloadOutlined /> Скачать отчёт
              </button>
              <button className="rp-preview-btn" type="button" disabled>
                <EyeOutlined /> Открыть предпросмотр
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
