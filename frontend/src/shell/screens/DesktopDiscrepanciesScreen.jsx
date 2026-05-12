import { useState, useRef, useEffect } from "react";
import {
  DownloadOutlined, WarningOutlined, SwapRightOutlined,
  LeftOutlined, RightOutlined, CloseOutlined,
  CheckCircleOutlined, LoadingOutlined,
  UserOutlined, ToolOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
import { DISC_ROWS_DATA } from "../data/discrepanciesScreenData";
import "../styles/discrepanciesScreen.css";

/* ── Constants ── */
const PAGE_SIZE = 10;

const CHIP_FILTERS = {
  "Все": null,
  "Конфликты": (r) => r.type === "Конфликт",
  "Отсутствует": (r) => r.type === "Отсутствует",
  "Без серийника": (r) => r.type === "Без серийника",
  "ПНР": (r) => r.type === "ПНР",
  "Новые": (r) => r.status === "Новый",
  "Разрешено": (r) => r.status === "Разрешено",
};

const MODAL_CONFIG = {
  accept: {
    title: "Принять данные оператора?",
    desc: "Плановые данные системы будут заменены фактическими данными, полученными от оператора. Это действие обновит паспорт оборудования.",
    planHeader: "План", opHeader: "Оператор", opHighlight: true,
    commentPlaceholder: "Укажите причину принятия данных оператора...",
    commentLabel: "Комментарий решения",
    confirmLabel: "Принять данные оператора",
    btnClass: "reg-modal-btn reg-modal-btn-primary",
    loadingTitle: "Сохраняем решение", loadingDesc: "Обновляем статус расхождения",
  },
  keep: {
    title: "Оставить плановые данные?",
    desc: "Данные оператора будут отклонены. В системе сохранятся текущие плановые значения. Расхождение будет помечено как разрешённое.",
    planHeader: "План (Сохранить)", opHeader: "Оператор", planHighlight: true, opMuted: true,
    commentPlaceholder: "Укажите причину сохранения плановых данных...",
    commentLabel: "Комментарий решения",
    confirmLabel: "Оставить плановые данные",
    btnClass: "reg-modal-btn reg-modal-btn-primary",
    loadingTitle: "Сохраняем решение", loadingDesc: "Обновляем статус расхождения",
  },
  close: {
    title: "Закрыть расхождение?",
    desc: "Запись будет перенесена в архив без изменения системных данных. Это действие необратимо.",
    commentPlaceholder: "Например: Техническая ошибка при вводе...",
    commentLabel: "Причина закрытия",
    confirmLabel: "Закрыть расхождение",
    btnClass: "reg-modal-btn reg-modal-btn-danger",
    loadingTitle: "Сохраняем решение", loadingDesc: "Обновляем статус расхождения",
    destructive: true,
  },
};

const MOCK_OPERATORS = ["Иван Иванов", "Петр Петров", "Мария Сидорова", "Алексей Козлов", "Анна Смирнова", "Дмитрий Орлов", "Елена Белова"];

const KPI_CARDS = [
  { label: "Всего расхождений", value: "45", sub: "+5 за сегодня" },
  { label: "Конфликты", value: "8", valueTone: "is-error", sub: "Критический статус", subTone: "is-error" },
  { label: "Отсутствует оборудование", value: "9", valueTone: "is-error", sub: "Требует списания?", subTone: "is-error" },
  { label: "Без серийного номера", value: "8", valueTone: "is-orange", sub: "Уточнить в реестре", subTone: "is-orange" },
  { label: "ПНР", value: "5", valueTone: "is-orange", sub: "Пуско-наладка", subTone: "is-orange" },
  { label: "Разрешено", value: "15", valueTone: "is-green", sub: "В архиве", subTone: "is-green" },
];

/* ── KPI Card ── */
function KpiCard({ label, value, valueTone, sub, subTone }) {
  return (
    <div className="disc-kpi-card">
      <p className="disc-kpi-label">{label}</p>
      <p className={`disc-kpi-value${valueTone ? ` ${valueTone}` : ""}`}>{value}</p>
      <div className={`disc-kpi-sub${subTone ? ` ${subTone}` : ""}`}>{sub}</div>
    </div>
  );
}

/* ── Type pill ── */
function TypePill({ type }) {
  const map = {
    "Конфликт": "disc-pill disc-pill-conflict",
    "Отсутствует": "disc-pill disc-pill-missing",
    "Без серийника": "disc-pill disc-pill-noserial",
    "ПНР": "disc-pill disc-pill-pnr",
    "Коммуникации": "disc-pill disc-pill-comm",
    "Повреждение": "disc-pill disc-pill-damage",
  };
  return <span className={map[type] || "disc-pill disc-pill-missing"}>{type}</span>;
}

/* ── Status pill ── */
function StatusPill({ status }) {
  const map = {
    "Новый": "disc-pill disc-pill-new",
    "В работе": "disc-pill disc-pill-inwork",
    "Разрешено": "disc-pill disc-pill-resolved",
  };
  return <span className={map[status] || "disc-pill disc-pill-new"}>{status}</span>;
}

/* ── Resolve Modal ── */
function DiscResolveModal({ type, item, onClose, onSuccess }) {
  const cfg = MODAL_CONFIG[type];
  const [phase, setPhase] = useState("form"); // 'form' | 'loading' | 'success'
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const handleConfirm = () => {
    if (comment.trim().length < 5) {
      setCommentError("Введите не менее 5 символов");
      return;
    }
    setCommentError("");
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      setPhase("success");
      onSuccess(item.id);
    }, 3000);
  };

  const modalTitle =
    phase === "form" ? cfg.title :
    phase === "loading" ? cfg.loadingTitle :
    "Расхождение разрешено";

  const showTable = !cfg.destructive && item.expected !== "—" && item.found !== "—";

  const footer =
    phase === "success" ? (
      <>
        <button className="reg-modal-btn reg-modal-btn-secondary" onClick={onClose}>Закрыть</button>
        <button className="reg-modal-btn reg-modal-btn-primary" onClick={onClose}>К списку расхождений</button>
      </>
    ) : (
      <>
        <button
          className="reg-modal-btn reg-modal-btn-secondary"
          onClick={onClose}
          disabled={phase === "loading"}
        >
          Отмена
        </button>
        <button
          className={cfg.btnClass}
          onClick={handleConfirm}
          disabled={phase === "loading"}
        >
          {phase === "loading" && <LoadingOutlined style={{ marginRight: 6 }} />}
          {cfg.confirmLabel}
        </button>
      </>
    );

  return (
    <DesktopModalShell
      title={modalTitle}
      size="narrow"
      onClose={onClose}
      closeDisabled={phase === "loading"}
      footer={footer}
    >
      {phase === "success" && (
        <div className="disc-resolve-success">
          <span className="disc-resolve-success-icon"><CheckCircleOutlined /></span>
          <h4>Расхождение разрешено</h4>
          <p>Решение сохранено в истории</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="disc-resolve-loading">
          <span className="disc-resolve-loading-icon"><LoadingOutlined spin /></span>
          <div>
            <strong>{cfg.loadingTitle}</strong>
            <span>{cfg.loadingDesc}</span>
          </div>
        </div>
      )}

      {phase === "form" && (
        <div className="disc-resolve-body">
          <p className="disc-resolve-desc">{cfg.desc}</p>

          {cfg.destructive ? (
            <div className="disc-resolve-info is-destructive">
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Оборудование</span>
                <span className="disc-resolve-info-val">{item.equipName}</span>
              </div>
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Экземпляр</span>
                <span className="disc-resolve-info-val">{item.equipId}</span>
              </div>
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Статус</span>
                <span className="disc-resolve-info-val is-error">Критическое</span>
              </div>
            </div>
          ) : (
            <div className="disc-resolve-info">
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Оборудование</span>
                <span className="disc-resolve-info-val">{item.equipName}</span>
              </div>
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Экземпляр</span>
                <span className="disc-resolve-info-val">{item.equipId}</span>
              </div>
              <div className="disc-resolve-info-row">
                <span className="disc-resolve-info-label">Оператор</span>
                <span className="disc-resolve-info-val">{item.operator}</span>
              </div>
            </div>
          )}

          {showTable && (
            <table className="disc-resolve-table">
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>{cfg.planHeader}</th>
                  <th>{cfg.opHeader}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Серийный номер</td>
                  <td>
                    <span className={cfg.planHighlight ? "disc-resolve-val-primary" : undefined}>
                      {item.expected}
                    </span>
                  </td>
                  <td>
                    <span className={cfg.opHighlight ? "disc-resolve-val-error" : cfg.opMuted ? "disc-resolve-val-muted" : undefined}>
                      {item.found}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          <div className="disc-resolve-comment">
            <span className="disc-resolve-comment-label">
              {cfg.commentLabel} <span className="req">*</span>
            </span>
            <textarea
              className={`disc-resolve-comment-textarea${commentError ? " is-error" : ""}`}
              placeholder={cfg.commentPlaceholder}
              value={comment}
              onChange={(e) => { setComment(e.target.value); if (commentError) setCommentError(""); }}
            />
            {commentError && <span className="disc-resolve-comment-error">{commentError}</span>}
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── Conflict Resolution Modal ── */
function DiscConflictModal({ item, onClose, onSuccess }) {
  const [phase, setPhase] = useState("form"); // form | loading | success
  const [chosenAction, setChosenAction] = useState(null); // 'accept' | 'keep'
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleChoose = (action) => {
    setChosenAction(action);
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      setPhase("success");
      onSuccess(item.id);
    }, 3000);
  };

  const modalTitle =
    phase === "form" ? "Решить конфликт" :
    phase === "loading" ? "Сохраняем решение" :
    "Расхождение разрешено";

  const footer =
    phase === "success" ? (
      <>
        <button className="reg-modal-btn reg-modal-btn-secondary" onClick={onClose}>Закрыть</button>
        <button className="reg-modal-btn reg-modal-btn-primary" onClick={onClose}>К списку расхождений</button>
      </>
    ) : phase === "loading" ? (
      <button className="reg-modal-btn reg-modal-btn-secondary" disabled>Отмена</button>
    ) : (
      <>
        <button className="reg-modal-btn reg-modal-btn-secondary" onClick={onClose}>Отмена</button>
        <button className="reg-modal-btn reg-modal-btn-secondary" onClick={() => handleChoose("keep")}>
          Оставить плановые данные
        </button>
        <button className="reg-modal-btn reg-modal-btn-primary" onClick={() => handleChoose("accept")}>
          Принять данные оператора
        </button>
      </>
    );

  const showTable = item.expected !== "—" && item.found !== "—";

  return (
    <DesktopModalShell
      title={modalTitle}
      size="narrow"
      onClose={onClose}
      closeDisabled={phase === "loading"}
      footer={footer}
    >
      {phase === "success" && (
        <div className="disc-resolve-success">
          <span className="disc-resolve-success-icon"><CheckCircleOutlined /></span>
          <h4>Расхождение разрешено</h4>
          <p>
            {chosenAction === "accept"
              ? "Данные оператора приняты и сохранены"
              : "Плановые данные сохранены, данные оператора отклонены"}
          </p>
        </div>
      )}

      {phase === "loading" && (
        <div className="disc-resolve-loading">
          <span className="disc-resolve-loading-icon"><LoadingOutlined spin /></span>
          <div>
            <strong>Сохраняем решение</strong>
            <span>Обновляем статус расхождения</span>
          </div>
        </div>
      )}

      {phase === "form" && (
        <div className="disc-resolve-body">
          <p className="disc-resolve-desc">
            Выберите вариант разрешения конфликта данных для этого расхождения.
          </p>

          <div className="disc-resolve-info">
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Оборудование</span>
              <span className="disc-resolve-info-val">{item.equipName}</span>
            </div>
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Экземпляр</span>
              <span className="disc-resolve-info-val">{item.equipId}</span>
            </div>
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Оператор</span>
              <span className="disc-resolve-info-val">{item.operator}</span>
            </div>
          </div>

          {showTable && (
            <table className="disc-resolve-table">
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>План</th>
                  <th>Оператор</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Серийный номер</td>
                  <td>{item.expected}</td>
                  <td><span className="disc-resolve-val-error">{item.found}</span></td>
                </tr>
              </tbody>
            </table>
          )}

          <p className="disc-resolve-desc" style={{ fontSize: 12, color: "#94a3b8" }}>
            После подключения API — решение будет записано в историю расхождений.
          </p>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── Recheck Modal ── */
function DiscRecheckModal({ item, onClose, onSuccess }) {
  const [operator, setOperator] = useState("");
  const [comment, setComment] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [phase, setPhase] = useState("form"); // form | loading | success
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleConfirm = () => {
    if (!operator) { setFieldError("Выберите оператора"); return; }
    setFieldError("");
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      setPhase("success");
      onSuccess(item.id);
    }, 3000);
  };

  const modalTitle =
    phase === "form" ? "Назначить повторную проверку" :
    phase === "loading" ? "Назначаем повторную проверку" :
    "Проверка назначена";

  const footer =
    phase === "success" ? (
      <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>
    ) : (
      <>
        <button
          className="reg-modal-btn reg-modal-btn-secondary"
          type="button"
          onClick={onClose}
          disabled={phase === "loading"}
        >
          Отмена
        </button>
        <button
          className="reg-modal-btn reg-modal-btn-primary"
          type="button"
          onClick={handleConfirm}
          disabled={phase === "loading"}
        >
          {phase === "loading" && <LoadingOutlined style={{ marginRight: 6 }} />}
          Назначить
        </button>
      </>
    );

  return (
    <DesktopModalShell title={modalTitle} size="narrow" onClose={onClose} closeDisabled={phase === "loading"} footer={footer}>
      {phase === "success" && (
        <div className="disc-resolve-success">
          <span className="disc-resolve-success-icon" style={{ color: "var(--accent)" }}><UserOutlined /></span>
          <h4>Проверка назначена</h4>
          <p>Оператор уведомлён о новой задаче</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="disc-resolve-loading">
          <span className="disc-resolve-loading-icon"><LoadingOutlined spin /></span>
          <div>
            <strong>Назначаем повторную проверку</strong>
            <span>Обновляем статус расхождения</span>
          </div>
        </div>
      )}

      {phase === "form" && (
        <div className="disc-resolve-body">
          <div className="disc-resolve-info">
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Расхождение</span>
              <span className="disc-resolve-info-val">{item.id}</span>
            </div>
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Помещение</span>
              <span className="disc-resolve-info-val">{item.room}</span>
            </div>
            <div className="disc-resolve-info-row">
              <span className="disc-resolve-info-label">Оборудование</span>
              <span className="disc-resolve-info-val">{item.equipName}</span>
            </div>
          </div>

          <div className="disc-resolve-comment">
            <label className="disc-resolve-comment-label">
              Оператор <span className="req">*</span>
            </label>
            <select
              value={operator}
              onChange={(e) => { setOperator(e.target.value); if (fieldError) setFieldError(""); }}
              className={fieldError ? "is-error" : ""}
            >
              <option value="">— Выберите оператора —</option>
              {MOCK_OPERATORS.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            {fieldError && <span className="disc-resolve-comment-error">{fieldError}</span>}
          </div>

          <div className="disc-resolve-comment">
            <label className="disc-resolve-comment-label">Причина назначения</label>
            <textarea
              placeholder="Опишите причину повторной проверки..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ── Equipment Card Modal ── */
function DiscEquipModal({ item, onClose }) {
  return (
    <DesktopModalShell
      title="Карточка оборудования"
      size="narrow"
      onClose={onClose}
      footer={
        <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>
      }
    >
      <div className="disc-equip-body">
        <div className="disc-equip-header-row">
          <div className="disc-equip-avatar"><ToolOutlined /></div>
          <div>
            <div className="disc-equip-id">{item.equipId}</div>
            <div className="disc-equip-name">{item.equipName}</div>
          </div>
        </div>
        <div className="disc-resolve-info">
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Тип оборудования</span>
            <span className="disc-resolve-info-val">{item.equipType ?? "Медицинское"}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Объект</span>
            <span className="disc-resolve-info-val">{item.object}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Помещение</span>
            <span className="disc-resolve-info-val">{item.room}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Поставщик</span>
            <span className="disc-resolve-info-val">{item.supplier ?? "—"}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Инспекция</span>
            <span className="disc-resolve-info-val">{item.inspection}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Расхождение</span>
            <span className="disc-resolve-info-val">{item.id}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Оператор</span>
            <span className="disc-resolve-info-val">{item.operator}</span>
          </div>
          <div className="disc-resolve-info-row">
            <span className="disc-resolve-info-label">Статус расхождения</span>
            <span className={`disc-resolve-info-val${item.status === "Новый" ? " is-error" : ""}`}>{item.status}</span>
          </div>
        </div>
        {item.operatorComment && item.operatorComment !== "—" && (
          <div className="disc-resolve-comment">
            <span className="disc-resolve-comment-label">Комментарий оператора</span>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", fontStyle: "italic" }}>"{item.operatorComment}"</p>
          </div>
        )}
      </div>
    </DesktopModalShell>
  );
}

/* ── Detail panel ── */
function DetailPanel({ item, onClose, onOpenModal }) {
  const hasCompare = item.expected !== "—" && item.found !== "—";

  return (
    <div className="disc-detail-panel">
      <div className="disc-detail-header">
        <div className="disc-detail-header-top">
          <h5>Детали расхождения</h5>
          <button className="disc-detail-close" onClick={onClose}><CloseOutlined /></button>
        </div>
        <div className="disc-detail-meta">
          <span className="disc-detail-meta-time">{item.time} • {item.inspection}</span>
          <TypePill type={item.type} />
        </div>
      </div>

      <div className="disc-detail-body">
        <div className="disc-detail-fields">
          <div>
            <span className="disc-detail-field-label">Помещение</span>
            <div className="disc-detail-field-val">{item.room}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Оборудование</span>
            <div className="disc-detail-field-val">{item.equipName}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Экземпляр</span>
            <div className="disc-detail-field-val">{item.equipId}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Оператор</span>
            <div className="disc-detail-field-val">{item.operator}</div>
          </div>
        </div>

        {hasCompare ? (
          <div className="disc-compare-block">
            <div className="disc-compare-row">
              <div className="disc-compare-side">
                <span className="disc-compare-side-label">Ожидалось</span>
                <div className="disc-compare-box">
                  <span className="disc-compare-sn">{item.expected}</span>
                  <span className="disc-compare-hint">На месте по плану</span>
                </div>
              </div>
              <div className="disc-compare-arrow"><SwapRightOutlined /></div>
              <div className="disc-compare-side">
                <span className="disc-compare-side-label is-error">Найдено</span>
                <div className="disc-compare-box is-error">
                  <span className="disc-compare-sn is-error">{item.found}</span>
                  <span className="disc-compare-hint is-error">От оператора</span>
                </div>
              </div>
            </div>
            <div className="disc-comment-block">
              <span className="disc-comment-label">Комментарий оператора</span>
              <p className="disc-comment-text">"{item.operatorComment}"</p>
            </div>
          </div>
        ) : (
          <div className="disc-compare-block">
            <div className="disc-comment-block" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="disc-comment-label">Комментарий оператора</span>
              <p className="disc-comment-text">"{item.operatorComment}"</p>
            </div>
          </div>
        )}
      </div>

      <div className="disc-detail-actions">
        <button className="disc-detail-btn-primary" onClick={() => onOpenModal("accept", item)}>Принять данные оператора</button>
        <button className="disc-detail-btn-secondary" onClick={() => onOpenModal("keep", item)}>Оставить плановые данные</button>
        <button className="disc-detail-btn-secondary" onClick={() => onOpenModal("recheck", item)}>Назначить повторную проверку</button>
        <button className="disc-detail-btn-secondary" onClick={() => onOpenModal("equip", item)}>Открыть карточку оборудования</button>
        <button className="disc-detail-btn-danger" onClick={() => onOpenModal("close", item)}>Игнорировать расхождение</button>
      </div>
    </div>
  );
}

/* ── Main screen ── */
export function DesktopDiscrepanciesScreen() {
  const [rows, setRows] = useState(DISC_ROWS_DATA);
  const [selectedId, setSelectedId] = useState(DISC_ROWS_DATA[0].id);
  const [activeChip, setActiveChip] = useState("Все");
  const [modal, setModal] = useState(null); // { type, item } | null
  const [currentPage, setCurrentPage] = useState(1);
  const [exportPhase, setExportPhase] = useState("idle"); // idle | loading | success
  const exportTimerRef = useRef(null);

  // Filters
  const [filterInspection, setFilterInspection] = useState("");
  const [filterObject, setFilterObject] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterOperator, setFilterOperator] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => () => window.clearTimeout(exportTimerRef.current), []);

  // Derived unique values — cascade
  const rowsForObjects   = filterInspection ? rows.filter((r) => r.inspection === filterInspection) : rows;
  const rowsForRooms     = filterObject     ? rowsForObjects.filter((r) => r.object    === filterObject)    : rowsForObjects;
  const rowsForOperators = filterRoom       ? rowsForRooms.filter((r)    => r.room     === filterRoom)      : rowsForRooms;
  const rowsForTypes     = filterOperator   ? rowsForOperators.filter((r) => r.operator === filterOperator) : rowsForOperators;
  const rowsForStatuses  = filterType       ? rowsForTypes.filter((r)    => r.type     === filterType)      : rowsForTypes;

  const uniqueInspections = [...new Set(rows.map((r) => r.inspection))].sort();
  const uniqueObjects     = [...new Set(rowsForObjects.map((r) => r.object))].sort();
  const uniqueRooms       = [...new Set(rowsForRooms.map((r) => r.room))].sort();
  const uniqueOperators   = [...new Set(rowsForOperators.map((r) => r.operator))].sort();
  const uniqueTypes       = [...new Set(rowsForTypes.map((r) => r.type))].sort();
  const uniqueStatuses    = [...new Set(rowsForStatuses.map((r) => r.status))].sort();

  // Period: unique dates from all rows
  const uniqueDates = [...new Set(rows.map((r) => r.date))].sort();

  // Filtering pipeline
  const afterSelects = rows.filter((r) => {
    if (filterInspection && r.inspection !== filterInspection) return false;
    if (filterObject && r.object !== filterObject) return false;
    if (filterRoom && r.room !== filterRoom) return false;
    if (filterOperator && r.operator !== filterOperator) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterDate === "Неделя" || filterDate === "Месяц") { /* no-op, show all */ }
    else if (filterDate && r.date !== filterDate) return false;
    return true;
  });
  const chipFn = CHIP_FILTERS[activeChip];
  const filteredRows = chipFn ? afterSelects.filter(chipFn) : afterSelects;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setCurrentPage(1);

  // Auto-select first row when filter changes
  useEffect(() => {
    if (!filteredRows.find((r) => r.id === selectedId) && filteredRows.length > 0) {
      setSelectedId(filteredRows[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows.length, activeChip, filterInspection, filterObject, filterRoom, filterOperator, filterType, filterStatus]);

  const selectedItem = rows.find((r) => r.id === selectedId) ?? null;

  const resetAllFilters = () => {
    setFilterInspection(""); setFilterObject(""); setFilterRoom("");
    setFilterOperator(""); setFilterType(""); setFilterStatus(""); setFilterDate("");
    setActiveChip("Все");
    resetPage();
  };

  const handleExport = () => {
    if (exportPhase !== "idle") { if (exportPhase === "success") setExportPhase("idle"); return; }
    setExportPhase("loading");
    exportTimerRef.current = window.setTimeout(() => setExportPhase("success"), 3000);
  };

  const openModal = (type, item) => setModal({ type, item });
  const closeModal = () => setModal(null);

  const handleResolveSuccess = (itemId) => {
    setRows((prev) => prev.map((r) => r.id === itemId ? { ...r, status: "Разрешено", action: "archive" } : r));
  };
  const handleRecheckSuccess = (itemId) => {
    setRows((prev) => prev.map((r) => r.id === itemId ? { ...r, status: "В работе", action: "details" } : r));
  };

  const handleRowClick = (row) => setSelectedId(row.id);

  const handleActionClick = (e, row) => {
    e.stopPropagation();
    if (row.action === "resolve") {
      openModal("conflict", row);
    } else {
      setSelectedId(row.id);
    }
  };

  const btnMap = (row) => ({
    resolve: <button className="disc-btn-resolve" onClick={(e) => handleActionClick(e, row)}>Решить</button>,
    open: <button className="disc-btn-open" onClick={(e) => handleActionClick(e, row)}>Открыть</button>,
    check: <button className="disc-btn-open" onClick={(e) => handleActionClick(e, row)}>Проверить</button>,
    details: <button className="disc-btn-open" onClick={(e) => handleActionClick(e, row)}>Детали</button>,
    archive: <button className="disc-btn-archive" disabled>Архив</button>,
  });

  return (
    <div className="desktop-screen" style={{ display: "grid", gap: "20px" }}>
      {/* Page header */}
      <div className="disc-page-header">
        <div className="disc-page-header-left">
          <h3>Расхождения</h3>
          <p>Проблемы, конфликты и расхождения, найденные во время инспекций</p>
        </div>
        <button
          className={`disc-btn-export${exportPhase === "loading" ? " is-loading" : exportPhase === "success" ? " is-success" : ""}`}
          onClick={handleExport}
          disabled={exportPhase === "loading"}
        >
          {exportPhase === "loading" ? <LoadingOutlined /> : <DownloadOutlined />}
          {exportPhase === "idle" ? "Экспорт отчёта" : exportPhase === "loading" ? "Готовим экспорт..." : "Экспорт готов ✓"}
        </button>
      </div>

      {/* Alert */}
      <div className="disc-alert">
        <div className="disc-alert-left">
          <div className="disc-alert-icon"><WarningOutlined /></div>
          <div>
            <p className="disc-alert-title">Есть неразрешенные конфликты</p>
            <p className="disc-alert-sub">
              Завершение связанных инспекций невозможно, пока конфликты не будут обработаны.
            </p>
          </div>
        </div>
        <button className="disc-btn-alert" onClick={() => { setActiveChip("Конфликты"); resetPage(); }}>Показать конфликты</button>
      </div>

      {/* KPI row */}
      <div className="disc-kpi-grid">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Filters */}
      <div className="disc-filter-card">
        <div className="disc-filter-grid">
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Инспекция</span>
            <select value={filterInspection} onChange={(e) => {
              const val = e.target.value;
              setFilterInspection(val);
              setFilterObject(""); setFilterRoom(""); setFilterOperator(""); setFilterType(""); setFilterStatus("");
              resetPage();
            }}>
              <option value="">Все инспекции</option>
              {uniqueInspections.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Объект</span>
            <select value={filterObject} onChange={(e) => {
              const val = e.target.value;
              setFilterObject(val);
              setFilterRoom(""); setFilterOperator(""); setFilterType(""); setFilterStatus("");
              resetPage();
            }}>
              <option value="">Все объекты</option>
              {uniqueObjects.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Помещение</span>
            <select value={filterRoom} onChange={(e) => {
              const val = e.target.value;
              setFilterRoom(val);
              setFilterOperator(""); setFilterType(""); setFilterStatus("");
              resetPage();
            }}>
              <option value="">Все помещения</option>
              {uniqueRooms.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Оператор</span>
            <select value={filterOperator} onChange={(e) => {
              const val = e.target.value;
              setFilterOperator(val);
              setFilterType(""); setFilterStatus("");
              resetPage();
            }}>
              <option value="">Все операторы</option>
              {uniqueOperators.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Тип проблемы</span>
            <select value={filterType} onChange={(e) => {
              const val = e.target.value;
              setFilterType(val);
              setFilterStatus("");
              resetPage();
            }}>
              <option value="">Все типы</option>
              {uniqueTypes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Статус</span>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}>
              <option value="">Все статусы</option>
              {uniqueStatuses.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="disc-filter-field">
            <span className="disc-filter-field-label">Период</span>
            <select value={filterDate} onChange={(e) => { setFilterDate(e.target.value); resetPage(); }}>
              <option value="">Все</option>
              <option value="Неделя">Неделя</option>
              <option value="Месяц">Месяц</option>
              {uniqueDates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="disc-filter-bottom">
          <div className="disc-chip-row">
            {Object.keys(CHIP_FILTERS).map((c) => (
              <button
                key={c}
                className={`disc-chip${activeChip === c ? " is-active" : ""}`}
                onClick={() => { setActiveChip(c); resetPage(); }}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="disc-reset-btn" onClick={resetAllFilters}>Сбросить фильтры</button>
        </div>
      </div>

      {/* Split: table + detail panel */}
      <div className="disc-split">
        {/* Table */}
        <div className="disc-table-card">
          <div className="disc-table-header">
            <h5>Список расхождений</h5>
            <span>Показано {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} из {filteredRows.length} записей</span>
          </div>

          <div className="disc-table-scroll">
            <table className="disc-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Время</th>
                  <th style={{ width: 130 }}>Инспекция</th>
                  <th style={{ width: 180 }}>Помещение</th>
                  <th>Оборудование</th>
                  <th style={{ width: 130 }}>Тип</th>
                  <th style={{ width: 100 }}>Статус</th>
                  <th style={{ width: 100, textAlign: "right" }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const actionBtn = (btnMap(row)[row.action] || btnMap(row).open);
                  return (
                    <tr
                      key={row.id}
                      className={selectedId === row.id ? "is-selected" : ""}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="disc-td-time">{row.time}</td>
                      <td className="disc-td-ins">{row.inspection}</td>
                      <td className="disc-td-room">{row.room}</td>
                      <td>
                        <span className="disc-td-equip-name">{row.equipName}</span>
                        <span className="disc-td-equip-id">{row.equipId}</span>
                      </td>
                      <td><TypePill type={row.type} /></td>
                      <td><StatusPill status={row.status} /></td>
                      <td style={{ textAlign: "right" }}>{actionBtn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="disc-table-footer">
            <span>Показано {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} из {filteredRows.length} записей</span>
            <div className="disc-pagination">
              <button
                className="disc-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <LeftOutlined style={{ fontSize: 10 }} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`disc-page-btn${currentPage === page ? " is-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="disc-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <RightOutlined style={{ fontSize: 10 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedItem ? (
          <DetailPanel
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onOpenModal={openModal}
          />
        ) : null}
      </div>

      {/* Modals */}
      {(modal?.type === "accept" || modal?.type === "keep" || modal?.type === "close") ? (
        <DiscResolveModal type={modal.type} item={modal.item} onClose={closeModal} onSuccess={handleResolveSuccess} />
      ) : null}
      {modal?.type === "recheck" ? (
        <DiscRecheckModal item={modal.item} onClose={closeModal} onSuccess={handleRecheckSuccess} />
      ) : null}
      {modal?.type === "equip" ? (
        <DiscEquipModal item={modal.item} onClose={closeModal} />
      ) : null}
      {modal?.type === "conflict" ? (
        <DiscConflictModal item={modal.item} onClose={closeModal} onSuccess={handleResolveSuccess} />
      ) : null}
    </div>
  );
}
