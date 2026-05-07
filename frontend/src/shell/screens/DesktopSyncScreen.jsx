import {
  SyncOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ControlOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  SwapOutlined,
  MoreOutlined,
  EyeOutlined,
  CloseOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import "../styles/syncScreen.css";

/* ── Static data ── */
const STATS = [
  {
    label: "Всего событий",
    value: "124",
    badge: "+5%",
    badgeTone: "is-success-text",
  },
  {
    label: "В очереди",
    value: "12",
    badge: "Warning",
    badgeTone: "is-warning-text",
    tone: "is-warning",
  },
  {
    label: "Ошибки",
    value: "3",
    badge: "Critical",
    badgeTone: "is-error-text",
    valueTone: "is-error",
    tone: "is-error",
  },
  {
    label: "Конфликты",
    value: "2",
    badge: "Manual",
    badgeTone: "is-error-text",
    valueTone: "is-error",
    tone: "is-error",
  },
  {
    label: "Синхронизировано",
    value: "107",
    iconCheck: true,
    tone: "is-success",
  },
];

const QUEUE_ROWS = [
  {
    time: "14:20:05",
    inspection: "INSP-9012",
    operator: "Петров А.",
    type: "Комментарий",
    object: "Генератор G1 (Основной блок)",
    status: "Ошибка 503 (Сервер недоступен)",
    statusPill: "sync-pill-error",
    actionIcon: "more",
    selected: false,
  },
  {
    time: "14:18:42",
    inspection: "INSP-9010",
    operator: "Сидоров В.",
    type: "Отметка экземпляра",
    object: "Насосная ст. №4",
    status: "Конфликт",
    statusPill: "sync-pill-conflict",
    actionIcon: "eye",
    selected: true,
  },
  {
    time: "14:15:10",
    inspection: "INSP-8998",
    operator: "Козлов М.",
    type: "Фото",
    object: "Щит 04-B (Распределительный)",
    status: "В очереди",
    statusPill: "sync-pill-queue",
    actionIcon: "more",
    selected: false,
  },
  {
    time: "14:12:00",
    inspection: "INSP-8997",
    operator: "Иванов Д.",
    type: "Завершение помещения",
    object: "Блок 2.4 - Сектор C",
    status: "Синхронизировано",
    statusPill: "sync-pill-synced",
    actionIcon: "more",
    selected: false,
  },
  {
    time: "14:05:30",
    inspection: "INSP-8995",
    operator: "Петров А.",
    type: "Отметка экземпляра",
    object: "Трансф. T1 - Подстанция",
    status: "Конфликт данных",
    statusPill: "sync-pill-error",
    actionIcon: "more",
    selected: false,
  },
  {
    time: "13:58:12",
    inspection: "INSP-8990",
    operator: "Сидоров В.",
    type: "Комментарий",
    object: "Задвижка 12 (Входная группа)",
    status: "Синхронизировано",
    statusPill: "sync-pill-synced",
    actionIcon: "more",
    selected: false,
  },
];

/* ── KPI Card ── */
function KpiCard({ stat }) {
  return (
    <div className={`sync-kpi-card${stat.tone ? ` ${stat.tone}` : ""}`}>
      <p className="sync-kpi-label">{stat.label}</p>
      <div className="sync-kpi-bottom">
        <span className={`sync-kpi-value${stat.valueTone ? ` ${stat.valueTone}` : ""}`}>
          {stat.value}
        </span>
        {stat.iconCheck ? (
          <CheckCircleFilled className="sync-kpi-icon-check" />
        ) : (
          <span className={`sync-kpi-badge${stat.badgeTone ? ` ${stat.badgeTone}` : ""}`}>
            {stat.badge}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Status pill ── */
function StatusPill({ text, pillClass }) {
  return <span className={`sync-pill ${pillClass}`}>{text}</span>;
}

/* ── Queue table row ── */
function QueueRow({ row }) {
  return (
    <tr className={row.selected ? "is-selected" : ""}>
      <td className="sync-td-time">{row.time}</td>
      <td>{row.inspection}</td>
      <td>{row.operator}</td>
      <td>{row.type}</td>
      <td className="sync-td-overflow">{row.object}</td>
      <td className="sync-td-overflow">
        <StatusPill text={row.status} pillClass={row.statusPill} />
      </td>
      <td>
        {row.actionIcon === "eye" ? (
          <EyeOutlined className={`sync-row-icon${row.selected ? " is-selected" : ""}`} />
        ) : (
          <MoreOutlined className="sync-row-icon" />
        )}
      </td>
    </tr>
  );
}

/* ── Detail panel ── */
function DetailPanel() {
  return (
    <div className="sync-detail-panel">
      <div className="sync-detail-header">
        <div className="sync-detail-header-left">
          <span className="sync-detail-eyebrow">Выбрано событие</span>
          <span className="sync-detail-id">14:18:42 • INSP-9010</span>
        </div>
        <button className="sync-detail-close">
          <CloseOutlined />
        </button>
      </div>

      <div className="sync-detail-body">
        {/* Basic info */}
        <div className="sync-detail-info">
          <div className="sync-detail-field">
            <span className="sync-detail-field-label">Инспекция</span>
            <p className="sync-detail-field-value">INSP-9010 (Еженедельный осмотр)</p>
          </div>
          <div className="sync-detail-field-row">
            <div className="sync-detail-field">
              <span className="sync-detail-field-label">Дата и время</span>
              <p className="sync-detail-field-value">23.10.2023, 14:18:42</p>
            </div>
            <div className="sync-detail-field text-right">
              <span className="sync-detail-field-label">Оператор</span>
              <p className="sync-detail-field-value">Сидоров В.</p>
            </div>
          </div>
        </div>

        {/* Conflict block */}
        <div className="sync-conflict-block">
          <div className="sync-conflict-title">
            <SwapOutlined className="sync-conflict-title-icon" />
            <span>Конфликт данных</span>
          </div>

          <div className="sync-conflict-table">
            <div className="sync-conflict-table-head">
              <div>Сервер (Master)</div>
              <div>Устройство (Local)</div>
            </div>
            <div className="sync-conflict-table-body">
              <div className="sync-conflict-col">
                <div className="sync-conflict-field">
                  <span className="sync-conflict-field-label">Давление</span>
                  <span className="sync-conflict-field-value">4.2 bar</span>
                </div>
                <div className="sync-conflict-field">
                  <span className="sync-conflict-field-label">Статус</span>
                  <span className="sync-conflict-field-value is-success">Норма</span>
                </div>
              </div>
              <div className="sync-conflict-col">
                <div className="sync-conflict-field">
                  <span className="sync-conflict-field-label is-local">Давление</span>
                  <span className="sync-conflict-field-value is-local">5.8 bar</span>
                </div>
                <div className="sync-conflict-field">
                  <span className="sync-conflict-field-label is-local">Статус</span>
                  <span className="sync-conflict-field-value is-error">Критич.</span>
                </div>
              </div>
            </div>
          </div>

          <p className="sync-conflict-note">
            Система обнаружила расхождение в показаниях между локальной копией и серверной базой.
            Выберите действие для синхронизации.
          </p>
        </div>
      </div>

      <div className="sync-detail-footer">
        <button className="sync-detail-btn-primary">Принять данные оператора</button>
        <button className="sync-detail-btn-outline">Оставить серверные данные</button>
        <button className="sync-detail-btn-danger">Игнорировать событие</button>
      </div>
    </div>
  );
}

/* ── Main screen ── */
export function DesktopSyncScreen() {
  return (
    <div className="sync-screen">
      {/* Alert */}
      <div className="sync-alert">
        <WarningOutlined className="sync-alert-icon" />
        <div className="sync-alert-body">
          <p className="sync-alert-title">Обнаружены критические ошибки синхронизации</p>
          <p className="sync-alert-sub">
            Завершение инспекций невозможно, пока конфликты не будут разрешены.
          </p>
        </div>
        <button className="sync-alert-btn">Перейти к исправлению</button>
      </div>

      {/* Action bar */}
      <div className="sync-action-bar">
        <div className="sync-action-group">
          <button className="sync-btn sync-btn-primary">
            <SyncOutlined />
            Синхронизировать всё
          </button>
          <button className="sync-btn sync-btn-outline">
            <ReloadOutlined />
            Повторить ошибки
          </button>
        </div>
        <div className="sync-action-group">
          <button className="sync-btn sync-btn-outline">
            <DownloadOutlined />
            Экспорт журнала
          </button>
          <button className="sync-btn sync-btn-muted">
            <ControlOutlined />
            Настройки
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="sync-kpi-grid">
        {STATS.map((s, i) => (
          <KpiCard key={i} stat={s} />
        ))}
      </div>

      {/* Progress */}
      <div className="sync-progress-card">
        <div className="sync-progress-header">
          <div>
            <p className="sync-progress-title">Общий прогресс синхронизации</p>
            <p className="sync-progress-sub">
              Обработка текущего пакета данных от полевых устройств
            </p>
          </div>
          <span className="sync-progress-pct">86%</span>
        </div>
        <div className="sync-progress-track">
          <div className="sync-progress-fill" style={{ width: "86%" }} />
        </div>
        <div className="sync-progress-note">
          <InfoCircleOutlined className="sync-progress-note-icon" />
          Осталось 18 объектов до полного завершения цикла обмена.
        </div>
      </div>

      {/* Filters */}
      <div className="sync-filter-card">
        <div className="sync-filter-grid">
          <div className="sync-filter-field">
            <span className="sync-filter-label">Инспекция</span>
            <select className="sync-filter-select">
              <option>Все</option>
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Оператор</span>
            <select className="sync-filter-select">
              <option>Все</option>
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Объект</span>
            <select className="sync-filter-select">
              <option>Все</option>
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Статус</span>
            <select className="sync-filter-select">
              <option>Ошибки/Конфликты</option>
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Тип события</span>
            <select className="sync-filter-select">
              <option>Все</option>
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Период</span>
            <input type="date" className="sync-filter-date" />
          </div>
          <button className="sync-filter-apply">Применить</button>
        </div>
      </div>

      {/* Chip filters */}
      <div className="sync-chips">
        <button className="sync-chip sync-chip-all">Все</button>
        <button className="sync-chip sync-chip-default">В очереди</button>
        <button className="sync-chip sync-chip-default">Ошибки</button>
        <button className="sync-chip sync-chip-conflict">Конфликты</button>
        <button className="sync-chip sync-chip-default">Синхронизировано</button>
      </div>

      {/* Split: table + detail */}
      <div className="sync-split">
        {/* Queue table */}
        <div className="sync-queue-panel">
          <div className="sync-queue-header">
            <h3 className="sync-queue-title">Очередь изменений</h3>
            <span className="sync-queue-count">Показано 6 из 12 событий</span>
          </div>

          <div className="sync-queue-table-wrap">
            <table className="sync-queue-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Инспекция</th>
                  <th>Оператор</th>
                  <th>Тип события</th>
                  <th>Объект</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {QUEUE_ROWS.map((row, i) => (
                  <QueueRow key={i} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="sync-queue-footer">
            <span className="sync-queue-footer-count">Показано 6 из 12 событий</span>
            <div className="sync-pagination">
              <button className="sync-page-btn is-active">1</button>
              <button className="sync-page-btn">2</button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <DetailPanel />
      </div>
    </div>
  );
}
