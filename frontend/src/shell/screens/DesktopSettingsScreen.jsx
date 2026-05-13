import { useEffect, useMemo, useRef, useState } from "react";
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
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
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
  BACKUP_RESTORE_OPTIONS,
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
function StatusCards({ cards }) {
  return (
    <div className="st-status-row">
      {cards.map((card) => (
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
function RegistryCard({ masterFileName, masterImportedAt, onImportNew }) {
  return (
    <div className="st-card">
      <h3 className="st-card-title" style={{ marginBottom: 16 }}>
        <DatabaseOutlined className="st-card-title-icon" aria-hidden="true" />
        Управление мастер-данными
      </h3>
      <div className="st-registry-meta">
        <div className="st-registry-meta-row">
          <span>Файл:</span>
          <span className="st-registry-meta-val">{masterFileName}</span>
        </div>
        <div className="st-registry-meta-row">
          <span>Импорт:</span>
          <span className="st-registry-meta-val">{masterImportedAt}</span>
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
        <button className="st-btn-import" type="button" onClick={onImportNew}>Импорт нового</button>
      </div>
    </div>
  );
}

/* ── Files & Photos card ── */
function FilesCard({ storagePath, onEditStoragePath }) {
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
              value={storagePath}
            />
            <button className="st-path-btn" type="button" aria-label="Изменить путь к хранилищу" onClick={onEditStoragePath}>
              <FolderOpenOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Backup card ── */
function BackupCard({ lastBackup, onCreateBackup, onRestoreBackup }) {
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
        <span className="st-backup-ok-text">Последняя копия: {lastBackup}</span>
        <span className="st-backup-ok-text">Статус: OK</span>
      </div>
      <div className="st-backup-actions">
        <button className="st-btn-backup-primary" type="button" onClick={onCreateBackup}>Создать копию</button>
        <button className="st-btn-backup-secondary" type="button" onClick={onRestoreBackup}>Восстановить</button>
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
function MaintenanceCard({
  onToolAction,
  onRestartService,
  onResetSyncQueue,
  onClearCache,
  onResetSettings,
}) {
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
              <button key={t.label} className="st-maint-tool-btn" type="button" onClick={() => onToolAction(t)}>
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
          <button className="st-btn-restart" type="button" onClick={onRestartService}>
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
            <button className="st-btn-danger-outline" type="button" onClick={onResetSyncQueue}>Сбросить очередь синхронизации</button>
            <button className="st-btn-danger-outline" type="button" onClick={onClearCache}>Очистить кэш системы</button>
          </div>
          <button className="st-btn-danger-solid" type="button" onClick={onResetSettings}>Сбросить системные настройки</button>
          <p className="st-danger-note">Это действие необратимо и приведёт к потере конфигурации.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Right: Diagnostics ── */
function DiagCard({ syncQueueCount, serviceStatus, onCheckSystem }) {
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
          <span className="st-diag-status-ok">{serviceStatus}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="st-diag-uptime-value">99.8%</span>
          <span className="st-diag-uptime-sub">Uptime</span>
        </div>
      </div>

      <div className="st-diag-metrics">
        {DIAG_METRICS.map((m) => {
          const value = m.label === "Активная очередь задач" ? String(syncQueueCount) : m.value;
          return (
            <div key={m.label} className="st-diag-metric-row">
              <span className="st-diag-metric-label">{m.label}</span>
              <span className={metricValClass[m.tone]}>{value}</span>
            </div>
          );
        })}
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

      <button className="st-btn-check-system" type="button" onClick={onCheckSystem}>
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

function SettingsStatusModal({ workflow, onClose }) {
  const isLoading = workflow.phase === "loading";

  return (
    <DesktopModalShell
      title={isLoading ? workflow.loadingTitle : workflow.successTitle}
      subtitle={isLoading ? workflow.loadingSubtitle : workflow.successSubtitle}
      onClose={onClose}
      closeDisabled={isLoading}
      size="narrow"
      footer={(
        <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose} disabled={isLoading}>
          {isLoading ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
          {isLoading ? "Выполняется" : "Закрыть"}
        </button>
      )}
    >
      <div className={`st-status-state-card ${isLoading ? "loading" : "success"}`}>
        {isLoading ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
        <div>
          <strong>{isLoading ? workflow.loadingTitle : workflow.successTitle}</strong>
          <span>{isLoading ? workflow.loadingSubtitle : workflow.successSubtitle}</span>
        </div>
      </div>
    </DesktopModalShell>
  );
}

function RestoreBackupModal({ selectedBackupId, onSelectBackup, onClose, onConfirm }) {
  return (
    <DesktopModalShell
      title="Восстановить из резервной копии"
      subtitle="Выберите локальную mock-копию для восстановления настроек"
      onClose={onClose}
      size="wide"
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onConfirm}>
            <CloudUploadOutlined aria-hidden="true" />
            Восстановить
          </button>
        </>
      )}
    >
      <div className="st-modal-warning">
        <WarningOutlined aria-hidden="true" />
        <span>Восстановление перезапишет текущую конфигурацию в mock-state.</span>
      </div>
      <div className="st-backup-choice-list">
        {BACKUP_RESTORE_OPTIONS.map((backup) => (
          <button
            key={backup.id}
            className={`st-backup-choice${backup.id === selectedBackupId ? " selected" : ""}`}
            type="button"
            onClick={() => onSelectBackup(backup.id)}
          >
            <span className="st-backup-choice-name">{backup.name}</span>
            <span className="st-backup-choice-meta">{backup.meta}</span>
          </button>
        ))}
      </div>
    </DesktopModalShell>
  );
}

function SettingsConfirmModal({
  config,
  confirmText,
  onConfirmTextChange,
  onClose,
  onConfirm,
}) {
  const isConfirmDisabled = config.requiredText && confirmText !== config.requiredText;

  return (
    <DesktopModalShell
      title={config.title}
      subtitle={config.subtitle}
      onClose={onClose}
      size="narrow"
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button
            className={`reg-modal-btn ${config.danger ? "reg-modal-btn-danger" : "reg-modal-btn-primary"}`}
            type="button"
            onClick={onConfirm}
            disabled={Boolean(isConfirmDisabled)}
          >
            <WarningOutlined aria-hidden="true" />
            {config.confirmLabel}
          </button>
        </>
      )}
    >
      <div className={`st-modal-warning${config.danger ? " danger" : ""}`}>
        <WarningOutlined aria-hidden="true" />
        <span>{config.warning}</span>
      </div>
      {config.requiredText ? (
        <label className="st-confirm-input-wrap">
          <span>Введите “{config.requiredText}” для подтверждения</span>
          <input
            className="st-field-input"
            type="text"
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
          />
        </label>
      ) : null}
    </DesktopModalShell>
  );
}

function formatUploadSize(size) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function MasterDataImportModal({
  selectedFile,
  error,
  onFileChange,
  onClose,
  onConfirm,
}) {
  return (
    <DesktopModalShell
      title="Импорт нового мастер-файла"
      subtitle="Загрузите Excel-файл с мастер-данными. Backend/API не вызывается."
      onClose={onClose}
      size="narrow"
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onConfirm} disabled={!selectedFile}>
            <CloudUploadOutlined aria-hidden="true" />
            Импортировать
          </button>
        </>
      )}
    >
      <div className="st-upload-box">
        <label className="st-upload-drop">
          <CloudUploadOutlined aria-hidden="true" />
          <span>Выберите файл .xlsx или .xls до 10 MB</span>
          <input
            className="st-upload-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileChange}
          />
        </label>
        {error ? <p className="st-upload-error">{error}</p> : null}
        {selectedFile ? (
          <div className="st-upload-selected">
            <div>
              <strong>{selectedFile.name}</strong>
              <span>{formatUploadSize(selectedFile.size)}</span>
            </div>
            <span className="st-upload-badge">Выбран</span>
          </div>
        ) : null}
      </div>
    </DesktopModalShell>
  );
}

function StoragePathModal({
  value,
  onChange,
  onClose,
  onConfirm,
}) {
  const isDisabled = !value.trim();

  return (
    <DesktopModalShell
      title="Изменить путь к хранилищу"
      subtitle="Введите локальный путь вручную. Выбор системной папки недоступен в обычном web-приложении."
      onClose={onClose}
      size="narrow"
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onConfirm} disabled={isDisabled}>
            <SaveOutlined aria-hidden="true" />
            Сохранить
          </button>
        </>
      )}
    >
      <label className="st-storage-path-field">
        <span>Путь к хранилищу</span>
        <input
          className="st-field-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </DesktopModalShell>
  );
}

/* ── Main screen ── */
export function DesktopSettingsScreen() {
  const timerRef = useRef(null);
  const [workflow, setWorkflow] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [selectedBackupId, setSelectedBackupId] = useState(BACKUP_RESTORE_OPTIONS[0]?.id ?? "");
  const [lastBackup, setLastBackup] = useState("14:45");
  const [syncQueueCount, setSyncQueueCount] = useState(12);
  const [serviceStatus, setServiceStatus] = useState("СТАБИЛЬНО");
  const [masterFileName, setMasterFileName] = useState("master_equipment_v3.xlsx");
  const [masterImportedAt, setMasterImportedAt] = useState("12.10.2023, 14:20");
  const [selectedMasterFile, setSelectedMasterFile] = useState(null);
  const [masterImportError, setMasterImportError] = useState("");
  const [storagePath, setStoragePath] = useState("/data/infocollect/storage");
  const [storagePathDraft, setStoragePathDraft] = useState("/data/infocollect/storage");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const statusCards = useMemo(() => (
    SETTINGS_STATUS_CARDS.map((card) => {
      if (card.label === "Резервные копии") {
        return { ...card, value: `Сегодня, ${lastBackup}` };
      }
      if (card.label === "Синхронизация") {
        return {
          ...card,
          sub: syncQueueCount > 0 ? `В очереди: ${syncQueueCount}` : "Очередь пуста",
          subTone: syncQueueCount > 0 ? "blue" : "green",
        };
      }
      return card;
    })
  ), [lastBackup, syncQueueCount]);

  const startWorkflow = (config, onSuccess) => {
    window.clearTimeout(timerRef.current);
    setConfirmConfig(null);
    setWorkflow({ ...config, phase: "loading" });
    timerRef.current = window.setTimeout(() => {
      onSuccess?.();
      setWorkflow({ ...config, phase: "success" });
    }, 3000);
  };

  const openConfirm = (config) => {
    setConfirmText("");
    setConfirmConfig(config);
  };

  const handleRestoreBackup = () => {
    startWorkflow({
      loadingTitle: "Восстанавливаем резервную копию",
      loadingSubtitle: "Проверяем архив и применяем настройки",
      successTitle: "Резервная копия восстановлена",
      successSubtitle: "Параметры обновлены в локальном mock-state.",
    }, () => {
      const selectedBackup = BACKUP_RESTORE_OPTIONS.find((backup) => backup.id === selectedBackupId);
      setLastBackup(selectedBackup?.meta.split(" · ")[0].replace("Сегодня, ", "") ?? "02:00");
    });
  };

  const handleSimpleAction = (config) => {
    startWorkflow(config, config.onSuccess);
  };

  const handleConfirmAction = () => {
    if (confirmConfig) {
      startWorkflow(confirmConfig.workflow, confirmConfig.onSuccess);
    }
  };

  const closeMasterImport = () => {
    setSelectedMasterFile(null);
    setMasterImportError("");
    setWorkflow(null);
  };

  const handleMasterFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const isAllowedSize = file.size <= 10 * 1024 * 1024;

    if (!isExcel) {
      setSelectedMasterFile(null);
      setMasterImportError("Разрешены только Excel-файлы .xlsx и .xls.");
      return;
    }

    if (!isAllowedSize) {
      setSelectedMasterFile(null);
      setMasterImportError("Размер файла не должен превышать 10 MB.");
      return;
    }

    setMasterImportError("");
    setSelectedMasterFile(file);
  };

  const handleImportMasterData = () => {
    if (!selectedMasterFile) {
      setMasterImportError("Выберите Excel-файл для импорта.");
      return;
    }

    const fileName = selectedMasterFile.name;
    startWorkflow({
      loadingTitle: "Импортируем мастер-данные",
      loadingSubtitle: "Проверяем структуру файла",
      successTitle: "Мастер-данные обновлены",
      successSubtitle: "Файл принят в локальный mock-state.",
    }, () => {
      setMasterFileName(fileName);
      setMasterImportedAt(`Сегодня, ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
      setSelectedMasterFile(null);
      setMasterImportError("");
    });
  };

  const openStoragePathModal = () => {
    setStoragePathDraft(storagePath);
    setWorkflow({ phase: "storage-path" });
  };

  const handleSaveStoragePath = () => {
    const nextPath = storagePathDraft.trim();
    if (!nextPath) {
      return;
    }

    startWorkflow({
      loadingTitle: "Проверяем путь",
      loadingSubtitle: "Обновляем настройки хранилища",
      successTitle: "Путь к хранилищу обновлен",
      successSubtitle: "Новый путь сохранен в локальном mock-state.",
    }, () => setStoragePath(nextPath));
  };

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
          <button
            className="st-btn-save"
            type="button"
            onClick={() => handleSimpleAction({
              loadingTitle: "Сохраняем настройки",
              loadingSubtitle: "Применяем локальные параметры",
              successTitle: "Настройки сохранены",
              successSubtitle: "Изменения сохранены в mock-state.",
            })}
          >
            <SaveOutlined aria-hidden="true" />
            Сохранить изменения
          </button>
        </div>
        <div className="st-action-bar-right">
          <button
            className="st-btn-text"
            type="button"
            onClick={() => handleSimpleAction({
              loadingTitle: "Проверяем подключение",
              loadingSubtitle: "Опрашиваем локальные компоненты",
              successTitle: "Подключение проверено",
              successSubtitle: "Сервер и локальные модули доступны.",
            })}
          >
            <WifiOutlined aria-hidden="true" />
            Проверить подключение
          </button>
          <button
            className="st-btn-text"
            type="button"
            onClick={() => handleSimpleAction({
              loadingTitle: "Создаем резервную копию",
              loadingSubtitle: "Сохраняем текущие параметры",
              successTitle: "Резервная копия создана",
              successSubtitle: "Новая копия добавлена в локальный mock-state.",
              onSuccess: () => setLastBackup(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })),
            })}
          >
            <CloudUploadOutlined aria-hidden="true" />
            Создать резервную копию
          </button>
          <button
            className="st-btn-text"
            type="button"
            onClick={() => handleSimpleAction({
              loadingTitle: "Экспортируем настройки",
              loadingSubtitle: "Формируем локальный пакет конфигурации",
              successTitle: "Экспорт настроек готов",
              successSubtitle: "Файл будет сформирован backend после подключения API.",
            })}
          >
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
      <StatusCards cards={statusCards} />

      {/* Main layout */}
      <div className="st-body">
        <div className="st-main-col">
          <div className="st-config-grid">
            <ServerCard />
            <SyncCard />
            <RegistryCard
              masterFileName={masterFileName}
              masterImportedAt={masterImportedAt}
              onImportNew={() => setWorkflow({ phase: "master-import" })}
            />
            <FilesCard storagePath={storagePath} onEditStoragePath={openStoragePathModal} />
            <BackupCard
              lastBackup={lastBackup}
              onCreateBackup={() => handleSimpleAction({
                loadingTitle: "Создаем резервную копию",
                loadingSubtitle: "Сохраняем текущие параметры",
                successTitle: "Резервная копия создана",
                successSubtitle: "Новая копия добавлена в локальный mock-state.",
                onSuccess: () => setLastBackup(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })),
              })}
              onRestoreBackup={() => setWorkflow({ phase: "restore" })}
            />
            <SecurityCard />
            <JournalCard />
          </div>
          <MaintenanceCard
            onToolAction={(tool) => handleSimpleAction({
              loadingTitle: tool.chevron === "download" ? "Готовим пакет диагностики" : "Выполняем обслуживание",
              loadingSubtitle: tool.label,
              successTitle: tool.chevron === "download" ? "Пакет диагностики готов" : "Обслуживание завершено",
              successSubtitle: "Действие выполнено в локальном mock-state.",
            })}
            onRestartService={() => openConfirm({
              title: "Перезапустить сервис",
              subtitle: "На время перезапуска локальные операции будут недоступны.",
              warning: "Активные пользователи могут увидеть короткую паузу в работе сервиса.",
              confirmLabel: "Перезапустить",
              workflow: {
                loadingTitle: "Перезапускаем сервис",
                loadingSubtitle: "Проверяем состояние компонентов",
                successTitle: "Сервис перезапущен",
                successSubtitle: "Компоненты снова доступны в локальном mock-state.",
              },
              onSuccess: () => setServiceStatus("СТАБИЛЬНО"),
            })}
            onResetSyncQueue={() => openConfirm({
              title: "Сбросить очередь синхронизации",
              subtitle: "Локальные задачи очереди будут удалены из mock-state.",
              warning: "После подтверждения очередь синхронизации станет пустой.",
              confirmLabel: "Сбросить очередь",
              danger: true,
              workflow: {
                loadingTitle: "Сбрасываем очередь синхронизации",
                loadingSubtitle: "Удаляем локальные задачи из очереди",
                successTitle: "Очередь синхронизации сброшена",
                successSubtitle: "Активных задач синхронизации больше нет.",
              },
              onSuccess: () => setSyncQueueCount(0),
            })}
            onClearCache={() => handleSimpleAction({
              loadingTitle: "Очищаем кэш системы",
              loadingSubtitle: "Удаляем временные локальные файлы",
              successTitle: "Кэш системы очищен",
              successSubtitle: "Временные данные очищены в mock-state.",
            })}
            onResetSettings={() => openConfirm({
              title: "Сбросить системные настройки",
              subtitle: "Подтвердите возврат параметров по умолчанию.",
              warning: "Это действие необратимо для текущего локального состояния экрана.",
              confirmLabel: "Сбросить настройки",
              danger: true,
              requiredText: "СБРОСИТЬ",
              workflow: {
                loadingTitle: "Сбрасываем настройки",
                loadingSubtitle: "Возвращаем параметры по умолчанию",
                successTitle: "Настройки сброшены",
                successSubtitle: "Параметры возвращены к значениям по умолчанию.",
              },
              onSuccess: () => {
                setSyncQueueCount(12);
                setLastBackup("02:00");
                setServiceStatus("СТАБИЛЬНО");
              },
            })}
          />
        </div>
        <div className="st-side-col">
          <DiagCard
            syncQueueCount={syncQueueCount}
            serviceStatus={serviceStatus}
            onCheckSystem={() => handleSimpleAction({
              loadingTitle: "Проверяем систему",
              loadingSubtitle: "Проверяем состояние компонентов",
              successTitle: "Система проверена",
              successSubtitle: "Критических проблем не найдено.",
            })}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="st-footer">
        <p className="st-footer-text">InfoCollect MVP v0.1 • Локальная установка</p>
      </footer>

      {workflow?.phase === "restore" ? (
        <RestoreBackupModal
          selectedBackupId={selectedBackupId}
          onSelectBackup={setSelectedBackupId}
          onClose={() => setWorkflow(null)}
          onConfirm={handleRestoreBackup}
        />
      ) : null}

      {workflow?.phase === "master-import" ? (
        <MasterDataImportModal
          selectedFile={selectedMasterFile}
          error={masterImportError}
          onFileChange={handleMasterFileChange}
          onClose={closeMasterImport}
          onConfirm={handleImportMasterData}
        />
      ) : null}

      {workflow?.phase === "storage-path" ? (
        <StoragePathModal
          value={storagePathDraft}
          onChange={setStoragePathDraft}
          onClose={() => setWorkflow(null)}
          onConfirm={handleSaveStoragePath}
        />
      ) : null}

      {workflow && ["loading", "success"].includes(workflow.phase) ? (
        <SettingsStatusModal workflow={workflow} onClose={() => setWorkflow(null)} />
      ) : null}

      {confirmConfig ? (
        <SettingsConfirmModal
          config={confirmConfig}
          confirmText={confirmText}
          onConfirmTextChange={setConfirmText}
          onClose={() => setConfirmConfig(null)}
          onConfirm={handleConfirmAction}
        />
      ) : null}

    </div>
  );
}
