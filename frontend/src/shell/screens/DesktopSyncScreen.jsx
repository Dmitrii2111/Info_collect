import { useEffect, useRef, useState } from "react";
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
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
import { SYNC_ROWS_DATA } from "../data/syncScreenData";
import "../styles/syncScreen.css";

const PAGE_SIZE = 10;

const STATS = [
  { label: "Всего событий", value: "124", badge: "+5%", badgeTone: "is-success-text" },
  { label: "В очереди", value: "12", badge: "Warning", badgeTone: "is-warning-text", tone: "is-warning" },
  { label: "Ошибки", value: "3", badge: "Critical", badgeTone: "is-error-text", valueTone: "is-error", tone: "is-error" },
  { label: "Конфликты", value: "2", badge: "Manual", badgeTone: "is-error-text", valueTone: "is-error", tone: "is-error" },
  { label: "Синхронизировано", value: "107", iconCheck: true, tone: "is-success" },
];

const CHIP_LABELS = ["Все", "В очереди", "Ошибки", "Конфликты", "Синхронизировано"];

const CHIP_FILTER = {
  "Все": () => true,
  "В очереди": (r) => r.statusPill === "sync-pill-queue",
  "Ошибки": (r) => r.statusPill === "sync-pill-error",
  "Конфликты": (r) => r.statusPill === "sync-pill-conflict",
  "Синхронизировано": (r) => r.statusPill === "sync-pill-synced",
};

/* ── KPI Card ── */
function KpiCard({ stat }) {
  return (
    <div className={`sync-kpi-card${stat.tone ? ` ${stat.tone}` : ""}`}>
      <p className="sync-kpi-label">{stat.label}</p>
      <div className="sync-kpi-bottom">
        <span className={`sync-kpi-value${stat.valueTone ? ` ${stat.valueTone}` : ""}`}>{stat.value}</span>
        {stat.iconCheck ? (
          <CheckCircleFilled className="sync-kpi-icon-check" />
        ) : (
          <span className={`sync-kpi-badge${stat.badgeTone ? ` ${stat.badgeTone}` : ""}`}>{stat.badge}</span>
        )}
      </div>
    </div>
  );
}

/* ── Status pill ── */
function StatusPill({ text, pillClass }) {
  return <span className={`sync-pill ${pillClass}`}>{text}</span>;
}

/* ── SyncConflictModal ── */
function SyncConflictModal({ type, item, onClose, onSuccess }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const isAccept = type === "accept-operator";

  const handleConfirm = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Конфликт разрешён" :
    phase === "loading" ? "Применяем изменения" :
    isAccept ? "Принять данные оператора?" : "Оставить серверные данные?";

  const subtitle =
    phase === "success" ? (isAccept ? "Приняты данные оператора." : "Оставлены серверные данные.") :
    phase === "loading" ? "Обновляем данные синхронизации..." :
    isAccept ? "Серверные данные будут заменены данными оператора." : "Данные оператора будут отклонены для этого события.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <SwapOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={phase === "success" ? onSuccess : onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? (isAccept ? "Понятно" : "Ок") : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
              {isAccept ? "Принять данные оператора" : "Оставить серверные данные"}
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Конфликт разрешён</strong>
            <span>{isAccept ? "Приняты данные оператора." : "Оставлены серверные данные."}</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Применяем изменения</strong>
            <span>Обновляем данные синхронизации...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="sync-modal-ctx-card">
            <div>
              <span className="sync-modal-ctx-label">Инспекция</span>
              <span className="sync-modal-ctx-value">{item?.inspection ?? "—"}</span>
            </div>
            <div>
              <span className="sync-modal-ctx-label">Оператор</span>
              <span className="sync-modal-ctx-value">{item?.operator ?? "—"}</span>
            </div>
            <div>
              <span className="sync-modal-ctx-label">Объект</span>
              <span className="sync-modal-ctx-value">{item?.object ?? "—"}</span>
            </div>
            <div>
              <span className="sync-modal-ctx-label">Тип</span>
              <span className="sync-modal-ctx-value">{item?.type ?? "—"}</span>
            </div>
          </div>
          <div className="sync-modal-compare">
            <div className="sync-modal-compare-server">
              <span className="sync-modal-compare-label">Серверные данные</span>
              <span className="sync-modal-compare-big">{item?.serverValue ?? "—"}</span>
              <span className="sync-modal-compare-badge is-neutral">Статус: {item?.serverStatus ?? "—"}</span>
            </div>
            <div className="sync-modal-compare-arrow" aria-hidden="true">
              <SwapOutlined />
            </div>
            <div className="sync-modal-compare-operator">
              <span className="sync-modal-compare-label is-primary">Данные оператора</span>
              <span className="sync-modal-compare-big">{item?.localValue ?? "—"}</span>
              <span className="sync-modal-compare-badge is-error">Статус: {item?.localStatus ?? "—"}</span>
            </div>
          </div>
          <div className="sync-modal-what-list">
            <p className="sync-modal-what-title">Что изменится:</p>
            {isAccept ? (
              <>
                <div><CheckCircleOutlined aria-hidden="true" /> В записи останутся данные оператора</div>
                <div><CheckCircleOutlined aria-hidden="true" /> Конфликт будет помечен как разрешённый</div>
                <div><CheckCircleOutlined aria-hidden="true" /> Решение будет записано в историю</div>
              </>
            ) : (
              <>
                <div><CheckCircleOutlined aria-hidden="true" /> В записи останутся серверные данные</div>
                <div><CheckCircleOutlined aria-hidden="true" /> Локальное изменение будет отклонено</div>
                <div><CheckCircleOutlined aria-hidden="true" /> Решение будет сохранено в истории</div>
              </>
            )}
          </div>
        </>
      )}
    </DesktopModalShell>
  );
}

/* ── SyncIgnoreModal ── */
function SyncIgnoreModal({ item, onClose, onSuccess }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");
  const [reason, setReason] = useState("");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const canSubmit = reason.trim().length >= 5;

  const handleConfirm = () => {
    if (phase !== "form" || !canSubmit) return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Событие проигнорировано" :
    phase === "loading" ? "Игнорируем событие" : "Игнорировать событие?";

  const subtitle =
    phase === "success" ? "Изменение не повлияет на итоговый отчет." :
    phase === "loading" ? "Обновляем статус события..." :
    "Событие будет исключено из очереди синхронизации без изменения основной записи.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon sync-icon-error">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <WarningOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={phase === "success" ? onSuccess : onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-danger"
              type="button"
              onClick={handleConfirm}
              disabled={phase === "loading" || !canSubmit}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <WarningOutlined aria-hidden="true" />}
              Игнорировать событие
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Событие проигнорировано</strong>
            <span>Изменение не повлияет на итоговый отчет.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Игнорируем событие</strong>
            <span>Обновляем статус события...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="sync-modal-warning-banner">
            <WarningOutlined aria-hidden="true" />
            <span>Используйте это действие только если событие ошибочное или не должно применяться.</span>
          </div>
          <div className="sync-modal-field">
            <label className="sync-modal-field-label" htmlFor="sync-ignore-reason">Причина *</label>
            <textarea
              id="sync-ignore-reason"
              className="sync-modal-textarea"
              placeholder="Укажите причину игнорирования события"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </>
      )}
    </DesktopModalShell>
  );
}

/* ── SyncRunModal ── */
function SyncRunModal({ onClose, onSuccess }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleConfirm = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Синхронизация завершена" :
    phase === "loading" ? "Синхронизируем данные" : "Запустить синхронизацию?";

  const subtitle =
    phase === "success" ? "Все доступные изменения отправлены на сервер." :
    phase === "loading" ? "Отправляем события на сервер..." :
    "Система попробует отправить все события из очереди и повторить обработку ошибок.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <SyncOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={phase === "success" ? onSuccess : onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Продолжить работу" : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <SyncOutlined aria-hidden="true" />}
              Синхронизировать всё
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Синхронизация завершена</strong>
            <span>Все доступные изменения отправлены на сервер.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Синхронизируем данные</strong>
            <span>Отправляем события на сервер...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="sync-modal-stats-block">
            <div className="sync-modal-stats-item">
              <span className="sync-modal-stats-label">В очереди</span>
              <span className="sync-modal-stats-value">12</span>
            </div>
            <div className="sync-modal-stats-divider" />
            <div className="sync-modal-stats-item">
              <span className="sync-modal-stats-label is-error">Ошибки</span>
              <span className="sync-modal-stats-value is-error">3</span>
            </div>
            <div className="sync-modal-stats-divider" />
            <div className="sync-modal-stats-item">
              <span className="sync-modal-stats-label is-warning">Конфликты</span>
              <span className="sync-modal-stats-value is-warning">2</span>
            </div>
          </div>
          <div className="sync-modal-what-list">
            <p className="sync-modal-what-title">Что произойдёт</p>
            <div><CheckCircleOutlined aria-hidden="true" /> События в очереди будут отправлены</div>
            <div><ReloadOutlined aria-hidden="true" /> Ошибочные события будут повторены</div>
            <div><InfoCircleOutlined aria-hidden="true" /> Конфликты останутся до ручного решения</div>
          </div>
        </>
      )}
    </DesktopModalShell>
  );
}

/* ── SyncRetryModal ── */
function SyncRetryModal({ onClose, onSuccess }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleConfirm = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Ошибочные события повторены" :
    phase === "loading" ? "Повторяем отправку" : "Повторить ошибочные события?";

  const subtitle =
    phase === "success" ? "Локальная очередь данных пуста." :
    phase === "loading" ? "Повторяем отправку ошибочных событий..." :
    "Система повторит отправку событий, которые завершились ошибкой.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <ReloadOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={phase === "success" ? onSuccess : onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Завершить" : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <ReloadOutlined aria-hidden="true" />}
              Повторить отправку
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Ошибочные события повторены</strong>
            <span>Локальная очередь данных пуста.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Повторяем отправку</strong>
            <span>Повторяем отправку ошибочных событий...</span>
          </div>
        </div>
      ) : (
        <div className="sync-modal-retry-stats">
          <div className="sync-modal-retry-row">
            <span>Всего ошибок к повтору:</span>
            <span className="sync-modal-retry-badge">3 события</span>
          </div>
          <div className="sync-modal-retry-row">
            <span>Последняя попытка:</span>
            <span>сегодня, 09:42</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── SyncExportModal ── */
function SyncExportModal({ filteredCount, onClose }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleConfirm = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Экспорт готов" :
    phase === "loading" ? "Готовим экспорт" : "Экспорт журнала синхронизации";

  const subtitle =
    phase === "success" ? "Файл будет сформирован backend после подключения API." :
    phase === "loading" ? "Формируем журнал синхронизации..." :
    "Выгрузка событий из очереди синхронизации.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <DownloadOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleConfirm}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <DownloadOutlined aria-hidden="true" />}
              Экспортировать
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Экспорт готов</strong>
            <span>Файл будет сформирован backend после подключения API.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Готовим экспорт</strong>
            <span>Формируем журнал синхронизации...</span>
          </div>
        </div>
      ) : (
        <div className="sync-modal-retry-stats">
          <div className="sync-modal-retry-row">
            <span>Событий в выборке:</span>
            <span className="sync-modal-export-count">{filteredCount}</span>
          </div>
          <div className="sync-modal-retry-row">
            <span>Формат файла:</span>
            <span>XLSX / CSV</span>
          </div>
          <div className="sync-modal-retry-row">
            <span>Дата экспорта:</span>
            <span>23.10.2023</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── SyncSettingsModal ── */
function SyncSettingsModal({ onClose }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("form");
  const [syncMode, setSyncMode] = useState("Автоматический");
  const [syncInterval, setSyncInterval] = useState("10 мин");
  const [conflictResolution, setConflictResolution] = useState("Запрашивать вручную");
  const [retryLimit, setRetryLimit] = useState("3");
  const [notifications, setNotifications] = useState(true);
  const [logging, setLogging] = useState(true);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleSave = () => {
    if (phase !== "form") return;
    setPhase("loading");
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
  };

  const title =
    phase === "success" ? "Настройки сохранены" :
    phase === "loading" ? "Сохраняем настройки" : "Настройки синхронизации";

  const subtitle =
    phase === "success" ? "Параметры синхронизации обновлены." :
    phase === "loading" ? "Обновляем параметры синхронизации..." :
    "Управление режимом и параметрами синхронизации.";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={phase === "loading"}
      headerContent={(
        <div className="reg-confirm-title-row">
          <div className="reg-confirm-icon">
            {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> :
             phase === "success" ? <CheckCircleOutlined aria-hidden="true" /> :
             <ControlOutlined aria-hidden="true" />}
          </div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
            <p className="reg-modal-subtitle">{subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            className="reg-modal-btn reg-modal-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={phase === "loading"}
          >
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase !== "success" ? (
            <button
              className="reg-modal-btn reg-modal-btn-primary"
              type="button"
              onClick={handleSave}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
              Сохранить
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Настройки сохранены</strong>
            <span>Параметры синхронизации обновлены.</span>
          </div>
        </div>
      ) : phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Сохраняем настройки</strong>
            <span>Обновляем параметры синхронизации...</span>
          </div>
        </div>
      ) : (
        <div className="sync-settings-form">
          <div className="sync-settings-grid">
            <div className="sync-modal-field">
              <label className="sync-modal-field-label">Режим синхронизации</label>
              <select className="sync-filter-select" value={syncMode} onChange={(e) => setSyncMode(e.target.value)}>
                <option>Автоматический</option>
                <option>Ручной</option>
                <option>По расписанию</option>
              </select>
            </div>
            <div className="sync-modal-field">
              <label className="sync-modal-field-label">Интервал автосинхронизации</label>
              <select className="sync-filter-select" value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)}>
                <option>5 мин</option>
                <option>10 мин</option>
                <option>30 мин</option>
                <option>1 час</option>
              </select>
            </div>
            <div className="sync-modal-field">
              <label className="sync-modal-field-label">Разрешение конфликтов</label>
              <select className="sync-filter-select" value={conflictResolution} onChange={(e) => setConflictResolution(e.target.value)}>
                <option>Запрашивать вручную</option>
                <option>Серверные данные</option>
                <option>Данные оператора</option>
              </select>
            </div>
            <div className="sync-modal-field">
              <label className="sync-modal-field-label">Лимит повторных попыток</label>
              <select className="sync-filter-select" value={retryLimit} onChange={(e) => setRetryLimit(e.target.value)}>
                <option>3</option>
                <option>5</option>
                <option>10</option>
              </select>
            </div>
          </div>
          <div className="sync-settings-toggles">
            <label className="sync-settings-toggle">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <span>Уведомления о конфликтах</span>
            </label>
            <label className="sync-settings-toggle">
              <input
                type="checkbox"
                checked={logging}
                onChange={(e) => setLogging(e.target.checked)}
              />
              <span>Подробное логирование</span>
            </label>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── Queue table row ── */
function QueueRow({ row, isSelected, onClick, onEyeClick }) {
  return (
    <tr className={isSelected ? "is-selected" : ""} onClick={onClick}>
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
          <button
            className={`sync-row-icon-btn${isSelected ? " is-selected" : ""}`}
            type="button"
            aria-label="Просмотр конфликта"
            onClick={(e) => { e.stopPropagation(); onEyeClick(); }}
          >
            <EyeOutlined />
          </button>
        ) : (
          <MoreOutlined className="sync-row-icon" />
        )}
      </td>
    </tr>
  );
}

/* ── Detail panel ── */
function DetailPanel({ row, onClose, onOpenModal }) {
  const isConflict = row?.statusPill === "sync-pill-conflict";

  return (
    <div className="sync-detail-panel">
      <div className="sync-detail-header">
        <div className="sync-detail-header-left">
          <span className="sync-detail-eyebrow">Выбрано событие</span>
          <span className="sync-detail-id">
            {row ? `${row.time} • ${row.inspection}` : "—"}
          </span>
        </div>
        <button className="sync-detail-close" type="button" onClick={onClose}>
          <CloseOutlined />
        </button>
      </div>

      <div className="sync-detail-body">
        {row ? (
          <>
            <div className="sync-detail-info">
              <div className="sync-detail-field">
                <span className="sync-detail-field-label">Инспекция</span>
                <p className="sync-detail-field-value">{row.inspection}</p>
              </div>
              <div className="sync-detail-field-row">
                <div className="sync-detail-field">
                  <span className="sync-detail-field-label">Дата и время</span>
                  <p className="sync-detail-field-value">{row.date}, {row.time}</p>
                </div>
                <div className="sync-detail-field text-right">
                  <span className="sync-detail-field-label">Оператор</span>
                  <p className="sync-detail-field-value">{row.operator}</p>
                </div>
              </div>
              <div className="sync-detail-field">
                <span className="sync-detail-field-label">Объект</span>
                <p className="sync-detail-field-value">{row.object}</p>
              </div>
              <div className="sync-detail-field">
                <span className="sync-detail-field-label">Тип события</span>
                <p className="sync-detail-field-value">{row.type}</p>
              </div>
            </div>

            {isConflict && (
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
                        <span className="sync-conflict-field-label">Значение</span>
                        <span className="sync-conflict-field-value">{row.serverValue}</span>
                      </div>
                      <div className="sync-conflict-field">
                        <span className="sync-conflict-field-label">Статус</span>
                        <span className="sync-conflict-field-value is-success">{row.serverStatus}</span>
                      </div>
                    </div>
                    <div className="sync-conflict-col">
                      <div className="sync-conflict-field">
                        <span className="sync-conflict-field-label is-local">Значение</span>
                        <span className="sync-conflict-field-value is-local">{row.localValue}</span>
                      </div>
                      <div className="sync-conflict-field">
                        <span className="sync-conflict-field-label is-local">Статус</span>
                        <span className="sync-conflict-field-value is-error">{row.localStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="sync-conflict-note">
                  Система обнаружила расхождение между локальной копией и серверной базой.
                  Выберите действие для синхронизации.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="sync-detail-empty">Выберите событие из списка</p>
        )}
      </div>

      {row && (
        <div className="sync-detail-footer">
          {isConflict ? (
            <>
              <button
                className="sync-detail-btn-primary"
                type="button"
                onClick={() => onOpenModal("accept-operator", row)}
              >
                Принять данные оператора
              </button>
              <button
                className="sync-detail-btn-outline"
                type="button"
                onClick={() => onOpenModal("keep-server", row)}
              >
                Оставить серверные данные
              </button>
            </>
          ) : null}
          <button
            className="sync-detail-btn-danger"
            type="button"
            onClick={() => onOpenModal("ignore", row)}
            style={isConflict ? undefined : { gridColumn: "1 / -1" }}
          >
            Игнорировать событие
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main screen ── */
export function DesktopSyncScreen() {
  const [rows, setRows] = useState(SYNC_ROWS_DATA);
  const [selectedId, setSelectedId] = useState(2); // INSP-9010 conflict row
  const [activeChip, setActiveChip] = useState("Все");
  const [modal, setModal] = useState(null); // { type, item }
  const [currentPage, setCurrentPage] = useState(1);
  const [filterInspection, setFilterInspection] = useState("");
  const [filterOperator, setFilterOperator] = useState("");
  const [filterObject, setFilterObject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const openModal = (type, item = null) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const chipFn = CHIP_FILTER[activeChip] ?? (() => true);
  const filteredRows = rows.filter((r) => {
    if (filterInspection && r.inspection !== filterInspection) return false;
    if (filterOperator && r.operator !== filterOperator) return false;
    if (filterObject && r.object !== filterObject) return false;
    if (filterStatus && r.statusPill !== filterStatus) return false;
    if (filterType && r.type !== filterType) return false;
    return chipFn(r);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedRow = rows.find((r) => r.id === selectedId) ?? null;

  // Auto-select first row and reset page when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (filteredRows.length > 0 && !filteredRows.find((r) => r.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
    setCurrentPage(1);
  }, [activeChip, filterInspection, filterOperator, filterObject, filterStatus, filterType]);

  const handleConflictSuccess = (type, item) => {
    setRows((prev) => prev.map((r) =>
      r.id === item?.id
        ? { ...r, status: "Синхронизировано", statusPill: "sync-pill-synced", actionIcon: "more" }
        : r
    ));
    closeModal();
  };

  const handleIgnoreSuccess = (item) => {
    setRows((prev) => prev.map((r) =>
      r.id === item?.id
        ? { ...r, status: "Игнорировано", statusPill: "sync-pill-queue" }
        : r
    ));
    closeModal();
  };

  const handleRunSuccess = () => {
    setRows((prev) => prev.map((r) =>
      r.statusPill === "sync-pill-queue" || r.statusPill === "sync-pill-error"
        ? { ...r, status: "Синхронизировано", statusPill: "sync-pill-synced", actionIcon: "more" }
        : r
    ));
    closeModal();
  };

  const handleRetrySuccess = () => {
    setRows((prev) => prev.map((r) =>
      r.statusPill === "sync-pill-error"
        ? { ...r, status: "Синхронизировано", statusPill: "sync-pill-synced", actionIcon: "more" }
        : r
    ));
    closeModal();
  };

  // Dropdown options
  const uniqueInspections = [...new Set(rows.map((r) => r.inspection))];
  const uniqueOperators = [...new Set(rows.map((r) => r.operator))];
  const uniqueObjects = [...new Set(rows.map((r) => r.object))];
  const uniqueTypes = [...new Set(rows.map((r) => r.type))];
  const STATUS_OPTS = [
    { label: "Ошибки", value: "sync-pill-error" },
    { label: "Конфликты", value: "sync-pill-conflict" },
    { label: "В очереди", value: "sync-pill-queue" },
    { label: "Синхронизировано", value: "sync-pill-synced" },
  ];

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
        <button className="sync-alert-btn" type="button" onClick={() => setActiveChip("Конфликты")}>
          Перейти к исправлению
        </button>
      </div>

      {/* Action bar */}
      <div className="sync-action-bar">
        <div className="sync-action-group">
          <button className="sync-btn sync-btn-primary" type="button" onClick={() => openModal("run-sync")}>
            <SyncOutlined aria-hidden="true" />
            Синхронизировать всё
          </button>
          <button className="sync-btn sync-btn-outline" type="button" onClick={() => openModal("retry")}>
            <ReloadOutlined aria-hidden="true" />
            Повторить ошибки
          </button>
        </div>
        <div className="sync-action-group">
          <button className="sync-btn sync-btn-outline" type="button" onClick={() => openModal("export")}>
            <DownloadOutlined aria-hidden="true" />
            Экспорт журнала
          </button>
          <button className="sync-btn sync-btn-muted" type="button" onClick={() => openModal("settings")}>
            <ControlOutlined aria-hidden="true" />
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
            <p className="sync-progress-sub">Обработка текущего пакета данных от полевых устройств</p>
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
            <select
              className="sync-filter-select"
              value={filterInspection}
              onChange={(e) => setFilterInspection(e.target.value)}
            >
              <option value="">Все</option>
              {uniqueInspections.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Оператор</span>
            <select
              className="sync-filter-select"
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
            >
              <option value="">Все</option>
              {uniqueOperators.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Объект</span>
            <select
              className="sync-filter-select"
              value={filterObject}
              onChange={(e) => setFilterObject(e.target.value)}
            >
              <option value="">Все</option>
              {uniqueObjects.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Статус</span>
            <select
              className="sync-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Все</option>
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Тип события</span>
            <select
              className="sync-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Все</option>
              {uniqueTypes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sync-filter-field">
            <span className="sync-filter-label">Период</span>
            <input type="date" className="sync-filter-date" />
          </div>
          <button
            className="sync-filter-apply"
            type="button"
            onClick={() => {
              setFilterInspection("");
              setFilterOperator("");
              setFilterObject("");
              setFilterStatus("");
              setFilterType("");
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Chip filters */}
      <div className="sync-chips">
        {CHIP_LABELS.map((chip) => {
          const isActive = activeChip === chip;
          let cls = "sync-chip";
          if (isActive) {
            cls += chip === "Конфликты" ? " sync-chip-conflict" : " sync-chip-all";
          } else {
            cls += " sync-chip-default";
          }
          return (
            <button key={chip} className={cls} type="button" onClick={() => setActiveChip(chip)}>
              {chip}
            </button>
          );
        })}
      </div>

      {/* Split: table + detail */}
      <div className="sync-split">
        {/* Queue table */}
        <div className="sync-queue-panel">
          <div className="sync-queue-header">
            <h3 className="sync-queue-title">Очередь изменений</h3>
            <span className="sync-queue-count">Показано {pagedRows.length} из {filteredRows.length} событий</span>
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
                {pagedRows.map((row) => (
                  <QueueRow
                    key={row.id}
                    row={row}
                    isSelected={row.id === selectedId}
                    onClick={() => setSelectedId(row.id)}
                    onEyeClick={() => setSelectedId(row.id)}
                  />
                ))}
                {pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="sync-table-empty">Нет событий по выбранным фильтрам</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sync-queue-footer">
            <span className="sync-queue-footer-count">Показано {pagedRows.length} из {filteredRows.length} событий</span>
            <div className="sync-pagination">
              <button
                className="sync-page-btn"
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`sync-page-btn${safePage === i + 1 ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="sync-page-btn"
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <DetailPanel
          row={selectedRow}
          onClose={() => setSelectedId(null)}
          onOpenModal={openModal}
        />
      </div>

      {/* Modals */}
      {(modal?.type === "accept-operator" || modal?.type === "keep-server") ? (
        <SyncConflictModal
          type={modal.type}
          item={modal.item}
          onClose={closeModal}
          onSuccess={() => handleConflictSuccess(modal.type, modal.item)}
        />
      ) : null}
      {modal?.type === "ignore" ? (
        <SyncIgnoreModal
          item={modal.item}
          onClose={closeModal}
          onSuccess={() => handleIgnoreSuccess(modal.item)}
        />
      ) : null}
      {modal?.type === "run-sync" ? (
        <SyncRunModal onClose={closeModal} onSuccess={handleRunSuccess} />
      ) : null}
      {modal?.type === "retry" ? (
        <SyncRetryModal onClose={closeModal} onSuccess={handleRetrySuccess} />
      ) : null}
      {modal?.type === "export" ? (
        <SyncExportModal filteredCount={filteredRows.length} onClose={closeModal} />
      ) : null}
      {modal?.type === "settings" ? (
        <SyncSettingsModal onClose={closeModal} />
      ) : null}
    </div>
  );
}
