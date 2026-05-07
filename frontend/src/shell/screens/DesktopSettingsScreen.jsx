import {
  SaveOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  SyncOutlined,
  DatabaseOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  SafetyOutlined,
  HistoryOutlined,
  ToolOutlined,
  WarningOutlined,
  FundViewOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  PoweroffOutlined,
  WifiOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import "../styles/settingsScreen.css";
import {
  SETTINGS_STATUS_CARDS,
  SYNC_TOGGLES,
  REGISTRY_CHECKS,
  FILE_STORAGE_STATS,
  SECURITY_TOGGLES,
  JOURNAL_SELECTS_LEFT,
  JOURNAL_TOGGLES,
  JOURNAL_STATS,
  MAINTENANCE_TOOLS,
  DIAG_METRICS,
  DIAG_BARS,
  EVENT_LOG,
} from "../data/settingsScreenData.js";

/* ── Toggle component ── */
function Toggle({ checked }) {
  return (
    <label className="st-toggle">
      <input type="checkbox" defaultChecked={checked} />
      <span className="st-toggle-track" />
      <span className="st-toggle-thumb" />
    </label>
  );
}

/* ── Status cards row ── */
function StatusCards() {
  return (
    <div className="st-status-row">
      {SETTINGS_STATUS_CARDS.map((card) => (
        <div key={card.label} className="st-status-card">
          <p className="st-status-card-label">{card.label}</p>
          <p className="st-status-card-value">{card.value}</p>
          {card.progress != null ? (
            <div className="st-progress-bar">
              <div className="st-progress-fill" style={{ width: `${card.progress}%` }} />
            </div>
          ) : (
            <p className={`st-status-card-sub ${card.subTone}`}>{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Server / API card ── */
function ServerCard() {
  return (
    <div className="st-card">
      <div className="st-card-header">
        <h3 className="st-card-title">
          <ApiOutlined className="st-card-title-icon" aria-hidden="true" />
          Параметры узла и API
        </h3>
        <span className="st-card-badge-green">API OK</span>
      </div>
      <div className="st-field-group">
        <div className="st-field">
          <label className="st-field-label">Адрес сервера</label>
          <input className="st-field-input" type="text" defaultValue="http://localhost:8080" />
        </div>
        <div className="st-field">
          <label className="st-field-label">Название сервера</label>
          <input className="st-field-input" type="text" defaultValue="InfoCollect Local Server" />
        </div>
        <div className="st-fields-row">
          <div className="st-field">
            <label className="st-field-label">Режим</label>
            <select className="st-field-select">
              <option>Production</option>
              <option>Development</option>
            </select>
          </div>
          <div className="st-field">
            <label className="st-field-label">Последняя проверка</label>
            <div className="st-field-value">14:45:12</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sync card ── */
function SyncCard() {
  return (
    <div className="st-card">
      <div className="st-card-header">
        <h3 className="st-card-title">
          <SyncOutlined className="st-card-title-icon" aria-hidden="true" />
          Параметры синхронизации
        </h3>
        <div className="st-card-badge-blue">
          <span className="st-card-badge-blue-dot" />
          В ОЧЕРЕДИ: 12
        </div>
      </div>
      <div className="st-field-group">
        <div className="st-toggle-row">
          <span className="st-toggle-label">Интервал синхронизации</span>
          <select className="st-journal-select" style={{ width: 120 }}>
            <option>5 минут</option>
            <option>15 минут</option>
            <option>1 час</option>
          </select>
        </div>
        {SYNC_TOGGLES.map((t) => (
          <div key={t.label} className="st-toggle-row">
            <span className="st-toggle-label">{t.label}</span>
            <Toggle checked={t.checked} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Registry card ── */
function RegistryCard() {
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 16 }}>
        <DatabaseOutlined className="st-card-title-icon" aria-hidden="true" />
        Управление мастер-данными
      </h3>
      <div className="st-registry-meta">
        <div className="st-registry-meta-row">
          <span>Файл:</span>
          <span className="st-registry-meta-val">master_equipment_v3.xlsx</span>
        </div>
        <div className="st-registry-meta-row">
          <span>Импорт:</span>
          <span className="st-registry-meta-val">12.10.2023, 14:20</span>
        </div>
      </div>
      <div className="st-field-group" style={{ marginBottom: 16 }}>
        {REGISTRY_CHECKS.map((c) => (
          <label key={c.label} className="st-checkbox-row">
            <input className="st-checkbox" type="checkbox" defaultChecked={c.checked} />
            {c.label}
          </label>
        ))}
      </div>
      <div className="st-registry-bottom">
        <div className="st-field" style={{ flex: 1 }}>
          <label className="st-field-label">Хранение истории</label>
          <select className="st-field-select" style={{ height: 36, fontSize: 12 }}>
            <option>12 месяцев</option>
            <option>24 месяца</option>
          </select>
        </div>
        <button className="st-btn-import" type="button">Импорт нового</button>
      </div>
    </div>
  );
}

/* ── Files & Photos card ── */
function FilesCard() {
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 16 }}>
        <CameraOutlined className="st-card-title-icon" aria-hidden="true" />
        Файлы и фото
      </h3>
      <div className="st-file-stats">
        {FILE_STORAGE_STATS.map((s) => (
          <div key={s.label} className="st-file-stat">
            <p className="st-file-stat-label">{s.label}</p>
            <p className="st-file-stat-value">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="st-field-group">
        <div className="st-toggle-row">
          <span className="st-toggle-label">Сжатие изображений</span>
          <Toggle checked={true} />
        </div>
        <div className="st-fields-row">
          <div className="st-field">
            <label className="st-field-label">Качество</label>
            <select className="st-field-select" style={{ height: 38, fontSize: 12 }}>
              <option>Среднее</option>
              <option>Высокое</option>
            </select>
          </div>
          <div className="st-field">
            <label className="st-field-label">Лимит файла</label>
            <select className="st-field-select" style={{ height: 38, fontSize: 12 }}>
              <option>10 MB</option>
              <option>25 MB</option>
            </select>
          </div>
        </div>
        <div className="st-field">
          <label className="st-field-label">Форматы</label>
          <div className="st-format-tags">
            {["JPG","PNG","PDF","XLSX"].map((f) => (
              <span key={f} className="st-format-tag">{f}</span>
            ))}
          </div>
        </div>
        <div className="st-field">
          <label className="st-field-label">Путь к хранилищу</label>
          <div className="st-path-row">
            <input
              className="st-path-input"
              readOnly
              defaultValue="/data/infocollect/storage"
            />
            <button className="st-path-btn" type="button" aria-label="Выбрать папку">
              <FolderOpenOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Backup card ── */
function BackupCard() {
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 16 }}>
        <CloudUploadOutlined className="st-card-title-icon" aria-hidden="true" />
        Резервное копирование
      </h3>
      <div className="st-field-group" style={{ marginBottom: 10 }}>
        <div className="st-toggle-row">
          <span className="st-toggle-label">Авто-бэкап активен</span>
          <Toggle checked={true} />
        </div>
        <div className="st-fields-row">
          <div className="st-field">
            <label className="st-field-label">Расписание</label>
            <input className="st-field-input" type="time" defaultValue="02:00" style={{ height: 38, fontSize: 13 }} />
          </div>
          <div className="st-field">
            <label className="st-field-label">Срок хранения</label>
            <select className="st-field-select" style={{ height: 38, fontSize: 12 }}>
              <option>30 дней</option>
              <option>90 дней</option>
            </select>
          </div>
        </div>
        <div className="st-field">
          <label className="st-field-label">Путь бэкапа</label>
          <input
            className="st-field-input st-field-input-readonly"
            readOnly
            defaultValue="/data/infocollect/backups"
            style={{ fontSize: 12 }}
          />
        </div>
      </div>
      <div className="st-backup-ok">
        <span className="st-backup-ok-text">Последняя копия: 14:45</span>
        <span className="st-backup-ok-text">Статус: OK</span>
      </div>
      <div className="st-backup-actions">
        <button className="st-btn-backup-primary" type="button">Создать копию</button>
        <button className="st-btn-backup-secondary" type="button">Восстановить</button>
      </div>
      <p className="st-backup-warn">Внимание: восстановление перезапишет текущие данные!</p>
    </div>
  );
}

/* ── Security card ── */
function SecurityCard() {
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 16 }}>
        <SafetyOutlined className="st-card-title-icon" aria-hidden="true" />
        Безопасность и доступ
      </h3>
      <div className="st-field-group">
        {SECURITY_TOGGLES.map((t) => (
          <div key={t.label} className="st-toggle-row">
            <span className="st-toggle-label">{t.label}</span>
            <Toggle checked={t.checked} />
          </div>
        ))}
        <div className="st-field">
          <label className="st-field-label">Тайм-аут (Админ)</label>
          <select className="st-field-select">
            <option>8 часов</option>
            <option>4 часа</option>
            <option>1 час</option>
          </select>
        </div>
        <div className="st-field">
          <label className="st-field-label">Тайм-аут (Оператор)</label>
          <select className="st-field-select">
            <option>24 часа</option>
            <option>12 часов</option>
            <option>Бессрочно</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ── Journal card (full-width) ── */
function JournalCard() {
  return (
    <div className="st-card st-card-full">
      <div className="st-card-header">
        <h3 className="st-card-title">
          <HistoryOutlined className="st-card-title-icon" aria-hidden="true" />
          Журнал и история
        </h3>
        <div className="st-journal-header-stats">
          {JOURNAL_STATS.map((s) => (
            <div key={s.label} className="st-journal-stat">
              <p className={`st-journal-stat-label${s.tone === "red" ? " red" : ""}`}>{s.label}</p>
              <p className={`st-journal-stat-value${s.tone === "red" ? " red" : ""}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="st-journal-body">
        <div className="st-field-group">
          {JOURNAL_SELECTS_LEFT.map((row) => (
            <div key={row.label} className="st-journal-select-row">
              <span className="st-journal-select-label">{row.label}</span>
              <select className="st-journal-select">
                {row.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="st-field-group">
          {JOURNAL_TOGGLES.map((t) => (
            <div key={t.label} className="st-toggle-row">
              <span className="st-toggle-label">{t.label}</span>
              <Toggle checked={t.checked} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Maintenance card ── */
function MaintenanceCard() {
  const ICON_MAP = {
    database: DatabaseOutlined,
    check:    CheckOutlined,
    clean:    ToolOutlined,
    download: DownloadOutlined,
  };
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 20 }}>
        <ToolOutlined className="st-card-title-icon" aria-hidden="true" />
        Обслуживание системы
      </h3>
      <div className="st-maint-body">
        <div>
          <p className="st-maint-subtitle">Инструменты</p>
          {MAINTENANCE_TOOLS.map((t) => {
            const Icon = ICON_MAP[t.icon] || ToolOutlined;
            const Chevron = t.chevron === "download" ? DownloadOutlined : null;
            return (
              <button key={t.label} className="st-maint-tool-btn" type="button">
                <span className="st-maint-tool-left">
                  <Icon className="st-maint-tool-icon" aria-hidden="true" />
                  <span className="st-maint-tool-label">{t.label}</span>
                </span>
                {Chevron
                  ? <Chevron className="st-maint-tool-chevron" aria-hidden="true" />
                  : <span className="st-maint-tool-chevron">›</span>
                }
              </button>
            );
          })}
          <button className="st-btn-restart" type="button">
            <PoweroffOutlined aria-hidden="true" />
            Перезапустить сервис
          </button>
        </div>
        <div className="st-danger-zone">
          <p className="st-danger-title">
            <WarningOutlined className="st-danger-title-icon" aria-hidden="true" />
            Опасная зона
          </p>
          <div className="st-danger-btns">
            <button className="st-btn-danger-outline" type="button">Сбросить очередь синхронизации</button>
            <button className="st-btn-danger-outline" type="button">Очистить кэш системы</button>
          </div>
          <button className="st-btn-danger-solid" type="button">Сбросить системные настройки</button>
          <p className="st-danger-note">Это действие необратимо и приведёт к потере конфигурации.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Right: Diagnostics ── */
function DiagCard() {
  const metricValClass = {
    primary: "st-diag-metric-val-primary",
    red:     "st-diag-metric-val-red",
    orange:  "st-diag-metric-val-orange",
  };
  return (
    <div className="st-diag-card">
      <div className="st-diag-header">
        <h3 className="st-diag-title">Системная диагностика</h3>
        <FundViewOutlined className="st-diag-monitor-icon" aria-hidden="true" />
      </div>

      <div className="st-diag-uptime-block">
        <div className="st-diag-uptime-top">
          <span>Сервер</span>
          <span className="st-diag-status-ok">СТАБИЛЬНО</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="st-diag-uptime-value">99.8%</span>
          <span className="st-diag-uptime-sub">Uptime</span>
        </div>
      </div>

      <div className="st-diag-metrics">
        {DIAG_METRICS.map((m) => (
          <div key={m.label} className="st-diag-metric-row">
            <span className="st-diag-metric-label">{m.label}</span>
            <span className={metricValClass[m.tone]}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="st-diag-bar-group">
        {DIAG_BARS.map((b) => (
          <div key={b.label} className="st-diag-bar-row">
            <div className="st-diag-bar-top">
              <span>{b.label}</span>
              <span style={{ color: "#1a1b22" }}>{b.value}%</span>
            </div>
            <div className="st-diag-bar-track">
              <div
                className="st-diag-bar-fill"
                style={{ width: `${b.value}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="st-btn-check-system" type="button">
        <WifiOutlined aria-hidden="true" />
        Проверить систему
      </button>

      <div className="st-event-log">
        <p className="st-event-log-title">Журнал событий</p>
        <div className="st-event-log-list">
          {EVENT_LOG.map((e) => (
            <div key={e.title} className="st-event-item">
              <span className={`st-event-dot ${e.tone}`} />
              <div>
                <p className="st-event-title">{e.title}</p>
                <p className="st-event-time">{e.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="st-event-log-link" type="button">Все события (86)</button>
      </div>
    </div>
  );
}

/* ── Main screen ── */
export function DesktopSettingsScreen() {
  return (
    <div className="desktop-screen st-screen">

      {/* Page header */}
      <div className="st-page-header">
        <h1 className="st-page-title">Системные настройки</h1>
        <p className="st-page-sub">Конфигурация сервера, синхронизации, хранения данных и безопасности</p>
      </div>

      {/* Action bar */}
      <div className="st-action-bar">
        <div className="st-action-bar-left">
          <div className="st-unsaved-badge">
            <WarningOutlined style={{ fontSize: 13 }} aria-hidden="true" />
            Есть несохранённые изменения
          </div>
          <button className="st-btn-save" type="button">
            <SaveOutlined aria-hidden="true" />
            Сохранить изменения
          </button>
        </div>
        <div className="st-action-bar-right">
          <button className="st-btn-text" type="button">
            <WifiOutlined aria-hidden="true" />
            Проверить подключение
          </button>
          <button className="st-btn-text" type="button">
            <CloudUploadOutlined aria-hidden="true" />
            Создать резервную копию
          </button>
          <button className="st-btn-text" type="button">
            <DownloadOutlined aria-hidden="true" />
            Экспорт настроек
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="st-info-banner">
        <InfoCircleOutlined className="st-info-banner-icon" aria-hidden="true" />
        <p className="st-info-banner-text">
          Изменения системных параметров могут повлиять на работу мобильных операторов.
          Проверьте настройки перед сохранением.
        </p>
      </div>

      {/* Status row */}
      <StatusCards />

      {/* Main layout */}
      <div className="st-body">
        <div className="st-main-col">
          <div className="st-config-grid">
            <ServerCard />
            <SyncCard />
            <RegistryCard />
            <FilesCard />
            <BackupCard />
            <SecurityCard />
            <JournalCard />
          </div>
          <MaintenanceCard />
        </div>
        <div className="st-side-col">
          <DiagCard />
        </div>
      </div>

      {/* Footer */}
      <footer className="st-footer">
        <p className="st-footer-text">InfoCollect MVP v0.1 • Локальная установка</p>
      </footer>

    </div>
  );
}
